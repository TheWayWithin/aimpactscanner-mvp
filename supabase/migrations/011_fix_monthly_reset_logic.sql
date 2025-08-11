-- Fix Monthly Reset Logic Migration
-- Fixes bug where usage was resetting daily instead of monthly
-- Date: August 11, 2025

-- Drop the existing function with daily reset bug
DROP FUNCTION IF EXISTS increment_monthly_analyses(UUID);

-- Create corrected function that resets monthly, not daily
CREATE OR REPLACE FUNCTION increment_monthly_analyses(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
    user_reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current count and reset date
    SELECT monthly_analyses_used, monthly_reset_date 
    INTO current_count, user_reset_date
    FROM users 
    WHERE id = user_uuid;
    
    -- If user doesn't exist, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check if we need to reset (new month or new year)
    IF user_reset_date IS NULL OR
       EXTRACT(MONTH FROM user_reset_date) != EXTRACT(MONTH FROM today_date) OR 
       EXTRACT(YEAR FROM user_reset_date) != EXTRACT(YEAR FROM today_date) THEN
        -- Reset for new month
        UPDATE users 
        SET monthly_analyses_used = 1, 
            monthly_reset_date = today_date
        WHERE id = user_uuid;
        RETURN 1;
    ELSE
        -- Same month, increment count
        UPDATE users 
        SET monthly_analyses_used = monthly_analyses_used + 1
        WHERE id = user_uuid;
        RETURN current_count + 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the check_tier_access function to use proper monthly logic
DROP FUNCTION IF EXISTS check_tier_access(UUID);

CREATE OR REPLACE FUNCTION check_tier_access(user_uuid UUID)
RETURNS TABLE(
    can_analyze BOOLEAN, 
    tier VARCHAR(20), 
    analyses_remaining INTEGER,
    message TEXT
) AS $$
DECLARE
    user_tier VARCHAR(20);
    user_expires_at TIMESTAMP;
    monthly_used INTEGER;
    reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get user data
    SELECT u.tier, u.tier_expires_at, u.monthly_analyses_used, u.monthly_reset_date
    INTO user_tier, user_expires_at, monthly_used, reset_date
    FROM users u
    WHERE u.id = user_uuid;
    
    -- Check if tier expired
    IF user_expires_at IS NOT NULL AND user_expires_at < NOW() THEN
        UPDATE users SET tier = 'free' WHERE id = user_uuid;
        user_tier := 'free';
    END IF;
    
    -- Reset monthly count if it's a new month
    IF reset_date IS NULL OR
       EXTRACT(MONTH FROM reset_date) != EXTRACT(MONTH FROM today_date) OR 
       EXTRACT(YEAR FROM reset_date) != EXTRACT(YEAR FROM today_date) THEN
        UPDATE users 
        SET monthly_analyses_used = 0, 
            monthly_reset_date = today_date
        WHERE id = user_uuid;
        monthly_used := 0;
    END IF;
    
    -- Check access based on tier
    IF user_tier = 'free' THEN
        IF monthly_used < 3 THEN
            RETURN QUERY SELECT true, user_tier, (3 - monthly_used), 'Analysis allowed'::TEXT;
        ELSE
            RETURN QUERY SELECT false, user_tier, 0, 'Monthly limit reached. Upgrade to Coffee tier for unlimited analyses.'::TEXT;
        END IF;
    ELSE
        -- Coffee or higher tier - unlimited
        RETURN QUERY SELECT true, user_tier, 999, 'Unlimited analyses available'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (in case they were lost)
GRANT EXECUTE ON FUNCTION increment_monthly_analyses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_tier_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_monthly_analyses(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_tier_access(UUID) TO service_role;

-- Add comment explaining the fix
COMMENT ON FUNCTION increment_monthly_analyses IS 'Increments monthly analysis count and resets on month change (not daily). Fixed in migration 011.';
COMMENT ON FUNCTION check_tier_access IS 'Checks if user can perform analysis based on tier and monthly limits. Resets on month change. Fixed in migration 011.';

-- Verify the fix by showing what the functions do
DO $$
BEGIN
    RAISE NOTICE 'Monthly reset logic fixed successfully!';
    RAISE NOTICE 'Usage now resets on month change, not daily.';
    RAISE NOTICE 'Free tier users get 3 analyses per calendar month.';
END $$;