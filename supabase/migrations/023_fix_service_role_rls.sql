-- Migration 023: Fix service role RLS policy for webhook updates
-- Date: 2025-10-30
-- Purpose: Fix RLS policy so service role can actually update users table
--
-- Issue: auth.role() doesn't work correctly in Edge Functions
-- Solution: Use current_setting('role') which works reliably

-- Drop the broken policy
DROP POLICY IF EXISTS "service_role_all" ON users;

-- Create working service role policy using current_setting('role')
-- This allows Edge Functions with service role key to bypass RLS
CREATE POLICY "service_role_all_access" ON users
    FOR ALL
    USING (
        current_setting('role') = 'service_role'
    )
    WITH CHECK (
        current_setting('role') = 'service_role'
    );

-- Verify policies were updated
SELECT 'RLS Policies Updated:' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY cmd, policyname;
