-- Migration: Add llmstxt_generations table for tracking LLMs.txt generation usage
-- This tracks per-user usage of the LLMtxtMastery API integration
-- Growth tier: 25/month, Scale tier: unlimited

-- Create the llmstxt_generations table
CREATE TABLE IF NOT EXISTS llmstxt_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_url TEXT,
  llmstxt_analysis_id TEXT, -- ID from LLMtxtMastery API
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB, -- Store the generated llms.txt content and metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index for efficient usage counting queries
CREATE INDEX IF NOT EXISTS idx_llmstxt_generations_user_created
ON llmstxt_generations(user_id, created_at);

-- Create index for looking up by external analysis ID
CREATE INDEX IF NOT EXISTS idx_llmstxt_generations_analysis_id
ON llmstxt_generations(llmstxt_analysis_id);

-- Enable RLS
ALTER TABLE llmstxt_generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own generations
CREATE POLICY "Users can view own llmstxt generations"
ON llmstxt_generations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own generations (via Edge Function)
CREATE POLICY "Users can insert own llmstxt generations"
ON llmstxt_generations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access to llmstxt generations"
ON llmstxt_generations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE llmstxt_generations IS 'Tracks LLMs.txt file generation usage per user. Growth tier limited to 25/month, Scale unlimited.';
COMMENT ON COLUMN llmstxt_generations.llmstxt_analysis_id IS 'External ID from LLMtxtMastery API for tracking analysis status';
COMMENT ON COLUMN llmstxt_generations.result IS 'JSON containing generated llms.txt content, file URL, and metadata';

-- Create helper function to get monthly usage count for a user
CREATE OR REPLACE FUNCTION get_llmstxt_monthly_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM llmstxt_generations
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
    AND created_at < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_llmstxt_monthly_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_llmstxt_monthly_usage(UUID) TO service_role;

COMMENT ON FUNCTION get_llmstxt_monthly_usage(UUID) IS 'Returns the number of LLMs.txt generations used by a user in the current month';
