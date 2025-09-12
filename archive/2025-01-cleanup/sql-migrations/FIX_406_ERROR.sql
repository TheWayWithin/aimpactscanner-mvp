-- Fix 406 Error - RLS Policy Issues
-- The 406 error indicates RLS policies are blocking user creation/reading

-- First, check if RLS is enabled on users table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';

-- Check existing RLS policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Add a policy that allows users to read their own record
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Add a policy that allows users to insert their own record
CREATE POLICY "Users can insert own record" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Add a policy that allows users to update their own record
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Make sure service role can do everything
CREATE POLICY "Service role full access" ON users
    FOR ALL
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Grant necessary permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;