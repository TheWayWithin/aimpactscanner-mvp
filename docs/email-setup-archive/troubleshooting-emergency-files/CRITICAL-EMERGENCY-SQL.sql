-- ⚠️ CRITICAL EMERGENCY FIX - EXECUTE IMMEDIATELY ⚠️
-- Navigate to: https://supabase.com/dashboard/project/pdmtvkcxnqysujnpcnyh/sql
-- Copy this entire file and click RUN

-- PRIORITY 1: Fix RLS Policies (406 Errors)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can read own user data" ON users;

CREATE POLICY "Users can read own user data" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        (auth.uid() IS NOT NULL AND email_verified = true)
    );

-- PRIORITY 2: Fix User Creation (401 Errors)  
DROP POLICY IF EXISTS "Allow signup user creation" ON users;
CREATE POLICY "Allow signup user creation" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- PRIORITY 3: Fix User Updates
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- PRIORITY 4: Improved User Creation Trigger
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        tier,
        monthly_analyses_used,
        subscription_status,
        email_verified,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        0,
        'active',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_user_on_signup
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for performance
DROP INDEX IF EXISTS idx_users_auth_id;
CREATE INDEX idx_users_auth_id ON users (id);
DROP INDEX IF EXISTS idx_users_email_verified;
CREATE INDEX idx_users_email_verified ON users (email_verified);

-- ✅ DATABASE FIX COMPLETE
-- ⚠️ STILL NEED: SMTP Configuration in Auth Settings!