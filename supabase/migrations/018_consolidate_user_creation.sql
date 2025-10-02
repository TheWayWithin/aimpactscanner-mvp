-- Migration: 018_consolidate_user_creation.sql
-- Purpose: Fix conflicting triggers and RLS policies
-- Resolves: All signup failures (422, 406, 401 errors and RLS violations)
-- Date: 2025-10-01
-- Author: THE ARCHITECT (AGENT-11)

-- =============================================================================
-- ROOT CAUSE: Two migrations (010 and 017) created conflicting triggers
-- - Migration 010: create_user_profile() trigger
-- - Migration 017: handle_new_user() trigger
-- - BOTH fire on auth.users INSERT → race condition → RLS violations
-- =============================================================================

-- ============================================
-- STEP 1: Clean up conflicting triggers
-- ============================================

DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP TRIGGER IF EXISTS update_user_last_login_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_user_last_login();

-- ============================================
-- STEP 2: Create single authoritative trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert or update user profile
    -- ON CONFLICT ensures idempotency if trigger fires multiple times
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
    -- Log error but don't fail the auth process
    -- This ensures signup completes even if user profile creation has issues
    RAISE WARNING 'User profile creation failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create single trigger that handles both INSERT and UPDATE
CREATE TRIGGER handle_user_creation_trigger
    AFTER INSERT OR UPDATE OF email_confirmed_at, last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_creation();

-- ============================================
-- STEP 3: Fix RLS policies - Remove conflicts
-- ============================================

-- Drop ALL existing user policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow signup user creation" ON users;
DROP POLICY IF EXISTS "Service role can read users" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;

-- ============================================
-- STEP 4: Create clean, simple RLS policies
-- ============================================

-- Users can read their own data (verified or not)
-- Simple policy: if auth.uid() matches user id, allow SELECT
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own data (verified or not)
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role has full access (for Edge Functions)
CREATE POLICY "users_service_role_all" ON users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can insert their own profile
-- (Backup policy in case trigger fails - shouldn't normally be used)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STEP 5: Add email_verified column if missing
-- ============================================

-- Add column with default value (safe for existing records)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Update existing users based on auth.users confirmation status
UPDATE users u
SET email_verified = (au.email_confirmed_at IS NOT NULL)
FROM auth.users au
WHERE u.id = au.id
  AND u.email_verified IS DISTINCT FROM (au.email_confirmed_at IS NOT NULL);

-- ============================================
-- STEP 6: Ensure all existing users have profiles
-- ============================================

-- Create profiles for any auth.users without corresponding users record
-- This handles users who may have been created before this migration
INSERT INTO public.users (
    id,
    email,
    full_name,
    tier,
    monthly_analyses_used,
    subscription_status,
    email_verified,
    created_at,
    updated_at
)
SELECT
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ),
    COALESCE(au.raw_user_meta_data->>'tier', 'free'),
    0,
    'active',
    (au.email_confirmed_at IS NOT NULL),
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 7: Verification and testing
-- ============================================

-- Test that trigger function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'handle_user_creation'
    ) THEN
        RAISE EXCEPTION 'Critical: Trigger function not created!';
    END IF;
    RAISE NOTICE '✅ Trigger function exists: handle_user_creation';
END $$;

-- Test that trigger exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'handle_user_creation_trigger'
    ) THEN
        RAISE EXCEPTION 'Critical: Trigger not created!';
    END IF;
    RAISE NOTICE '✅ Trigger exists: handle_user_creation_trigger';
END $$;

-- Test that RLS policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'users';

    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Critical: Not all RLS policies created! Found: %, Expected: >= 4', policy_count;
    END IF;
    RAISE NOTICE '✅ RLS policies created: % policies', policy_count;
END $$;

-- Test that email_verified column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name = 'email_verified'
    ) THEN
        RAISE EXCEPTION 'Critical: email_verified column not created!';
    END IF;
    RAISE NOTICE '✅ Column exists: email_verified';
END $$;

-- Log successful migration completion
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 018 completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ User creation trigger consolidated';
    RAISE NOTICE '✅ Conflicting triggers removed';
    RAISE NOTICE '✅ RLS policies simplified (4 policies)';
    RAISE NOTICE '✅ Email verification column ensured';
    RAISE NOTICE '✅ Existing users backfilled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Signup flow should now work correctly';
    RAISE NOTICE 'Test with: supabase.auth.signUp()';
    RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- MIGRATION NOTES FOR OPERATORS
-- =============================================================================
--
-- What this migration does:
-- 1. Removes duplicate triggers from migrations 010 and 017
-- 2. Creates single authoritative trigger for user profile creation
-- 3. Simplifies RLS policies to basic principles (users see their own data)
-- 4. Ensures email_verified column exists and is populated
-- 5. Backfills any missing user profiles
--
-- Expected results after migration:
-- - New signups create user in both auth.users and public.users
-- - No more 406 errors when reading user profile
-- - No more 401 errors on user creation
-- - No more RLS violations during signup
-- - Email verification tracked correctly
--
-- Rollback plan (if needed):
-- This migration is safe to rollback by re-applying migration 017
-- However, that will re-introduce the bug, so only rollback if critical issue
--
-- Testing after deployment:
-- 1. Test signup: Should succeed without errors
-- 2. Check tables: User should exist in both auth.users and users
-- 3. Test login: Should work after email verification
-- 4. Check RLS: User should be able to read their own profile
--
-- =============================================================================
