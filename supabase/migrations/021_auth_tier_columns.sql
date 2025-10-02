-- Migration 021: Auth & Tier Columns for OAuth and Monetization
-- Date: 2025-10-02
-- Purpose: Add authentication provider tracking and tier management columns
-- Status: REQUIRED before OAuth deployment
-- Author: THE DEVELOPER (AGENT-11)
--
-- Critical Design Principles Applied:
-- ✅ Work WITH existing RLS policies, never bypass
-- ✅ Backward compatible with existing users table
-- ✅ Safe backfill strategy for existing users
-- ✅ Performance optimized with appropriate indexes

-- ============================================
-- STEP 1: Add authentication tracking columns
-- ============================================

-- Track which OAuth provider or magic link was used
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT;
COMMENT ON COLUMN users.auth_provider IS 'Authentication method: google, github, magic_link, or email';

-- Track tier selected during signup (may differ from current tier during payment)
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_tier TEXT DEFAULT 'free';
COMMENT ON COLUMN users.selected_tier IS 'Tier user selected during signup (before payment)';

-- Track first login flag for upsell skip logic
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT true;
COMMENT ON COLUMN users.is_first_login IS 'Skip upsell on first login after signup';

-- Track signup context for analytics
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_source TEXT;
COMMENT ON COLUMN users.signup_source IS 'Context: landing_page, direct_signup, etc.';

-- Track last login for analytics
-- NOTE: last_login_at already exists in users table from migration 010, no need to add again

-- ============================================
-- STEP 2: Add Stripe integration columns
-- ============================================

-- stripe_customer_id already exists in users table from migration 010
-- Just add comment for clarity
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID for payment tracking';

-- Add Stripe subscription ID for tracking active subscriptions
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for active subscriptions';

-- Add unique constraint on Stripe IDs to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id_unique
    ON users(stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_subscription_id_unique
    ON users(stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

-- ============================================
-- STEP 3: Add indexes for performance
-- ============================================

-- Index for auth provider lookups (filter by Google/GitHub users)
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Partial index for first login checks (only index users who haven't logged in)
-- This is very efficient since most users will have is_first_login = false after first login
CREATE INDEX IF NOT EXISTS idx_users_is_first_login
    ON users(is_first_login)
    WHERE is_first_login = true;

-- Index for signup source analytics
CREATE INDEX IF NOT EXISTS idx_users_signup_source ON users(signup_source);

-- NOTE: idx_users_stripe_customer and idx_users_subscription_status already exist from migration 010

-- ============================================
-- STEP 4: Backfill existing users
-- ============================================

-- Set auth_provider for existing users
-- Assumption: Existing users used email/password or magic link (email-based)
UPDATE users
SET auth_provider = 'magic_link'
WHERE auth_provider IS NULL;

-- Set is_first_login to false for existing users
-- (They've already logged in to create an account)
UPDATE users
SET is_first_login = false
WHERE is_first_login IS NULL OR is_first_login = true;

-- Ensure selected_tier matches current tier for existing users
UPDATE users
SET selected_tier = COALESCE(tier, 'free')
WHERE selected_tier IS NULL OR selected_tier = '';

-- Ensure subscription_status is set for existing users
-- NOTE: subscription_status already has DEFAULT 'inactive' in migration 010
UPDATE users
SET subscription_status = 'active'
WHERE subscription_status = 'inactive' AND tier != 'free';

-- ============================================
-- STEP 5: Update trigger to include new fields
-- ============================================

-- Update handle_user_creation trigger to capture OAuth provider
CREATE OR REPLACE FUNCTION public.handle_user_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_provider TEXT;
BEGIN
    -- Detect auth provider from app_metadata
    v_auth_provider := COALESCE(
        NEW.raw_app_meta_data->>'provider',
        CASE
            WHEN NEW.raw_user_meta_data->>'provider' IS NOT NULL
            THEN NEW.raw_user_meta_data->>'provider'
            ELSE 'magic_link'
        END
    );

    -- Insert or update user profile with OAuth data
    INSERT INTO public.users (
        id,
        email,
        full_name,
        tier,
        monthly_analyses_used,
        subscription_status,
        email_verified,
        auth_provider,
        selected_tier,
        is_first_login,
        signup_source,
        created_at,
        updated_at,
        last_login_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free'),
        0,
        'active',
        (NEW.email_confirmed_at IS NOT NULL),
        v_auth_provider,
        COALESCE(NEW.raw_user_meta_data->>'selected_tier', 'free'),
        true, -- New users always get is_first_login = true
        NEW.raw_user_meta_data->>'signup_source',
        COALESCE(NEW.created_at, NOW()),
        NOW(),
        COALESCE(NEW.last_sign_in_at, NOW())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        email_verified = (NEW.email_confirmed_at IS NOT NULL),
        last_login_at = COALESCE(NEW.last_sign_in_at, users.last_login_at),
        updated_at = NOW();

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'User profile creation failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Verification
-- ============================================

DO $$
DECLARE
    v_column_count INTEGER;
    v_index_count INTEGER;
BEGIN
    -- Verify all new columns exist
    SELECT COUNT(*) INTO v_column_count
    FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name IN (
        'auth_provider',
        'selected_tier',
        'is_first_login',
        'signup_source',
        'stripe_subscription_id'
      );

    IF v_column_count < 5 THEN
        RAISE EXCEPTION 'Migration failed: Not all columns created. Found: %, Expected: 5', v_column_count;
    END IF;

    -- Verify indexes created
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE tablename = 'users'
      AND indexname IN (
        'idx_users_auth_provider',
        'idx_users_is_first_login',
        'idx_users_signup_source',
        'idx_users_stripe_customer_id_unique',
        'idx_users_stripe_subscription_id_unique'
      );

    IF v_index_count < 5 THEN
        RAISE EXCEPTION 'Migration failed: Not all indexes created. Found: %, Expected: 5', v_index_count;
    END IF;

    -- Log success
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 021 completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All auth/tier columns created (5 columns)';
    RAISE NOTICE '✅ Indexes created for performance (5 indexes)';
    RAISE NOTICE '✅ Existing users backfilled';
    RAISE NOTICE '✅ Trigger updated to capture OAuth data';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'OAuth authentication ready to deploy';
    RAISE NOTICE 'Test with: supabase.auth.signInWithOAuth()';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- ROLLBACK PLAN
-- ============================================
-- To rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_users_auth_provider;
-- DROP INDEX IF EXISTS idx_users_is_first_login;
-- DROP INDEX IF EXISTS idx_users_signup_source;
-- DROP INDEX IF EXISTS idx_users_stripe_customer_id_unique;
-- DROP INDEX IF EXISTS idx_users_stripe_subscription_id_unique;
--
-- ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;
-- ALTER TABLE users DROP COLUMN IF EXISTS selected_tier;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_first_login;
-- ALTER TABLE users DROP COLUMN IF EXISTS signup_source;
-- ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;
--
-- Then restore previous version of handle_user_creation() function from migration 018

-- ============================================
-- TESTING QUERIES
-- ============================================
-- After migration, verify with these queries:
--
-- 1. Check new columns exist:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
--   AND column_name IN ('auth_provider', 'selected_tier', 'is_first_login', 'signup_source', 'stripe_subscription_id')
-- ORDER BY column_name;
--
-- 2. Check existing users backfilled:
-- SELECT
--   COUNT(*) as total_users,
--   COUNT(auth_provider) as users_with_provider,
--   COUNT(CASE WHEN is_first_login = false THEN 1 END) as existing_users_flagged
-- FROM users;
--
-- 3. Check indexes created:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'users'
--   AND indexname LIKE '%auth%' OR indexname LIKE '%first_login%'
-- ORDER BY indexname;
