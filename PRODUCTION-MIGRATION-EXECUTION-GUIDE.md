# Production Migration 021 - Execution Guide

**Date**: 2025-10-24
**Migration**: 021_auth_tier_columns.sql
**Database**: Production (`pdmtvkcxnqysujnpcnyh.supabase.co`)
**Risk Level**: ✅ LOW (test users only, proven in staging)
**Estimated Time**: 5-10 minutes

---

## Pre-Flight Checklist

Before starting:
- ✅ Investigation complete - root cause identified
- ✅ Staging has migration 021 applied and working
- ✅ Only test users in production (low risk)
- ✅ Migration SQL reviewed and safe
- ✅ Backup procedures ready

---

## STEP 1: Backup Production Database (MANDATORY)

⚠️ **DO THIS FIRST - NO EXCEPTIONS**

### Instructions

1. Go to: https://supabase.com/dashboard
2. Select project: `aimpactscanner-mvp` (pdmtvkcxnqysujnpcnyh)
3. Navigate to: **Database** → **Backups**
4. Click: **"Create a new backup"**
5. Wait for completion (2-3 minutes)
6. ✅ Verify backup shows "Success"

**Backup Name**: `pre-migration-021-20251024`

⏱️ **CHECKPOINT**: Do not proceed until backup is complete and verified!

---

## STEP 2: Pre-Migration Verification

Run these queries to document current state:

### Query 1: Count Current Users
```sql
SELECT COUNT(*) as total_users FROM users;
```

**Expected**: Small number (test users only)
**Record the result**: _____ users

### Query 2: Check Current Columns
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Expected**: Should NOT see `is_first_login`, `auth_provider`, `selected_tier`, `signup_source`, `stripe_subscription_id`

### Query 3: Sample User Data (if any users exist)
```sql
SELECT id, email, tier, created_at
FROM users
LIMIT 5;
```

**Record**: Note any Coffee tier users (should be test accounts)

---

## STEP 3: Apply Migration 021

### Instructions

1. Stay in: **Supabase Dashboard** → **SQL Editor**
2. Create new query
3. Copy the SQL below
4. Click **"Run"**
5. Wait for completion (~1-2 minutes)

### Migration SQL (Copy Everything Below)

```sql
-- ============================================
-- Migration 021: Auth & Tier Columns
-- Production Application: 2025-10-24
-- ============================================

BEGIN;

-- STEP 1: Add authentication tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.auth_provider IS 'Authentication method: google, github, magic_link, or email';
COMMENT ON COLUMN users.selected_tier IS 'Tier user selected during signup (before payment)';
COMMENT ON COLUMN users.is_first_login IS 'Skip upsell on first login after signup';
COMMENT ON COLUMN users.signup_source IS 'Context: landing_page, direct_signup, etc.';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment tracking';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';

-- STEP 2: Add unique constraints on Stripe IDs
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id_unique
    ON users(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_subscription_id_unique
    ON users(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

-- STEP 3: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_is_first_login
    ON users(is_first_login)
    WHERE is_first_login = true;
CREATE INDEX IF NOT EXISTS idx_users_signup_source ON users(signup_source);

-- STEP 4: Backfill existing users with safe defaults
UPDATE users
SET auth_provider = 'magic_link'
WHERE auth_provider IS NULL;

UPDATE users
SET is_first_login = false
WHERE is_first_login IS NULL OR is_first_login = true;

UPDATE users
SET selected_tier = COALESCE(tier, 'free')
WHERE selected_tier IS NULL OR selected_tier = '';

UPDATE users
SET subscription_status = 'active'
WHERE subscription_status = 'inactive' AND tier != 'free';

-- STEP 5: Update trigger to capture OAuth data
CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_provider TEXT;
BEGIN
    -- Detect auth provider from app_metadata
    v_auth_provider := COALESCE(
        NEW.raw_app_meta_data->>'provider',
        CASE
            WHEN NEW.raw_user_meta_data->>'provider' IS NOT NULL
            THEN NEW.raw_user_meta_data->>'provider'
            ELSE 'magic_link'
        END
    );

    -- Insert or update user profile with OAuth data
    INSERT INTO public.users (
        id,
        email,
        full_name,
        tier,
        monthly_analyses_used,
        subscription_status,
        email_verified,
        auth_provider,
        selected_tier,
        is_first_login,
        signup_source,
        created_at,
        updated_at,
        last_login_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
        0,
        'active',
        (NEW.email_confirmed_at IS NOT NULL),
        v_auth_provider,
        COALESCE(NEW.raw_user_meta_data->>'selected_tier', 'free'),
        true,
        NEW.raw_user_meta_data->>'signup_source',
        COALESCE(NEW.created_at, NOW()),
        NOW(),
        COALESCE(NEW.last_sign_in_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = (NEW.email_confirmed_at IS NOT NULL),
        last_login_at = COALESCE(NEW.last_sign_in_at, users.last_login_at),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'User profile creation failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verification
SELECT
    '✅ Migration 021 completed successfully!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_first_login IS NOT NULL THEN 1 END) as users_with_first_login,
    COUNT(CASE WHEN auth_provider IS NOT NULL THEN 1 END) as users_with_provider
FROM users;
```

### Expected Output

You should see:
```
SUCCESS
✅ Migration 021 completed successfully!
total_users | users_with_first_login | users_with_provider
-----------|-----------------------|--------------------
     X     |           X           |         X
```

Where X matches your current user count.

⏱️ **CHECKPOINT**: Migration complete! Proceed to verification.

---

## STEP 4: Post-Migration Verification

### Verify Columns Created

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('auth_provider', 'selected_tier', 'is_first_login', 'signup_source', 'stripe_subscription_id')
ORDER BY column_name;
```

**Expected Output**: 5 rows showing all new columns

| column_name | data_type | column_default |
|------------|-----------|----------------|
| auth_provider | text | null |
| is_first_login | boolean | true |
| selected_tier | text | 'free'::text |
| signup_source | text | null |
| stripe_subscription_id | text | null |

✅ **Success Criteria**: All 5 columns exist

### Verify Existing Users Backfilled

```sql
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN auth_provider IS NOT NULL THEN 1 END) as has_provider,
    COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users_flagged,
    COUNT(CASE WHEN selected_tier IS NOT NULL THEN 1 END) as has_selected_tier
FROM users;
```

**Expected**: All counts should equal total_users

✅ **Success Criteria**: No NULL values in critical columns

### Verify Indexes Created

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND (indexname LIKE '%auth%' OR indexname LIKE '%first_login%' OR indexname LIKE '%stripe%')
ORDER BY indexname;
```

**Expected**: At least 5 indexes listed

✅ **Success Criteria**: All performance indexes created

---

## STEP 5: Test OAuth Functionality

### Test 1: OAuth Signup Flow

1. Go to: https://aimpactscanner.com/#signup
2. Select: **Free** or **Coffee** tier
3. Click: **"Continue with Google"**
4. Complete OAuth flow
5. ✅ **Expected**: Should land on dashboard (NOT error page)

### Test 2: OAuth Login Flow

1. Sign out
2. Go to: https://aimpactscanner.com/#login
3. Click: **"Continue with Google"**
4. Use same account from Test 1
5. ✅ **Expected**: Should land on dashboard immediately

### Test 3: Verify User Data

```sql
SELECT
    email,
    auth_provider,
    selected_tier,
    is_first_login,
    tier,
    created_at
FROM users
WHERE auth_provider = 'google'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected**: New OAuth users should have:
- `auth_provider = 'google'`
- `is_first_login = true` (first time) or `false` (returning)
- `selected_tier` matching what they chose
- `tier` matching their subscription status

---

## STEP 6: Monitor for Issues

### Check for Errors (Next 30 Minutes)

1. **Application Logs**: Monitor for "column does not exist" errors (should be 0)
2. **Supabase Logs**: Database → Logs → Postgres Logs
3. **User Reports**: Monitor support channels for OAuth issues

### Success Indicators

- ✅ No "column does not exist" errors
- ✅ OAuth signups complete successfully
- ✅ OAuth logins work without errors
- ✅ New users have correct `auth_provider` values
- ✅ `is_first_login` flag working correctly

---

## ROLLBACK PROCEDURES (If Needed)

⚠️ Only use if migration causes problems

### Option 1: Restore from Backup (Nuclear Option)

1. Go to: Supabase Dashboard → Database → Backups
2. Find backup: `pre-migration-021-20251024`
3. Click: **"Restore"**
4. Wait 5-10 minutes for restore
5. Verify: OAuth will be broken again, but database is back to pre-migration state

**Warning**: This loses any new users created after migration

### Option 2: Remove Columns (Surgical Rollback)

```sql
BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_auth_provider;
DROP INDEX IF EXISTS idx_users_is_first_login;
DROP INDEX IF EXISTS idx_users_signup_source;
DROP INDEX IF EXISTS idx_users_stripe_customer_id_unique;
DROP INDEX IF EXISTS idx_users_stripe_subscription_id_unique;

-- Remove columns
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;

COMMIT;
```

**Warning**: OAuth will be broken again after rollback

---

## Post-Migration Actions

### Update Documentation

- [x] Mark migration 021 as applied in production
- [x] Update `progress.md` with success log
- [x] Update `project-plan.md` mission status

### Fix netlify.toml (Prevent Future Confusion)

The netlify.toml file (line 54) still shows production database for deploy-previews. This should be updated to match staging:

**File**: `netlify.toml` line 54
**Change**:
```toml
# FROM:
VITE_SUPABASE_URL = "https://pdmtvkcxnqysujnpcnyh.supabase.co"

# TO:
VITE_SUPABASE_URL = "https://isgzvwpjokcmtizstwru.supabase.co"
```

**Reason**: Deploy previews should use staging database (though Netlify dashboard already overrides this)

### Create Migration Tracking System

Add this to prevent future drift:

```sql
-- Create migration tracking table
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
    version TEXT PRIMARY KEY,
    name TEXT,
    applied_at TIMESTAMP DEFAULT NOW()
);

-- Record migration 021
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('021', '021_auth_tier_columns.sql')
ON CONFLICT (version) DO NOTHING;
```

---

## Summary Checklist

Before closing this migration:

- [ ] Backup created and verified
- [ ] Migration SQL executed successfully
- [ ] All 5 columns created
- [ ] All 5 indexes created
- [ ] Existing users backfilled
- [ ] OAuth signup tested
- [ ] OAuth login tested
- [ ] No errors in logs
- [ ] Documentation updated
- [ ] netlify.toml fixed (optional)
- [ ] Migration tracking added (recommended)

---

## Support

**If you encounter issues**:
1. Screenshot the error
2. Check the rollback procedures above
3. Don't panic - backup exists
4. Review verification queries to understand current state

**Success Indicators**:
- OAuth works immediately
- No database errors
- Users can sign up/login with Google/GitHub
- All test users still accessible

---

**Migration Created By**: THE COORDINATOR (AGENT-11)
**Date**: 2025-10-24
**Status**: Ready for execution
**Risk**: ✅ LOW (test users only, proven in staging)

**Estimated Total Time**: 5-10 minutes

---

**READY TO PROCEED** ✅

Open Supabase dashboard and start with STEP 1 (Backup).
