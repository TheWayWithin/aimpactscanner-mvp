-- Database Schema Inspection Queries
-- Project: AImpactScanner MVP (Staging)
-- Database: impactscanner-staging (pdmtvkcxnqysujnpcnyh.supabase.co)
-- Purpose: Identify which migrations have been applied
-- Usage: Run these in Supabase SQL Editor to diagnose schema drift

-- =============================================================================
-- CRITICAL: Run these queries to identify schema drift
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. CHECK APPLIED MIGRATIONS (Most Important)
-- -----------------------------------------------------------------------------
-- This tells us which migration files have been applied
SELECT version, applied_at
FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

-- Expected: 22 migrations from 002 through 022
-- Reality: Likely FEWER migrations applied
-- Missing migrations = Schema drift

-- -----------------------------------------------------------------------------
-- 2. CHECK FOR is_first_login COLUMN (OAuth Blocker)
-- -----------------------------------------------------------------------------
-- This is THE critical column causing OAuth failures
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'is_first_login';

-- Expected: 1 row returned (column exists)
-- Reality: Likely 0 rows (column missing) ❌
-- Impact: ALL OAuth logins fail

-- -----------------------------------------------------------------------------
-- 3. CHECK ALL users TABLE COLUMNS (Schema Validation)
-- -----------------------------------------------------------------------------
-- Compare this to expected schema from migrations
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Expected columns (from migrations):
-- - id (UUID, PRIMARY KEY)
-- - email (TEXT)
-- - full_name (TEXT)
-- - tier (VARCHAR(20))
-- - subscription_tier (VARCHAR(20))
-- - selected_tier (TEXT) ← Migration 021
-- - monthly_analyses_used (INTEGER)
-- - subscription_status (VARCHAR(20))
-- - stripe_customer_id (VARCHAR(255))
-- - stripe_subscription_id (TEXT) ← Migration 021
-- - email_verified (BOOLEAN) ← Migration 018
-- - auth_provider (TEXT) ← Migration 021
-- - is_first_login (BOOLEAN) ← Migration 021 ⚠️ CRITICAL
-- - signup_source (TEXT) ← Migration 021
-- - last_analysis_id (UUID) ← Migration 009
-- - last_login_at (TIMESTAMP) ← Migration 009
-- - total_analyses_count (INTEGER) ← Migration 009
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- -----------------------------------------------------------------------------
-- 4. CHECK USER CREATION TRIGGERS (Race Condition Detection)
-- -----------------------------------------------------------------------------
-- Migration 018 consolidated conflicting triggers
SELECT
  t.tgname as trigger_name,
  t.tgrelid::regclass as table_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgname NOT LIKE 'pg_%'
ORDER BY t.tgname;

-- Expected (after migration 018):
-- - handle_user_creation_trigger → handle_user_creation()
--
-- BAD STATE (before migration 018):
-- - create_user_profile_trigger → create_user_profile() ❌
-- - create_user_on_signup → handle_new_user() ❌
--   ^ These two cause race conditions and RLS violations

-- -----------------------------------------------------------------------------
-- 5. CHECK RLS POLICIES (Permission Issues)
-- -----------------------------------------------------------------------------
-- Migration 018 simplified RLS policies from 8+ to 4
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected (after migration 018): 4 policies
-- - users_insert_own (INSERT)
-- - users_select_own (SELECT)
-- - users_service_role_all (ALL)
-- - users_update_own (UPDATE)
--
-- BAD STATE (before migration 018): 8+ policies with conflicts
-- - "Users can view their own profile" (from migration 013) ❌
-- - "Users can update their own profile" (from migration 013) ❌
-- - Conflicts cause permission denied errors

-- -----------------------------------------------------------------------------
-- 6. CHECK USER TRACKING FUNCTIONS (Dashboard Features)
-- -----------------------------------------------------------------------------
-- Migration 009 added dashboard tracking functions
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_user_tracking',
    'get_user_dashboard_data',
    'handle_user_creation',
    'get_actual_user_tier',
    'sync_tier_columns'
  )
ORDER BY p.proname;

-- Expected functions:
-- - handle_user_creation() ← Migration 018 (CRITICAL)
-- - update_user_tracking(user_uuid UUID, analysis_uuid UUID) ← Migration 009
-- - get_user_dashboard_data(user_uuid UUID) ← Migration 009
-- - get_actual_user_tier(user_id UUID) ← Migration 014
-- - sync_tier_columns() ← Migration 014 (trigger function)

-- -----------------------------------------------------------------------------
-- 7. CHECK INDEXES (Performance)
-- -----------------------------------------------------------------------------
-- Migrations added performance indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname NOT LIKE 'pg_%'
ORDER BY indexname;

-- Expected indexes (from various migrations):
-- - idx_users_auth_provider ← Migration 021
-- - idx_users_is_first_login ← Migration 021
-- - idx_users_signup_source ← Migration 021
-- - idx_users_stripe_customer_id_unique ← Migration 021
-- - idx_users_stripe_subscription_id_unique ← Migration 021
-- - idx_users_last_analysis ← Migration 009
-- - idx_users_last_login ← Migration 009
-- - idx_users_total_count ← Migration 009
-- - idx_users_subscription_tier ← Migration 013

-- -----------------------------------------------------------------------------
-- 8. CHECK TIER SYNCHRONIZATION (Tier Display Issues)
-- -----------------------------------------------------------------------------
-- Migration 014 ensures tier and subscription_tier stay in sync
SELECT
  id,
  email,
  tier,
  subscription_tier,
  selected_tier,
  subscription_status,
  CASE
    WHEN tier != subscription_tier THEN 'MISMATCH ❌'
    ELSE 'OK ✅'
  END as tier_status
FROM users
ORDER BY tier_status DESC, created_at DESC
LIMIT 20;

-- Expected: All users have tier = subscription_tier
-- Reality: May have mismatches if migration 014 not applied

-- -----------------------------------------------------------------------------
-- 9. CHECK FOR ORPHANED USERS (Missing Profiles)
-- -----------------------------------------------------------------------------
-- Migration 018 backfills users missing from public.users
SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  u.created_at as profile_created,
  CASE
    WHEN u.id IS NULL THEN 'MISSING PROFILE ❌'
    ELSE 'OK ✅'
  END as profile_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Expected: 0 rows (all auth.users have public.users records)
-- Reality: May have orphaned users if trigger failed

-- -----------------------------------------------------------------------------
-- 10. CHECK SAMPLE USER DATA (Real-World Validation)
-- -----------------------------------------------------------------------------
-- Verify actual user data structure
SELECT
  id,
  email,
  tier,
  selected_tier,
  is_first_login,
  auth_provider,
  signup_source,
  subscription_status,
  last_login_at,
  total_analyses_count,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- This shows what columns actually exist and what values they have
-- Compare to expected schema from migrations

-- -----------------------------------------------------------------------------
-- 11. CHECK WAITLIST TABLE (Optional Feature)
-- -----------------------------------------------------------------------------
-- Migration 022 added Growth/Scale waitlist
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_name = 'growth_scale_waitlist'
) as waitlist_table_exists;

-- Expected: true (if migration 022 applied)
-- Reality: Likely false (optional feature)

-- -----------------------------------------------------------------------------
-- 12. CHECK ANALYSIS TRACKING (Dashboard Dependencies)
-- -----------------------------------------------------------------------------
-- Verify analyses table and user tracking
SELECT
  COUNT(*) as total_analyses,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as latest_analysis
FROM analyses;

-- Then check if users table is tracking properly
SELECT
  COUNT(*) as users_with_tracking,
  COUNT(*) FILTER (WHERE last_analysis_id IS NOT NULL) as users_with_last_analysis,
  COUNT(*) FILTER (WHERE total_analyses_count > 0) as users_with_count
FROM users;

-- Expected: last_analysis_id and total_analyses_count columns exist
-- Reality: Columns may be missing if migration 009 not applied

-- =============================================================================
-- DIAGNOSTIC QUERIES (If Issues Found)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DIAGNOSTIC: Why is OAuth failing?
-- -----------------------------------------------------------------------------
-- Run this query that mimics what OAuthCallback.jsx does
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- Replace with real user ID
BEGIN
  -- This is the query that's failing
  PERFORM id, email, tier, is_first_login, subscription_status, monthly_analyses_used
  FROM users
  WHERE id = test_user_id;

  RAISE NOTICE 'Query succeeded! Column exists.';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'ERROR: is_first_login column missing! Apply migration 021.';
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- DIAGNOSTIC: Which migrations are missing?
-- -----------------------------------------------------------------------------
-- Compare expected migrations to applied migrations
WITH expected_migrations AS (
  SELECT unnest(ARRAY[
    '002_analysis_tables',
    '003_service_role_policies',
    '004_test_utilities',
    '005_add_missing_columns',
    '005_coffee_tier_infrastructure',
    '006_debug_rls_policy',
    '007_fix_factors_rls',
    '008_rpc_get_factors',
    '009_phase2_user_tracking',
    '010_enable_email_password_auth',
    '011_fix_monthly_reset_logic',
    '012_add_missing_users',
    '013_fix_users_table_schema',
    '014_sync_tier_columns',
    '015_rename_tiers',
    '016_fix_service_role_users_access',
    '017_fix_email_verification',
    '018_consolidate_user_creation',
    '019_diagnostic_helper_functions',
    '020_fix_rls_for_signup',
    '021_auth_tier_columns',
    '022_waitlist_table'
  ]) as migration_name
),
applied_migrations AS (
  SELECT version
  FROM supabase_migrations.schema_migrations
)
SELECT
  e.migration_name,
  CASE
    WHEN a.version IS NOT NULL THEN '✅ APPLIED'
    ELSE '❌ MISSING'
  END as status
FROM expected_migrations e
LEFT JOIN applied_migrations a ON e.migration_name = a.version
ORDER BY e.migration_name;

-- This shows exactly which migrations need to be applied

-- =============================================================================
-- QUICK HEALTH CHECK (Run This First)
-- =============================================================================

DO $$
DECLARE
  migrations_count INTEGER;
  is_first_login_exists BOOLEAN;
  trigger_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Check migrations
  SELECT COUNT(*) INTO migrations_count
  FROM supabase_migrations.schema_migrations;

  -- Check critical column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_first_login'
  ) INTO is_first_login_exists;

  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass AND tgname LIKE '%user%';

  -- Check RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users';

  -- Report
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'DATABASE HEALTH CHECK';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Migrations Applied: % (Expected: 22)', migrations_count;
  RAISE NOTICE 'is_first_login Exists: % (Expected: true)', is_first_login_exists;
  RAISE NOTICE 'User Creation Triggers: % (Expected: 1)', trigger_count;
  RAISE NOTICE 'RLS Policies on users: % (Expected: 4)', policy_count;
  RAISE NOTICE '===========================================';

  IF migrations_count < 22 THEN
    RAISE NOTICE '❌ CRITICAL: Missing migrations! Apply missing migrations.';
  END IF;

  IF NOT is_first_login_exists THEN
    RAISE NOTICE '❌ CRITICAL: is_first_login column missing! OAuth will fail.';
    RAISE NOTICE '   Solution: Apply migration 021_auth_tier_columns.sql';
  END IF;

  IF trigger_count > 1 THEN
    RAISE NOTICE '⚠️  WARNING: Multiple triggers detected! Race condition risk.';
    RAISE NOTICE '   Solution: Apply migration 018_consolidate_user_creation.sql';
  END IF;

  IF policy_count != 4 THEN
    RAISE NOTICE '⚠️  WARNING: Expected 4 RLS policies, found %', policy_count;
    RAISE NOTICE '   Solution: Apply migration 018_consolidate_user_creation.sql';
  END IF;

  IF migrations_count = 22 AND is_first_login_exists AND trigger_count = 1 AND policy_count = 4 THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Database schema is correct!';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

-- =============================================================================
-- END OF INSPECTION QUERIES
-- =============================================================================

-- HOW TO USE THIS FILE:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy/paste the QUICK HEALTH CHECK (above) and run it
-- 3. Review the output to identify issues
-- 4. Run individual diagnostic queries as needed
-- 5. Use results to determine which migrations to apply
--
-- CRITICAL: Run queries 1, 2, 3, 4, 5 to get full picture of schema drift
