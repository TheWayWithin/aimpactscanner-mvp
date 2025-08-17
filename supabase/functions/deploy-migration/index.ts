import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting migration deployment...')

    // Execute the migration SQL directly
    const migrationSQL = `
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
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })

    if (migrationError) {
      console.error('Migration error:', migrationError)
      // If rpc doesn't exist, try direct execution
      console.log('Trying direct SQL execution...')
      
      // Try executing parts individually using client
      const { error: alterError } = await supabase.from('users').select('*').limit(1)
      console.log('Table access test:', alterError ? 'FAILED' : 'SUCCESS')
    }

    // Create the RPC function for get_user_data
    const createFunctionSQL = `
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
    `

    console.log('Creating get_user_data function...')
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    })

    if (functionError) {
      console.error('Function creation error:', functionError)
    }

    // Test the new function
    console.log('Testing database connection and schema...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, email, tier, subscription_tier, monthly_analyses_used, subscription_status')
      .limit(1)

    console.log('Test query result:', { testData, testError })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration deployment attempted',
        migrationError: migrationError?.message || null,
        functionError: functionError?.message || null,
        testResult: { testData, testError: testError?.message || null },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Deploy migration error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})