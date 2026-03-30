/**
 * Citation Monitor Routes
 *
 * POST   /api/monitor/config          - Create/update monitoring config
 * GET    /api/monitor/config          - Get user's monitoring config
 * GET    /api/monitor/citations       - Get citation summary
 * GET    /api/monitor/citations/history - Paginated citation history
 * GET    /api/monitor/citations/queries - Citations grouped by query
 * POST   /api/monitor/check           - Manually trigger citation check
 * GET    /api/monitor/changes         - Detect recent citation changes
 *
 * All routes require JWT auth (authenticateUser middleware).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import {
  createMonitorConfig,
  getMonitorConfig,
  updateMonitorConfig,
  checkCitations,
  getCitationSummary,
  getCitationHistory,
  getQueryMap,
  detectCitationChanges,
  isCheckRateLimited,
  AIPlatform,
} from '../services/citationTracker';

const router = Router();

// All monitor routes require JWT auth
router.use(authenticateUser);

const VALID_PLATFORMS: AIPlatform[] = ['chatgpt', 'perplexity', 'claude', 'gemini', 'copilot'];

/**
 * POST /api/monitor/config - Create or update monitoring config
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { domain, keywords, platforms } = req.body;

    // Validate domain
    if (!domain || typeof domain !== 'string') {
      res.status(400).json({ error: 'domain is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Validate keywords
    if (!Array.isArray(keywords) || keywords.length === 0) {
      res.status(400).json({ error: 'keywords must be a non-empty array', code: 'VALIDATION_ERROR' });
      return;
    }

    if (keywords.length > 20) {
      res.status(400).json({ error: 'Maximum 20 keywords allowed', code: 'VALIDATION_ERROR' });
      return;
    }

    // Validate platforms (optional, defaults applied by DB)
    const selectedPlatforms: AIPlatform[] = platforms || ['chatgpt', 'perplexity', 'claude'];
    const invalidPlatforms = selectedPlatforms.filter((p: string) => !VALID_PLATFORMS.includes(p as AIPlatform));
    if (invalidPlatforms.length > 0) {
      res.status(400).json({
        error: `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid: ${VALID_PLATFORMS.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Check if config already exists -- update if so
    const existing = await getMonitorConfig(user.id);
    if (existing) {
      const updated = await updateMonitorConfig(user.id, existing.id, {
        domain,
        keywords,
        platforms: selectedPlatforms,
      });
      res.json({ config: updated, updated: true });
      return;
    }

    const config = await createMonitorConfig(user.id, domain, keywords, selectedPlatforms);
    res.status(201).json({ config, created: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save monitor config';
    const status = message.includes('already exists') ? 409 : 500;
    res.status(status).json({ error: message, code: status === 409 ? 'CONFLICT' : 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/monitor/config - Get user's monitoring config
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const config = await getMonitorConfig(user.id);

    if (!config) {
      res.status(404).json({ error: 'No monitor config found. Create one first.', code: 'NOT_FOUND' });
      return;
    }

    res.json({ config });
  } catch (err) {
    console.error('Error fetching monitor config:', err);
    res.status(500).json({ error: 'Failed to fetch monitor config', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/monitor/citations - Get citation summary with optional date filters
 *
 * Query params:
 *   ?from=YYYY-MM-DD  - Start date (inclusive)
 *   ?to=YYYY-MM-DD    - End date (inclusive)
 */
router.get('/citations', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const dateRange: { from?: string; to?: string } = {};
    if (from) dateRange.from = from;
    if (to) dateRange.to = to;

    const summary = await getCitationSummary(user.id, Object.keys(dateRange).length > 0 ? dateRange : undefined);
    res.json({ summary });
  } catch (err) {
    console.error('Error fetching citation summary:', err);
    res.status(500).json({ error: 'Failed to fetch citation summary', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/monitor/citations/history - Paginated citation history
 *
 * Query params:
 *   ?limit=20   - Results per page (max 100)
 *   ?offset=0   - Offset for pagination
 */
router.get('/citations/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const { citations, total } = await getCitationHistory(user.id, limit, offset);

    res.json({
      citations,
      pagination: {
        total,
        limit,
        offset,
        has_more: total > offset + limit,
      },
    });
  } catch (err) {
    console.error('Error fetching citation history:', err);
    res.status(500).json({ error: 'Failed to fetch citation history', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/monitor/citations/queries - Citations grouped by query
 */
router.get('/citations/queries', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const queryMap = await getQueryMap(user.id);
    res.json({ queries: queryMap });
  } catch (err) {
    console.error('Error fetching query map:', err);
    res.status(500).json({ error: 'Failed to fetch query map', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/monitor/check - Manually trigger a citation check
 *
 * Rate limited: 1 check per 5 minutes per user.
 */
router.post('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    // Rate limit check
    if (isCheckRateLimited(user.id)) {
      res.status(429).json({
        error: 'Citation check rate limited. Please wait 5 minutes between checks.',
        code: 'RATE_LIMITED',
      });
      return;
    }

    // Get config
    const config = await getMonitorConfig(user.id);
    if (!config) {
      res.status(404).json({
        error: 'No monitor config found. Create one first.',
        code: 'NOT_FOUND',
      });
      return;
    }

    if (!config.is_active) {
      res.status(400).json({
        error: 'Monitor is paused. Activate it before running checks.',
        code: 'MONITOR_INACTIVE',
      });
      return;
    }

    // Run the check
    const results = await checkCitations(config);

    res.json({
      message: 'Citation check complete',
      results_count: results.length,
      cited_count: results.filter((r) => r.cited).length,
      results,
    });
  } catch (err) {
    console.error('Error running citation check:', err);
    res.status(500).json({ error: 'Failed to run citation check', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/monitor/changes - Detect recent citation changes
 *
 * Compares the two most recent check batches to find new or lost citations.
 */
router.get('/changes', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const changes = await detectCitationChanges(user.id);

    res.json({
      new_citations: changes.new_citations,
      lost_citations: changes.lost_citations,
      new_count: changes.new_citations.length,
      lost_count: changes.lost_citations.length,
    });
  } catch (err) {
    console.error('Error detecting citation changes:', err);
    res.status(500).json({ error: 'Failed to detect citation changes', code: 'INTERNAL_ERROR' });
  }
});

export default router;
