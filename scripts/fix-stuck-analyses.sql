-- Script to fix stuck analyses from July 2025 deployment regression
-- Run this script using: supabase db push < scripts/fix-stuck-analyses.sql

-- Update all stuck analyses to failed status with appropriate error details
UPDATE analyses 
SET 
  status = 'failed',
  error_details = jsonb_build_object(
    'error', 'Analysis timeout due to deployment regression',
    'message', 'This analysis was affected by a July 2025 deployment issue that has now been resolved. Please retry your analysis.',
    'error_code', 'DEPLOYMENT_REGRESSION_JULY_2025',
    'timestamp', now(),
    'resolution', 'Edge Function has been fixed with proper 15-factor implementation'
  )
WHERE status = 'processing'
  AND created_at < '2025-08-01'::timestamp;

-- Log the number of analyses fixed
DO $$ 
DECLARE 
  count_fixed INTEGER;
BEGIN
  GET DIAGNOSTICS count_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed % stuck analyses', count_fixed;
END $$;