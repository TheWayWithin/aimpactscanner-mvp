-- Check how Coffee tier users are stored in PRODUCTION
-- This will show us the pattern that WORKS
SELECT
  id,
  email,
  tier,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  created_at
FROM users
WHERE tier = 'coffee'
LIMIT 5;
