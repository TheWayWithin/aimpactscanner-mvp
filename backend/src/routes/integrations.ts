/**
 * Integration Framework Routes
 *
 * Provides Zapier-compatible webhook triggers, Slack notifications,
 * and GitHub Action CI/CD support for AImpactScanner.
 *
 * Zapier:
 *   GET  /api/integrations/zapier/triggers                - List available triggers
 *   GET  /api/integrations/zapier/triggers/scan-complete   - Poll: recent completed scans
 *   GET  /api/integrations/zapier/triggers/citation-found  - Poll: recent citations
 *   POST /api/integrations/zapier/actions/scan             - Action: trigger a scan
 *
 * Slack:
 *   POST   /api/integrations/slack/configure  - Store Slack webhook URL
 *   GET    /api/integrations/slack/config      - Get Slack config
 *   DELETE /api/integrations/slack/config      - Remove Slack integration
 *   POST   /api/integrations/slack/test        - Send test message
 *
 * GitHub:
 *   POST /api/integrations/github/validate    - CI pass/fail validation
 *
 * All routes require JWT auth (authenticateUser middleware).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// All integration routes require JWT auth
router.use(authenticateUser);

// --- Slack Block Kit Formatter ---

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

function formatSlackMessage(event: string, data: Record<string, unknown>): { blocks: SlackBlock[] } {
  const blocks: SlackBlock[] = [];

  switch (event) {
    case 'scan.complete': {
      const domain = (data.domain as string) || 'unknown';
      const score = (data.score as number) ?? 0;
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'Scan Complete', emoji: true },
      });
      blocks.push({
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Domain:*\n${domain}` },
          { type: 'mrkdwn', text: `*Score:*\n${score}/100` },
        ],
      });
      if (data.factors_analyzed) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `_${data.factors_analyzed} factors analyzed_` },
        });
      }
      break;
    }

    case 'monitor.citation_found': {
      const domain = (data.domain as string) || 'unknown';
      const platform = (data.platform as string) || 'unknown';
      const query = (data.query as string) || '';
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'New Citation Found', emoji: true },
      });
      blocks.push({
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Domain:*\n${domain}` },
          { type: 'mrkdwn', text: `*Platform:*\n${platform}` },
        ],
      });
      if (query) {
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: `*Query:*\n"${query}"` },
        });
      }
      break;
    }

    case 'llmstxt.drift_detected': {
      const domain = (data.domain as string) || 'unknown';
      blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'LLMs.txt Drift Detected', emoji: true },
      });
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `Content drift detected for *${domain}*. Review and regenerate your LLMs.txt file.` },
      });
      break;
    }

    default: {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*Event:* ${event}\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\`` },
      });
    }
  }

  // Footer
  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `AImpactScanner | ${new Date().toISOString()}` },
    ],
  });

  return { blocks };
}

// ===========================
// Zapier Integration Endpoints
// ===========================

/**
 * GET /api/integrations/zapier/triggers - List available trigger types
 */
router.get('/zapier/triggers', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    triggers: [
      {
        key: 'scan_complete',
        name: 'Scan Complete',
        description: 'Fires when an AI visibility scan completes',
        poll_url: '/api/integrations/zapier/triggers/scan-complete',
      },
      {
        key: 'citation_found',
        name: 'Citation Found',
        description: 'Fires when a new AI citation is discovered',
        poll_url: '/api/integrations/zapier/triggers/citation-found',
      },
      {
        key: 'drift_detected',
        name: 'LLMs.txt Drift Detected',
        description: 'Fires when LLMs.txt content drift is detected',
        poll_url: '/api/integrations/zapier/triggers/drift-detected',
      },
    ],
  });
});

/**
 * GET /api/integrations/zapier/triggers/scan-complete
 * Zapier-compatible poll endpoint returning recent completed scans (last 24h).
 * Returns array of objects with `id` field (Zapier deduplication key).
 */
router.get('/zapier/triggers/scan-complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('scan_results')
      .select('id, domain, overall_score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching scans for Zapier:', error);
      res.status(500).json({ error: 'Failed to fetch recent scans', code: 'INTERNAL_ERROR' });
      return;
    }

    // Zapier expects an array of objects with `id` for deduplication
    const results = (data ?? []).map((scan: Record<string, unknown>) => ({
      id: scan.id,
      domain: scan.domain,
      score: scan.overall_score,
      completed_at: scan.created_at,
    }));

    res.json(results);
  } catch (err) {
    console.error('Error in Zapier scan-complete trigger:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/integrations/zapier/triggers/citation-found
 * Zapier-compatible poll endpoint returning recent citations (last 24h).
 */
router.get('/zapier/triggers/citation-found', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('citations')
      .select('id, domain, platform, query, cited, context_quote, sentiment, checked_at')
      .eq('user_id', user.id)
      .eq('cited', true)
      .gte('checked_at', since)
      .order('checked_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching citations for Zapier:', error);
      res.status(500).json({ error: 'Failed to fetch recent citations', code: 'INTERNAL_ERROR' });
      return;
    }

    const results = (data ?? []).map((c: Record<string, unknown>) => ({
      id: c.id,
      domain: c.domain,
      platform: c.platform,
      query: c.query,
      context: c.context_quote,
      sentiment: c.sentiment,
      found_at: c.checked_at,
    }));

    res.json(results);
  } catch (err) {
    console.error('Error in Zapier citation-found trigger:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/integrations/zapier/actions/scan - Trigger a scan via Zapier
 * Body: { url: string }
 */
router.post('/zapier/actions/scan', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Normalize URL to domain
    let domain: string;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      res.status(400).json({ error: 'Invalid URL', code: 'VALIDATION_ERROR' });
      return;
    }

    // Create a pending scan record
    const { data, error } = await supabaseAdmin
      .from('scan_results')
      .insert({
        user_id: user.id,
        domain,
        status: 'pending',
        overall_score: null,
      } as never)
      .select('id, domain, status, created_at')
      .single();

    if (error) {
      console.error('Error creating scan from Zapier:', error);
      res.status(500).json({ error: 'Failed to trigger scan', code: 'INTERNAL_ERROR' });
      return;
    }

    res.status(202).json({
      message: 'Scan queued successfully',
      scan_id: (data as Record<string, unknown>).id,
      domain,
      status: 'pending',
    });
  } catch (err) {
    console.error('Error in Zapier scan action:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

// ===========================
// Slack Integration Endpoints
// ===========================

const VALID_SLACK_EVENTS = ['scan.complete', 'llmstxt.drift_detected', 'monitor.citation_found'];

/**
 * POST /api/integrations/slack/configure - Store Slack webhook URL
 * Body: { webhook_url: string, events: string[] }
 */
router.post('/slack/configure', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { webhook_url, events } = req.body;

    if (!webhook_url || typeof webhook_url !== 'string') {
      res.status(400).json({ error: 'webhook_url is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Validate webhook URL format
    if (!webhook_url.startsWith('https://hooks.slack.com/')) {
      res.status(400).json({
        error: 'webhook_url must be a valid Slack webhook URL (https://hooks.slack.com/...)',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'events must be a non-empty array of event types',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const invalidEvents = events.filter((e: string) => !VALID_SLACK_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      res.status(400).json({
        error: `Invalid events: ${invalidEvents.join(', ')}. Valid: ${VALID_SLACK_EVENTS.join(', ')}`,
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Upsert: check if config exists
    const { data: existing } = await supabaseAdmin
      .from('slack_configs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let config;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('slack_configs')
        .update({
          webhook_url,
          events,
          is_active: true,
        } as never)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating Slack config:', error);
        res.status(500).json({ error: 'Failed to update Slack config', code: 'INTERNAL_ERROR' });
        return;
      }
      config = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('slack_configs')
        .insert({
          user_id: user.id,
          webhook_url,
          events,
        } as never)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating Slack config:', error);
        res.status(500).json({ error: 'Failed to create Slack config', code: 'INTERNAL_ERROR' });
        return;
      }
      config = data;
    }

    // Mask webhook URL in response
    const masked = config as Record<string, unknown>;
    const urlStr = masked.webhook_url as string;
    masked.webhook_url = urlStr.substring(0, 30) + '...' + urlStr.substring(urlStr.length - 8);

    res.json({ config: masked, message: 'Slack integration configured' });
  } catch (err) {
    console.error('Error configuring Slack:', err);
    res.status(500).json({ error: 'Failed to configure Slack', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/integrations/slack/config - Get Slack config
 */
router.get('/slack/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const { data, error } = await supabaseAdmin
      .from('slack_configs')
      .select('id, user_id, events, is_active, created_at')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'No Slack integration configured', code: 'NOT_FOUND' });
        return;
      }
      console.error('Error fetching Slack config:', error);
      res.status(500).json({ error: 'Failed to fetch Slack config', code: 'INTERNAL_ERROR' });
      return;
    }

    // Do not return the full webhook URL for security
    res.json({ config: data });
  } catch (err) {
    console.error('Error fetching Slack config:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/integrations/slack/config - Remove Slack integration
 */
router.delete('/slack/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const { error } = await supabaseAdmin
      .from('slack_configs')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting Slack config:', error);
      res.status(500).json({ error: 'Failed to remove Slack integration', code: 'INTERNAL_ERROR' });
      return;
    }

    res.json({ message: 'Slack integration removed' });
  } catch (err) {
    console.error('Error removing Slack config:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/integrations/slack/test - Send test message to configured webhook
 */
router.post('/slack/test', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;

    const { data: config, error: configError } = await supabaseAdmin
      .from('slack_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !config) {
      res.status(404).json({
        error: 'No Slack integration configured. Configure one first.',
        code: 'NOT_FOUND',
      });
      return;
    }

    const typedConfig = config as unknown as { webhook_url: string; is_active: boolean };

    if (!typedConfig.is_active) {
      res.status(400).json({
        error: 'Slack integration is inactive',
        code: 'INTEGRATION_INACTIVE',
      });
      return;
    }

    const testMessage = formatSlackMessage('scan.complete', {
      domain: 'example.com',
      score: 73,
      factors_analyzed: 8,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(typedConfig.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        res.json({ success: true, message: 'Test message sent to Slack' });
      } else {
        const body = await response.text().catch(() => '');
        res.status(502).json({
          success: false,
          error: `Slack returned HTTP ${response.status}: ${body}`,
          code: 'SLACK_ERROR',
        });
      }
    } catch (fetchErr) {
      clearTimeout(timeout);
      const message = fetchErr instanceof Error ? fetchErr.message : 'Unknown error';
      res.status(502).json({
        success: false,
        error: `Failed to reach Slack: ${message}`,
        code: 'SLACK_UNREACHABLE',
      });
    }
  } catch (err) {
    console.error('Error sending Slack test:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

// ===========================
// GitHub Action Endpoint
// ===========================

/**
 * POST /api/integrations/github/validate - CI pass/fail validation
 * Body: { url: string, min_score?: number }
 * Returns: { pass: boolean, score: number, min_score: number, factors_failing: number }
 */
router.post('/github/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { url, min_score = 50 } = req.body;

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'url is required', code: 'VALIDATION_ERROR' });
      return;
    }

    // Normalize URL to domain
    let domain: string;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      res.status(400).json({ error: 'Invalid URL', code: 'VALIDATION_ERROR' });
      return;
    }

    const minScoreNum = typeof min_score === 'number' ? min_score : parseInt(min_score as string) || 50;

    // Get the most recent scan for this domain
    const { data: scan, error } = await supabaseAdmin
      .from('scan_results')
      .select('overall_score, factor_scores, created_at')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !scan) {
      // No scan found -- run a quick check or return not-found
      res.status(404).json({
        error: `No scan results found for ${domain}. Run a scan first.`,
        code: 'NOT_FOUND',
      });
      return;
    }

    const typedScan = scan as unknown as {
      overall_score: number;
      factor_scores: Record<string, { score: number }> | null;
      created_at: string;
    };

    const score = typedScan.overall_score ?? 0;

    // Count factors below the minimum
    let factorsFailing = 0;
    if (typedScan.factor_scores) {
      for (const factor of Object.values(typedScan.factor_scores)) {
        if (factor.score < minScoreNum) {
          factorsFailing++;
        }
      }
    }

    const pass = score >= minScoreNum;

    res.json({
      pass,
      score,
      min_score: minScoreNum,
      domain,
      factors_failing: factorsFailing,
      scanned_at: typedScan.created_at,
    });
  } catch (err) {
    console.error('Error in GitHub validate:', err);
    res.status(500).json({ error: 'Internal error', code: 'INTERNAL_ERROR' });
  }
});

// Export the formatSlackMessage function for use by other services (e.g., webhook event handlers)
export { formatSlackMessage };

export default router;
