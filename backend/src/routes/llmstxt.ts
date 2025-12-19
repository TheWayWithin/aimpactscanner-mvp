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

// Tier-based page limits for LLMtxtMastery API v1.2.0
const TIER_MAX_PAGES: Record<string, number> = {
  growth: 500,
  scale: 1000,
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
        const force = req.body.force; // Optional: bypass cache

        if (!targetUrl || !isValidUrl(targetUrl)) {
          return res.status(400).json({
            error: 'Invalid URL provided. Must be a valid http or https URL.',
          });
        }

        console.log('Starting analysis for URL:', targetUrl);

        // Build v1.2.0 API options with tier-based features
        const maxPages = TIER_MAX_PAGES[userTier] || 500;
        const enableJsRendering = userTier === 'scale'; // JS rendering only for Scale tier

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const analyzeOptions: any = {
          maxPages,
          userTier,
          userId: user.id, // For per-user quota tracking
        };

        // Only enable JS rendering for Scale tier
        if (enableJsRendering) {
          analyzeOptions.renderJs = true;
        }

        // Add force option if provided
        if (force !== undefined) {
          analyzeOptions.force = force;
        }

        console.log('LLMtxtMastery API options:', JSON.stringify(analyzeOptions));

        const analyzeResponse = await fetch(`${LLMTXT_API_BASE_URL}/api/v1/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            url: targetUrl,
            options: analyzeOptions,
          }),
        });

        if (!analyzeResponse.ok) {
          // Try to parse JSON error response for v1.2.0 error codes
          let errorCode: string | null = null;
          let errorMessage = 'External service error';

          try {
            const errorJson = await analyzeResponse.json() as { code?: string; error?: string; message?: string };
            errorCode = errorJson.code || null;
            errorMessage = errorJson.error || errorJson.message || errorMessage;
          } catch {
            errorMessage = await analyzeResponse.text();
          }

          console.error('LLMtxtMastery API error:', { status: analyzeResponse.status, errorCode, errorMessage });

          // Handle v1.2.0 specific error codes
          if (errorCode === 'JS_RENDER_NOT_AVAILABLE') {
            return res.status(403).json({
              error: 'JavaScript rendering not available',
              message: 'JavaScript rendering for SPA/CSR sites is only available for Scale tier subscribers. Upgrade to Scale to analyze React, Vue, and other JavaScript-heavy sites.',
              code: errorCode,
              requiredTier: 'scale',
              currentTier: userTier,
            });
          }

          if (errorCode === 'JS_RENDER_QUOTA_EXCEEDED') {
            return res.status(429).json({
              error: 'JS rendering quota exceeded',
              message: 'You have used all 100 JavaScript rendering requests for this month. Your quota resets on the 1st of next month.',
              code: errorCode,
            });
          }

          return res.status(analyzeResponse.status).json({
            error: 'Failed to start analysis',
            details: errorMessage,
            ...(errorCode && { code: errorCode }),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const analyzeData = await analyzeResponse.json() as any;
        // Handle nested response: { analysis: { id: ... } } or { id: ... }
        const analysisId = analyzeData?.analysis?.id || analyzeData?.id;
        console.log('Analysis started:', analysisId, 'Full response:', JSON.stringify(analyzeData));

        // Build enhanced response with v1.2.0 fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = { ...analyzeData };

        // Forward tierInfo if present in the response
        if (analyzeData?.analysis?.tierInfo) {
          response.tierInfo = analyzeData.analysis.tierInfo;
        }

        // Forward jsRenderQuota for Scale tier users if present
        if (userTier === 'scale' && analyzeData?.analysis?.jsRenderQuota) {
          response.jsRenderQuota = analyzeData.analysis.jsRenderQuota;
        }

        return res.json(response);
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

      case 'validate': {
        // Validate an existing llms.txt file at a URL
        // Available for Growth+ tiers
        const targetUrl = req.body.url;
        const fileType = req.body.fileType || 'auto'; // auto, llms.txt, llms-full.txt, .well-known, llms.md
        const includeRobotsTxt = req.body.includeRobotsTxt !== false; // Default true
        const bustCache = req.body.bustCache || false;

        if (!targetUrl || !isValidUrl(targetUrl)) {
          return res.status(400).json({
            error: 'Invalid URL provided. Must be a valid http or https URL.',
          });
        }

        console.log('Validating llms.txt for URL:', targetUrl);

        const validateResponse = await fetch(`${LLMTXT_API_BASE_URL}/api/validate-llms-txt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            url: targetUrl,
            fileType,
            includeRobotsTxt,
            bustCache,
          }),
        });

        if (!validateResponse.ok) {
          const errorText = await validateResponse.text();
          console.error('LLMs.txt validation API error:', errorText);
          return res.status(validateResponse.status).json({
            error: 'Failed to validate llms.txt',
            details: errorText,
          });
        }

        const validateData = await validateResponse.json();
        return res.json(validateData);
      }

      case 'batch-validate': {
        // Batch validate all llms.txt locations for a URL
        // Available only for Scale tier
        if (userTier !== 'scale') {
          return res.status(403).json({
            error: 'Upgrade required',
            message: 'Batch validation is only available for Scale tier subscribers.',
            requiredTier: 'scale',
            currentTier: userTier,
          });
        }

        const targetUrl = req.body.url;
        const includeRobotsTxt = req.body.includeRobotsTxt !== false; // Default true

        if (!targetUrl || !isValidUrl(targetUrl)) {
          return res.status(400).json({
            error: 'Invalid URL provided. Must be a valid http or https URL.',
          });
        }

        console.log('Batch validating llms.txt locations for URL:', targetUrl);

        const batchValidateResponse = await fetch(`${LLMTXT_API_BASE_URL}/api/batch-validate-llms-txt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            url: targetUrl,
            includeRobotsTxt,
          }),
        });

        if (!batchValidateResponse.ok) {
          const errorText = await batchValidateResponse.text();
          console.error('LLMs.txt batch validation API error:', errorText);
          return res.status(batchValidateResponse.status).json({
            error: 'Failed to batch validate llms.txt',
            details: errorText,
          });
        }

        const batchValidateData = await batchValidateResponse.json();
        return res.json(batchValidateData);
      }

      default:
        return res.status(400).json({
          error: 'Invalid action. Valid actions: analyze, status, generate, download, usage, validate, batch-validate',
        });
    }
  } catch (error) {
    console.error('Error in llmstxt route:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
