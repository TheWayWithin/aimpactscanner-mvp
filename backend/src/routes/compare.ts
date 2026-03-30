/**
 * Competitive Comparison API Routes
 *
 * POST /api/compare     - Compare two URLs for AI-readiness
 * GET  /api/compare/history - Get comparison history
 *
 * Growth+ tier only
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';
import {
  analyzeAllFactors,
  getPillarBreakdown,
  getAnalysisSummary,
} from '../services/analyzer';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/** Tiers that have access to competitive comparison */
const ALLOWED_TIERS = ['growth', 'professional', 'scale', 'enterprise'];

/**
 * Fetch page content from URL
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
        throw new Error(`The website could not be found. Please check the URL and try again.`);
      }
      if (code === 'ECONNREFUSED') {
        throw new Error(`The website refused the connection. It may be down or blocking requests.`);
      }
      if (code === 'ECONNRESET' || code === 'EPIPE') {
        throw new Error(`The connection was interrupted. The website may be experiencing issues.`);
      }
      if (code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        throw new Error(`The website has an invalid or expired SSL certificate.`);
      }
      if (error.name === 'AbortError') {
        throw new Error(`The website took too long to respond (30s timeout). It may be slow or unreachable.`);
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
 * Determine delta status
 */
function getDeltaStatus(delta: number): 'ahead' | 'behind' | 'tied' {
  if (delta > 0) return 'ahead';
  if (delta < 0) return 'behind';
  return 'tied';
}

/**
 * POST /api/compare
 *
 * Compare two URLs for AI-readiness. Growth+ tier only.
 */
router.post('/', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { url, competitor_url } = req.body;
  const startTime = Date.now();

  try {
    // Tier check
    const userTier = String(authReq.user.tier);
    if (!ALLOWED_TIERS.includes(userTier)) {
      res.status(403).json({
        error: 'Competitive benchmarking requires a Growth plan or higher.',
        code: 'TIER_REQUIRED',
        required_tier: 'growth',
        current_tier: userTier,
        upgrade_message: 'Unlock Competitive Benchmarking — Growth plan ($19.95/mo)',
      });
      return;
    }

    // Validate inputs
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (!competitor_url || typeof competitor_url !== 'string') {
      res.status(400).json({ error: 'competitor_url is required', code: 'INVALID_REQUEST' });
      return;
    }
    if (!isValidUrl(url)) {
      res.status(400).json({ error: 'Invalid URL format for your URL.', code: 'INVALID_URL' });
      return;
    }
    if (!isValidUrl(competitor_url)) {
      res.status(400).json({ error: 'Invalid URL format for competitor URL.', code: 'INVALID_URL' });
      return;
    }

    console.log(`[Compare] Starting comparison: ${url} vs ${competitor_url} (user: ${authReq.user.id}, tier: ${userTier})`);

    // Fetch both pages in parallel
    let userContent: string;
    let competitorContent: string;

    try {
      const [userFetch, competitorFetch] = await Promise.all([
        fetchPageContent(url),
        fetchPageContent(competitor_url),
      ]);
      userContent = userFetch.content;
      competitorContent = competitorFetch.content;
      console.log(`[Compare] Fetched both pages (user: ${userFetch.content.length}B, competitor: ${competitorFetch.content.length}B)`);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      res.status(422).json({
        error: `Failed to fetch page: ${errorMessage}`,
        code: 'FETCH_ERROR',
        details: 'Make sure both URLs are accessible and return valid HTML content.',
      });
      return;
    }

    // Analyze both URLs in parallel
    const [userResult, competitorResult] = await Promise.all([
      analyzeAllFactors(url, userContent, userTier),
      analyzeAllFactors(competitor_url, competitorContent, userTier),
    ]);

    if (!userResult.success) {
      res.status(500).json({ error: 'Analysis failed for your URL', code: 'ANALYSIS_ERROR' });
      return;
    }
    if (!competitorResult.success) {
      res.status(500).json({ error: 'Analysis failed for competitor URL', code: 'ANALYSIS_ERROR' });
      return;
    }

    const userSummary = getAnalysisSummary(userResult);
    const competitorSummary = getAnalysisSummary(competitorResult);

    const userPillars = getPillarBreakdown(userResult.factors);
    const competitorPillars = getPillarBreakdown(competitorResult.factors);

    // Build factor deltas
    const factorDeltas: Array<{
      factor_id: string;
      factor_name: string;
      pillar: string;
      user_score: number;
      competitor_score: number;
      delta: number;
      status: 'ahead' | 'behind' | 'tied';
    }> = [];

    // Map competitor factors by factor_id for lookup
    const competitorFactorMap = new Map(
      competitorResult.factors.map(f => [f.factor_id, f])
    );

    for (const userFactor of userResult.factors) {
      const competitorFactor = competitorFactorMap.get(userFactor.factor_id);
      const competitorScore = competitorFactor ? Math.round(competitorFactor.score) : 0;
      const userScore = Math.round(userFactor.score);
      const delta = userScore - competitorScore;

      factorDeltas.push({
        factor_id: userFactor.factor_id,
        factor_name: userFactor.factor_name,
        pillar: userFactor.pillar,
        user_score: userScore,
        competitor_score: competitorScore,
        delta,
        status: getDeltaStatus(delta),
      });
    }

    // Sort by delta ascending (biggest gaps where user is behind first)
    factorDeltas.sort((a, b) => a.delta - b.delta);

    // Build pillar deltas
    const allPillarKeys = new Set([
      ...Object.keys(userPillars),
      ...Object.keys(competitorPillars),
    ]);

    const pillarDeltas: Array<{
      pillar: string;
      pillar_name: string;
      user_score: number;
      competitor_score: number;
      delta: number;
      status: 'ahead' | 'behind' | 'tied';
    }> = [];

    for (const pillar of allPillarKeys) {
      const userPillarScore = userPillars[pillar]?.score ?? 0;
      const competitorPillarScore = competitorPillars[pillar]?.score ?? 0;
      const delta = userPillarScore - competitorPillarScore;

      pillarDeltas.push({
        pillar,
        pillar_name: userPillars[pillar]?.name || competitorPillars[pillar]?.name || pillar,
        user_score: userPillarScore,
        competitor_score: competitorPillarScore,
        delta,
        status: getDeltaStatus(delta),
      });
    }

    // Generate "close the gap" recommendations
    const recommendations: string[] = [];
    for (const fd of factorDeltas) {
      if (fd.delta <= -10) {
        // Competitor is ahead by 10+ points
        const userFactor = userResult.factors.find(f => f.factor_id === fd.factor_id);
        const firstRec = userFactor?.recommendations?.[0] || '';
        const recText = firstRec
          ? `Improve ${fd.factor_name}: competitor scores ${fd.competitor_score} vs your ${fd.user_score}. ${firstRec}`
          : `Improve ${fd.factor_name}: competitor scores ${fd.competitor_score} vs your ${fd.user_score}.`;
        recommendations.push(recText);
      }
    }

    const scoreDelta = userResult.overall_score - competitorResult.overall_score;

    // Store comparison in database
    const comparisonId = uuidv4();
    try {
      await supabaseAdmin
        .from('comparisons')
        .insert({
          id: comparisonId,
          user_id: authReq.user.id,
          user_url: url,
          competitor_url,
          user_score: Math.round(userResult.overall_score),
          competitor_score: Math.round(competitorResult.overall_score),
          score_delta: Math.round(scoreDelta),
          factor_deltas: JSON.stringify(factorDeltas),
          pillar_deltas: JSON.stringify(pillarDeltas),
          recommendations: JSON.stringify(recommendations),
          created_at: new Date().toISOString(),
        } as never);
    } catch (dbError) {
      // Non-blocking: log but do not fail the request
      console.error('[Compare] Failed to store comparison:', dbError);
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Compare] Completed ${url} vs ${competitor_url} — delta: ${scoreDelta} (${totalTime}ms)`);

    res.json({
      success: true,
      user: {
        url,
        overall_score: userResult.overall_score,
        grade: userSummary.grade,
        factors: userResult.factors,
        pillars: userSummary.pillarBreakdown,
      },
      competitor: {
        url: competitor_url,
        overall_score: competitorResult.overall_score,
        grade: competitorSummary.grade,
        factors: competitorResult.factors,
        pillars: competitorSummary.pillarBreakdown,
      },
      comparison: {
        score_delta: Math.round(scoreDelta),
        factor_deltas: factorDeltas,
        pillar_deltas: pillarDeltas,
        recommendations,
      },
      processing_time_ms: totalTime,
    });
  } catch (error) {
    console.error('[Compare] Unexpected error:', error);
    res.status(500).json({
      error: 'An unexpected error occurred during comparison',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/compare/history
 *
 * Get comparison history for the authenticated user. Growth+ only.
 */
router.get('/history', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const userTier = String(authReq.user.tier);
    if (!ALLOWED_TIERS.includes(userTier)) {
      res.status(403).json({
        error: 'Competitive benchmarking requires a Growth plan or higher.',
        code: 'TIER_REQUIRED',
        required_tier: 'growth',
        current_tier: userTier,
      });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    // Last 30 days only
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabaseAdmin
      .from('comparisons')
      .select('id, user_url, competitor_url, user_score, competitor_score, score_delta, created_at')
      .eq('user_id', authReq.user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Compare] Failed to fetch history:', error);
      res.status(500).json({ error: 'Failed to retrieve comparison history', code: 'DATABASE_ERROR' });
      return;
    }

    res.json({
      success: true,
      comparisons: (data || []).map((row: Record<string, unknown>) => ({
        id: row.id,
        user_url: row.user_url,
        competitor_url: row.competitor_url,
        user_score: row.user_score,
        competitor_score: row.competitor_score,
        delta: row.score_delta,
        created_at: row.created_at,
      })),
      count: (data || []).length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Compare] Error fetching history:', error);
    res.status(500).json({
      error: 'Failed to retrieve comparison history',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
