-- First, let's check what constraints exist on the users table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND contype = 'c';

-- Check the current state of the user
SELECT 
  u.id,
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  s.tier as sub_tier,
  s.status as sub_status
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- The error shows subscription_tier is trying to be set to 'coffee' but there's a constraint
-- Let's check the table structure and constraints using information_schema
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name IN ('tier', 'subscription_tier');

-- If the constraint only allows specific values, we need to handle the test subscription differently
-- Let's clean up the test subscription first
UPDATE subscriptions 
SET status = 'inactive'
WHERE tier LIKE '%test%' 
  AND user_id = (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com');

-- Now update the user record to have matching tier columns
-- But we need to handle the constraint - the error suggests 'coffee' isn't a valid value
-- Let's check if it should be 'coffeesub_test_123' or if we should just use 'free'
UPDATE users 
SET 
  tier = 'free',
  subscription_tier = 'free',
  subscription_status = 'active',
  updated_at = NOW()
WHERE email = 'jamie.watters.mail@icloud.com';

-- Now let's create the function without the problematic UPDATE statements
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

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO service_role;

-- Create a trigger to keep tier and subscription_tier in sync (but respecting constraints)
CREATE OR REPLACE FUNCTION sync_tier_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if the values are valid per the check constraint
  -- We'll keep them in sync only for valid tier values
  
  -- If tier is updated to a valid value, sync to subscription_tier
  IF TG_OP = 'UPDATE' AND NEW.tier IS DISTINCT FROM OLD.tier THEN
    IF NEW.tier IN ('free', 'coffee', 'professional', 'enterprise') THEN
      NEW.subscription_tier = NEW.tier;
    END IF;
  END IF;
  
  -- If subscription_tier is updated to a valid value, sync to tier
  IF TG_OP = 'UPDATE' AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    IF NEW.subscription_tier IN ('free', 'coffee', 'professional', 'enterprise') THEN
      NEW.tier = NEW.subscription_tier;
    END IF;
  END IF;
  
  -- For inserts, ensure both are valid
  IF TG_OP = 'INSERT' THEN
    IF NEW.tier IS NULL OR NEW.tier NOT IN ('free', 'coffee', 'professional', 'enterprise') THEN
      NEW.tier = 'free';
    END IF;
    IF NEW.subscription_tier IS NULL OR NEW.subscription_tier NOT IN ('free', 'coffee', 'professional', 'enterprise') THEN
      NEW.subscription_tier = NEW.tier;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_tier_columns_trigger ON users;

-- Create the trigger
CREATE TRIGGER sync_tier_columns_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION sync_tier_columns();

-- Check the result
SELECT 
  u.email,
  u.tier,
  u.subscription_tier,
  u.subscription_status,
  get_actual_user_tier(u.id) as actual_tier_info
FROM users u
WHERE u.email = 'jamie.watters.mail@icloud.com';

-- Test the function
SELECT * FROM get_actual_user_tier(
  (SELECT id FROM users WHERE email = 'jamie.watters.mail@icloud.com')
);