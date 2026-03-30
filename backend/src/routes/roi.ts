/**
 * ROI Attribution Routes
 *
 * POST   /api/roi/config        - Create/update ROI configuration
 * GET    /api/roi/config        - Get user's ROI config
 * GET    /api/roi/summary       - Full ROI summary (current + trend + ROI %)
 * GET    /api/roi/attribution   - Attribution data for a specific month
 * GET    /api/roi/report        - Monthly report data (JSON for client-side PDF)
 *
 * All routes require JWT auth (authenticateUser middleware).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import {
  createROIConfig,
  getROIConfig,
  calculateAttribution,
  getROISummary,
  generateMonthlyReport,
} from '../services/roiAttribution';

const router = Router();

// All ROI routes require JWT auth
router.use(authenticateUser);

const VALID_ANALYTICS_PROVIDERS = ['ga4', 'plausible', 'manual'];

/**
 * POST /api/roi/config - Create or update ROI configuration
 *
 * Body:
 *   analytics_provider?: 'ga4' | 'plausible' | 'manual'
 *   analytics_property_id?: string
 *   avg_deal_value?: number
 *   conversion_rate?: number       (0-1, e.g. 0.025 = 2.5%)
 *   traffic_multiplier?: number
 *   subscription_cost?: number
 */
router.post('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const {
      analytics_provider,
      analytics_property_id,
      avg_deal_value,
      conversion_rate,
      traffic_multiplier,
      subscription_cost,
    } = req.body;

    // Validate analytics_provider if provided
    if (analytics_provider && !VALID_ANALYTICS_PROVIDERS.includes(analytics_provider)) {
      res.status(400).json({
        error: `Invalid analytics_provider. Valid: ${VALID_ANALYTICS_PROVIDERS.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate numeric fields
    if (avg_deal_value !== undefined && (typeof avg_deal_value !== 'number' || avg_deal_value < 0)) {
      res.status(400).json({ error: 'avg_deal_value must be a non-negative number', code: 'VALIDATION_ERROR' });
      return;
    }

    if (conversion_rate !== undefined && (typeof conversion_rate !== 'number' || conversion_rate < 0 || conversion_rate > 1)) {
      res.status(400).json({ error: 'conversion_rate must be between 0 and 1', code: 'VALIDATION_ERROR' });
      return;
    }

    if (traffic_multiplier !== undefined && (typeof traffic_multiplier !== 'number' || traffic_multiplier < 1)) {
      res.status(400).json({ error: 'traffic_multiplier must be at least 1', code: 'VALIDATION_ERROR' });
      return;
    }

    if (subscription_cost !== undefined && (typeof subscription_cost !== 'number' || subscription_cost < 0)) {
      res.status(400).json({ error: 'subscription_cost must be a non-negative number', code: 'VALIDATION_ERROR' });
      return;
    }

    const config = await createROIConfig(user.id, {
      analytics_provider,
      analytics_property_id,
      avg_deal_value,
      conversion_rate,
      traffic_multiplier,
      subscription_cost,
    });

    res.json({ config });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save ROI config';
    console.error('Error saving ROI config:', err);
    res.status(500).json({ error: message, code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/roi/config - Get user's ROI configuration
 */
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const config = await getROIConfig(user.id);

    if (!config) {
      res.status(404).json({
        error: 'No ROI config found. Create one with POST /api/roi/config.',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({ config });
  } catch (err) {
    console.error('Error fetching ROI config:', err);
    res.status(500).json({ error: 'Failed to fetch ROI config', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/roi/summary - Full ROI summary
 *
 * Returns current month attribution, 6-month trend, ROI %, and payback note.
 */
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const summary = await getROISummary(user.id);
    res.json({ summary });
  } catch (err) {
    console.error('Error calculating ROI summary:', err);
    res.status(500).json({ error: 'Failed to calculate ROI summary', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/roi/attribution - Attribution data for a specific month
 *
 * Query params:
 *   ?month=2026-03   (format: YYYY-MM, defaults to current month)
 */
router.get('/attribution', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const month = req.query.month as string | undefined;

    // Validate month format if provided
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        error: 'Invalid month format. Use YYYY-MM (e.g., 2026-03).',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const attribution = await calculateAttribution(user.id, month);
    res.json({ attribution });
  } catch (err) {
    console.error('Error calculating attribution:', err);
    res.status(500).json({ error: 'Failed to calculate attribution', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/roi/report - Monthly report data
 *
 * Returns structured JSON suitable for client-side PDF rendering.
 *
 * Query params:
 *   ?month=2026-03   (format: YYYY-MM, defaults to current month)
 */
router.get('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const month = req.query.month as string | undefined;

    // Validate month format if provided
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({
        error: 'Invalid month format. Use YYYY-MM (e.g., 2026-03).',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const report = await generateMonthlyReport(user.id, month);
    res.json({ report });
  } catch (err) {
    console.error('Error generating monthly report:', err);
    res.status(500).json({ error: 'Failed to generate monthly report', code: 'INTERNAL_ERROR' });
  }
});

export default router;
