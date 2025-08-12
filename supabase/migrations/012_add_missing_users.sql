-- Migration: Add missing users to users table
-- These users exist in auth but not in the users table

-- Add the main test user
INSERT INTO users (
  id,
  email,
  tier,
  subscription_tier,
  subscription_status,
  monthly_analyses_used,
  monthly_reset_date,
  created_at,
  updated_at
) VALUES (
  '9b54c8e8-f049-4254-8989-68e3962ab625',
  'wlkgztsglmfzmhyrok@fxavaj.com',
  'free',
  'free',
  'active',
  3,
  CURRENT_DATE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  updated_at = NOW();

-- Also ensure the other test user exists
INSERT INTO users (
  id,
  email,
  tier,
  subscription_tier,
  subscription_status,
  monthly_analyses_used,
  monthly_reset_date,
  created_at,
  updated_at
) VALUES (
  '45bacda7-3d43-4235-9bc0-89501361eac6',
  'ugcbwkkfxvhhxyxmih@xfavaj.com',
  'free',
  'free',
  'active',
  0,
  CURRENT_DATE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  tier = EXCLUDED.tier,
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_status = EXCLUDED.subscription_status,
  updated_at = NOW();

-- Add any other auth users that might be missing from users table
-- This ensures all authenticated users have a corresponding users table entry
INSERT INTO users (id, email, tier, subscription_tier, subscription_status, monthly_analyses_used, monthly_reset_date, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'free',
  'free',
  'active',
  0,
  CURRENT_DATE,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;