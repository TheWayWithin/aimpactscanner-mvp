-- Coffee Tier Migration - Step by Step
-- Apply these sections one at a time to troubleshoot any issues

-- ========================================
-- STEP 1: Add columns to users table
-- ========================================
-- Run this first, then verify it worked before proceeding

ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_analyses_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- ========================================
-- STEP 2: Create subscriptions table
-- ========================================
-- Only run this after Step 1 succeeds

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ========================================
-- STEP 3: Create usage analytics table
-- ========================================
-- Only run this after Step 2 succeeds

CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    analysis_type VARCHAR(20) DEFAULT 'phase_a',
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_tier ON usage_analytics(user_id, tier);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_date ON usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_tier ON usage_analytics(tier);

-- ========================================
-- STEP 4: Create database functions
-- ========================================
-- Only run this after Steps 1-3 succeed

-- Function to increment analysis count
CREATE OR REPLACE FUNCTION increment_monthly_analyses(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get current count and check if reset is needed
    SELECT monthly_analyses_used INTO current_count
    FROM users 
    WHERE id = user_uuid;
    
    -- If user doesn't exist, return 0
    IF current_count IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Reset count if it's a new month
    IF (SELECT monthly_reset_date FROM users WHERE id = user_uuid) != today_date THEN
        UPDATE users 
        SET monthly_analyses_used = 1, monthly_reset_date = today_date
        WHERE id = user_uuid;
        RETURN 1;
    ELSE
        -- Increment existing count
        UPDATE users 
        SET monthly_analyses_used = monthly_analyses_used + 1
        WHERE id = user_uuid;
        RETURN current_count + 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check tier access
CREATE OR REPLACE FUNCTION check_tier_access(user_uuid UUID)
RETURNS TABLE (
    allowed BOOLEAN,
    tier VARCHAR(20),
    remaining_analyses INTEGER,
    subscription_expired BOOLEAN,
    message TEXT
) AS $$
DECLARE
    user_tier VARCHAR(20);
    user_expires_at TIMESTAMP;
    monthly_used INTEGER;
    reset_date DATE;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Get user data - be explicit about column names
    SELECT u.tier, u.tier_expires_at, u.monthly_analyses_used, u.monthly_reset_date
    INTO user_tier, user_expires_at, monthly_used, reset_date
    FROM users u
    WHERE u.id = user_uuid;
    
    -- Check if user exists
    IF user_tier IS NULL THEN
        RETURN QUERY SELECT false, 'unknown'::VARCHAR(20), 0, false, 'User not found';
        RETURN;
    END IF;
    
    -- Reset monthly count if needed
    IF reset_date != today_date THEN
        UPDATE users 
        SET monthly_analyses_used = 0, monthly_reset_date = today_date
        WHERE id = user_uuid;
        monthly_used := 0;
    END IF;
    
    -- Check tier-specific access
    CASE user_tier
        WHEN 'free' THEN
            IF monthly_used >= 3 THEN
                RETURN QUERY SELECT false, user_tier, 0, false, 'Free tier limit reached. Upgrade to Coffee tier for unlimited access!';
            ELSE
                RETURN QUERY SELECT true, user_tier, (3 - monthly_used), false, '';
            END IF;
            
        WHEN 'coffee' THEN
            IF user_expires_at IS NOT NULL AND user_expires_at < NOW() THEN
                -- Downgrade expired coffee tier users
                UPDATE users SET tier = 'free', tier_expires_at = NULL, subscription_status = 'inactive'
                WHERE id = user_uuid;
                RETURN QUERY SELECT false, 'expired'::VARCHAR(20), 0, true, 'Coffee tier subscription expired. Please renew for unlimited access!';
            ELSE
                RETURN QUERY SELECT true, user_tier, -1, false, ''; -- -1 indicates unlimited
            END IF;
            
        WHEN 'professional', 'enterprise' THEN
            RETURN QUERY SELECT true, user_tier, -1, false, '';
            
        ELSE
            RETURN QUERY SELECT false, 'unknown'::VARCHAR(20), 0, false, 'Invalid tier';
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 5: Create RLS policies
-- ========================================
-- Only run this after Steps 1-4 succeed

-- Subscriptions policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
ON subscriptions FOR ALL
USING (current_setting('role') = 'service_role');

-- Usage analytics policies
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage analytics"
ON usage_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage analytics"
ON usage_analytics FOR ALL
USING (current_setting('role') = 'service_role');

-- Update existing users table policies to include new columns
DROP POLICY IF EXISTS "Service role can update all users" ON users;
CREATE POLICY "Service role can update all users"
ON users FOR UPDATE
USING (current_setting('role') = 'service_role');

-- ========================================
-- STEP 6: Grant permissions
-- ========================================
-- Only run this after Steps 1-5 succeed

GRANT EXECUTE ON FUNCTION increment_monthly_analyses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_tier_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_monthly_analyses(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION check_tier_access(UUID) TO service_role;