-- Fix tier metadata key mismatch in user creation trigger
--
-- PROBLEM: OAuth stores 'selected_tier' but trigger reads 'tier'
-- SOLUTION: Check both keys (selected_tier first, then tier, then default to free)
--
-- This fixes the issue where all Growth tier signups since Oct 24 got tier: 'free'
-- instead of tier: 'growth' because the metadata key didn't match what the trigger expected.

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger function with fixed metadata key
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user record with correct tier from metadata
  INSERT INTO public.users (
    id,
    email,
    tier,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- FIX: Check both 'selected_tier' AND 'tier' metadata keys
    -- Try 'tier' first (OAuth now stores this), fallback to 'selected_tier' (legacy), then 'free'
    COALESCE(
      NEW.raw_user_meta_data->>'tier',               -- Try this first (new OAuth metadata)
      NEW.raw_user_meta_data->>'selected_tier',      -- Fallback to legacy key
      'free'                                          -- Default if both missing
    ),
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add migration metadata
COMMENT ON FUNCTION public.handle_new_user() IS 'Fixed to check both tier and selected_tier metadata keys. Migration 024 - 2025-11-09';
