-- Migration: 017_fix_email_verification.sql
-- Purpose: EMERGENCY FIX - Resolve email verification system failures
-- Date: 2025-09-30
-- Context: Production emergency - users cannot complete registration

-- =============================================================================
-- PRIORITY 1: Fix RLS Policies for Unverified Users (406 Errors)
-- =============================================================================

-- Drop the restrictive policy that blocks unverified users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own user data" ON users;

-- Create updated policy that allows unverified users to read their own data
CREATE POLICY "Users can read own user data" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        (auth.uid() IS NOT NULL AND email_verified = true)
    );

-- =============================================================================
-- PRIORITY 2: Fix User Creation Permissions (401 Errors) 
-- =============================================================================

-- Allow users to insert their own profile during signup (even when unverified)
CREATE POLICY IF NOT EXISTS "Allow signup user creation" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update existing user modification policy to work with unverified users
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =============================================================================
-- PRIORITY 3: Fix User Profile Creation Trigger
-- =============================================================================

-- Drop and recreate the user creation trigger function with better error handling
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Improved function that handles unverified users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create user profile if one doesn't already exist
    INSERT INTO public.users (
        id,
        email,
        tier,
        monthly_analyses_used,
        subscription_status,
        email_verified,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        0,
        'active',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires on user creation or email confirmation
CREATE TRIGGER create_user_on_signup
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- PRIORITY 4: Ensure Database Indexes for Performance
-- =============================================================================

-- Ensure indexes exist for the new query patterns
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users (id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users (email_verified);

-- =============================================================================
-- VERIFICATION QUERIES (for testing)
-- =============================================================================

-- Test query 1: Verify RLS policies work for unverified users
-- SELECT id, email, tier FROM users WHERE id = auth.uid();

-- Test query 2: Verify user creation works
-- This should not fail when called during signup process

-- Test query 3: Check trigger function exists
-- SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- =============================================================================
-- ROLLBACK PLAN (in case of issues)
-- =============================================================================

/*
-- To rollback this migration if needed:

DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP POLICY IF EXISTS "Allow signup user creation" ON users;
DROP POLICY IF EXISTS "Users can read own user data" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Restore original restrictive policy:
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);
*/