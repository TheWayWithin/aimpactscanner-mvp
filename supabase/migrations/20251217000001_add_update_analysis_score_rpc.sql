-- Migration: Add update_analysis_score RPC function
-- Purpose: Bypass PostgREST schema cache issues when updating analysis scores
-- Date: 2025-12-17

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.update_analysis_score(UUID, INTEGER);

-- Create the function to update analysis score
-- This uses raw SQL which bypasses PostgREST's schema cache
CREATE OR REPLACE FUNCTION public.update_analysis_score(
  p_analysis_id UUID,
  p_score INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE analyses
  SET
    status = 'completed',
    overall_score = p_score,
    completed_at = NOW()
  WHERE id = p_analysis_id;

  -- Log for debugging (will appear in Supabase logs)
  RAISE NOTICE 'Updated analysis % with score %', p_analysis_id, p_score;
END;
$$;

-- Grant execute permission to service_role and authenticated users
GRANT EXECUTE ON FUNCTION public.update_analysis_score(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_analysis_score(UUID, INTEGER) TO authenticated;

-- Also add a helper function to refresh the PostgREST schema cache
-- This can be called manually if needed
CREATE OR REPLACE FUNCTION public.refresh_postgrest_schema()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_postgrest_schema() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.update_analysis_score IS
  'Updates analysis status to completed and sets the overall_score. Bypasses PostgREST schema cache.';
