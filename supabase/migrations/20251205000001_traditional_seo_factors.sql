-- Migration: Traditional SEO Foundation - Caching Infrastructure
-- Sprint 2, Phase 1: Add caching for external SEO API results
-- Created: 2025-12-05

-- ============================================================================
-- EXTERNAL API CACHE TABLE
-- ============================================================================
-- Purpose: Cache expensive external API calls (PageSpeed Insights, etc.)
-- with TTL to reduce API usage and improve response times

CREATE TABLE IF NOT EXISTS seo_external_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Cache key components
  url text NOT NULL,
  factor_type text NOT NULL,  -- 'page-speed-mobile', 'mobile-friendly', etc.

  -- Cached data
  api_response jsonb NOT NULL,  -- Full API response for replay
  score numeric,                 -- Extracted score for quick access

  -- Cache metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,  -- TTL enforcement
  cache_hits integer DEFAULT 0,     -- Track usage

  -- Constraints
  CONSTRAINT unique_cache_key UNIQUE (url, factor_type),
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT valid_factor_type CHECK (factor_type IN (
    'page-speed-mobile',
    'mobile-friendly',
    'indexability-status',
    'broken-links',
    'sitemap-presence'
  ))
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary cache lookup: find cached results by URL and type
CREATE INDEX IF NOT EXISTS idx_seo_cache_lookup ON seo_external_cache(url, factor_type, expires_at);

-- Cleanup index: efficiently find entries by expiration date
CREATE INDEX IF NOT EXISTS idx_seo_cache_expired ON seo_external_cache(expires_at);

-- Analytics index: track cache performance
CREATE INDEX IF NOT EXISTS idx_seo_cache_hits ON seo_external_cache(factor_type, cache_hits);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE seo_external_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read cache entries for any URL (public SEO data)
-- Rationale: SEO metrics are public information, no privacy concerns
CREATE POLICY "Public SEO cache read access"
  ON seo_external_cache
  FOR SELECT
  TO authenticated
  USING (true);  -- All authenticated users can read cache

-- Policy: Only the analyze-page Edge Function can write to cache
-- Rationale: Centralize cache management, prevent cache pollution
CREATE POLICY "Service role cache write access"
  ON seo_external_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CACHE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function: Get valid cached result or return NULL
CREATE OR REPLACE FUNCTION get_seo_cache(
  p_url text,
  p_factor_type text
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_cache_id uuid;
BEGIN
  -- Try to get valid cached result
  SELECT api_response, id
  INTO v_result, v_cache_id
  FROM seo_external_cache
  WHERE url = p_url
    AND factor_type = p_factor_type
    AND expires_at > now()
  LIMIT 1;

  -- If found, increment cache hit counter
  IF v_cache_id IS NOT NULL THEN
    UPDATE seo_external_cache
    SET cache_hits = cache_hits + 1
    WHERE id = v_cache_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Store cache entry with TTL
CREATE OR REPLACE FUNCTION set_seo_cache(
  p_url text,
  p_factor_type text,
  p_api_response jsonb,
  p_score numeric,
  p_ttl_hours integer DEFAULT 24
) RETURNS uuid AS $$
DECLARE
  v_cache_id uuid;
BEGIN
  -- Upsert cache entry
  INSERT INTO seo_external_cache (
    url,
    factor_type,
    api_response,
    score,
    expires_at
  ) VALUES (
    p_url,
    p_factor_type,
    p_api_response,
    p_score,
    now() + (p_ttl_hours || ' hours')::interval
  )
  ON CONFLICT (url, factor_type)
  DO UPDATE SET
    api_response = EXCLUDED.api_response,
    score = EXCLUDED.score,
    created_at = now(),
    expires_at = now() + (p_ttl_hours || ' hours')::interval,
    cache_hits = 0  -- Reset hit counter on refresh
  RETURNING id INTO v_cache_id;

  RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup expired cache entries (call via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_seo_cache()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM seo_external_cache
  WHERE expires_at <= now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CACHE ANALYTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW seo_cache_stats AS
SELECT
  factor_type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE expires_at > now()) as valid_entries,
  COUNT(*) FILTER (WHERE expires_at <= now()) as expired_entries,
  SUM(cache_hits) as total_hits,
  AVG(cache_hits) as avg_hits_per_entry,
  MAX(cache_hits) as max_hits,
  AVG(EXTRACT(EPOCH FROM (now() - created_at))/3600) as avg_age_hours
FROM seo_external_cache
GROUP BY factor_type;

-- Grant access to stats view
GRANT SELECT ON seo_cache_stats TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE seo_external_cache IS
  'Cache for expensive external SEO API calls (PageSpeed Insights, etc.) with 24h TTL';

COMMENT ON COLUMN seo_external_cache.url IS
  'Full URL that was analyzed (cache key part 1)';

COMMENT ON COLUMN seo_external_cache.factor_type IS
  'SEO factor type (page-speed-mobile, mobile-friendly, etc.) - cache key part 2';

COMMENT ON COLUMN seo_external_cache.api_response IS
  'Full API response stored as JSONB for replay without re-querying';

COMMENT ON COLUMN seo_external_cache.expires_at IS
  'Cache expiration timestamp - results invalid after this time';

COMMENT ON COLUMN seo_external_cache.cache_hits IS
  'Number of times this cached result was used (analytics)';

COMMENT ON FUNCTION get_seo_cache IS
  'Get valid cached SEO result or NULL if expired/missing. Increments hit counter.';

COMMENT ON FUNCTION set_seo_cache IS
  'Store SEO API result in cache with configurable TTL (default 24h)';

COMMENT ON FUNCTION cleanup_expired_seo_cache IS
  'Delete expired cache entries. Call via pg_cron daily.';

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

-- Verify table created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'seo_external_cache') THEN
    RAISE EXCEPTION 'seo_external_cache table not created';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'seo_cache_stats') THEN
    RAISE EXCEPTION 'seo_cache_stats view not created';
  END IF;

  RAISE NOTICE 'Migration 20251205000001_traditional_seo_factors completed successfully';
END $$;
