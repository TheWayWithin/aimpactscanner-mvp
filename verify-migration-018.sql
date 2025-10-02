-- ============================================
-- CRITICAL VERIFICATION: Migration 018 Status
-- ============================================
-- Purpose: Verify that Migration 018's trigger actually exists in production
-- Date: 2025-10-01

-- 1. Check if trigger exists
SELECT '=== TRIGGER STATUS ===' as section;
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'handle_user_creation_trigger';

-- 2. Check if trigger function exists
SELECT '=== TRIGGER FUNCTION STATUS ===' as section;
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'handle_user_creation';

-- 3. List ALL triggers on auth.users table
SELECT '=== ALL TRIGGERS ON auth.users ===' as section;
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass;

-- 4. Check RLS policies on users table
SELECT '=== RLS POLICIES ON users TABLE ===' as section;
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. Check for OLD triggers that should be DELETED
SELECT '=== OLD TRIGGERS (Should be EMPTY) ===' as section;
SELECT tgname FROM pg_trigger
WHERE tgname IN ('create_user_profile_trigger', 'create_user_on_signup')
  AND tgrelid = 'auth.users'::regclass;

-- 6. Check for OLD functions that should be DELETED
SELECT '=== OLD FUNCTIONS (Should be EMPTY) ===' as section;
SELECT proname FROM pg_proc
WHERE proname IN ('create_user_profile', 'handle_new_user');

-- 7. Verify email_verified column exists
SELECT '=== email_verified COLUMN STATUS ===' as section;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'email_verified';

-- 8. Count users with and without email_verified
SELECT '=== USER DATA STATUS ===' as section;
SELECT
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_users
FROM users;
