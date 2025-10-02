-- Migration: 019_diagnostic_helper_functions.sql
-- Purpose: Create helper functions for diagnostic page to check database state
-- Created: 2025-10-02

-- ============================================
-- Function 1: Check triggers on auth.users
-- ============================================
CREATE OR REPLACE FUNCTION check_auth_triggers()
RETURNS TABLE (
    trigger_name TEXT,
    event_type TEXT,
    function_name TEXT,
    enabled BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tgname::TEXT as trigger_name,
        CASE t.tgtype::integer & 66
            WHEN 2 THEN 'BEFORE'
            WHEN 64 THEN 'INSTEAD OF'
            ELSE 'AFTER'
        END::TEXT as event_type,
        p.proname::TEXT as function_name,
        t.tgenabled = 'O' as enabled
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND NOT t.tgisinternal
    ORDER BY t.tgname;
END;
$$;

-- ============================================
-- Function 2: Check user-related functions
-- ============================================
CREATE OR REPLACE FUNCTION check_user_functions()
RETURNS TABLE (
    function_name TEXT,
    schema_name TEXT,
    return_type TEXT,
    security_definer BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.proname::TEXT as function_name,
        n.nspname::TEXT as schema_name,
        pg_catalog.pg_get_function_result(p.oid)::TEXT as return_type,
        p.prosecdef as security_definer
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname LIKE '%user%'
    OR p.proname LIKE '%handle%'
    OR p.proname LIKE '%create%'
    ORDER BY p.proname;
END;
$$;

-- ============================================
-- Function 3: Check RLS policies on users table
-- ============================================
CREATE OR REPLACE FUNCTION check_user_policies()
RETURNS TABLE (
    policy_name TEXT,
    table_name TEXT,
    command TEXT,
    permissive TEXT,
    roles TEXT[],
    using_expression TEXT,
    check_expression TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pol.polname::TEXT as policy_name,
        c.relname::TEXT as table_name,
        CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
        END::TEXT as command,
        CASE pol.polpermissive
            WHEN true THEN 'PERMISSIVE'
            ELSE 'RESTRICTIVE'
        END::TEXT as permissive,
        ARRAY(
            SELECT r.rolname::TEXT
            FROM pg_roles r
            WHERE r.oid = ANY(pol.polroles)
        ) as roles,
        pg_get_expr(pol.polqual, pol.polrelid)::TEXT as using_expression,
        pg_get_expr(pol.polwithcheck, pol.polrelid)::TEXT as check_expression
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    WHERE c.relname = 'users'
    ORDER BY pol.polname;
END;
$$;

-- ============================================
-- Grant execute permissions
-- ============================================
GRANT EXECUTE ON FUNCTION check_auth_triggers() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_functions() TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_policies() TO authenticated;

-- Also grant to anon for diagnostic purposes
GRANT EXECUTE ON FUNCTION check_auth_triggers() TO anon;
GRANT EXECUTE ON FUNCTION check_user_functions() TO anon;
GRANT EXECUTE ON FUNCTION check_user_policies() TO anon;

-- ============================================
-- Log successful migration
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 019 completed successfully';
    RAISE NOTICE 'Diagnostic helper functions created:';
    RAISE NOTICE '  - check_auth_triggers()';
    RAISE NOTICE '  - check_user_functions()';
    RAISE NOTICE '  - check_user_policies()';
END $$;
