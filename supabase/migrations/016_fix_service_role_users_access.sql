-- Fix service role access to users table for Stripe portal sessions
-- This allows Edge Functions to read user Stripe customer IDs

-- Allow service role to read users table (for accessing Stripe customer IDs)
CREATE POLICY "Service role can read users" ON users
  FOR SELECT USING (
    current_setting('role') = 'service_role'
  );

-- Also allow service role to manage all user operations if needed
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );