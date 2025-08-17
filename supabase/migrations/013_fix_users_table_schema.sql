-- Fix users table schema inconsistencies that cause 406 errors
-- Ensures all columns referenced in the application exist

-- Add missing subscription_tier column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';

-- Ensure all required columns exist with proper defaults
ALTER TABLE users ALTER COLUMN tier SET DEFAULT 'free';
ALTER TABLE users ALTER COLUMN monthly_analyses_used SET DEFAULT 0;
ALTER TABLE users ALTER COLUMN subscription_status SET DEFAULT 'inactive';

-- Update existing users to have subscription_tier = tier if null
UPDATE users SET 
  subscription_tier = COALESCE(subscription_tier, tier, 'free'),
  updated_at = NOW()
WHERE subscription_tier IS NULL;

-- Add index for subscription_tier for better performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Grant necessary permissions for authenticated users to read their own data
GRANT SELECT ON users TO authenticated;

-- Ensure RLS policies allow proper access
-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile  
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role can manage all users
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (current_setting('role') = 'service_role');

-- Allow authenticated users to insert their own user record (for user creation)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a safer function to get user data that handles missing users gracefully
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_data(UUID) TO service_role;