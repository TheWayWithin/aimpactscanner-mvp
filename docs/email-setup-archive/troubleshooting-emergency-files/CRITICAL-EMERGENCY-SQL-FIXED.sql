-- ⚠️ CRITICAL EMERGENCY FIX - SCHEMA CORRECTED VERSION ⚠️
-- Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql
-- Copy this entire file and click RUN

-- SCHEMA FIX: Remove email_verified column references (doesn't exist)
-- Use Supabase's built-in auth.users.email_confirmed_at instead

-- PRIORITY 1: Fix RLS Policies (406 Errors)
-- Remove restrictive policies that block unverified users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own user data" ON users;

-- Create policy that allows unverified users to read their own data
-- This prevents 406 errors during user initialization
CREATE POLICY "Users can read own user data" ON users
    FOR SELECT USING (
        auth.uid() = id
    );

-- PRIORITY 2: Fix User Creation (401 Errors)  
-- Allow users to create their own profile during signup
DROP POLICY IF EXISTS "Allow signup user creation" ON users;
CREATE POLICY "Allow signup user creation" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- PRIORITY 3: Fix User Updates
-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PRIORITY 4: Service Role Access (Keep existing)
-- Ensure service role can manage all users
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (current_setting('role') = 'service_role');

-- PRIORITY 5: Improved User Creation Trigger
-- Remove references to non-existent email_verified column
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile with existing schema columns only
    INSERT INTO public.users (
        id,
        email,
        tier,
        monthly_analyses_used,
        subscription_status,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        0,
        'active',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log warning but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
CREATE TRIGGER create_user_on_signup
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRIORITY 6: Performance Indexes (Keep existing ones)
-- Only create indexes for columns that exist
DROP INDEX IF EXISTS idx_users_auth_id;
CREATE INDEX idx_users_auth_id ON users (id);

-- Add index for tier column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier);

-- Add index for subscription_status if it doesn't exist  
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users (subscription_status);

-- PRIORITY 7: Grant proper permissions
-- Ensure authenticated users can access their data
GRANT SELECT ON users TO authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

-- PRIORITY 8: Email Verification Check Function (OPTIONAL)
-- Create helper function that uses auth.users.email_confirmed_at
CREATE OR REPLACE FUNCTION is_email_verified(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = user_id 
        AND email_confirmed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_email_verified(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_verified(UUID) TO service_role;

-- ✅ SCHEMA-CORRECTED DATABASE FIX COMPLETE
-- ⚠️ STILL NEED: SMTP Configuration in Auth Settings!
-- Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/auth/settings
-- Enable SMTP with your preferred email provider

-- 🎯 VERIFICATION NOTES:
-- This SQL works with existing users table schema (no email_verified column)
-- Uses Supabase's native auth.users.email_confirmed_at for email verification
-- Frontend already checks session?.user?.email_confirmed_at
-- RLS policies now allow unverified users to access their data during initialization
-- User creation trigger creates profiles without schema conflicts