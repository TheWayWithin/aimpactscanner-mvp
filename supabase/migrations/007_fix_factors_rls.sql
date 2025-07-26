-- Fix RLS policy for analysis_factors to allow users to view factors
-- The issue: Edge Function (service role) inserts factors, but user role can't read them

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can view factors for their analyses" ON analysis_factors;

-- Create a new policy that works with service role insertions
CREATE POLICY "Users can view factors for their analyses" ON analysis_factors
  FOR SELECT USING (
    -- Allow if the user owns the analysis
    EXISTS (
      SELECT 1 FROM analyses 
      WHERE analyses.id = analysis_factors.analysis_id 
      AND analyses.user_id = auth.uid()
    )
    -- OR if it's a service role operation
    OR current_setting('role') = 'service_role'
  );

-- Also ensure service role can select (for debugging)
CREATE POLICY IF NOT EXISTS "Service role can view all factors" ON analysis_factors
  FOR SELECT USING (
    current_setting('role') = 'service_role'
  );