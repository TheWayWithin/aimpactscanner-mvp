-- CRITICAL FIX: Apply missing authentication migration
-- This script fixes 27 users who can't access the system after authentication
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- Step 1: Create the missing trigger function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, tier, monthly_analyses_used, subscription_status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'coffee',
        0,
        'inactive'
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

-- Step 2: Create the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Step 3: Backfill all 27 missing users
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    tier, 
    monthly_analyses_used, 
    subscription_status, 
    created_at, 
    updated_at
)
SELECT 
    au.id,
    au.email,
    COALESCE(
        au.raw_user_meta_data->>'full_name', 
        split_part(au.email, '@', 1)
    ),
    'coffee',  -- Default tier
    0,         -- Start with 0 analyses
    'inactive',
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify the fix worked
SELECT 
    'Before:' as status,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users,
    (SELECT COUNT(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)) as missing_users;

-- Expected output: auth_users = public_users, missing_users = 0