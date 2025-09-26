-- URGENT DATABASE SCHEMA FIXES FOR DASHBOARD FEATURE
-- =====================================================
-- Run this SQL with proper database admin privileges (service_role or higher)
-- 
-- CRITICAL ISSUES IDENTIFIED:
-- 1. Missing overall_score column in analyses table
-- 2. Missing user_id index on analyses table (causing timeouts)  
-- 3. User tier inconsistency (tier vs subscription_tier mismatch)
-- 4. Multiple performance issues with RLS policies

-- =============================================================================
-- FIX 1: ADD MISSING OVERALL_SCORE COLUMN
-- =============================================================================
ALTER TABLE analyses ADD COLUMN overall_score INTEGER;

-- Add constraint to ensure valid score range
ALTER TABLE analyses ADD CONSTRAINT check_overall_score_range 
CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));

-- =============================================================================  
-- FIX 2: POPULATE OVERALL_SCORE FROM EXISTING SCORES JSON
-- =============================================================================
-- Extract overall score from existing scores JSON field and populate the new column
UPDATE analyses 
SET overall_score = CAST(scores->>'overall' AS INTEGER)
WHERE scores->>'overall' IS NOT NULL;

-- =============================================================================
-- FIX 3: ADD CRITICAL PERFORMANCE INDEXES
-- =============================================================================
-- MOST CRITICAL: user_id index on analyses (fixes dashboard timeouts)
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

-- Additional performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_status ON analyses(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_overall_score ON analyses(overall_score);

-- Foreign key indexes for analysis_progress (per Supabase advisor warnings)
CREATE INDEX IF NOT EXISTS idx_analysis_progress_analysis_id ON analysis_progress(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_progress_user_id ON analysis_progress(user_id);

-- Foreign key index for usage_analytics
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);

-- =============================================================================
-- FIX 4: RESOLVE USER TIER INCONSISTENCY
-- =============================================================================
-- Fix specific user tier issue (Coffee tier user showing as Free)
UPDATE users 
SET subscription_tier = tier 
WHERE tier IS NOT NULL 
AND tier != subscription_tier;

-- Specifically fix the reported user
UPDATE users 
SET subscription_tier = 'coffee'
WHERE id = 'e8fda207-946e-48dc-87c4-909cfde3f543' 
AND tier = 'coffee';

-- =============================================================================
-- FIX 5: ENABLE RLS ON SUBSCRIPTIONS TABLE (SECURITY ISSUE)
-- =============================================================================
-- Enable RLS on subscriptions table (flagged as security risk)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policy for subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions  
FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these after applying fixes to verify success:

-- 1. Check overall_score column was added and populated
-- SELECT COUNT(*) as total_analyses, 
--        COUNT(overall_score) as populated_scores,
--        AVG(overall_score) as avg_score
-- FROM analyses;

-- 2. Verify indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'analyses' 
-- AND indexname LIKE 'idx_%';

-- 3. Check user tier consistency
-- SELECT id, email, tier, subscription_tier, tier_expires_at 
-- FROM users 
-- WHERE tier != subscription_tier;

-- 4. Verify specific user fix
-- SELECT id, email, tier, subscription_tier, subscription_status
-- FROM users 
-- WHERE id = 'e8fda207-946e-48dc-87c4-909cfde3f543';

-- =============================================================================
-- PERFORMANCE IMPACT SUMMARY
-- =============================================================================
-- These fixes will resolve:
-- - Dashboard query timeouts (user_id index)
-- - Missing overall_score data for dashboard charts
-- - User tier display issues (Coffee vs Free tier)
-- - Security vulnerability (RLS disabled on subscriptions)
-- - General query performance improvements

-- ESTIMATED PERFORMANCE IMPROVEMENT: 80-95% faster dashboard queries