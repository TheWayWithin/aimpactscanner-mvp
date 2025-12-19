/**
 * LLMs.txt Generation Routes
 *
 * Proxies requests to LLMtxtMastery API with tier-based access control and usage tracking.
 * Ported from Supabase Edge Function to Railway Node.js.
 */

import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

// Type for user data from database
interface UserData {
  tier: string | null;
  subscription_tier: string | null;
}

const router = Router();

// Apply authentication middleware
router.use(authenticateUser);

// Constants
const LLMTXT_API_BASE_URL = 'https://llm-txt-mastery-production.up.railway.app';
const ALLOWED_TIERS = ['growth', 'scale'];
const TIER_LIMITS: Record<string, number> = {
  growth: 25, // 25 generations per month
  scale: -1,  // unlimited
};

// Types
interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

interface UsageCheckResult {
  allowed: boolean;
  message?: string;
  used?: number;
  resetDate?: string;
}

/**
 * Get current usage stats for a user
 */
async function getCurrentUsage(userId: string, tier: string): Promise<UsageStats> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limit = TIER_LIMITS[tier] || 0;

  const { data: usageData, error: usageError } = await supabaseAdmin
    .from('llmstxt_generations')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lt('created_at', nextMonth.toISOString());

  const used = usageError ? 0 : (usageData?.length || 0);
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    used,
    limit: limit === -1 ? -1 : limit,
    remaining,
    resetDate: nextMonth.toISOString(),
  };
}

/**
 * Check and increment usage for Growth tier
 */
async function checkAndIncrementUsage(userId: string, tier: string): Promise<UsageCheckResult> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limit = TIER_LIMITS[tier] || 0;

  const { data: usageData, error: usageError } = await supabaseAdmin
    .from('llmstxt_generations')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lt('created_at', nextMonth.toISOString());

  if (usageError) {
    console.error('Error fetching usage:', usageError);
    // If table doesn't exist yet, allow the request (graceful degradation)
    if (usageError.code === '42P01') {
      console.log('llmstxt_generations table not found - allowing request');
      return { allowed: true, used: 0 };
    }
    return { allowed: false, message: 'Error checking usage limits' };
  }

  const currentUsage = usageData?.length || 0;

  if (currentUsage >= limit) {
    return {
      allowed: false,
      message: `Monthly limit of ${limit} generations reached. Upgrade to Scale for unlimited generations.`,
      used: currentUsage,
      resetDate: nextMonth.toISOString(),
    };
  }

  // Record the generation (usage tracking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabaseAdmin as any)
    .from('llmstxt_generations')
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('Error recording usage:', insertError);
    if (insertError.code === '42P01') {
      return { allowed: true, used: currentUsage };
    }
    return { allowed: false, message: 'Error updating usage tracking' };
  }

  return { allowed: true, used: currentUsage + 1 };
}

/**
 * Validate URL format
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Main LLMs.txt endpoint
 * POST /api/llmstxt
 * Body: { action: 'analyze' | 'status' | 'generate' | 'download' | 'usage', ...params }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('=== GENERATE LLMSTXT START ===');

    // User should be attached by auth middleware
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('Authenticated user:', user.id);

    // Get user tier from users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData, error: userDataError } = await (supabaseAdmin as any)
      .from('users')
      .select('tier, subscription_tier')
      .eq('id', user.id)
      .single() as { data: UserData | null; error: unknown };

    if (userDataError || !userData) {
      console.error('User data error:', userDataError);
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }

    const userTier = (userData.subscription_tier || userData.tier || 'free').toLowerCase();
    console.log('User tier:', userTier);

    // Check if user tier is allowed
    if (!ALLOWED_TIERS.includes(userTier)) {
      return res.status(403).json({
        error: 'Upgrade required',
        message: 'LLMs.txt generation is available for Growth and Scale tiers only',
        requiredTier: 'growth',
        currentTier: userTier,
      });
    }

    const { action } = req.body;

    if (!action) {
      return res.status(400).json({
        error: 'Missing action parameter. Valid actions: analyze, status, generate, download, usage',
      });
    }

    // Get API key
    const apiKey = process.env.LLMTXT_MASTERY_API_KEY;
    if (!apiKey) {
      console.error('LLMTXT_MASTERY_API_KEY not configured');
      return res.status(500).json({ error: 'Service configuration error' });
    }

    // Route based on action
    switch (action) {
      case 'analyze': {
        // Check usage limits before starting analysis (only for Growth tier)
        if (userTier === 'growth') {
          const usageCheckResult = await checkAndIncrementUsage(user.id, userTier);
          if (!usageCheckResult.allowed) {
            return res.status(429).json({
              error: 'Usage limit exceeded',
              message: usageCheckResult.message,
              limit: TIER_LIMITS.growth,
              used: usageCheckResult.used,
              resetDate: usageCheckResult.resetDate,
            });
          }
        }

        const targetUrl = req.body.url;

        if (!targetUrl || !isValidUrl(targetUrl)) {
          return res.status(400).json({
            error: 'Invalid URL provided. Must be a valid http or https URL.',
          });
        }

        console.log('Starting analysis for URL:', targetUrl);

        const analyzeResponse = await fetch(`${LLMTXT_API_BASE_URL}/api/v1/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (!analyzeResponse.ok) {
          const errorText = await analyzeResponse.text();
          console.error('LLMtxtMastery API error:', errorText);
          return res.status(analyzeResponse.status).json({
            error: 'Failed to start analysis',
            details: 'External service error',
          });
        }

        const analyzeData = await analyzeResponse.json() as { id?: string; analysis?: { id: string } };
        // Handle nested response: { analysis: { id: ... } } or { id: ... }
        const analysisId = analyzeData?.analysis?.id || analyzeData?.id;
        console.log('Analysis started:', analysisId, 'Full response:', JSON.stringify(analyzeData));

        return res.json(analyzeData);
      }

      case 'status': {
        const analysisId = req.body.id;
        if (!analysisId) {
          return res.status(400).json({ error: 'Missing analysis ID' });
        }

        console.log('Checking status for analysis:', analysisId);

        const statusResponse = await fetch(
          `${LLMTXT_API_BASE_URL}/api/v1/analysis/${analysisId}`,
          {
            headers: {
              'X-API-Key': apiKey,
            },
          }
        );

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.error(`Status check failed for ${analysisId}:`, statusResponse.status, errorText);
          return res.status(statusResponse.status).json({
            error: 'Failed to fetch analysis status',
            details: errorText,
          });
        }

        const statusData = await statusResponse.json() as { status?: string; analysis?: { status: string; error?: string } };
        // Log details when analysis fails
        const status = statusData?.status || statusData?.analysis?.status;
        if (status === 'failed') {
          console.error(`Analysis ${analysisId} failed:`, JSON.stringify(statusData));
        }
        return res.json(statusData);
      }

      case 'generate': {
        const analysisId = req.body.analysisId;

        if (!analysisId) {
          return res.status(400).json({ error: 'Missing analysis ID' });
        }

        console.log('Generating llms.txt for analysis:', analysisId);

        const generateResponse = await fetch(`${LLMTXT_API_BASE_URL}/api/v1/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({ analysisId }),
        });

        if (!generateResponse.ok) {
          return res.status(generateResponse.status).json({
            error: 'Failed to generate llms.txt',
          });
        }

        const generateData = await generateResponse.json();
        return res.json(generateData);
      }

      case 'download': {
        const downloadId = req.body.id;
        if (!downloadId) {
          return res.status(400).json({ error: 'Missing download ID' });
        }

        console.log('Downloading file:', downloadId);

        const downloadResponse = await fetch(
          `${LLMTXT_API_BASE_URL}/api/v1/download/${downloadId}`,
          {
            headers: {
              'X-API-Key': apiKey,
            },
          }
        );

        if (!downloadResponse.ok) {
          return res.status(downloadResponse.status).json({
            error: 'Failed to download file',
          });
        }

        const fileContent = await downloadResponse.text();
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="llms.txt"');
        return res.send(fileContent);
      }

      case 'usage': {
        const usageStats = await getCurrentUsage(user.id, userTier);
        return res.json(usageStats);
      }

      default:
        return res.status(400).json({
          error: 'Invalid action. Valid actions: analyze, status, generate, download, usage',
        });
    }
  } catch (error) {
    console.error('Error in llmstxt route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
