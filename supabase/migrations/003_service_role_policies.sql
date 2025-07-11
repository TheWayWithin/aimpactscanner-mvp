-- Add service role policies for Edge Functions to update analyses and related tables

-- Allow service role to update analyses (for Edge Functions)
CREATE POLICY "Service role can update analyses" ON analyses
  FOR UPDATE USING (
    current_setting('role') = 'service_role'
  );

-- Allow service role to insert into analysis_progress (for Edge Functions)
CREATE POLICY "Service role can insert analysis progress" ON analysis_progress
  FOR INSERT WITH CHECK (
    current_setting('role') = 'service_role'
  );

-- Allow service role to insert into analysis_factors (for Edge Functions)
CREATE POLICY "Service role can insert analysis factors" ON analysis_factors
  FOR INSERT WITH CHECK (
    current_setting('role') = 'service_role'
  );