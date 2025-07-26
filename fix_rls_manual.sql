-- COMPREHENSIVE MANUAL FIX FOR RLS POLICY ISSUE  
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check what columns exist in analyses table (for debugging 500 error)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'analyses'
ORDER BY ordinal_position;

-- 2. First check what columns exist in analysis_factors
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'analysis_factors'
ORDER BY ordinal_position;

-- 2. Check if factors exist but can't be accessed
SELECT 
  COUNT(*) as total_factors,
  COUNT(DISTINCT analysis_id) as unique_analyses
FROM analysis_factors;

-- 3. Check recent analyses and their factors
SELECT 
  a.id as analysis_id,
  a.user_id,
  a.url,
  a.status,
  COUNT(af.id) as factor_count
FROM analyses a
LEFT JOIN analysis_factors af ON a.id = af.analysis_id
WHERE a.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.id, a.user_id, a.url, a.status
ORDER BY a.created_at DESC;

-- 4. Add missing columns if they don't exist
ALTER TABLE analysis_factors 
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS educational_content TEXT,
ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'instant';

-- 5. Create RPC function to bypass RLS
CREATE OR REPLACE FUNCTION get_analysis_factors(analysis_uuid UUID)
RETURNS TABLE (
  id UUID,
  analysis_id UUID,
  factor_id TEXT,
  factor_name TEXT,
  pillar TEXT,
  score INTEGER,
  confidence INTEGER,
  weight DECIMAL(4,2),
  evidence JSONB,
  recommendations JSONB,
  processing_time_ms INTEGER,
  educational_content TEXT,
  phase TEXT,
  created_at TIMESTAMP
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify the user owns this analysis
  IF NOT EXISTS (
    SELECT 1 FROM analyses 
    WHERE analyses.id = analysis_uuid 
    AND analyses.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Analysis not found or not owned by user';
  END IF;

  -- Return the factors
  RETURN QUERY
  SELECT 
    af.id,
    af.analysis_id,
    af.factor_id,
    af.factor_name,
    af.pillar,
    af.score,
    af.confidence,
    af.weight,
    af.evidence,
    af.recommendations,
    af.processing_time_ms,
    af.educational_content,
    af.phase,
    af.created_at
  FROM analysis_factors af
  WHERE af.analysis_id = analysis_uuid
  ORDER BY af.factor_id;
END;
$$;

-- 6. Fix RLS policy to be more permissive
DROP POLICY IF EXISTS "Users can view factors for their analyses" ON analysis_factors;

CREATE POLICY "Users can view factors for their analyses" ON analysis_factors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses 
      WHERE analyses.id = analysis_factors.analysis_id 
      AND analyses.user_id = auth.uid()
    )
  );