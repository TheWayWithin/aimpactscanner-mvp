-- Final fix for tier and subscription issues

-- 1. First check current state
SELECT 
  'BEFORE' as status,
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  u.tier_expires_at,
  s.tier as sub_tier,
  s.status as sub_status,
  s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- 2. Update the user to have coffee tier (avoid subscription_tier due to constraint)
UPDATE users
SET 
  tier = 'coffee',
  tier_expires_at = NOW() + INTERVAL '30 days',
  subscription_status = 'active',
  monthly_analyses_used = 0,
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- 3. Update the coffee subscription to have valid dates
UPDATE subscriptions
SET 
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  status = 'active',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND tier = 'coffee';

-- 4. If no coffee subscription exists, create one
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

-- 5. Clean up any inactive or test subscriptions
UPDATE subscriptions
SET status = 'canceled', updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND (tier LIKE '%test%' OR status != 'active')
  AND tier != 'coffee';

-- 6. Verify the fix
SELECT 
  'AFTER' as status,
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

-- 7. Test the function
SELECT * FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);