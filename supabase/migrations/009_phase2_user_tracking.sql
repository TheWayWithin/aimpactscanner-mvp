-- Phase 2 User Tracking Enhancement Migration
-- Adds user experience tracking columns for smart dashboard and UX improvements

-- Add user tracking columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_analysis_id UUID REFERENCES analyses(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_analyses_count INTEGER DEFAULT 0;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_last_analysis ON users(last_analysis_id);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_total_count ON users(total_analyses_count);

-- Create function to update user tracking data
CREATE OR REPLACE FUNCTION update_user_tracking(user_uuid UUID, analysis_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Update last login time and increment total count
    UPDATE users 
    SET 
        last_login_at = NOW(),
        total_analyses_count = CASE 
            WHEN analysis_uuid IS NOT NULL THEN total_analyses_count + 1
            ELSE total_analyses_count
        END,
        last_analysis_id = CASE 
            WHEN analysis_uuid IS NOT NULL THEN analysis_uuid
            ELSE last_analysis_id
        END
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID)
RETURNS TABLE (
    user_tier VARCHAR(20),
    monthly_used INTEGER,
    total_count INTEGER,
    last_analysis_url TEXT,
    last_analysis_date TIMESTAMP,
    is_first_time BOOLEAN,
    usage_percentage FLOAT
) AS $$
DECLARE
    user_created_at TIMESTAMP;
BEGIN
    -- Get user data with last analysis info
    SELECT 
        u.tier,
        u.monthly_analyses_used,
        u.total_analyses_count,
        a.url,
        a.created_at,
        u.created_at
    INTO 
        user_tier,
        monthly_used,
        total_count,
        last_analysis_url,
        last_analysis_date,
        user_created_at
    FROM users u
    LEFT JOIN analyses a ON u.last_analysis_id = a.id
    WHERE u.id = user_uuid;
    
    -- Check if first-time user (created within last 30 minutes for realistic testing)
    is_first_time := (user_created_at > NOW() - INTERVAL '30 minutes');
    
    -- Calculate usage percentage for free tier
    IF user_tier = 'free' THEN
        usage_percentage := (monthly_used::FLOAT / 3.0) * 100;
    ELSE
        usage_percentage := 0; -- Unlimited for paid tiers
    END IF;
    
    RETURN QUERY SELECT 
        get_user_dashboard_data.user_tier,
        get_user_dashboard_data.monthly_used,
        get_user_dashboard_data.total_count,
        get_user_dashboard_data.last_analysis_url,
        get_user_dashboard_data.last_analysis_date,
        get_user_dashboard_data.is_first_time,
        get_user_dashboard_data.usage_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_tracking(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_tracking(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO service_role;

-- Update existing users to have proper default values
UPDATE users 
SET 
    last_login_at = COALESCE(last_login_at, created_at),
    total_analyses_count = COALESCE(total_analyses_count, 0)
WHERE last_login_at IS NULL OR total_analyses_count IS NULL;

-- Create trigger to automatically update total_analyses_count when new analysis is created
CREATE OR REPLACE FUNCTION trigger_update_user_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's total count and last analysis when a new analysis is completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM update_user_tracking(NEW.user_id, NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on analyses table
DROP TRIGGER IF EXISTS update_user_analysis_count_trigger ON analyses;
CREATE TRIGGER update_user_analysis_count_trigger
    AFTER INSERT OR UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_analysis_count();

-- Add RLS policies for new functions
-- Users can call functions for their own data
-- Service role can call functions for any user