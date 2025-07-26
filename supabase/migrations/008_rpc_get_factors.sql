-- Create RPC function to get analysis factors (bypasses RLS)
-- This function runs with SECURITY DEFINER which uses the owner's permissions

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