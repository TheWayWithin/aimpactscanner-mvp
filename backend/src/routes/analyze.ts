/**
 * Analysis API Routes
 *
 * POST /api/analyze - Analyze a URL for AI-readiness
 *
 * Aligned with existing Edge Function interface for seamless migration
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { createTierRateLimiter } from '../middleware/rate-limit';
import { supabaseAdmin } from '../lib/supabase';
import { analyzeAllFactors, getAnalysisSummary } from '../services/analyzer';
import { createJob, getJobById, getUserJobs } from '../services/jobQueue';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../types/database.types';

// Type aliases for database operations
type AnalysisInsert = Database['public']['Tables']['analyses']['Insert'];
type AnalysisUpdate = Database['public']['Tables']['analyses']['Update'];
type AnalysisRow = Database['public']['Tables']['analyses']['Row'];
type AnalysisProgressInsert = Database['public']['Tables']['analysis_progress']['Insert'];
type AnalysisProgressRow = Database['public']['Tables']['analysis_progress']['Row'];
type AnalysisFactorInsert = Database['public']['Tables']['analysis_factors']['Insert'];
type AnalysisFactorRow = Database['public']['Tables']['analysis_factors']['Row'];

const router = Router();

// Rate limiting applied globally; auth applied per-route
router.use(createTierRateLimiter());

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
 * Update analysis progress in database
 */
async function updateProgress(
  analysisId: string,
  stage: string,
  percent: number,
  message: string,
  educational: string
): Promise<void> {
  try {
    const progressData: AnalysisProgressInsert = {
      analysis_id: analysisId,
      stage,
      progress_percent: percent,
      message,
      educational_content: educational,
      phase: 'instant',
      updated_at: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('analysis_progress')
      .upsert(progressData as never, {
        onConflict: 'analysis_id',
      });
  } catch (error) {
    console.error('Failed to update progress:', error);
  }
}

/**
 * POST /api/analyze
 *
 * Accepts optional analysisId - if provided, updates existing record.
 * If not provided, creates a new record.
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const { url, analysisId: providedAnalysisId, userTier: bodyUserTier } = req.body;
  // Use provided analysisId or generate new one
  const analysisId = providedAnalysisId || uuidv4();
  const startTime = Date.now();

  // Determine auth status early so it's available in catch block
  const isAnonymous = !(req as AuthenticatedRequest).user;
  const userId = (req as AuthenticatedRequest).user?.id || uuidv4();
  const userTier = (req as AuthenticatedRequest).user?.tier || bodyUserTier || 'free';

  try {
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        error: 'URL is required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    if (!isValidUrl(url)) {
      res.status(400).json({
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
        code: 'INVALID_URL',
      });
      return;
    }

    console.log(`[Analysis] Starting analysis for ${url} (user: ${userId}, tier: ${userTier}, analysisId: ${analysisId}, anonymous: ${isAnonymous})`);

    // Only persist to database for authenticated users (anonymous scans skip DB due to FK constraints)
    if (!isAnonymous) {
      // Check if analysis record already exists (frontend may have pre-created it)
      const { data: existingAnalysis } = await supabaseAdmin
        .from('analyses')
        .select('id')
        .eq('id', analysisId)
        .single();

      if (existingAnalysis) {
        // Update existing record to processing status
        const { error: updateError } = await supabaseAdmin
          .from('analyses')
          .update({
            status: 'processing',
            framework_version: '3.1.1',
          } as never)
          .eq('id', analysisId);

        if (updateError) {
          console.error('Failed to update analysis record:', updateError);
          res.status(500).json({
            error: 'Failed to start analysis',
            code: 'DATABASE_ERROR',
          });
          return;
        }
        console.log(`[Analysis] Using existing analysis record: ${analysisId}`);
      } else {
        // Create new analysis record
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
          console.error('Failed to create analysis record:', insertError);
          res.status(500).json({
            error: 'Failed to start analysis',
            code: 'DATABASE_ERROR',
          });
          return;
        }
        console.log(`[Analysis] Created new analysis record: ${analysisId}`);
      }
    } else {
      console.log(`[Analysis] Anonymous scan — skipping database persistence`);
    }

    if (!isAnonymous) {
      await updateProgress(analysisId, 'fetching', 0, 'Fetching page content...', 'The first step is retrieving your page content for analysis.');
    }

    // Fetch page content
    let pageContent: string;
    try {
      const { content, statusCode } = await fetchPageContent(url);
      pageContent = content;
      console.log(`[Analysis] Fetched ${url} (${statusCode}, ${content.length} bytes)`);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';

      if (!isAnonymous) {
        const failedUpdate: AnalysisUpdate = {
          status: 'failed',
        };

        await supabaseAdmin
          .from('analyses')
          .update(failedUpdate as never)
          .eq('id', analysisId);
      }

      res.status(422).json({
        error: `Failed to fetch page: ${errorMessage}`,
        code: 'FETCH_ERROR',
        details: 'Make sure the URL is accessible and returns valid HTML content.',
      });
      return;
    }

    // Progress callback (only persist for authenticated users)
    const progressCallback = async (
      stage: string,
      percent: number,
      message: string,
      educational: string
    ) => {
      if (!isAnonymous) {
        await updateProgress(analysisId, stage, percent, message, educational);
      }
    };

    // Run analysis
    const result = await analyzeAllFactors(url, pageContent, userTier, progressCallback);

    if (!result.success) {
      if (!isAnonymous) {
        const failedUpdate: AnalysisUpdate = {
          status: 'failed',
        };

        await supabaseAdmin
          .from('analyses')
          .update(failedUpdate as never)
          .eq('id', analysisId);
      }

      res.status(500).json({
        error: result.error || 'Analysis failed',
        code: 'ANALYSIS_ERROR',
      });
      return;
    }

    const summary = getAnalysisSummary(result);

    // Only persist results to database for authenticated users
    if (!isAnonymous) {
      const roundedScore = Math.round(result.overall_score);

      try {
        // Use raw SQL via RPC to bypass schema cache
        // @ts-expect-error - Custom RPC function not in generated types
        const { error: updateError } = await supabaseAdmin.rpc('update_analysis_score', {
          p_analysis_id: analysisId,
          p_score: roundedScore,
        });

        if (updateError) {
          console.error('Failed to update analysis via RPC:', updateError);
          const { error: fallbackError } = await supabaseAdmin
            .from('analyses')
            .update({ status: 'completed', overall_score: roundedScore } as never)
            .eq('id', analysisId);

          if (fallbackError) {
            console.error('Fallback update also failed:', fallbackError);
          }
        }
      } catch (rpcError) {
        console.error('RPC call failed:', rpcError);
        const { error: fallbackError } = await supabaseAdmin
          .from('analyses')
          .update({ status: 'completed', overall_score: roundedScore } as never)
          .eq('id', analysisId);

        if (fallbackError) {
          console.error('Fallback update also failed:', fallbackError);
        }
      }

      // Store factor results with rounded scores
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
        console.error('Failed to store factor results:', factorError);
      }

      // Increment user's analysis count (ignore errors)
      try {
        // @ts-expect-error - RPC function may not be in generated types
        await supabaseAdmin.rpc('increment_analysis_count', { user_id: userId });
      } catch (err) {
        console.error('Failed to increment analysis count:', err);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Analysis] Completed ${url} - Score: ${result.overall_score} (${totalTime}ms)`);

    res.json({
      id: analysisId,
      url,
      overall_score: result.overall_score,
      grade: summary.grade,
      factor_count: summary.factorCount,
      factors: result.factors,
      pillars: summary.pillarBreakdown,
      top_issues: summary.topIssues,
      processing_time_ms: totalTime,
      success: true,
    });
  } catch (error) {
    console.error('[Analysis] Unexpected error:', error);

    if (!isAnonymous) {
      try {
        const failedUpdate: AnalysisUpdate = {
          status: 'failed',
        };
        await supabaseAdmin
          .from('analyses')
          .update(failedUpdate as never)
          .eq('id', analysisId);
      } catch {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/analyze/:id
 */
router.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const { data, error: analysisError } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', authReq.user.id)
      .single();

    const analysis = data as AnalysisRow | null;

    if (analysisError || !analysis) {
      res.status(404).json({
        error: 'Analysis not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const { data: factorData, error: factorsError } = await supabaseAdmin
      .from('analysis_factors')
      .select('*')
      .eq('analysis_id', id);

    const factors = factorData as AnalysisFactorRow[] | null;

    if (factorsError) {
      console.error('Failed to fetch factors:', factorsError);
    }

    res.json({
      id: analysis.id,
      url: analysis.url,
      overall_score: analysis.overall_score,
      status: analysis.status,
      created_at: analysis.created_at,
      completed_at: analysis.completed_at,
      factors: factors || [],
    });
  } catch (error) {
    console.error('[Analysis] Error fetching analysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/analyze/async
 * Queue an analysis job for background processing
 */
router.post('/async', optionalAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { url, priority, userTier: bodyUserTier } = req.body;
  const analysisId = uuidv4();

  try {
    if (!url || typeof url !== 'string') {
      res.status(400).json({
        error: 'URL is required',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    if (!isValidUrl(url)) {
      res.status(400).json({
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.',
        code: 'INVALID_URL',
      });
      return;
    }

    // Support authenticated and anonymous users
    // Always use a valid UUID for user_id (database column is UUID type)
    const userId = authReq.user?.id || uuidv4();
    const userTier = authReq.user?.tier || bodyUserTier || 'free';

    // Determine priority based on tier (higher tier = higher priority)
    // Scale/enterprise get priority 10, growth/professional get 5, others get 0
    const tierStr = String(userTier);
    const jobPriority = priority ?? (
      (tierStr === 'scale' || tierStr === 'enterprise') ? 10 :
      (tierStr === 'growth' || tierStr === 'professional') ? 5 : 0
    );

    console.log(`[Analysis] Queueing async analysis for ${url} (user: ${userId}, tier: ${userTier}, priority: ${jobPriority})`);

    // Create analysis record first
    const analysisInsert: AnalysisInsert = {
      id: analysisId,
      user_id: userId,
      url,
      status: 'pending',
      framework_version: '3.1.1',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabaseAdmin
      .from('analyses')
      .insert(analysisInsert as never);

    if (insertError) {
      console.error('Failed to create analysis record:', insertError);
      res.status(500).json({
        error: 'Failed to queue analysis',
        code: 'DATABASE_ERROR',
      });
      return;
    }

    // Create job in queue
    const job = await createJob({
      userId,
      url,
      analysisId,
      priority: jobPriority,
    });

    console.log(`[Analysis] Job ${job.id} created for analysis ${analysisId}`);

    res.status(202).json({
      job_id: job.id,
      analysis_id: analysisId,
      url,
      status: 'pending',
      message: 'Analysis queued for processing',
      success: true,
    });
  } catch (error) {
    console.error('[Analysis] Failed to queue job:', error);

    // Cleanup analysis record if job creation failed
    try {
      await supabaseAdmin
        .from('analyses')
        .delete()
        .eq('id', analysisId);
    } catch {
      // Ignore cleanup errors
    }

    res.status(500).json({
      error: 'Failed to queue analysis',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/analyze/jobs
 * Get user's job history
 */
router.get('/jobs', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  try {
    const jobs = await getUserJobs(authReq.user.id, limit);

    res.json({
      jobs: jobs.map(job => ({
        id: job.id,
        analysis_id: job.analysis_id,
        url: job.url,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        error_message: job.error_message,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
      })),
      count: jobs.length,
    });
  } catch (error) {
    console.error('[Analysis] Error fetching jobs:', error);
    res.status(500).json({
      error: 'Failed to retrieve jobs',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/analyze/jobs/:jobId
 * Get specific job status
 */
router.get('/jobs/:jobId', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { jobId } = req.params;

  try {
    const job = await getJobById(jobId);

    if (!job || job.user_id !== authReq.user.id) {
      res.status(404).json({
        error: 'Job not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // If job is completed, include analysis results
    let analysisResult: {
      id: string;
      url: string;
      overall_score: number | null;
      status: string;
      factors: AnalysisFactorRow[];
    } | null = null;

    if (job.status === 'completed') {
      const { data: analysisData } = await supabaseAdmin
        .from('analyses')
        .select('*')
        .eq('id', job.analysis_id)
        .single();

      const analysis = analysisData as AnalysisRow | null;

      const { data: factorData } = await supabaseAdmin
        .from('analysis_factors')
        .select('*')
        .eq('analysis_id', job.analysis_id);

      const factors = factorData as AnalysisFactorRow[] | null;

      if (analysis) {
        analysisResult = {
          id: analysis.id,
          url: analysis.url,
          overall_score: analysis.overall_score,
          status: analysis.status,
          factors: factors || [],
        };
      }
    }

    res.json({
      id: job.id,
      analysis_id: job.analysis_id,
      url: job.url,
      status: job.status,
      priority: job.priority,
      attempts: job.attempts,
      max_attempts: job.max_attempts,
      error_message: job.error_message,
      worker_id: job.worker_id,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('[Analysis] Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to retrieve job',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/analyze/progress/:id
 */
router.get('/progress/:id', authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const { data } = await supabaseAdmin
      .from('analyses')
      .select('user_id, status')
      .eq('id', id)
      .single();

    const analysis = data as { user_id: string; status: string } | null;

    if (!analysis || analysis.user_id !== authReq.user.id) {
      res.status(404).json({
        error: 'Analysis not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const { data: progressData, error: progressError } = await supabaseAdmin
      .from('analysis_progress')
      .select('*')
      .eq('analysis_id', id)
      .single();

    const progress = progressData as AnalysisProgressRow | null;

    if (progressError || !progress) {
      res.json({
        analysis_id: id,
        status: analysis.status,
        progress_percent: 0,
        stage: 'pending',
        message: 'Analysis starting...',
      });
      return;
    }

    res.json({
      analysis_id: id,
      status: analysis.status,
      progress_percent: progress.progress_percent,
      stage: progress.stage,
      message: progress.message,
      educational_content: progress.educational_content,
    });
  } catch (error) {
    console.error('[Analysis] Error fetching progress:', error);
    res.status(500).json({
      error: 'Failed to retrieve progress',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
