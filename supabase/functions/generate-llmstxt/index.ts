// generate-llmstxt/index.ts - LLMtxtMastery API Integration
// Proxies requests to LLMtxtMastery API with tier-based access control and usage tracking

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface LLMTxtAnalyzeRequest {
  url: string;
}

interface LLMTxtGenerateRequest {
  analysisId: string;
}

interface LLMTxtAnalyzeResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url: string;
}

interface LLMTxtAnalysisStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface LLMTxtGenerateResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
}

// Constants
const LLMTXT_API_BASE_URL = 'https://llm-txt-mastery-production.up.railway.app';
const ALLOWED_TIERS = ['growth', 'scale'];
const TIER_LIMITS: Record<string, number> = {
  growth: 25, // 25 generations per month
  scale: -1,  // unlimited
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== GENERATE LLMSTXT START ===');

    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for user lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract JWT token from Authorization header
    const jwt = authHeader.replace('Bearer ', '');

    // Verify the JWT and get user
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Get user tier from users table
    const { data: userData, error: userDataError } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('User data error:', userDataError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userTier = (userData.tier || 'free').toLowerCase();
    console.log('User tier:', userTier);

    // Check if user tier is allowed
    if (!ALLOWED_TIERS.includes(userTier)) {
      return new Response(
        JSON.stringify({
          error: 'Upgrade required',
          message: 'LLMs.txt generation is available for Growth and Scale tiers only',
          requiredTier: 'growth',
          currentTier: userTier,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for action and params
    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      // Body may be empty for some requests
    }

    const action = requestBody.action;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Missing action parameter. Valid actions: analyze, status, generate, download, usage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const apiKey = Deno.env.get('LLMTXT_MASTERY_API_KEY');
    if (!apiKey) {
      console.error('LLMTXT_MASTERY_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Route based on action
    switch (action) {
      case 'analyze': {
        // Check usage limits before starting analysis (only for Growth tier)
        if (userTier === 'growth') {
          const usageCheckResult = await checkAndIncrementUsage(
            supabaseAdmin,
            user.id,
            userTier
          );
          if (!usageCheckResult.allowed) {
            return new Response(
              JSON.stringify({
                error: 'Usage limit exceeded',
                message: usageCheckResult.message,
                limit: TIER_LIMITS.growth,
                used: usageCheckResult.used,
                resetDate: usageCheckResult.resetDate,
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const targetUrl = requestBody.url;

        if (!targetUrl || !isValidUrl(targetUrl)) {
          return new Response(
            JSON.stringify({ error: 'Invalid URL provided. Must be a valid http or https URL.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: 'Failed to start analysis', details: 'External service error' }),
            { status: analyzeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const analyzeData = await analyzeResponse.json() as LLMTxtAnalyzeResponse;
        console.log('Analysis started:', analyzeData.id);

        return new Response(JSON.stringify(analyzeData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        const analysisId = requestBody.id;
        if (!analysisId) {
          return new Response(
            JSON.stringify({ error: 'Missing analysis ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: 'Failed to fetch analysis status' }),
            { status: statusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const statusData = await statusResponse.json() as LLMTxtAnalysisStatus;
        return new Response(JSON.stringify(statusData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate': {
        const analysisId = requestBody.analysisId;

        if (!analysisId) {
          return new Response(
            JSON.stringify({ error: 'Missing analysis ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: 'Failed to generate llms.txt' }),
            { status: generateResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const generateData = await generateResponse.json() as LLMTxtGenerateResponse;
        return new Response(JSON.stringify(generateData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'download': {
        const downloadId = requestBody.id;
        if (!downloadId) {
          return new Response(
            JSON.stringify({ error: 'Missing download ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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
          return new Response(
            JSON.stringify({ error: 'Failed to download file' }),
            { status: downloadResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Pass through the file download
        const fileContent = await downloadResponse.text();
        return new Response(fileContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="llms.txt"',
          },
        });
      }

      case 'usage': {
        // Get current usage stats for the user
        const usageStats = await getCurrentUsage(supabaseAdmin, user.id, userTier);
        return new Response(JSON.stringify(usageStats), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Valid actions: analyze, status, generate, download, usage' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in generate-llmstxt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to validate URLs
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Helper function to get current usage stats
async function getCurrentUsage(
  supabase: any,
  userId: string,
  tier: string
): Promise<{ used: number; limit: number; remaining: number; resetDate: string }> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const limit = TIER_LIMITS[tier] || 0;

  // Get current usage for this month
  const { data: usageData, error: usageError } = await supabase
    .from('llmstxt_generations')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lt('created_at', nextMonth.toISOString());

  const used = usageError ? 0 : (usageData?.length || 0);
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    used,
    limit: limit === -1 ? -1 : limit, // -1 means unlimited
    remaining,
    resetDate: nextMonth.toISOString(),
  };
}

// Helper function to check and increment usage for Growth tier
async function checkAndIncrementUsage(
  supabase: any,
  userId: string,
  tier: string
): Promise<{ allowed: boolean; message?: string; used?: number; resetDate?: string }> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const limit = TIER_LIMITS[tier] || 0;

  // Get current usage for this month
  const { data: usageData, error: usageError } = await supabase
    .from('llmstxt_generations')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', firstDayOfMonth.toISOString())
    .lt('created_at', nextMonth.toISOString());

  if (usageError) {
    console.error('Error fetching usage:', usageError);
    // If table doesn't exist, deny — table should exist in production
    if (usageError.code === '42P01') {
      console.error('llmstxt_generations table not found - denying request');
      return { allowed: false, used: 0, message: 'Service temporarily unavailable' };
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
  const { error: insertError } = await supabase
    .from('llmstxt_generations')
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('Error recording usage:', insertError);
    // If table doesn't exist, deny
    if (insertError.code === '42P01') {
      return { allowed: false, used: currentUsage, message: 'Service temporarily unavailable' };
    }
    return { allowed: false, message: 'Error updating usage tracking' };
  }

  return { allowed: true, used: currentUsage + 1 };
}
