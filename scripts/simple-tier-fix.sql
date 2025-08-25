-- Step 1: Check current constraints on the users table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c';

-- Step 2: Check current state of your user
SELECT 
  u.id,
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status
FROM users u
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- Step 3: Check what values the constraint allows for subscription_tier
-- Based on the error, it seems 'coffee' is not allowed, only specific values
-- Let's see what other users have
SELECT DISTINCT subscription_tier 
FROM users 
WHERE subscription_tier IS NOT NULL;

-- Step 4: Update your user to have consistent free tier
-- This should work with the constraint
UPDATE users 
SET 
  tier = 'free',
  subscription_tier = 'free',
  subscription_status = 'active',
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- Step 5: Clean up the test subscription
UPDATE subscriptions 
SET status = 'inactive', updated_at = NOW()
WHERE tier LIKE '%test%' 
  AND user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com');

-- Step 6: If you want coffee tier, create a proper subscription record
-- First delete any existing coffee subscriptions for this user
DELETE FROM subscriptions 
WHERE user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
  AND tier = 'coffee';

-- Then insert a new proper coffee subscription
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
) VALUES (
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com'),
  'coffee',
  'active',
  'sub_manual_coffee_tier',
  'price_coffee_tier',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
);

-- Step 7: Now update the user to coffee tier (if the constraint allows it)
-- Try updating just the tier column first
UPDATE users 
SET 
  tier = 'coffee',
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- Step 8: Create the helper function
DROP FUNCTION IF EXISTS get_actual_user_tier(UUID);
CREATE OR REPLACE FUNCTION get_actual_user_tier(user_id UUID)
RETURNS TABLE(
  actual_tier VARCHAR(20),
  subscription_status VARCHAR(20),
  has_active_subscription BOOLEAN,
  stripe_subscription_id VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      u.tier,
      u.subscription_tier,
      u.subscription_status as user_status,
      u.tier_expires_at
    FROM users u
    WHERE u.id = user_id
  ),
  subscription_data AS (
    SELECT 
      s.tier as sub_tier,
      s.status as sub_status,
      s.stripe_subscription_id
    FROM subscriptions s
    WHERE s.user_id = get_actual_user_tier.user_id
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  )
  SELECT 
    CASE 
      -- If there's an active subscription, use that tier
      WHEN sd.sub_tier IN ('coffee', 'professional', 'enterprise') THEN sd.sub_tier
      -- Otherwise use the highest tier from user table
      WHEN ud.tier IN ('coffee', 'professional', 'enterprise') THEN ud.tier
      WHEN ud.subscription_tier IN ('coffee', 'professional', 'enterprise') THEN ud.subscription_tier
      -- Check if tier is expired
      WHEN ud.tier_expires_at IS NOT NULL AND ud.tier_expires_at < NOW() THEN 'free'
      -- Default to free
      ELSE 'free'
    END as actual_tier,
    COALESCE(sd.sub_status, ud.user_status, 'active') as subscription_status,
    (sd.sub_tier IS NOT NULL) as has_active_subscription,
    sd.stripe_subscription_id
  FROM user_data ud
  LEFT JOIN subscription_data sd ON true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO service_role;

-- Step 9: Test the function
SELECT * FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);

-- Step 10: Verify final state
SELECT 
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  s.tier as active_sub_tier,
  s.status as sub_status
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
WHERE u.email = 'jamie.watters.mail@icloud.com';