-- Fix the constraint issue by removing the sync trigger and checking what values are allowed

-- 1. First, drop the problematic trigger that's trying to sync the columns
DROP TRIGGER IF EXISTS sync_tier_columns_trigger ON users;
DROP FUNCTION IF EXISTS sync_tier_columns();

-- 2. Check what the constraint actually allows
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE '%subscription_tier%';

-- 3. Check what values are currently in subscription_tier
SELECT DISTINCT subscription_tier, COUNT(*) 
FROM users 
WHERE subscription_tier IS NOT NULL
GROUP BY subscription_tier;

-- 4. Reset both columns to 'free' first (which should always be allowed)
UPDATE users
SET 
  tier = 'free',
  subscription_tier = 'free',
  subscription_status = 'active',
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- 5. Now update ONLY the tier column (not subscription_tier)
UPDATE users
SET 
  tier = 'coffee',
  tier_expires_at = NOW() + INTERVAL '30 days',
  subscription_status = 'active',
  monthly_analyses_used = 0,
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- 6. Update or create the coffee subscription
UPDATE subscriptions
SET 
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND tier = 'coffee';

-- If no coffee subscription exists, create one
INSERT INTO subscriptions (
  user_id,
  tier,
  status,
  stripe_subscription_id,
  stripe_price_id,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) 
SELECT 
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com'),
  'coffee',
  'active',
  'sub_manual_coffee_' || substr(gen_random_uuid()::text, 1, 8),
  'price_coffee_monthly',
  NOW(),
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions 
  WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
    AND tier = 'coffee'
);

-- 7. Verify the final state
SELECT 
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  u.tier_expires_at,
  s.tier as sub_tier,
  s.status as sub_status,
  s.current_period_end,
  CASE 
    WHEN u.tier = 'coffee' AND s.status = 'active' THEN '✅ Fixed!'
    ELSE '❌ Still needs fixing'
  END as result
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- 8. Test the function
SELECT * FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);