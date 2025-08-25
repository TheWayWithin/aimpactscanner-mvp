-- Migration to sync tier columns and clean up subscription data
-- This resolves the issue where users have different values in tier vs subscription_tier

-- First, let's sync the tier columns for existing users
-- Use the highest tier between tier and subscription_tier
UPDATE users 
SET 
  tier = CASE 
    WHEN subscription_tier IN ('coffee', 'professional', 'enterprise') AND tier = 'free' THEN subscription_tier
    WHEN tier IN ('coffee', 'professional', 'enterprise') AND subscription_tier = 'free' THEN tier
    ELSE COALESCE(tier, subscription_tier, 'free')
  END,
  subscription_tier = CASE 
    WHEN subscription_tier IN ('coffee', 'professional', 'enterprise') AND tier = 'free' THEN subscription_tier
    WHEN tier IN ('coffee', 'professional', 'enterprise') AND subscription_tier = 'free' THEN tier
    ELSE COALESCE(tier, subscription_tier, 'free')
  END,
  updated_at = NOW()
WHERE tier != subscription_tier OR tier IS NULL OR subscription_tier IS NULL;

-- Check for active subscriptions and update user tiers accordingly
UPDATE users u
SET 
  tier = s.tier,
  subscription_tier = s.tier,
  subscription_status = s.status,
  updated_at = NOW()
FROM subscriptions s
WHERE s.user_id = u.id 
  AND s.status = 'active'
  AND s.tier IN ('coffee', 'professional', 'enterprise')
  AND (u.tier = 'free' OR u.subscription_tier = 'free');

-- Create a function to get the actual user tier considering all sources
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

-- Create a trigger to keep tier and subscription_tier in sync
CREATE OR REPLACE FUNCTION sync_tier_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If tier is updated, sync to subscription_tier
  IF TG_OP = 'UPDATE' AND NEW.tier IS DISTINCT FROM OLD.tier THEN
    NEW.subscription_tier = NEW.tier;
  END IF;
  
  -- If subscription_tier is updated, sync to tier
  IF TG_OP = 'UPDATE' AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    NEW.tier = NEW.subscription_tier;
  END IF;
  
  -- For inserts, ensure both are the same
  IF TG_OP = 'INSERT' THEN
    IF NEW.tier IS NULL AND NEW.subscription_tier IS NOT NULL THEN
      NEW.tier = NEW.subscription_tier;
    ELSIF NEW.subscription_tier IS NULL AND NEW.tier IS NOT NULL THEN
      NEW.subscription_tier = NEW.tier;
    ELSIF NEW.tier IS NULL AND NEW.subscription_tier IS NULL THEN
      NEW.tier = 'free';
      NEW.subscription_tier = 'free';
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

-- Grant permissions for the new function
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_actual_user_tier(UUID) TO service_role;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);

-- Clean up orphaned test subscriptions
-- Mark test subscriptions as inactive if they don't match user's current tier
UPDATE subscriptions s
SET 
  status = 'inactive',
  updated_at = NOW()
WHERE s.tier LIKE '%test%' 
  AND s.status = 'active'
  AND EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = s.user_id 
    AND u.tier = 'free'
  );

-- Log the migration completion
DO $$ 
BEGIN
    RAISE NOTICE 'Tier synchronization migration completed.';
    RAISE NOTICE 'All tier and subscription_tier columns are now in sync.';
    RAISE NOTICE 'Added get_actual_user_tier() function for reliable tier checking.';
    RAISE NOTICE 'Added trigger to keep columns synchronized going forward.';
END $$;