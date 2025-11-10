-- Fix get_actual_user_tier function to bypass RLS with SECURITY DEFINER
--
-- PROBLEM: Function was missing SECURITY DEFINER, causing RLS policies to block
-- subscription data access when called by anon users, resulting in tier defaulting to 'free'
--
-- SOLUTION: Add SECURITY DEFINER and SET search_path for security
--
-- This fixes Growth tier users seeing "Upgrade" badge on PDF export despite having access

-- Drop the existing function
DROP FUNCTION IF EXISTS get_actual_user_tier(uuid);

-- Recreate with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_actual_user_tier(user_id UUID)
RETURNS TABLE(
  actual_tier VARCHAR(20),
  subscription_status VARCHAR(20),
  has_active_subscription BOOLEAN,
  stripe_subscription_id VARCHAR(255)
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT
      u.tier,
      u.subscription_tier,
      u.subscription_status,
      u.tier_expires_at
    FROM users u
    WHERE u.id = get_actual_user_tier.user_id
  ),
  subscription_data AS (
    SELECT
      s.tier,
      s.status,
      s.stripe_subscription_id
    FROM subscriptions s
    WHERE s.user_id = get_actual_user_tier.user_id
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

-- Add migration metadata
COMMENT ON FUNCTION get_actual_user_tier(UUID) IS 'Fixed to use SECURITY DEFINER to bypass RLS. Migration 025 - 2025-11-10';
