/**
 * Webhook Management Routes
 *
 * POST   /api/webhooks          - Create a new webhook
 * GET    /api/webhooks          - List user's webhooks
 * GET    /api/webhooks/:id      - Get webhook with recent deliveries
 * PUT    /api/webhooks/:id      - Update webhook
 * DELETE /api/webhooks/:id      - Delete webhook
 * POST   /api/webhooks/:id/test - Send test event
 * GET    /api/webhooks/:id/deliveries - Get delivery history
 *
 * All routes require JWT auth (authenticateUser middleware).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import {
  createWebhook,
  listWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  sendTestEvent,
  getDeliveryHistory,
  VALID_EVENTS,
  WebhookEvent,
} from '../services/webhooks';

const router = Router();

// All webhook management requires JWT auth
router.use(authenticateUser);

/**
 * Validate a webhook URL.
 * Must be HTTPS in production, allows HTTP for localhost in development.
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return true;
    // Allow http for localhost in non-production
    if (
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      process.env.NODE_ENV !== 'production'
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validate event names against known event types.
 */
function validateEvents(events: unknown): { valid: boolean; parsed: WebhookEvent[]; error?: string } {
  if (!Array.isArray(events) || events.length === 0) {
    return { valid: false, parsed: [], error: 'events must be a non-empty array' };
  }

  const invalid = events.filter((e) => !VALID_EVENTS.includes(e as WebhookEvent));
  if (invalid.length > 0) {
    return {
      valid: false,
      parsed: [],
      error: `Invalid events: ${invalid.join(', ')}. Valid events: ${VALID_EVENTS.join(', ')}`,
    };
  }

  // Deduplicate
  const uniqueEvents = [...new Set(events)] as WebhookEvent[];
  return { valid: true, parsed: uniqueEvents };
}

/**
 * POST /api/webhooks - Create a new webhook
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { url, events } = req.body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required', code: 'VALIDATION_ERROR' });
      return;
    }

    if (!isValidWebhookUrl(url)) {
      res.status(400).json({
        error: 'url must be a valid HTTPS URL',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate events
    const eventsResult = validateEvents(events);
    if (!eventsResult.valid) {
      res.status(400).json({ error: eventsResult.error, code: 'VALIDATION_ERROR' });
      return;
    }

    const webhook = await createWebhook(user.id, url, eventsResult.parsed);

    // Return full config including secret on creation
    res.status(201).json({
      webhook,
      warning: 'Save the secret now. It will be masked in subsequent responses.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create webhook';
    const status = message.includes('Maximum') ? 400 : 500;
    res.status(status).json({ error: message, code: status === 400 ? 'LIMIT_REACHED' : 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/webhooks - List user's webhooks
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const webhooks = await listWebhooks(user.id);

    // Mask secrets in list response
    const masked = webhooks.map((w) => ({
      ...w,
      secret: w.secret.substring(0, 10) + '...',
    }));

    res.json({ webhooks: masked });
  } catch (err) {
    console.error('Error listing webhooks:', err);
    res.status(500).json({ error: 'Failed to list webhooks', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/webhooks/:id - Get single webhook with recent deliveries
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const webhook = await getWebhook(user.id, req.params.id);

    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' });
      return;
    }

    // Fetch last 10 deliveries
    const deliveries = await getDeliveryHistory(webhook.id, 10);

    res.json({
      webhook: {
        ...webhook,
        secret: webhook.secret.substring(0, 10) + '...',
      },
      recent_deliveries: deliveries,
    });
  } catch (err) {
    console.error('Error getting webhook:', err);
    res.status(500).json({ error: 'Failed to get webhook', code: 'INTERNAL_ERROR' });
  }
});

/**
 * PUT /api/webhooks/:id - Update webhook
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const { url, events, is_active } = req.body;
    const updates: Record<string, unknown> = {};

    // Validate optional URL
    if (url !== undefined) {
      if (typeof url !== 'string' || !isValidWebhookUrl(url)) {
        res.status(400).json({ error: 'url must be a valid HTTPS URL', code: 'VALIDATION_ERROR' });
        return;
      }
      updates.url = url;
    }

    // Validate optional events
    if (events !== undefined) {
      const eventsResult = validateEvents(events);
      if (!eventsResult.valid) {
        res.status(400).json({ error: eventsResult.error, code: 'VALIDATION_ERROR' });
        return;
      }
      updates.events = eventsResult.parsed;
    }

    // Validate optional is_active
    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        res.status(400).json({ error: 'is_active must be a boolean', code: 'VALIDATION_ERROR' });
        return;
      }
      updates.is_active = is_active;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: 'No valid fields to update', code: 'VALIDATION_ERROR' });
      return;
    }

    const webhook = await updateWebhook(user.id, req.params.id, updates);

    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({
      webhook: {
        ...webhook,
        secret: webhook.secret.substring(0, 10) + '...',
      },
    });
  } catch (err) {
    console.error('Error updating webhook:', err);
    res.status(500).json({ error: 'Failed to update webhook', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/webhooks/:id - Delete webhook
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const deleted = await deleteWebhook(user.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) {
    console.error('Error deleting webhook:', err);
    res.status(500).json({ error: 'Failed to delete webhook', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/webhooks/:id/test - Send test event
 */
router.post('/:id/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;
    const result = await sendTestEvent(req.params.id, user.id);

    if (!result.success && result.error === 'Webhook not found') {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' });
      return;
    }

    res.json(result);
  } catch (err) {
    console.error('Error sending test event:', err);
    res.status(500).json({ error: 'Failed to send test event', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/webhooks/:id/deliveries - Get delivery history (paginated)
 */
router.get('/:id/deliveries', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as unknown as AuthenticatedRequest).user;

    // Verify ownership
    const webhook = await getWebhook(user.id, req.params.id);
    if (!webhook) {
      res.status(404).json({ error: 'Webhook not found', code: 'NOT_FOUND' });
      return;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    // getDeliveryHistory doesn't support offset, so we use supabaseAdmin directly
    const { supabaseAdmin } = await import('../lib/supabase');
    const { data, error, count } = await supabaseAdmin
      .from('webhook_deliveries')
      .select('*', { count: 'exact' })
      .eq('webhook_id', req.params.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ error: 'Failed to fetch deliveries', code: 'INTERNAL_ERROR' });
      return;
    }

    res.json({
      deliveries: data || [],
      pagination: {
        total: count ?? 0,
        limit,
        offset,
        has_more: (count ?? 0) > offset + limit,
      },
    });
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries', code: 'INTERNAL_ERROR' });
  }
});

export default router;
