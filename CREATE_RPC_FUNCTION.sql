-- Create the get_user_data RPC function that's missing from the database
-- This function handles user data retrieval with automatic user creation fallback
-- Execute this SQL in the Supabase Dashboard SQL Editor

CREATE OR REPLACE FUNCTION get_user_data(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  tier VARCHAR(20),
  subscription_tier VARCHAR(20),
  stripe_customer_id VARCHAR(255),
  monthly_analyses_used INTEGER,
  subscription_status VARCHAR(20)
) 
SECURITY DEFINER
AS $$
BEGIN
  -- First try to get existing user
  RETURN QUERY 
  SELECT 
    u.id,
    u.email,
    u.tier,
    u.subscription_tier,
    u.stripe_customer_id,
    u.monthly_analyses_used,
    u.subscription_status
  FROM users u
  WHERE u.id = user_id;
  
  -- If no results, create the user entry and return defaults
  IF NOT FOUND THEN
    -- Get email from auth.users
    INSERT INTO users (id, email, tier, subscription_tier, monthly_analyses_used, subscription_status)
    SELECT 
      au.id,
      au.email,
      'free',
      'free', 
      0,
      'inactive'
    FROM auth.users au
    WHERE au.id = user_id
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
    
    -- Return the newly created user data
    RETURN QUERY 
    SELECT 
      u.id,
      u.email,
      u.tier,
      u.subscription_tier,
      u.stripe_customer_id,
      u.monthly_analyses_used,
      u.subscription_status
    FROM users u
    WHERE u.id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO service_role;