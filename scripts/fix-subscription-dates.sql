-- Fix subscription dates and tier sync issues

-- 1. Update the Coffee subscription to have valid dates (active for next 30 days)
UPDATE subscriptions
SET 
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND tier = 'coffee'
  AND status = 'active';

-- 2. Fix the user record - just update tier, not subscription_tier (to avoid constraint)
UPDATE users
SET 
  tier = 'coffee',
  tier_expires_at = NOW() + INTERVAL '30 days',
  subscription_status = 'active',
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- 3. Check what the constraint actually allows for subscription_tier
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE '%subscription_tier%';

-- 4. Verify the updates
SELECT 
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  u.tier_expires_at,
  s.tier as sub_tier,
  s.status as sub_status,
  s.current_period_end,
  s.stripe_subscription_id
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- 5. Test the function
SELECT * FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);