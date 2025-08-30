-- Fix Account Issues for jamie.watters.mail@icloud.com
-- Issue 1: Missing service role policy for create-portal-session function
-- Issue 2: Truncated Stripe customer ID causing portal session failures

-- Step 1: Add service role policy for users table
-- This allows Edge Functions to read user data including stripe_customer_id
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

-- Step 2: Grant necessary permissions
GRANT SELECT ON users TO service_role;
GRANT UPDATE ON users TO service_role;

-- Step 3: Fix the truncated Stripe customer ID for jamie.watters.mail@icloud.com
-- The current ID "cus_00de545e-ed33-" is truncated and needs to be corrected
-- This will require manual intervention or recreation of the Stripe customer

-- To identify the correct customer ID, check your Stripe dashboard for:
-- Email: jamie.watters.mail@icloud.com
-- Then update with the correct full customer ID:

-- UPDATE users 
-- SET stripe_customer_id = 'cus_CORRECT_FULL_CUSTOMER_ID_HERE'
-- WHERE email = 'jamie.watters.mail@icloud.com';

-- Step 4: Fix the truncated subscription ID as well
-- Current: "sub_5b8e1cde-940f-49ee-b11a-" (truncated)
-- Check Stripe dashboard for the correct subscription ID and update:

-- UPDATE subscriptions 
-- SET stripe_subscription_id = 'sub_CORRECT_FULL_SUBSCRIPTION_ID_HERE'
-- WHERE user_id = 'e8fda207-946e-48dc-87c4-909cfde3f543';

-- Step 5: Add service role policies for analyses table (for analysis count)
DROP POLICY IF EXISTS "Service role can manage analyses" ON analyses;
CREATE POLICY "Service role can manage analyses" ON analyses
  FOR ALL USING (current_setting('role') = 'service_role');

GRANT SELECT ON analyses TO service_role;

-- Step 6: Verification queries (run these after applying the above)
-- Check if policies are created:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND policyname LIKE '%service%';

-- Check user data access:
-- SELECT id, email, stripe_customer_id, tier FROM users WHERE email = 'jamie.watters.mail@icloud.com';

-- Check analysis count:
-- SELECT COUNT(*) FROM analyses WHERE user_id = 'e8fda207-946e-48dc-87c4-909cfde3f543';