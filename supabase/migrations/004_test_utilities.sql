-- Test utilities for AImpactScanner MVP
-- Adds helpful functions for debugging and testing

-- Function to get table schema information
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_name = get_table_schema.table_name
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO service_role;
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO authenticated;

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete test analyses and related data
  DELETE FROM analysis_factors 
  WHERE analysis_id IN (
    SELECT id FROM analyses 
    WHERE user_id LIKE 'test-user-%'
  );
  
  DELETE FROM analysis_progress 
  WHERE analysis_id IN (
    SELECT id FROM analyses 
    WHERE user_id LIKE 'test-user-%'
  );
  
  DELETE FROM analyses 
  WHERE user_id LIKE 'test-user-%';
  
  RAISE NOTICE 'Test data cleaned up successfully';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_test_data() TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_test_data() TO authenticated;