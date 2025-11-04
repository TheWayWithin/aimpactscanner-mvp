# Forensic Timeline Analysis: Migration vs Code Chronology

**Investigation Date**: 2025-10-24
**Issue**: OAuth failures on staging due to missing database columns
**Question**: Are migrations unapplied or missing?

---

## EXECUTIVE SUMMARY

**ANSWER**: **SCENARIO A - Unapplied Migrations**

The migrations exist and were created at the SAME TIME as the code that uses them. The problem is NOT missing migrations - it's that existing migrations were never applied to the staging database.

---

## DETAILED TIMELINE

### October 2, 2025 - THE GENESIS (Single Commit)

**Commit**: `6d6d519` - "fix: Add /signup route to show OAuth registration"
**Date**: Oct 2, 16:00:43 (4:00 PM EDT)
**Branch**: develop → main → production

**What Happened in This ONE Commit**:
1. ✅ Migration 021 created: `supabase/migrations/021_auth_tier_columns.sql`
2. ✅ OAuthCallback.jsx created with code using `is_first_login`
3. ✅ Code inserts: `is_first_login: true` (line 83 in original)
4. ✅ Code reads: `userData.is_first_login` (line 135 in original)

**File System Evidence**:
```
-rw-r--r--  1 jamiewatters  staff  10042 Oct  2 09:21 021_auth_tier_columns.sql
```

Migration file timestamp: **Oct 2, 09:21** (9:21 AM EDT)
Commit timestamp: **Oct 2, 16:00** (4:00 PM EDT)

**Interpretation**: File was created in the morning, committed in the afternoon. Both migration and code were developed together and committed as a unit.

---

### October 2 - October 21: Evolution of OAuth Code

**Code Changes Using `is_first_login`**:

| Date | Commit | File | Change |
|------|--------|------|--------|
| Oct 2 | `6d6d519` | OAuthCallback.jsx | **CREATES** file with `is_first_login: true` insert |
| Oct 2 | `6d6d519` | OAuthCallback.jsx | **CREATES** file with `userData.is_first_login` read |
| Oct 16 | `d73eead` | OAuthCallback.jsx | Uses `is_first_login` in routing logic |
| Oct 21 | `f175852` | OAuthCallback.jsx | Adds `markFirstLoginComplete()` call |
| Oct 21 | `f175852` | authRouting.js | Adds `markFirstLoginComplete()` function |

**Migration Changes**:
- **NONE** - No migration files modified after Oct 2

---

### October 22, 2025 - PRODUCTION RELEASE

**Merge**: `fb9d20a` - "Production deployment: Merge develop with Bug fixes"
**Date**: Oct 22, 2025

**What Was Deployed**:
- ✅ Migration 021 file (exists in codebase)
- ✅ OAuthCallback.jsx (uses `is_first_login`)
- ✅ authRouting.js (uses `is_first_login`)
- ❌ Migration 021 **NOT APPLIED** to staging database

**Evidence**:
```bash
git show fb9d20a:supabase/migrations/021_auth_tier_columns.sql
# ^ Returns full migration file content
```

---

## CODE ANALYSIS - COLUMNS REQUIRED

### OAuthCallback.jsx (Current Version)

**Line 153**: INSERT operation
```javascript
is_first_login: true,
```

**Line 216**: READ operation
```javascript
console.log('📊 is_first_login:', userData.is_first_login);
```

**Line 224**: CONDITIONAL logic
```javascript
if (userData.is_first_login) {
```

### authRouting.js (Current Version)

**Line 247**: READ operation
```javascript
if (user?.is_first_login === true) {
```

**Line 288**: UPDATE operation
```javascript
.update({ is_first_login: false })
```

**Line 354**: SELECT query
```javascript
.select('id, email, tier, is_first_login, subscription_status, monthly_analyses_used')
```

---

## MIGRATION FILE ANALYSIS

### Migration 021 - Created Oct 2, 2025

**Columns Added**:
1. ✅ `auth_provider` (TEXT)
2. ✅ `selected_tier` (TEXT, DEFAULT 'free')
3. ✅ `is_first_login` (BOOLEAN, DEFAULT true) ← **THIS ONE**
4. ✅ `signup_source` (TEXT)
5. ✅ `stripe_subscription_id` (TEXT)

**Verification Step in Migration** (lines 180-229):
```sql
-- Verify all new columns exist
SELECT COUNT(*) INTO v_column_count
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'auth_provider',
    'selected_tier',
    'is_first_login',
    'signup_source',
    'stripe_subscription_id'
  );

IF v_column_count < 5 THEN
    RAISE EXCEPTION 'Migration failed: Not all columns created. Found: %, Expected: 5', v_column_count;
END IF;
```

**Status**: Migration NEVER RAN on staging (would have raised exception if it had)

---

## THE SMOKING GUN

### Question 1: When was the code that queries `is_first_login` written?
**Answer**: **October 2, 2025, 4:00 PM EDT** (commit `6d6d519`)

### Question 2: When was migration 021 created?
**Answer**: **October 2, 2025, 9:21 AM EDT** (file system timestamp), committed in `6d6d519` at 4:00 PM

### Question 3: Was the code written BEFORE or AFTER the migration?
**Answer**: **SAME DAY, SAME COMMIT** - Migration created in the morning, code written later, both committed together as a single atomic unit

### Question 4: Has migration 021 ever been applied to staging?
**Answer**: **NO** - If it had run, we wouldn't see `column "is_first_login" does not exist` errors

### Question 5: Are there OTHER columns the code expects that have NO migrations?
**Answer**: **NO** - All columns used by the code are defined in migration 021:
- `auth_provider` ✓
- `selected_tier` ✓
- `is_first_login` ✓
- `signup_source` ✓
- `stripe_subscription_id` ✓

---

## CONCLUSION

**Scenario**: **A - Old Migrations Not Applied**

**Evidence**:
1. Migration 021 was created Oct 2
2. Code using those columns was created Oct 2 (same commit)
3. NO migration files modified after Oct 2
4. NO new column references added after Oct 2 that lack migrations
5. Production release Oct 22 includes BOTH migration file AND code

**Problem**: Migration 021 simply wasn't run on staging database

**Solution**: Apply existing migration 021 to staging

**NOT the problem**:
- ❌ Code promoted without creating migrations
- ❌ New code referencing columns without migrations
- ❌ Migration files missing from codebase

---

## VERIFICATION STEPS

### 1. Check if migration was applied

```bash
# On staging database
SELECT * FROM _migrations WHERE name = '021_auth_tier_columns';
# Expected: Empty result (migration never ran)
```

### 2. Check if columns exist

```bash
# On staging database
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_first_login', 'auth_provider', 'selected_tier', 'signup_source', 'stripe_subscription_id');
# Expected: Empty result (columns don't exist)
```

### 3. Apply migration

```bash
# Run migration 021
psql $DATABASE_URL -f supabase/migrations/021_auth_tier_columns.sql
# Expected: Success message "Migration 021 completed successfully"
```

### 4. Verify columns now exist

```bash
# On staging database
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('is_first_login', 'auth_provider', 'selected_tier', 'signup_source', 'stripe_subscription_id')
ORDER BY column_name;
# Expected: 5 rows returned
```

---

## ROOT CAUSE ANALYSIS

**Why wasn't the migration applied?**

Possible reasons:
1. **Manual deployment process** - Migrations not automatically applied during deploy
2. **Separate staging/production databases** - Production has migrations, staging doesn't
3. **Migration tracking system issue** - Supabase CLI didn't detect migration 021
4. **Database reset** - Staging database was reset after Oct 2, migrations not reapplied

**Most Likely**: Staging database is separate from production, and when staging was set up (Oct 13 commit: "feat: Set up staging environment"), migrations were not applied.

**Evidence**: Oct 13 commit `79ccf70` - "feat: Set up staging environment"
This is **AFTER** Oct 2 when migration 021 was created.

**Hypothesis**: Staging environment was created Oct 13 with a fresh database, and migration 021 (created Oct 2) was never applied to this new staging database.

---

## RECOMMENDED ACTION

**Immediate Fix**:
```bash
# Apply migration 021 to staging database
supabase db push --db-url $STAGING_DATABASE_URL
```

**Long-term Fix**:
1. Implement automated migration application on staging deploys
2. Add pre-deploy health check that verifies all migrations are applied
3. Document migration process in deployment checklist
4. Consider Supabase migration tracking table to prevent missing migrations

---

## USER'S CRITICAL INSIGHT

The user was correct to challenge the timeline. They recognized:
- Migration files last modified: Oct 2
- Recent production release: Oct 22 (AFTER Oct 2)
- OAuth breakage: Started with recent release

**Their intuition**: If migrations are from Oct 2 but production was released Oct 22, why is production broken?

**Answer**: The Oct 22 release included the migration FILE but the migration was never APPLIED to the staging database. The codebase is correct - the database state is incorrect.

---

## LESSONS LEARNED

1. **Codebase ≠ Database State** - Having a migration file in the repo doesn't mean it's applied to the database
2. **Staging Setup Date Matters** - Staging was created AFTER migration 021, so it missed the migration
3. **Migration Tracking is Critical** - Without a clear record of which migrations are applied to which environments, this confusion is inevitable
4. **Forensic Git Analysis Works** - Examining commit dates, file timestamps, and git blame reveals the true timeline

---

**End of Forensic Timeline Analysis**
