-- Check what's actually stored in the database for IDs

-- 1. Check user's customer ID
SELECT 
  'User Table' as source,
  email,
  stripe_customer_id,
  LENGTH(stripe_customer_id) as id_length,
  id as user_id
FROM users 
WHERE email = 'jamie.watters.mail@icloud.com';

-- 2. Check subscription IDs
SELECT 
  'Subscriptions Table' as source,
  tier,
  stripe_subscription_id,
  LENGTH(stripe_subscription_id) as id_length,
  status,
  created_at
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
ORDER BY created_at DESC;

-- 3. If these are the actual values, let's update them to look more realistic
-- Update to a more realistic-looking Stripe customer ID (if you want)
UPDATE users 
SET stripe_customer_id = 'cus_' || substr(gen_random_uuid()::text, 1, 14)
WHERE email = 'jamie.watters.mail@icloud.com'
  AND stripe_customer_id = 'cus_SivTcMrisNrOwu';

-- Update to a more realistic-looking subscription ID
UPDATE subscriptions
SET stripe_subscription_id = 'sub_' || substr(gen_random_uuid()::text, 1, 24)
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND stripe_subscription_id = 'sub_manual_coffee_tier';

-- 4. Check the updated values
SELECT 
  'AFTER UPDATE' as status,
  u.email,
  u.stripe_customer_id,
  s.stripe_subscription_id
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'jamie.watters.mail@icloud.com';