-- Migration 022: Growth & Scale Waitlist Table
-- Date: 2025-10-02
-- Purpose: Track user interest in upcoming Growth and Scale tiers
-- Status: OPTIONAL - Can deploy independently after Migration 021
-- Author: THE DEVELOPER (AGENT-11)
--
-- Critical Design Principles Applied:
-- ✅ RLS policies work WITH existing security model
-- ✅ Separate concern from auth (can deploy later)
-- ✅ Performance optimized with appropriate indexes
-- ✅ Helper function for easy waitlist management

-- ============================================
-- STEP 1: Create waitlist table
-- ============================================

CREATE TABLE IF NOT EXISTS growth_scale_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    interested_tier TEXT NOT NULL CHECK (interested_tier IN ('growth', 'scale')),
    current_tier TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Prevent duplicate entries per user per tier
    UNIQUE(user_id, interested_tier)
);

COMMENT ON TABLE growth_scale_waitlist IS 'Track user interest in upcoming Growth ($29) and Scale ($99) tiers';
COMMENT ON COLUMN growth_scale_waitlist.user_id IS 'References authenticated user (nullable for anonymous submissions)';
COMMENT ON COLUMN growth_scale_waitlist.email IS 'User email for waitlist notifications';
COMMENT ON COLUMN growth_scale_waitlist.interested_tier IS 'Tier user wants: growth or scale';
COMMENT ON COLUMN growth_scale_waitlist.current_tier IS 'User tier at time of joining waitlist';
COMMENT ON COLUMN growth_scale_waitlist.metadata IS 'Additional data: utm_source, referrer, signup_context, etc.';

-- ============================================
-- STEP 2: Enable RLS policies
-- ============================================

ALTER TABLE growth_scale_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
    ON growth_scale_waitlist
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own waitlist entries
CREATE POLICY "Users can insert own waitlist entries"
    ON growth_scale_waitlist
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role has full access for admin/notification purposes
CREATE POLICY "Service role full access to waitlist"
    ON growth_scale_waitlist
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- STEP 3: Add indexes for performance
-- ============================================

-- Index for user lookups (show user their waitlist entries)
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON growth_scale_waitlist(user_id);

-- Index for tier filtering (query all Growth waitlist users)
CREATE INDEX IF NOT EXISTS idx_waitlist_interested_tier ON growth_scale_waitlist(interested_tier);

-- Partial index for unnotified users (efficient notifications)
CREATE INDEX IF NOT EXISTS idx_waitlist_notified
    ON growth_scale_waitlist(notified, joined_at)
    WHERE notified = false;

-- Index for chronological queries (latest signups)
CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at ON growth_scale_waitlist(joined_at DESC);

-- ============================================
-- STEP 4: Create helper function for joining waitlist
-- ============================================

CREATE OR REPLACE FUNCTION join_waitlist(
    p_interested_tier TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    waitlist_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_current_tier TEXT;
    v_waitlist_id UUID;
    v_already_exists BOOLEAN;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false, 'Not authenticated'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Get user details from users table
    SELECT email, tier INTO v_email, v_current_tier
    FROM users
    WHERE id = v_user_id;

    IF v_email IS NULL THEN
        RETURN QUERY SELECT false, 'User profile not found'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Validate tier
    IF p_interested_tier NOT IN ('growth', 'scale') THEN
        RETURN QUERY SELECT false, 'Invalid tier. Must be growth or scale'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Check if user already on this waitlist
    SELECT EXISTS(
        SELECT 1 FROM growth_scale_waitlist
        WHERE user_id = v_user_id AND interested_tier = p_interested_tier
    ) INTO v_already_exists;

    IF v_already_exists THEN
        RETURN QUERY SELECT true, 'Already on waitlist'::TEXT, NULL::UUID;
        RETURN;
    END IF;

    -- Insert into waitlist
    INSERT INTO growth_scale_waitlist (
        user_id,
        email,
        interested_tier,
        current_tier,
        metadata
    )
    VALUES (
        v_user_id,
        v_email,
        p_interested_tier,
        v_current_tier,
        p_metadata
    )
    RETURNING id INTO v_waitlist_id;

    -- Return success
    RETURN QUERY SELECT true, 'Successfully added to waitlist'::TEXT, v_waitlist_id;

EXCEPTION WHEN OTHERS THEN
    -- Log error and return failure
    RAISE WARNING 'Waitlist join failed for user %: %', v_user_id, SQLERRM;
    RETURN QUERY SELECT false, 'Failed to join waitlist: ' || SQLERRM, NULL::UUID;
END;
$$;

COMMENT ON FUNCTION join_waitlist IS 'Add authenticated user to Growth or Scale tier waitlist';

-- ============================================
-- STEP 5: Create admin helper functions
-- ============================================

-- Function to get waitlist statistics
CREATE OR REPLACE FUNCTION get_waitlist_stats()
RETURNS TABLE (
    total_entries BIGINT,
    growth_count BIGINT,
    scale_count BIGINT,
    notified_count BIGINT,
    pending_count BIGINT,
    latest_signup TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE interested_tier = 'growth') as growth_count,
        COUNT(*) FILTER (WHERE interested_tier = 'scale') as scale_count,
        COUNT(*) FILTER (WHERE notified = true) as notified_count,
        COUNT(*) FILTER (WHERE notified = false) as pending_count,
        MAX(joined_at) as latest_signup
    FROM growth_scale_waitlist;
$$;

COMMENT ON FUNCTION get_waitlist_stats IS 'Get aggregate statistics for waitlist (service role only)';

-- Function to mark users as notified
CREATE OR REPLACE FUNCTION mark_waitlist_notified(
    p_waitlist_ids UUID[]
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Only service role can mark as notified
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Only service role can mark users as notified';
    END IF;

    UPDATE growth_scale_waitlist
    SET
        notified = true,
        notified_at = NOW()
    WHERE id = ANY(p_waitlist_ids)
      AND notified = false
    RETURNING * INTO v_count;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION mark_waitlist_notified IS 'Mark waitlist entries as notified (service role only)';

-- ============================================
-- STEP 6: Verification
-- ============================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_policy_count INTEGER;
    v_index_count INTEGER;
    v_function_count INTEGER;
BEGIN
    -- Verify table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'growth_scale_waitlist'
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
        RAISE EXCEPTION 'Migration failed: growth_scale_waitlist table not created';
    END IF;

    -- Verify RLS policies created (3 policies)
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE tablename = 'growth_scale_waitlist';

    IF v_policy_count < 3 THEN
        RAISE EXCEPTION 'Migration failed: Not all RLS policies created. Found: %, Expected: 3', v_policy_count;
    END IF;

    -- Verify indexes created (4 indexes)
    SELECT COUNT(*) INTO v_index_count
    FROM pg_indexes
    WHERE tablename = 'growth_scale_waitlist';

    IF v_index_count < 4 THEN
        RAISE EXCEPTION 'Migration failed: Not all indexes created. Found: %, Expected: 4', v_index_count;
    END IF;

    -- Verify functions created
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc
    WHERE proname IN ('join_waitlist', 'get_waitlist_stats', 'mark_waitlist_notified');

    IF v_function_count < 3 THEN
        RAISE EXCEPTION 'Migration failed: Not all functions created. Found: %, Expected: 3', v_function_count;
    END IF;

    -- Log success
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 022 completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ growth_scale_waitlist table created';
    RAISE NOTICE '✅ RLS policies created (3 policies)';
    RAISE NOTICE '✅ Indexes created for performance (4 indexes)';
    RAISE NOTICE '✅ Helper functions created (3 functions)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Waitlist system ready to use';
    RAISE NOTICE 'Usage: SELECT * FROM join_waitlist(''growth'')';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- ROLLBACK PLAN
-- ============================================
-- To rollback this migration, run:
--
-- DROP FUNCTION IF EXISTS join_waitlist(TEXT, JSONB);
-- DROP FUNCTION IF EXISTS get_waitlist_stats();
-- DROP FUNCTION IF EXISTS mark_waitlist_notified(UUID[]);
-- DROP TABLE IF EXISTS growth_scale_waitlist CASCADE;

-- ============================================
-- USAGE EXAMPLES
-- ============================================
--
-- 1. User joins Growth waitlist:
-- SELECT * FROM join_waitlist('growth', '{"utm_source": "landing_page"}'::jsonb);
--
-- 2. User joins Scale waitlist:
-- SELECT * FROM join_waitlist('scale');
--
-- 3. Get waitlist statistics (service role only):
-- SELECT * FROM get_waitlist_stats();
--
-- 4. Query unnotified Growth users (service role only):
-- SELECT email, joined_at, metadata
-- FROM growth_scale_waitlist
-- WHERE interested_tier = 'growth' AND notified = false
-- ORDER BY joined_at ASC;
--
-- 5. Mark users as notified (service role only):
-- SELECT mark_waitlist_notified(ARRAY['uuid1', 'uuid2']::UUID[]);

-- ============================================
-- TESTING QUERIES
-- ============================================
-- After migration, verify with these queries:
--
-- 1. Check table structure:
-- \d growth_scale_waitlist
--
-- 2. Check RLS policies:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'growth_scale_waitlist'
-- ORDER BY policyname;
--
-- 3. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'growth_scale_waitlist'
-- ORDER BY indexname;
--
-- 4. Check functions:
-- SELECT proname, prosrc
-- FROM pg_proc
-- WHERE proname LIKE '%waitlist%'
-- ORDER BY proname;
