/**
 * Competitive Citation Routes
 *
 * POST   /api/competitive/competitors       - Set competitor domains (max 5)
 * GET    /api/competitive/competitors       - Get competitor config
 * GET    /api/competitive/share-of-voice    - Share of voice analysis
 * GET    /api/competitive/gaps              - Citation gap detection
 * GET    /api/competitive/report            - Full opportunity report
 * POST   /api/competitive/check             - Trigger competitor citation check
 *
 * All routes require JWT auth (authenticateUser middleware).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import {
  setCompetitors,
  getCompetitors,
  checkCompetitorCitations,
  calculateShareOfVoice,
  findCitationGaps,
  generateOpportunityReport,
} from '../services/competitiveCitations';

const router = Router();

// All competitive routes require JWT auth
router.use(authenticateUser);

/**
 * POST /api/competitive/competitors - Set competitor domains
 * Body: { domains: string[] }  (max 5)
 */
router.post('/competitors', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      res.status(400).json({
        error: 'domains must be a non-empty array of domain strings',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (domains.length > 5) {
      res.status(400).json({
        error: 'Maximum 5 competitor domains allowed',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate each domain is a string
    for (const d of domains) {
      if (typeof d !== 'string' || d.trim().length === 0) {
        res.status(400).json({
          error: 'Each domain must be a non-empty string',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
    }

    const config = await setCompetitors(user.id, domains);
    res.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to set competitors';
    const status = message.includes('Maximum') || message.includes('Duplicate') ? 400 : 500;
    res.status(status).json({
      error: message,
      code: status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/competitive/competitors - Get competitor config
 */
router.get('/competitors', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const config = await getCompetitors(user.id);

    if (!config) {
      res.status(404).json({
        error: 'No competitors configured. Set competitors first.',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({ config });
  } catch (err) {
    console.error('Error fetching competitors:', err);
    res.status(500).json({ error: 'Failed to fetch competitors', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/competitive/share-of-voice - Share of voice analysis
 * Query params: ?keywords=keyword1,keyword2 (optional)
 */
router.get('/share-of-voice', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const keywordsParam = req.query.keywords as string | undefined;
    const keywords = keywordsParam
      ? keywordsParam.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined;

    const shareOfVoice = await calculateShareOfVoice(user.id, keywords);
    res.json({ share_of_voice: shareOfVoice });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to calculate share of voice';
    const status = message.includes('No monitor config') ? 404 : 500;
    res.status(status).json({
      error: message,
      code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/competitive/gaps - Citation gaps (competitors cited, user not)
 */
router.get('/gaps', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const gaps = await findCitationGaps(user.id);

    res.json({
      gaps,
      total: gaps.length,
      high_opportunity: gaps.filter((g) => g.opportunity_score >= 60).length,
    });
  } catch (err) {
    console.error('Error finding citation gaps:', err);
    res.status(500).json({ error: 'Failed to find citation gaps', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/competitive/report - Full opportunity report
 */
router.get('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const report = await generateOpportunityReport(user.id);
    res.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate report';
    console.error('Error generating opportunity report:', err);
    res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/competitive/check - Manually trigger competitor citation check
 */
router.post('/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const summaries = await checkCompetitorCitations(user.id);

    res.json({
      message: 'Competitor citation check complete',
      results: summaries,
      total_competitors: summaries.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to check competitor citations';
    const status = message.includes('No competitors') || message.includes('No monitor config') ? 404 : 500;
    res.status(status).json({
      error: message,
      code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
    });
  }
});

export default router;
