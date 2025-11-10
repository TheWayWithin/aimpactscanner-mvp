# 🚨 PRODUCTION EMERGENCY RECOVERY PLAN

**Date**: 2025-10-24
**Severity**: CRITICAL - Production OAuth Login Broken
**Estimated Downtime**: 15-30 minutes
**Risk Level**: LOW (safe migration with defaults)

---

## Executive Summary

**Problem**: Production database is missing 5 critical columns from migration 021, causing OAuth login to crash.

**Root Cause**: Migration 021 was applied to staging but NEVER applied to production. Code expects these columns to exist.

**Solution**: Apply migration 021 to production database to add missing columns.

**Impact**: OAuth login currently 100% broken. After fix: OAuth will work immediately.

---

## Database Comparison Results

### Production Database Status
- **Database**: `pdmtvkcxnqysujnpcnyh.supabase.co` (aimpactscanner-mvp)
- **Users Table Columns**: 56 columns
- **Migrations Applied**: 0 (no migration tracking table exists)
- **Missing Columns**: 5 critical columns from migration 021

### Staging Database Status
- **Database**: `isgzvwpjokcmtizstwru.supabase.co` (impactscanner-staging)
- **Users Table Columns**: 56 columns (but different than production)
- **Migrations Applied**: Unknown (no migration tracking table exists)
- **Has Columns**: All 5 columns from migration 021 ✅

### Missing Columns in Production

| Column | Type | Default | Status in Staging | Impact |
|--------|------|---------|-------------------|--------|
| `is_first_login` | boolean | true | ✅ EXISTS | ❌ **CRITICAL - OAuth crashes** |
| `auth_provider` | text | null | ✅ EXISTS | ⚠️ Analytics broken |
| `selected_tier` | text | 'free' | ✅ EXISTS | ⚠️ Tier selection broken |
| `signup_source` | text | null | ✅ EXISTS | ⚠️ Analytics broken |
| `stripe_subscription_id` | text | null | ✅ EXISTS | ⚠️ Payment tracking broken |

---

## Code Dependencies Broken

These code files are currently FAILING in production:

### 1. src/utils/authRouting.js
```javascript
// Line 247, 354 - Queries is_first_login
if (user?.is_first_login === true) {
  await markFirstLoginComplete(user.id);
}

// getUserData function queries is_first_login
const { data, error } = await supabase
  .from('users')
  .select('id, email, tier, is_first_login, subscription_status, monthly_analyses_used')
  // ❌ FAILS: column "is_first_login" does not exist
```

### 2. src/components/OAuthCallback.jsx
```javascript
// Lines 153, 216, 224 - Inserts is_first_login
const userData = {
  id: user.id,
  email: user.email,
  tier: tier,
  is_first_login: true,  // ❌ FAILS: column does not exist
  auth_provider: authProvider,  // ❌ FAILS: column does not exist
  selected_tier: selectedTier,  // ❌ FAILS: column does not exist
  signup_source: authContext?.mode === 'signup' ? 'oauth' : 'login'  // ❌ FAILS
}
```

**Result**: Every OAuth login attempt crashes immediately.

---

## EMERGENCY RECOVERY PROCEDURE

### Phase 1: BACKUP (MANDATORY - 5 minutes)

⚠️ **DO NOT SKIP THIS STEP**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select: **Production** project (`pdmtvkcxnqysujnpcnyh`)
3. Navigate to: **Settings** → **Database** → **Backups**
4. Click: **Create a new backup**
5. Label: `pre-migration-021-backup-20251024`
6. Wait for backup to complete (usually 2-3 minutes)
7. ✅ **VERIFY**: Backup status shows "Success"

**Why**: If migration fails, you can restore to this point.

---

### Phase 2: APPLY MIGRATION 021 (10 minutes)

#### Option A: Manual SQL Execution (RECOMMENDED - Safest)

1. Go to Supabase Dashboard
2. Select: **Production** project (`pdmtvkcxnqysujnpcnyh`)
3. Navigate to: **SQL Editor**
4. Copy the migration SQL below
5. Paste into SQL Editor
6. Click: **Run**
7. Verify: "Success. No rows returned" (this is correct)

#### Migration 021 SQL (Safe to Run)

```sql
-- ============================================
-- Migration 021: Add Auth and Tier Columns
-- Date: 2025-10-02 (Original Creation)
-- Applied: 2025-10-24 (Emergency Production Fix)
-- ============================================

-- Add missing columns with safe defaults
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_selected_tier ON users(selected_tier);
CREATE INDEX IF NOT EXISTS idx_users_is_first_login ON users(is_first_login);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Backfill existing users with safe defaults
UPDATE users
SET
  auth_provider = COALESCE(auth_provider, 'magic_link'),
  selected_tier = COALESCE(selected_tier, COALESCE(tier, 'free')),
  is_first_login = COALESCE(is_first_login, false)  -- Existing users are NOT first-time
WHERE auth_provider IS NULL
   OR selected_tier IS NULL
   OR is_first_login IS NULL;

-- Verification query
SELECT
  COUNT(*) as total_users,
  COUNT(auth_provider) as has_auth_provider,
  COUNT(selected_tier) as has_selected_tier,
  COUNT(CASE WHEN is_first_login IS NOT NULL THEN 1 END) as has_is_first_login,
  COUNT(stripe_subscription_id) as has_stripe_sub_id
FROM users;
```

**Expected Output**:
```
Success. No rows returned
```

Then run verification query:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_first_login', 'auth_provider', 'selected_tier', 'signup_source', 'stripe_subscription_id')
ORDER BY column_name;
```

**Expected Output**: 5 rows showing the new columns

---

### Phase 3: VERIFICATION (5 minutes)

#### Test 1: Verify Columns Exist
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_first_login', 'auth_provider', 'selected_tier', 'signup_source', 'stripe_subscription_id')
ORDER BY column_name;
```

**Expected**: 5 rows returned

#### Test 2: Verify Existing Users Have Defaults
```sql
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users_marked_false,
  COUNT(CASE WHEN auth_provider IS NOT NULL THEN 1 END) as users_with_provider
FROM users;
```

**Expected**: All existing users should have `is_first_login = false` and `auth_provider` set

#### Test 3: Test OAuth Login
1. Go to: https://aimpactscanner.com/#signup
2. Select tier (Free or Coffee)
3. Click: "Continue with Google"
4. Complete OAuth flow
5. ✅ **Success**: Should reach dashboard (not error page)

---

### Phase 4: MONITORING (30 minutes)

After migration, monitor for:

1. **OAuth Login Success Rate**
   - Check Supabase logs: Dashboard → Logs → Postgres Logs
   - Look for: No more "column is_first_login does not exist" errors

2. **Error Rate**
   - Monitor application error logs
   - Check for any new errors introduced

3. **User Reports**
   - Monitor support channels
   - Verify users can sign up and log in

---

## ROLLBACK PLAN (If Something Goes Wrong)

### Scenario 1: Migration Fails During Execution

**Symptoms**: SQL Editor shows error during migration

**Action**:
1. Screenshot the error
2. DO NOT proceed
3. Restore from backup:
   - Dashboard → Database → Backups
   - Find: `pre-migration-021-backup-20251024`
   - Click: **Restore**
   - Wait for restore to complete (5-10 minutes)

### Scenario 2: Migration Succeeds But OAuth Still Broken

**Symptoms**: Migration runs successfully but OAuth still crashes

**Diagnostic Steps**:
1. Verify columns exist (run Test 1 from Phase 3)
2. Check application error logs for new errors
3. Verify code is using correct database (production, not staging)

**Action**:
- If columns exist but OAuth fails: Code issue, not migration issue
- Review application configuration
- Check environment variables point to correct database

### Scenario 3: Migration Causes Data Loss

**Symptoms**: User data missing or corrupted

**Action**:
1. IMMEDIATELY restore from backup
2. Dashboard → Database → Backups
3. Find: `pre-migration-021-backup-20251024`
4. Click: **Restore**
5. Contact user to investigate before retry

**Prevention**: This migration only ADDS columns with safe defaults. It does NOT delete or modify existing data. Risk of data loss is NEAR ZERO.

---

## Data Impact Assessment

### Affected Records
- **ALL existing users** in production
- Estimated count: Unknown (run `SELECT COUNT(*) FROM users;` to check)

### Data Changes
All existing users will be updated with:
- `auth_provider = 'magic_link'` (assumption - most existing users used magic link)
- `selected_tier = <current tier value>` (preserves existing tier)
- `is_first_login = false` (correct - existing users are not first-time)
- `signup_source = null` (unknown for existing users)
- `stripe_subscription_id = null` (will be populated when they subscribe)

### Data Loss Risk
**RISK LEVEL: NONE**

- ✅ No existing columns are dropped
- ✅ No existing data is deleted
- ✅ No existing data is modified (except adding new columns)
- ✅ All new columns have safe defaults
- ✅ Existing user data is preserved 100%

### Data Correctness
- `is_first_login = false` for existing users: ✅ **CORRECT**
- `auth_provider = 'magic_link'`: ⚠️ **ASSUMPTION** (could be wrong for some users)
  - Impact: Analytics data may be incorrect for existing users
  - Mitigation: Only affects analytics, not functionality
  - Future signups will have correct data

---

## Success Criteria

Migration is successful when:

1. ✅ All 5 columns exist in production users table
2. ✅ Existing users have `is_first_login = false`
3. ✅ New OAuth signups complete successfully
4. ✅ Returning OAuth logins work
5. ✅ No "column does not exist" errors in logs
6. ✅ No user data loss or corruption
7. ✅ No increase in error rate

---

## Post-Migration Actions

### Immediate (Next 1 hour)
- [ ] Monitor OAuth login success rate
- [ ] Monitor error logs for new issues
- [ ] Test OAuth signup and login flows
- [ ] Verify tier selection works

### Short-term (Next 24 hours)
- [ ] Monitor user reports
- [ ] Verify analytics data populating correctly
- [ ] Check Stripe subscription tracking working

### Long-term (Next Week)
- [ ] Apply remaining missing migrations (009, 012, 013, 014, 016, 018, 020)
- [ ] Implement automated migration tracking
- [ ] Add CI/CD check for schema drift
- [ ] Document deployment process improvements

---

## Deployment Process Improvements

### Prevent This Issue in Future

1. **Add Migration Tracking**
   ```sql
   -- Create migration tracking table
   CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
     version TEXT PRIMARY KEY,
     name TEXT,
     applied_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Deployment Checklist**
   - [ ] Apply migrations to staging first
   - [ ] Test on staging
   - [ ] Apply migrations to production
   - [ ] Deploy code to production
   - [ ] Verify production working

3. **Automated Checks**
   - Add CI/CD step to verify schema matches code expectations
   - Block deployment if schema drift detected
   - Use Supabase CLI for idempotent migrations

4. **Environment Parity**
   - Keep schema dumps for comparison
   - Regular schema audits
   - Document which migrations are in which environment

---

## Frequently Asked Questions

### Q: Will this cause downtime?
**A**: Minimal. Adding columns is a fast operation (< 1 minute). Users may see brief OAuth errors during migration.

### Q: Will existing user data be lost?
**A**: NO. This migration only ADDS columns. It does NOT delete or modify existing data.

### Q: What if OAuth still doesn't work after migration?
**A**: Then the issue is in the code, not the database. Check that code is pointing to production database and not staging.

### Q: Can I test this on staging first?
**A**: Staging already has these columns (that's why it works). You can't re-test the migration on staging. Migration is safe because it uses `IF NOT EXISTS` and safe defaults.

### Q: How long will migration take?
**A**: < 1 minute to add columns + < 1 minute to backfill existing users = ~2 minutes total.

### Q: What happens to new users signing up during migration?
**A**: If someone signs up DURING the migration (unlikely in 2-minute window), their signup may fail. They can retry immediately after migration completes.

---

## Contact Information

**Performed By**: THE COORDINATOR (AGENT-11)
**Date**: 2025-10-24
**Migration File**: `supabase/migrations/021_auth_tier_columns.sql`
**Production Database**: `pdmtvkcxnqysujnpcnyh.supabase.co`

---

## Execution Log

Use this section to document the actual execution:

**Backup Created**:
- Time: ___________
- Backup Name: ___________
- Status: ___________

**Migration Applied**:
- Time: ___________
- Result: ___________
- Errors: ___________

**Verification**:
- Columns Exist: [ ] YES [ ] NO
- OAuth Test: [ ] PASS [ ] FAIL
- Error Logs: [ ] CLEAN [ ] ERRORS

**Notes**:
```
[Add any notes here during execution]
```

---

**END OF EMERGENCY RECOVERY PLAN**
