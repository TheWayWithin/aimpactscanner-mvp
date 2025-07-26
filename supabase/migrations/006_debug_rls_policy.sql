-- Temporary debug policy to test RLS issue
-- This policy will allow all authenticated users to read analysis_factors
-- for debugging purposes only

CREATE POLICY "Debug: authenticated users can view all factors" ON analysis_factors
  FOR SELECT USING (
    auth.role() = 'authenticated'
  );