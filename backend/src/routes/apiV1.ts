/**
 * API v1 Routes - Public API for AImpactScanner
 *
 * Wraps existing analysis functionality in a versioned, documented API.
 * All endpoints require authentication (JWT Bearer token or X-API-Key header).
 *
 * Endpoints:
 *   POST   /v1/scan              - Submit URL for analysis
 *   GET    /v1/scan/:id          - Retrieve scan results by ID
 *   GET    /v1/scan/:id/actions  - Get action items for a scan
 *   POST   /v1/schema/generate   - Generate schema markup for a URL
 *   GET    /v1/monitor/citations  - Placeholder (501)
 *   GET    /v1/monitor/roi        - Placeholder (501)
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import { analyzeAllFactors, getAnalysisSummary } from '../services/analyzer';
import { generateActionItems } from '../services/analyzer/actionItems';
import { analyzeAndGenerateSchema } from '../services/analyzer/schemaGenerator';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../types/database.types';

// Type aliases
type AnalysisRow = Database['public']['Tables']['analyses']['Row'];
type AnalysisFactorRow = Database['public']['Tables']['analysis_factors']['Row'];
type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
type AnalysisFactorInsert = Database['public']['Tables']['analysis_factors']['Insert'];

// Optional readability scorer — may not exist yet
let analyzeReadability: ((html: string) => unknown) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../services/analyzer/readabilityScorer');
  analyzeReadability = mod.analyzeReadability ?? mod.default ?? null;
} catch {
  // readabilityScorer not available yet — readability field will be null
}

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch page content from a URL (mirrors analyze.ts implementation)
 */
async function fetchPageContent(url: string): Promise<{ content: string; statusCode: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AImpactScanner/1.0 (https://aimpactscanner.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    return { content, statusCode: response.status };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error) {
      const cause = (error as NodeJS.ErrnoException).cause as NodeJS.ErrnoException | undefined;
      const code = cause?.code || (error as NodeJS.ErrnoException).code;

      if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
        throw new Error('The website could not be found. Please check the URL and try again.');
      }
      if (code === 'ECONNREFUSED') {
        throw new Error('The website refused the connection. It may be down or blocking requests.');
      }
      if (code === 'ECONNRESET' || code === 'EPIPE') {
        throw new Error('The connection was interrupted. The website may be experiencing issues.');
      }
      if (code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        throw new Error('The website has an invalid or expired SSL certificate.');
      }
      if (error.name === 'AbortError') {
        throw new Error('The website took too long to respond (30s timeout). It may be slow or unreachable.');
      }
    }
    throw error;
  }
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * API-specific rate limit headers middleware.
 *
 * Sets X-RateLimit-* headers based on user tier. The actual enforcement
 * is handled by the global rate limiter; this adds informational headers
 * for API consumers.
 */
function apiRateLimiter(req: Request, res: Response, next: () => void): void {
  const tierLimits: Record<string, number> = {
    free: 10,
    coffee: 100,
    growth: 1000,
    scale: 10000,
  };

  const tier = (req as AuthenticatedRequest).user?.tier || 'free';
  const limit = tierLimits[tier] || 10;

  res.set('X-RateLimit-Limit', String(limit));
  res.set('X-RateLimit-Remaining', String(limit - 1)); // Approximate; exact tracking is future work
  res.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 86400));

  next();
}

// Apply auth + rate-limit headers to all v1 routes
router.use(authenticateUser);
router.use(apiRateLimiter);

// ---------------------------------------------------------------------------
// POST /v1/scan — Submit URL for analysis
// ---------------------------------------------------------------------------

router.post('/scan', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { url } = req.body;
  const analysisId = uuidv4();
  const startTime = Date.now();

  try {
    // Validate input
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'URL is required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    if (!isValidUrl(url)) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
        code: 'INVALID_URL',
      });
      return;
    }

    const userId = authReq.user.id;
    const userTier = authReq.user.tier;

    console.log(`[API v1] POST /scan - url=${url} user=${userId} tier=${userTier}`);

    // Enforce monthly analysis limits
    const tierLimits: Record<string, number> = {
      free: 3,
      coffee: 10,
      growth: 40,
      scale: 100,
    };
    const monthlyLimit = tierLimits[String(userTier)] ?? 3;

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count: monthlyUsed, error: countError } = await supabaseAdmin
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', firstOfMonth);

    if (countError) {
      console.error('[API v1] Usage check failed:', countError);
      res.status(500).json({
        success: false,
        error: 'Unable to verify usage limits',
        code: 'USAGE_CHECK_FAILED',
      });
      return;
    }

    if ((monthlyUsed ?? 0) >= monthlyLimit) {
      res.status(429).json({
        success: false,
        error: `Monthly analysis limit reached (${monthlyUsed}/${monthlyLimit}). Upgrade your plan for more analyses.`,
        code: 'MONTHLY_LIMIT_REACHED',
        used: monthlyUsed,
        limit: monthlyLimit,
        tier: userTier,
      });
      return;
    }

    // Create analysis record
    const analysisInsert: AnalysisInsert = {
      id: analysisId,
      user_id: userId,
      url,
      status: 'processing',
      framework_version: '3.1.1',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from('analyses')
      .insert(analysisInsert as never);

    if (insertError) {
      console.error('[API v1] Failed to create analysis record:', insertError);
      res.status(500).json({
        success: false,
        error: 'Failed to start analysis',
        code: 'DATABASE_ERROR',
      });
      return;
    }

    // Fetch page content
    let pageContent: string;
    try {
      const { content } = await fetchPageContent(url);
      pageContent = content;
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';

      await supabaseAdmin
        .from('analyses')
        .update({ status: 'failed' } as never)
        .eq('id', analysisId);

      res.status(422).json({
        success: false,
        error: `Failed to fetch page: ${errorMessage}`,
        code: 'FETCH_ERROR',
      });
      return;
    }

    // Run analysis engine
    const result = await analyzeAllFactors(url, pageContent, userTier);

    if (!result.success) {
      await supabaseAdmin
        .from('analyses')
        .update({ status: 'failed' } as never)
        .eq('id', analysisId);

      res.status(500).json({
        success: false,
        error: result.error || 'Analysis failed',
        code: 'ANALYSIS_ERROR',
      });
      return;
    }

    // Post-processing: action items, schema, readability
    const actionItems = generateActionItems(result.factors, url, pageContent);
    const schemaAnalysis = analyzeAndGenerateSchema(url, pageContent);
    const readability = analyzeReadability ? analyzeReadability(pageContent) : null;

    const summary = getAnalysisSummary(result);
    const roundedScore = Math.round(result.overall_score);

    // Persist results
    try {
      // @ts-expect-error - Custom RPC function not in generated types
      const { error: updateError } = await supabaseAdmin.rpc('update_analysis_score', {
        p_analysis_id: analysisId,
        p_score: roundedScore,
      });

      if (updateError) {
        await supabaseAdmin
          .from('analyses')
          .update({ status: 'completed', overall_score: roundedScore } as never)
          .eq('id', analysisId);
      }
    } catch {
      await supabaseAdmin
        .from('analyses')
        .update({ status: 'completed', overall_score: roundedScore } as never)
        .eq('id', analysisId);
    }

    // Store factor results
    const factorInserts: AnalysisFactorInsert[] = result.factors.map(factor => ({
      id: uuidv4(),
      analysis_id: analysisId,
      factor_id: factor.factor_id,
      factor_name: factor.factor_name,
      pillar: factor.pillar,
      score: Math.round(factor.score),
      confidence: 80,
      weight: Math.round(factor.weight * 100) / 100,
      evidence: factor.evidence,
      recommendations: factor.recommendations,
    }));

    const { error: factorError } = await supabaseAdmin
      .from('analysis_factors')
      .insert(factorInserts as never[]);

    if (factorError) {
      console.error('[API v1] Failed to store factors:', factorError);
    }

    // Increment user analysis count (fire and forget)
    try {
      // @ts-expect-error - RPC function may not be in generated types
      await supabaseAdmin.rpc('increment_analysis_count', { user_id: userId });
    } catch {
      // Non-critical
    }

    const totalTime = Date.now() - startTime;
    console.log(`[API v1] Scan complete: ${url} - score=${roundedScore} (${totalTime}ms)`);

    res.status(200).json({
      success: true,
      id: analysisId,
      url,
      status: 'complete',
      overall_score: roundedScore,
      grade: summary.grade,
      factors: result.factors,
      pillars: summary.pillarBreakdown,
      action_items: actionItems,
      schema_analysis: schemaAnalysis,
      readability,
      processing_time_ms: totalTime,
    });
  } catch (error) {
    console.error('[API v1] POST /scan unexpected error:', error);

    try {
      await supabaseAdmin
        .from('analyses')
        .update({ status: 'failed' } as never)
        .eq('id', analysisId);
    } catch {
      // Ignore cleanup errors
    }

    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /v1/scan/:id — Retrieve scan results by ID
// ---------------------------------------------------------------------------

router.get('/scan/:id', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    // Fetch analysis — scoped to authenticated user
    const { data, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', authReq.user.id)
      .single();

    const analysis = data as AnalysisRow | null;

    if (analysisError || !analysis) {
      res.status(404).json({
        success: false,
        error: 'Scan not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Fetch factors
    const { data: factorData, error: factorsError } = await supabaseAdmin
      .from('analysis_factors')
      .select('*')
      .eq('analysis_id', id);

    const factors = (factorData as AnalysisFactorRow[] | null) || [];

    if (factorsError) {
      console.error('[API v1] Failed to fetch factors:', factorsError);
    }

    // Calculate pillar breakdown from stored factors if available
    const pillarBreakdown: Record<string, { score: number; factorCount: number }> = {};
    for (const factor of factors) {
      const pillar = factor.pillar;
      if (!pillarBreakdown[pillar]) {
        pillarBreakdown[pillar] = { score: 0, factorCount: 0 };
      }
      pillarBreakdown[pillar].score += factor.score * factor.weight;
      pillarBreakdown[pillar].factorCount++;
    }

    // Compute averages
    for (const [pillar, data] of Object.entries(pillarBreakdown)) {
      const totalWeight = factors
        .filter(f => f.pillar === pillar)
        .reduce((sum, f) => sum + f.weight, 0);
      if (totalWeight > 0) {
        pillarBreakdown[pillar].score = Math.round(data.score / totalWeight);
      }
    }

    // Determine grade from score
    const score = analysis.overall_score ?? 0;
    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 85) grade = 'A';
    else if (score >= 80) grade = 'A-';
    else if (score >= 75) grade = 'B+';
    else if (score >= 70) grade = 'B';
    else if (score >= 65) grade = 'B-';
    else if (score >= 60) grade = 'C+';
    else if (score >= 55) grade = 'C';
    else if (score >= 50) grade = 'C-';
    else if (score >= 45) grade = 'D+';
    else if (score >= 40) grade = 'D';

    res.status(200).json({
      success: true,
      id: analysis.id,
      url: analysis.url,
      status: analysis.status,
      overall_score: analysis.overall_score,
      grade,
      factors,
      pillars: pillarBreakdown,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
    });
  } catch (error) {
    console.error('[API v1] GET /scan/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scan',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /v1/scan/:id/actions — Get action items for a scan
// ---------------------------------------------------------------------------

router.get('/scan/:id/actions', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    // Verify ownership
    const { data, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('id, user_id, url')
      .eq('id', id)
      .eq('user_id', authReq.user.id)
      .single();

    if (analysisError || !data) {
      res.status(404).json({
        success: false,
        error: 'Scan not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // NOTE: Action items are not currently stored in the database.
    // They are generated on-the-fly during analysis. To retrieve them
    // after the fact, you would need to re-run analysis or store them
    // at scan time. For now, return empty arrays for historical scans.
    // Fresh scans via POST /v1/scan include action_items in the response.
    res.status(200).json({
      success: true,
      scan_id: id,
      actions: [],
      schema: null,
      _note: 'Action items are returned in the POST /v1/scan response. Historical retrieval requires re-analysis.',
    });
  } catch (error) {
    console.error('[API v1] GET /scan/:id/actions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve actions',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ---------------------------------------------------------------------------
// POST /v1/schema/generate — Generate schema markup for a URL
// ---------------------------------------------------------------------------

router.post('/schema/generate', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { url } = req.body;

  try {
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        success: false,
        error: 'URL is required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    if (!isValidUrl(url)) {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
        code: 'INVALID_URL',
      });
      return;
    }

    console.log(`[API v1] POST /schema/generate - url=${url} user=${authReq.user.id}`);

    // Fetch page content
    let pageContent: string;
    try {
      const { content } = await fetchPageContent(url);
      pageContent = content;
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      res.status(422).json({
        success: false,
        error: `Failed to fetch page: ${errorMessage}`,
        code: 'FETCH_ERROR',
      });
      return;
    }

    // Generate schema analysis
    const schemaAnalysis = analyzeAndGenerateSchema(url, pageContent);

    res.status(200).json({
      success: true,
      url,
      schema_analysis: schemaAnalysis,
    });
  } catch (error) {
    console.error('[API v1] POST /schema/generate error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
});

// ---------------------------------------------------------------------------
// GET /v1/monitor/citations — Proxy to /api/monitor/citations
// ---------------------------------------------------------------------------

router.get('/monitor/citations', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { getCitationSummary } = await import('../services/citationTracker');
    const authReq = req as AuthenticatedRequest;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const summary = await getCitationSummary(authReq.user.id, from && to ? { from, to } : undefined);
    res.json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve citations', code: 'INTERNAL_ERROR' });
  }
});

// ---------------------------------------------------------------------------
// GET /v1/monitor/roi — Proxy to /api/roi/summary
// ---------------------------------------------------------------------------

router.get('/monitor/roi', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { getROISummary } = await import('../services/roiAttribution');
    const authReq = req as AuthenticatedRequest;
    const summary = await getROISummary(authReq.user.id);
    res.json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve ROI data', code: 'INTERNAL_ERROR' });
  }
});

export default router;
