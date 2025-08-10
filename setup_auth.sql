-- Minimal authentication setup for existing database
-- This script only adds the necessary auth improvements without recreating existing tables

-- Create function to automatically create user profile on signup (if not exists)
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

-- Create trigger to automatically create user profile (drop first if exists)
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

-- Create trigger for login tracking (drop first if exists)
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_password_strength(TEXT) TO authenticated;

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
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();

-- Ensure all existing users have proper defaults
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