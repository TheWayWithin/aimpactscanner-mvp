-- Migration 020: Fix RLS policies blocking user signup
-- Date: 2025-10-02
-- Purpose: Allow users to create their own profile during signup

-- Drop all existing conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated user insert" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_service_role_all" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Create simple, working policies
-- 1. Allow users to read their own data
CREATE POLICY "users_can_read_own" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- 2. CRITICAL: Allow users to INSERT their own profile during signup
CREATE POLICY "users_can_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own data
CREATE POLICY "users_can_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow service role full access (for admin operations)
CREATE POLICY "service_role_all" ON users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify policies were created
SELECT 'RLS Policies Created:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY cmd, policyname;
