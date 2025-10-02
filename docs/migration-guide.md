# Database Migration Guide: OAuth & Monetization System

**Project**: AImpactScanner MVP
**Date**: 2025-10-02
**Author**: THE DEVELOPER (AGENT-11)
**Priority**: CRITICAL - Required for OAuth deployment

---

## Executive Summary

This guide covers deploying two database migrations that add OAuth authentication tracking and tier-based monetization support to the AImpactScanner platform.

**Migrations**:
- **021_auth_tier_columns.sql** - Adds OAuth provider tracking, tier management, and Stripe integration columns
- **022_waitlist_table.sql** - Creates waitlist system for Growth and Scale tiers

**Impact**: Zero downtime, backward compatible with existing application code

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration 021: Auth & Tier Columns](#migration-021-auth--tier-columns)
3. [Migration 022: Waitlist Table](#migration-022-waitlist-table)
4. [Local Testing Instructions](#local-testing-instructions)
5. [Production Deployment Checklist](#production-deployment-checklist)
6. [Rollback Procedures](#rollback-procedures)
7. [Verification Queries](#verification-queries)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- ✅ Supabase project admin access
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Local Supabase instance running (for testing)
- ✅ Production database credentials (for deployment)

### Backup Strategy
```bash
# Before any production migration, create backup
# Via Supabase Dashboard:
# Settings → Database → Database Backups → Create New Backup

# Or via CLI (if pitr enabled):
supabase db dump --db-url postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Environment Setup
```bash
# Link to Supabase project
supabase link --project-ref pdmtvkcxnqysujnpcnyh

# Verify connection
supabase db pull --dry-run
```

---

## Migration 021: Auth & Tier Columns

### Overview
Adds columns to `users` table to support OAuth authentication and tier-based monetization.

### Changes Made

**New Columns**:
- `auth_provider` (TEXT) - Tracks OAuth provider: 'google', 'github', 'magic_link'
- `selected_tier` (TEXT) - Tier selected during signup
- `is_first_login` (BOOLEAN) - Skip upsell on first login flag
- `signup_source` (TEXT) - Analytics context: 'landing_page', 'direct_signup'
- `stripe_subscription_id` (TEXT) - Stripe subscription tracking

**New Indexes**:
- `idx_users_auth_provider` - Fast provider lookups
- `idx_users_is_first_login` - Partial index for first login checks
- `idx_users_signup_source` - Analytics queries
- `idx_users_stripe_customer_id_unique` - Prevent duplicate Stripe customers
- `idx_users_stripe_subscription_id_unique` - Prevent duplicate subscriptions

**Updated Trigger**:
- `handle_user_creation()` function now captures OAuth provider data from `auth.users` metadata

### Backfill Strategy
Existing users are automatically backfilled with:
- `auth_provider = 'magic_link'` (assumption: email-based auth)
- `is_first_login = false` (existing users have already logged in)
- `selected_tier = tier` (matches current tier)
- `subscription_status = 'active'` (for paid users)

### Testing Instructions

#### Local Test (Required Before Production)

```bash
# 1. Start local Supabase
supabase start

# 2. Apply migration to local database
supabase db push

# 3. Verify migration success
supabase db pull --dry-run

# 4. Run verification queries (see Verification section)
psql postgresql://postgres:postgres@localhost:54322/postgres -f verification_queries.sql
```

#### Expected Results
```
✅ Migration 021 completed successfully
✅ All auth/tier columns created (5 columns)
✅ Indexes created for performance (5 indexes)
✅ Existing users backfilled
✅ Trigger updated to capture OAuth data
```

### Production Deployment

**Timeline**: 5-10 minutes
**Downtime**: None (zero-downtime migration)

```bash
# 1. Verify local testing complete
echo "Local testing verified? (yes/no)"
read response
if [ "$response" != "yes" ]; then exit 1; fi

# 2. Create production backup
echo "Creating backup..."
# Do this via Supabase Dashboard: Settings → Database → Backups

# 3. Apply migration to production
supabase db push --linked

# 4. Verify migration success
echo "Checking migration status..."
supabase db pull --linked --dry-run

# 5. Run verification queries
psql $(supabase status --json | jq -r '.db_url') -c "
SELECT
  COUNT(*) as total_users,
  COUNT(auth_provider) as users_with_provider,
  COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users_flagged
FROM users;
"

# Expected: All users should have auth_provider and is_first_login values
```

### Rollback Procedure

**If issues occur, rollback with**:

```sql
-- Run in Supabase SQL Editor or via psql

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

-- Restore previous trigger version from migration 018
-- (Copy handle_user_creation() function from migration 018)
```

**Rollback Timeline**: 2-3 minutes
**Data Loss**: None (columns dropped, data preserved in backup)

---

## Migration 022: Waitlist Table

### Overview
Creates separate table for tracking Growth and Scale tier waitlist interest.

### Changes Made

**New Table**: `growth_scale_waitlist`
- `id` (UUID) - Primary key
- `user_id` (UUID) - References authenticated user
- `email` (TEXT) - User email for notifications
- `interested_tier` (TEXT) - 'growth' or 'scale'
- `current_tier` (TEXT) - User's current tier
- `joined_at` (TIMESTAMPTZ) - Timestamp of signup
- `notified` (BOOLEAN) - Whether user has been notified
- `metadata` (JSONB) - Additional context (utm_source, etc.)

**RLS Policies**:
- Users can view own waitlist entries
- Users can insert own waitlist entries
- Service role has full access

**Helper Functions**:
- `join_waitlist(tier, metadata)` - Add user to waitlist
- `get_waitlist_stats()` - Admin statistics (service role)
- `mark_waitlist_notified(ids)` - Mark users notified (service role)

### Testing Instructions

#### Local Test

```bash
# 1. Apply migration
supabase db push

# 2. Test joining waitlist
psql postgresql://postgres:postgres@localhost:54322/postgres

-- In psql:
-- Set session to authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<test-user-uuid>';

-- Test joining Growth waitlist
SELECT * FROM join_waitlist('growth', '{"utm_source": "test"}'::jsonb);

-- Expected output:
-- success | message                        | waitlist_id
-- --------+--------------------------------+-------------
-- true    | Successfully added to waitlist | <uuid>

-- Test duplicate prevention
SELECT * FROM join_waitlist('growth');

-- Expected output:
-- success | message              | waitlist_id
-- --------+----------------------+-------------
-- true    | Already on waitlist  | NULL

-- Verify user can read own entry
SELECT * FROM growth_scale_waitlist;

-- Expected: 1 row returned (user's entry)
```

#### Expected Results
```
✅ Migration 022 completed successfully
✅ growth_scale_waitlist table created
✅ RLS policies created (3 policies)
✅ Indexes created for performance (4 indexes)
✅ Helper functions created (3 functions)
```

### Production Deployment

**Timeline**: 3-5 minutes
**Downtime**: None

```bash
# 1. Apply migration
supabase db push --linked

# 2. Verify table created
psql $(supabase status --json | jq -r '.db_url') -c "\d growth_scale_waitlist"

# 3. Test waitlist function (as authenticated user)
# Use Supabase SQL Editor with authenticated session

# 4. Verify RLS policies
psql $(supabase status --json | jq -r '.db_url') -c "
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'growth_scale_waitlist'
ORDER BY policyname;
"

# Expected: 3 policies (SELECT, INSERT, ALL for service_role)
```

### Rollback Procedure

**If issues occur, rollback with**:

```sql
-- Run in Supabase SQL Editor

-- Drop all functions
DROP FUNCTION IF EXISTS join_waitlist(TEXT, JSONB);
DROP FUNCTION IF EXISTS get_waitlist_stats();
DROP FUNCTION IF EXISTS mark_waitlist_notified(UUID[]);

-- Drop table (CASCADE removes all policies and indexes)
DROP TABLE IF EXISTS growth_scale_waitlist CASCADE;
```

**Rollback Timeline**: 1 minute
**Data Loss**: All waitlist entries lost (acceptable for optional feature)

---

## Local Testing Instructions

### Complete Local Testing Flow

```bash
# ============================================
# STEP 1: Set up local environment
# ============================================

# Start local Supabase
supabase start

# Note the local database URL (usually):
# postgresql://postgres:postgres@localhost:54322/postgres

# ============================================
# STEP 2: Apply migrations locally
# ============================================

# Apply Migration 021
supabase db push

# Verify no errors
# Expected output: "Finished supabase db push"

# ============================================
# STEP 3: Verify Migration 021
# ============================================

psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
-- Check new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'auth_provider',
    'selected_tier',
    'is_first_login',
    'signup_source',
    'stripe_subscription_id'
  )
ORDER BY column_name;

-- Check indexes created
SELECT indexname
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE '%auth%'
   OR indexname LIKE '%first_login%'
   OR indexname LIKE '%stripe%'
ORDER BY indexname;

-- Check existing users backfilled
SELECT
  COUNT(*) as total_users,
  COUNT(auth_provider) as has_provider,
  COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_flagged
FROM users;

-- All counts should be equal
EOF

# ============================================
# STEP 4: Test OAuth user creation
# ============================================

psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
-- Simulate OAuth user creation by inserting into auth.users
-- The trigger should automatically create users table entry

INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  raw_app_meta_data,
  email_confirmed_at,
  created_at
) VALUES (
  gen_random_uuid(),
  'test-google-user@example.com',
  '{"provider": "google", "full_name": "Test User", "selected_tier": "free"}'::jsonb,
  '{"provider": "google"}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id;

-- Check that users table entry was created
SELECT id, email, auth_provider, selected_tier, is_first_login
FROM users
WHERE email = 'test-google-user@example.com';

-- Expected:
-- auth_provider = 'google'
-- selected_tier = 'free'
-- is_first_login = true
EOF

# ============================================
# STEP 5: Verify Migration 022
# ============================================

psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
-- Check table exists
\d growth_scale_waitlist

-- Check RLS policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'growth_scale_waitlist'
ORDER BY policyname;

-- Check indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'growth_scale_waitlist'
ORDER BY indexname;

-- Check functions exist
SELECT proname
FROM pg_proc
WHERE proname IN ('join_waitlist', 'get_waitlist_stats', 'mark_waitlist_notified')
ORDER BY proname;
EOF

# ============================================
# STEP 6: Test waitlist functionality
# ============================================

# Get a test user UUID
TEST_USER_ID=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT id FROM users LIMIT 1;")

psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
-- Set session as authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '$TEST_USER_ID';

-- Test joining Growth waitlist
SELECT * FROM join_waitlist('growth', '{"utm_source": "local_test"}'::jsonb);

-- Expected: success = true, message = "Successfully added to waitlist"

-- Test duplicate prevention
SELECT * FROM join_waitlist('growth');

-- Expected: success = true, message = "Already on waitlist"

-- Verify user can read own entry
SELECT interested_tier, current_tier, joined_at
FROM growth_scale_waitlist;

-- Expected: 1 row returned
EOF

# ============================================
# STEP 7: Test RLS policies
# ============================================

psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
-- Create second test user
INSERT INTO auth.users (id, email, created_at)
VALUES (gen_random_uuid(), 'test-user-2@example.com', NOW())
RETURNING id;

-- Get second user ID
\set user2_id (SELECT id FROM auth.users WHERE email = 'test-user-2@example.com')

-- Try to read as different user (should return 0 rows)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = :'user2_id';

SELECT COUNT(*) FROM growth_scale_waitlist;

-- Expected: 0 (user 2 can't see user 1's entries)

-- Try to insert for different user (should fail)
INSERT INTO growth_scale_waitlist (user_id, email, interested_tier)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'test-google-user@example.com'),
  'wrong@example.com',
  'growth'
);

-- Expected: ERROR - RLS policy violation
EOF

# ============================================
# SUCCESS CRITERIA
# ============================================
echo "
Local testing complete! ✅

Verify all these passed:
✅ Migration 021 applied without errors
✅ New columns exist in users table
✅ Indexes created
✅ Existing users backfilled
✅ OAuth user creation works
✅ Trigger captures OAuth provider
✅ Migration 022 applied without errors
✅ Waitlist table created
✅ RLS policies enforce security
✅ join_waitlist() function works
✅ Duplicate prevention works
✅ Users can only see own entries

If all passed, ready for production deployment!
"
```

---

## Production Deployment Checklist

### Pre-Deployment (30 minutes before)

**1. Create Production Backup**
- [ ] Log into Supabase Dashboard
- [ ] Navigate to Settings → Database → Backups
- [ ] Click "Create New Backup"
- [ ] Wait for backup to complete (~5 minutes)
- [ ] Verify backup exists before proceeding

**2. Verify Application Compatibility**
- [ ] Confirm frontend code does NOT require new columns yet
- [ ] Confirm application works WITHOUT new columns
- [ ] Confirm migrations are backward compatible
- [ ] Review rollback procedure

**3. Schedule Deployment Window**
- [ ] Choose low-traffic time (e.g., 2-4 AM)
- [ ] Notify team of maintenance window
- [ ] Have rollback plan ready
- [ ] Assign backup person to monitor

### Deployment (15-20 minutes)

**4. Apply Migration 021**
```bash
# Connect to production
supabase link --project-ref pdmtvkcxnqysujnpcnyh

# Verify connection
supabase status

# Apply migration
supabase db push --linked

# Monitor output for errors
# Expected: "Finished supabase db push"
```

**5. Verify Migration 021**
```bash
# Check columns created
psql $(supabase status --json | jq -r '.db_url') << EOF
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'auth_provider',
    'selected_tier',
    'is_first_login',
    'signup_source',
    'stripe_subscription_id'
  );
EOF

# Expected: 5 rows returned

# Check backfill worked
psql $(supabase status --json | jq -r '.db_url') -c "
SELECT
  COUNT(*) as total,
  COUNT(auth_provider) as has_provider,
  COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_flagged
FROM users;
"

# Expected: All counts equal
```

**6. Smoke Test Application**
- [ ] Open production site
- [ ] Test existing user login
- [ ] Verify no errors in browser console
- [ ] Check application still functional
- [ ] Monitor error logs for 5 minutes

**7. Apply Migration 022**
```bash
# Apply waitlist migration
supabase db push --linked

# Verify table created
psql $(supabase status --json | jq -r '.db_url') -c "\d growth_scale_waitlist"

# Check RLS policies
psql $(supabase status --json | jq -r '.db_url') -c "
SELECT policyname FROM pg_policies
WHERE tablename = 'growth_scale_waitlist';
"

# Expected: 3 policies
```

**8. Final Verification**
- [ ] Application still functional
- [ ] No error spikes in logs
- [ ] Database queries responding normally
- [ ] Users can still sign up/login
- [ ] All verification queries passing

### Post-Deployment (30 minutes after)

**9. Monitor Production**
- [ ] Watch Supabase Dashboard → Database → Logs
- [ ] Monitor application error logs
- [ ] Check user signup rate (should be normal)
- [ ] Verify no performance degradation
- [ ] Test new user signup creates correct columns

**10. Document Completion**
- [ ] Update handoff-notes.md with deployment status
- [ ] Record any issues encountered
- [ ] Note any deviations from plan
- [ ] Update architecture.md if needed

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- ❌ Migration fails with errors
- ❌ Application breaks after migration
- ❌ Database performance degrades significantly
- ❌ User signups start failing
- ❌ Critical functionality broken

### Rollback Migration 021

**Timeline**: 5 minutes
**Impact**: Returns to pre-migration state

```sql
-- Run in Supabase SQL Editor

-- 1. Drop indexes
DROP INDEX IF EXISTS idx_users_auth_provider;
DROP INDEX IF EXISTS idx_users_is_first_login;
DROP INDEX IF EXISTS idx_users_signup_source;
DROP INDEX IF EXISTS idx_users_stripe_customer_id_unique;
DROP INDEX IF EXISTS idx_users_stripe_subscription_id_unique;

-- 2. Drop columns
ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;

-- 3. Restore previous trigger from migration 018
CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        full_name,
        tier,
        monthly_analyses_used,
        subscription_status,
        email_verified,
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

-- 4. Verify rollback
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'auth_provider',
    'selected_tier',
    'is_first_login',
    'signup_source',
    'stripe_subscription_id'
  );

-- Expected: 0 rows (columns removed)
```

### Rollback Migration 022

**Timeline**: 1 minute
**Impact**: Removes waitlist table (data lost)

```sql
-- Run in Supabase SQL Editor

-- Drop all functions and table
DROP FUNCTION IF EXISTS join_waitlist(TEXT, JSONB);
DROP FUNCTION IF EXISTS get_waitlist_stats();
DROP FUNCTION IF EXISTS mark_waitlist_notified(UUID[]);
DROP TABLE IF EXISTS growth_scale_waitlist CASCADE;

-- Verify rollback
SELECT tablename
FROM pg_tables
WHERE tablename = 'growth_scale_waitlist';

-- Expected: 0 rows (table removed)
```

---

## Verification Queries

### Migration 021 Verification

```sql
-- ============================================
-- QUERY 1: Check all columns exist
-- ============================================
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'auth_provider',
    'selected_tier',
    'is_first_login',
    'signup_source',
    'stripe_subscription_id'
  )
ORDER BY column_name;

-- Expected: 5 rows
-- auth_provider: TEXT, NULL, YES
-- selected_tier: TEXT, 'free', YES
-- is_first_login: BOOLEAN, true, YES
-- signup_source: TEXT, NULL, YES
-- stripe_subscription_id: TEXT, NULL, YES

-- ============================================
-- QUERY 2: Check indexes exist
-- ============================================
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND (
    indexname LIKE '%auth%' OR
    indexname LIKE '%first_login%' OR
    indexname LIKE '%signup%' OR
    indexname LIKE '%stripe%'
  )
ORDER BY indexname;

-- Expected: 5 indexes
-- idx_users_auth_provider
-- idx_users_is_first_login
-- idx_users_signup_source
-- idx_users_stripe_customer_id_unique
-- idx_users_stripe_subscription_id_unique

-- ============================================
-- QUERY 3: Check backfill worked
-- ============================================
SELECT
  COUNT(*) as total_users,
  COUNT(auth_provider) as users_with_provider,
  COUNT(CASE WHEN auth_provider = 'magic_link' THEN 1 END) as magic_link_users,
  COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users_flagged,
  COUNT(selected_tier) as users_with_selected_tier,
  AVG(CASE WHEN is_first_login = false THEN 1 ELSE 0 END) * 100 as pct_existing_flagged
FROM users;

-- Expected:
-- - All users have auth_provider
-- - All existing users have is_first_login = false
-- - All users have selected_tier
-- - pct_existing_flagged = 100% (all existing users)

-- ============================================
-- QUERY 4: Check trigger updated
-- ============================================
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_user_creation';

-- Expected: Function source includes 'auth_provider', 'selected_tier', 'is_first_login'

-- ============================================
-- QUERY 5: Test new user creation
-- ============================================
-- Create test user via auth.users insert
-- Check that users table entry has correct auth_provider

INSERT INTO auth.users (id, email, raw_app_meta_data, email_confirmed_at, created_at)
VALUES (
  gen_random_uuid(),
  'test-migration-verify@example.com',
  '{"provider": "google"}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id;

-- Then check users table
SELECT id, email, auth_provider, is_first_login, selected_tier
FROM users
WHERE email = 'test-migration-verify@example.com';

-- Expected:
-- auth_provider = 'google'
-- is_first_login = true
-- selected_tier = 'free'

-- Clean up test user
DELETE FROM auth.users WHERE email = 'test-migration-verify@example.com';
```

### Migration 022 Verification

```sql
-- ============================================
-- QUERY 1: Check table structure
-- ============================================
\d growth_scale_waitlist

-- Expected:
-- Column           | Type               | Nullable
-- -----------------+--------------------+----------
-- id               | uuid               | not null
-- user_id          | uuid               |
-- email            | text               | not null
-- interested_tier  | text               | not null
-- current_tier     | text               |
-- joined_at        | timestamptz        | not null
-- notified         | boolean            |
-- notified_at      | timestamptz        |
-- metadata         | jsonb              |
--
-- Indexes: pkey, unique(user_id, interested_tier), 4 other indexes
-- Constraints: CHECK interested_tier IN ('growth', 'scale')

-- ============================================
-- QUERY 2: Check RLS policies
-- ============================================
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'growth_scale_waitlist'
ORDER BY cmd, policyname;

-- Expected: 3 policies
-- 1. Users can view own waitlist entries (SELECT)
-- 2. Users can insert own waitlist entries (INSERT)
-- 3. Service role full access to waitlist (ALL)

-- ============================================
-- QUERY 3: Check indexes
-- ============================================
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'growth_scale_waitlist'
ORDER BY indexname;

-- Expected: 5 indexes total
-- - Primary key index
-- - Unique constraint index (user_id, interested_tier)
-- - idx_waitlist_user_id
-- - idx_waitlist_interested_tier
-- - idx_waitlist_notified
-- - idx_waitlist_joined_at

-- ============================================
-- QUERY 4: Check functions exist
-- ============================================
SELECT proname, prorettype::regtype, proargtypes::regtype[]
FROM pg_proc
WHERE proname IN ('join_waitlist', 'get_waitlist_stats', 'mark_waitlist_notified')
ORDER BY proname;

-- Expected: 3 functions
-- join_waitlist(text, jsonb) → SETOF record
-- get_waitlist_stats() → SETOF record
-- mark_waitlist_notified(uuid[]) → integer

-- ============================================
-- QUERY 5: Test waitlist function
-- ============================================
-- As authenticated user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<test-user-uuid>';

-- Test joining Growth waitlist
SELECT * FROM join_waitlist('growth', '{"test": "verification"}'::jsonb);

-- Expected: success = true, message = "Successfully added to waitlist"

-- Test duplicate prevention
SELECT * FROM join_waitlist('growth');

-- Expected: success = true, message = "Already on waitlist"

-- Verify entry created
SELECT interested_tier, notified, metadata
FROM growth_scale_waitlist;

-- Expected: 1 row, interested_tier = 'growth', notified = false

-- Clean up
RESET ROLE;
DELETE FROM growth_scale_waitlist WHERE user_id = '<test-user-uuid>';
```

---

## Troubleshooting

### Issue 1: Migration 021 Fails to Apply

**Symptom**: Error during `supabase db push`

**Possible Causes**:
1. Column already exists from previous attempt
2. Index name conflict
3. RLS policy blocking trigger
4. Insufficient permissions

**Solution**:
```sql
-- Check if columns already exist
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('auth_provider', 'selected_tier', 'is_first_login');

-- If columns exist, migration might have partially applied
-- Either:
-- A) Complete manually by running remaining steps
-- B) Rollback completely and re-apply

-- Check for index conflicts
SELECT indexname FROM pg_indexes WHERE tablename = 'users';

-- If indexes exist with same names, drop them:
DROP INDEX IF EXISTS idx_users_auth_provider;
-- ... etc.

-- Then re-run migration
```

---

### Issue 2: Existing Users Not Backfilled

**Symptom**: Some users have NULL in new columns

**Diagnosis**:
```sql
SELECT
  COUNT(*) as total,
  COUNT(auth_provider) as has_provider,
  COUNT(*) - COUNT(auth_provider) as missing_provider
FROM users;
```

**Solution**:
```sql
-- Manually backfill missing data
UPDATE users
SET
  auth_provider = 'magic_link',
  is_first_login = false,
  selected_tier = COALESCE(tier, 'free')
WHERE auth_provider IS NULL;

-- Verify fix
SELECT COUNT(*) FROM users WHERE auth_provider IS NULL;
-- Expected: 0
```

---

### Issue 3: Trigger Not Capturing OAuth Provider

**Symptom**: New OAuth users have auth_provider = NULL

**Diagnosis**:
```sql
-- Check recent users
SELECT id, email, auth_provider, created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- Check auth.users metadata
SELECT id, email, raw_app_meta_data, raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

**Solution**:
```sql
-- Trigger may need adjustment to read metadata correctly
-- Check metadata structure
SELECT
  email,
  raw_app_meta_data->>'provider' as app_provider,
  raw_user_meta_data->>'provider' as user_provider
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 day';

-- If metadata structure different, update trigger:
CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
...
-- Adjust metadata reading logic
```

---

### Issue 4: Waitlist Function Returns "Not authenticated"

**Symptom**: `join_waitlist()` always returns "Not authenticated"

**Diagnosis**:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'growth_scale_waitlist';

-- Check auth context
SELECT auth.uid();
-- Should return user UUID, not NULL
```

**Solution**:
- Ensure calling function with authenticated session
- Check JWT token is valid
- Verify `auth.uid()` returns user ID
- Test with service role key for debugging

```javascript
// In frontend code:
const { data: session } = await supabase.auth.getSession();
if (!session) {
  console.error('No active session');
  return;
}

const { data, error } = await supabase.rpc('join_waitlist', {
  p_interested_tier: 'growth'
});
```

---

### Issue 5: Performance Degradation After Migration

**Symptom**: Queries slower after adding indexes

**Diagnosis**:
```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'users'
ORDER BY idx_scan DESC;

-- Check table statistics
ANALYZE users;
```

**Solution**:
```sql
-- If indexes not being used, rebuild statistics
ANALYZE users;
ANALYZE growth_scale_waitlist;

-- If still slow, check query plans
EXPLAIN ANALYZE
SELECT * FROM users WHERE auth_provider = 'google';

-- May need to adjust index strategy
```

---

## Success Criteria

### Migration 021 Success
- ✅ All 5 new columns exist in users table
- ✅ All 5 indexes created and functional
- ✅ 100% of existing users backfilled with defaults
- ✅ New OAuth users get correct auth_provider
- ✅ Trigger captures OAuth metadata correctly
- ✅ Application continues functioning normally
- ✅ No performance degradation
- ✅ RLS policies still enforced

### Migration 022 Success
- ✅ `growth_scale_waitlist` table created
- ✅ 3 RLS policies active and enforced
- ✅ 4 indexes created for performance
- ✅ `join_waitlist()` function works correctly
- ✅ Users can join Growth waitlist
- ✅ Users can join Scale waitlist
- ✅ Duplicate prevention works
- ✅ RLS prevents cross-user access
- ✅ Statistics function returns data

### Overall Success
- ✅ Zero application downtime
- ✅ No user-facing errors
- ✅ All existing functionality preserved
- ✅ Ready for OAuth implementation
- ✅ Ready for tier-based upsell pages
- ✅ Backup available for rollback if needed

---

## Next Steps

After successful migration deployment:

1. **Update Application Code** (@developer)
   - Implement OAuth signup flow
   - Use new `auth_provider` column for analytics
   - Implement first login detection using `is_first_login`
   - Create waitlist join UI for Growth/Scale tiers

2. **Update Documentation** (@documenter)
   - Add migration to architecture.md
   - Document new database schema
   - Update API documentation with new fields

3. **Monitor Production** (@operator)
   - Watch database performance metrics
   - Monitor error rates
   - Track new user signups with OAuth
   - Monitor waitlist growth

4. **Deploy Frontend Changes** (@developer)
   - OAuth button components
   - Tier selection UI
   - Waitlist signup forms
   - Post-signup routing logic

---

## Contact & Support

**Issues During Migration**:
- Check Troubleshooting section first
- Review Supabase logs in Dashboard
- Consult with @operator for infrastructure issues
- Rollback if critical functionality broken

**Questions About Schema**:
- Refer to TECHNICAL_DESIGN_AUTH_MONETIZATION.md
- Check agent-context.md for business requirements
- Review USER_STORIES_AUTH_MONETIZATION.md for acceptance criteria

**Rollback Decision**:
- Critical: Immediate rollback if signups break
- High: Rollback within 1 hour if performance degrades >20%
- Medium: Rollback within 24 hours if data inconsistencies found
- Low: Can fix forward if minor issues (documentation, analytics)

---

**Document Status**: Production Ready ✅
**Last Updated**: 2025-10-02
**Next Review**: After OAuth deployment
