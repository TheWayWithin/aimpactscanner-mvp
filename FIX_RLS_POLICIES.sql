-- Fix RLS Policies for users table
-- Run this in Supabase SQL Editor to fix 406 errors

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

-- Allow users to read their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own record
CREATE POLICY "Users can insert own record" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own data  
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role full access" ON users
FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Verify policies were created
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;