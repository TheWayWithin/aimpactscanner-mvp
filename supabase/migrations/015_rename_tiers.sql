-- Migration: Rename Professional to Growth and Enterprise to Scale
-- Date: 2025-08-25
-- Purpose: Update tier names and maintain backward compatibility

-- 1. Update existing user tiers
UPDATE users 
SET tier = 'growth' 
WHERE tier = 'professional';

UPDATE users 
SET tier = 'scale' 
WHERE tier = 'enterprise';

-- Note: subscription_tier column has constraints, we'll leave it as-is for now
-- to avoid breaking existing functionality

-- 2. Update existing subscriptions
UPDATE subscriptions 
SET tier = 'growth' 
WHERE tier = 'professional';

UPDATE subscriptions 
SET tier = 'scale' 
WHERE tier = 'enterprise';

-- 3. Update analyses table if it has tier references
UPDATE analyses 
SET user_tier = 'growth' 
WHERE user_tier = 'professional';

UPDATE analyses 
SET user_tier = 'scale' 
WHERE user_tier = 'enterprise';

-- 4. Create or update the get_actual_user_tier function to handle new names
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
      u.subscription_status,
      u.tier_expires_at
    FROM users u
    WHERE u.id = user_id
  ),
  subscription_data AS (
    SELECT 
      s.tier,
      s.status,
      s.stripe_subscription_id
    FROM subscriptions s
    WHERE s.user_id = user_id 
      AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(
      CASE 
        -- Map old names to new names for backward compatibility
        WHEN sd.tier = 'professional' THEN 'growth'
        WHEN sd.tier = 'enterprise' THEN 'scale'
        WHEN sd.tier = 'coffeesub_test_123' THEN 'coffee'
        ELSE sd.tier
      END,
      CASE 
        WHEN ud.tier = 'professional' THEN 'growth'
        WHEN ud.tier = 'enterprise' THEN 'scale'
        ELSE ud.tier
      END,
      'free'
    )::VARCHAR(20) AS actual_tier,
    COALESCE(sd.status, ud.subscription_status, 'active')::VARCHAR(20) AS subscription_status,
    (sd.tier IS NOT NULL)::BOOLEAN AS has_active_subscription,
    sd.stripe_subscription_id::VARCHAR(255)
  FROM user_data ud
  LEFT JOIN subscription_data sd ON TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Add comment for documentation
COMMENT ON FUNCTION get_actual_user_tier(UUID) IS 'Returns the actual user tier with new naming: free, coffee, growth (formerly professional), scale (formerly enterprise)';