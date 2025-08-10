-- Enable Email/Password Authentication Migration
-- Configures Supabase for modern email/password authentication with enhanced security

-- Ensure users table exists with all necessary columns
-- The auth.users table is automatically created by Supabase, but we need our custom users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'free',
    tier_expires_at TIMESTAMP,
    monthly_analyses_used INTEGER DEFAULT 0,
    monthly_reset_date DATE DEFAULT CURRENT_DATE,
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(20) DEFAULT 'inactive',
    last_analysis_id UUID,
    last_login_at TIMESTAMP DEFAULT NOW(),
    total_analyses_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_last_analysis ON users(last_analysis_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_total_count ON users(total_analyses_count);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Service role can manage all users" ON users
    FOR ALL USING (current_setting('role') = 'service_role');

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, update their info instead
        UPDATE public.users 
        SET 
            email = NEW.email,
            full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
            updated_at = NOW()
        WHERE id = NEW.id;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Create function to handle user login tracking
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last login time when user signs in
    UPDATE public.users 
    SET 
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS update_user_last_login_trigger ON auth.users;
CREATE TRIGGER update_user_last_login_trigger
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_user_last_login();

-- Create function to validate password strength (called from client)
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    score INTEGER,
    missing_requirements TEXT[]
) AS $$
DECLARE
    requirements TEXT[] := '{}';
    strength_score INTEGER := 0;
BEGIN
    -- Check minimum length (8 characters)
    IF length(password) < 8 THEN
        requirements := requirements || 'minimum 8 characters';
    ELSE
        strength_score := strength_score + 1;
    END IF;
    
    -- Check for at least one number
    IF password !~ '\d' THEN
        requirements := requirements || 'at least one number';
    ELSE
        strength_score := strength_score + 1;
    END IF;
    
    -- Check for at least one special character
    IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        requirements := requirements || 'at least one special character';
    ELSE
        strength_score := strength_score + 1;
    END IF;
    
    -- Check for at least one lowercase letter
    IF password !~ '[a-z]' THEN
        requirements := requirements || 'at least one lowercase letter';
    ELSE
        strength_score := strength_score + 1;
    END IF;
    
    -- Check for at least one uppercase letter
    IF password !~ '[A-Z]' THEN
        requirements := requirements || 'at least one uppercase letter';
    ELSE
        strength_score := strength_score + 1;
    END IF;
    
    RETURN QUERY SELECT 
        (strength_score = 5) as is_valid,
        strength_score,
        requirements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user authentication stats
CREATE OR REPLACE FUNCTION get_user_auth_stats(user_uuid UUID)
RETURNS TABLE (
    total_logins INTEGER,
    last_login TIMESTAMP,
    account_age_days INTEGER,
    password_last_changed TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        1 as total_logins, -- Placeholder - would need additional tracking table for full stats
        u.last_login_at,
        EXTRACT(DAY FROM NOW() - u.created_at)::INTEGER as account_age_days,
        au.updated_at as password_last_changed
    FROM public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_password_strength(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_auth_stats(UUID) TO authenticated;

-- Update existing users to have proper default values if they don't exist
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.created_at,
    NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Ensure all existing users have proper tier and usage defaults
UPDATE public.users 
SET 
    tier = COALESCE(tier, 'free'),
    monthly_analyses_used = COALESCE(monthly_analyses_used, 0),
    monthly_reset_date = COALESCE(monthly_reset_date, CURRENT_DATE),
    subscription_status = COALESCE(subscription_status, 'inactive'),
    total_analyses_count = COALESCE(total_analyses_count, 0),
    last_login_at = COALESCE(last_login_at, created_at),
    updated_at = NOW()
WHERE tier IS NULL 
   OR monthly_analyses_used IS NULL 
   OR monthly_reset_date IS NULL 
   OR subscription_status IS NULL 
   OR total_analyses_count IS NULL 
   OR last_login_at IS NULL;