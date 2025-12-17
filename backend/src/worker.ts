/**
 * Background Worker Process
 *
 * Processes queued analysis jobs asynchronously.
 * Features:
 * - Atomic job claiming (safe for multiple workers)
 * - Exponential backoff when queue is empty
 * - Graceful shutdown handling
 * - Comprehensive logging
 */

import { config } from 'dotenv';
config(); // Load environment variables

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from './lib/supabase';
import {
  claimNextJob,
  completeJob,
  failJob,
  releaseStaleJobs,
  getPendingJobCount,
} from './services/jobQueue';
import { analyzeAllFactors, getAnalysisSummary } from './services/analyzer';
import { fetchPageContent, isPuppeteerEnabledForTier } from './services/pageFetcher';
import { closeBrowser } from './services/browserRenderer';
import { Database } from './types/database.types';

// Type aliases
type AnalysisUpdate = Database['public']['Tables']['analyses']['Update'];
type AnalysisFactorInsert = Database['public']['Tables']['analysis_factors']['Insert'];

// Configuration
const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL || '5000', 10);
const MAX_POLL_INTERVAL_MS = 60000; // 1 minute max
const BACKOFF_MULTIPLIER = 1.5;
const STALE_JOB_CHECK_INTERVAL_MS = 60000; // Check for stale jobs every minute
const WORKER_ID = `worker-${uuidv4().slice(0, 8)}`;

let currentPollInterval = POLL_INTERVAL_MS;
let isShuttingDown = false;
let currentJobId: string | null = null;
let lastStaleCheck = 0;

/**
 * Process a single job
 */
async function processJob(): Promise<boolean> {
  try {
    // Periodically check for stale jobs
    const now = Date.now();
    if (now - lastStaleCheck > STALE_JOB_CHECK_INTERVAL_MS) {
      lastStaleCheck = now;
      await releaseStaleJobs(10); // Release jobs processing > 10 minutes
    }

    // Claim next available job
    const job = await claimNextJob(WORKER_ID);

    if (!job) {
      // No jobs available - apply exponential backoff
      currentPollInterval = Math.min(
        currentPollInterval * BACKOFF_MULTIPLIER,
        MAX_POLL_INTERVAL_MS
      );
      return false;
    }

    // Reset poll interval when job found
    currentPollInterval = POLL_INTERVAL_MS;
    currentJobId = job.id;

    const startTime = Date.now();
    console.log(`[Worker ${WORKER_ID}] Processing job ${job.id} for URL: ${job.url}`);

    try {
      // Get user tier for factor access control and Puppeteer eligibility
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('tier, subscription_tier')
        .eq('id', job.user_id)
        .single();

      const user = userData as { tier: string | null; subscription_tier: string | null } | null;
      const userTier = user?.subscription_tier || user?.tier || 'free';

      // Determine if Puppeteer should be used based on tier
      const canUsePuppeteer = isPuppeteerEnabledForTier(userTier);

      // Fetch page content with intelligent CSR detection
      console.log(`[Worker ${WORKER_ID}] Fetching ${job.url} (Puppeteer: ${canUsePuppeteer ? 'enabled' : 'disabled'})`);
      const fetchResult = await fetchPageContent(job.url, {
        skipPuppeteer: !canUsePuppeteer,
      });

      if (!fetchResult.success) {
        throw new Error(fetchResult.error || 'Failed to fetch page content');
      }

      const content = fetchResult.html;
      console.log(
        `[Worker ${WORKER_ID}] Fetched ${job.url} via ${fetchResult.method} ` +
        `(${content.length} bytes, ${fetchResult.fetchTimeMs}ms)`
      );

      // Log CSR detection results if available
      if (fetchResult.csrDetection) {
        console.log(
          `[Worker ${WORKER_ID}] CSR Detection: ${fetchResult.csrDetection.isCSR ? 'CSR' : 'SSR'} ` +
          `(confidence: ${fetchResult.csrDetection.confidence}%)`
        );
      }

      // Run analysis
      const result = await analyzeAllFactors(job.url, content, userTier);

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      const summary = getAnalysisSummary(result);

      // Update analysis record with results using raw SQL to bypass PostgREST schema cache issues
      const roundedScore = Math.round(result.overall_score);

      try {
        // Use raw SQL via RPC to bypass schema cache
        const { error: updateError } = await supabaseAdmin.rpc('update_analysis_score', {
          p_analysis_id: job.analysis_id,
          p_score: roundedScore,
        });

        if (updateError) {
          console.error(`[Worker ${WORKER_ID}] Failed to update analysis via RPC:`, updateError);
          // Fallback: try direct update
          await supabaseAdmin
            .from('analyses')
            .update({ status: 'completed', overall_score: roundedScore } as never)
            .eq('id', job.analysis_id);
        }
      } catch (rpcError) {
        console.error(`[Worker ${WORKER_ID}] RPC call failed:`, rpcError);
        // Fallback: try direct update
        await supabaseAdmin
          .from('analyses')
          .update({ status: 'completed', overall_score: roundedScore } as never)
          .eq('id', job.analysis_id);
      }

      // Store factor results with rounded scores
      const factorInserts: AnalysisFactorInsert[] = result.factors.map(factor => ({
        id: uuidv4(),
        analysis_id: job.analysis_id,
        factor_id: factor.factor_id,
        factor_name: factor.factor_name,
        pillar: factor.pillar,
        score: Math.round(factor.score), // Round to integer for database
        confidence: 80, // Default confidence level
        weight: Math.round(factor.weight * 100) / 100, // Round weight to 2 decimal places
        evidence: factor.evidence, // JSONB column expects array
        recommendations: factor.recommendations, // JSONB column expects array
      }));

      await supabaseAdmin
        .from('analysis_factors')
        .insert(factorInserts as never[]);

      // Increment user's analysis count
      try {
        // @ts-expect-error - RPC function may not be in generated types
        await supabaseAdmin.rpc('increment_analysis_count', { user_id: job.user_id });
      } catch (err) {
        console.error(`[Worker ${WORKER_ID}] Failed to increment analysis count:`, err);
      }

      // Mark job as completed
      await completeJob(job.id);

      const totalTime = Date.now() - startTime;
      console.log(
        `[Worker ${WORKER_ID}] Job ${job.id} completed - Score: ${result.overall_score} ` +
        `(${summary.factorCount} factors, ${totalTime}ms)`
      );

      return true;
    } catch (error) {
      // Job processing failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update analysis record to failed
      await supabaseAdmin
        .from('analyses')
        .update({
          status: 'failed',
        } as never)
        .eq('id', job.analysis_id);

      // Mark job as failed (handles retry logic)
      await failJob(job.id, errorMessage);

      console.error(`[Worker ${WORKER_ID}] Job ${job.id} failed:`, errorMessage);
      return false;
    } finally {
      currentJobId = null;
    }
  } catch (error) {
    // Error claiming job or system error
    console.error(`[Worker ${WORKER_ID}] Error in job processing cycle:`, error);
    return false;
  }
}

/**
 * Main worker loop
 */
async function runWorker(): Promise<void> {
  console.log(`[Worker ${WORKER_ID}] Starting...`);
  console.log(`[Worker ${WORKER_ID}] Poll interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`[Worker ${WORKER_ID}] Max poll interval: ${MAX_POLL_INTERVAL_MS}ms`);

  // Check initial queue status
  const pendingCount = await getPendingJobCount();
  console.log(`[Worker ${WORKER_ID}] Pending jobs in queue: ${pendingCount}`);

  while (!isShuttingDown) {
    await processJob();

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, currentPollInterval));
  }

  console.log(`[Worker ${WORKER_ID}] Shutdown complete`);
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  console.log(`[Worker ${WORKER_ID}] Received ${signal}, starting graceful shutdown...`);
  isShuttingDown = true;

  // Wait for current job to complete (max 60 seconds)
  const shutdownTimeout = setTimeout(() => {
    console.warn(`[Worker ${WORKER_ID}] Shutdown timeout reached, forcing exit`);
    process.exit(1);
  }, 60000);

  // Wait for current job if any
  if (currentJobId) {
    console.log(`[Worker ${WORKER_ID}] Waiting for job ${currentJobId} to complete...`);
    while (currentJobId) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Close browser instance if running
  console.log(`[Worker ${WORKER_ID}] Closing browser...`);
  await closeBrowser();

  clearTimeout(shutdownTimeout);
  console.log(`[Worker ${WORKER_ID}] Graceful shutdown completed`);
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`[Worker ${WORKER_ID}] Uncaught exception:`, error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error(`[Worker ${WORKER_ID}] Unhandled rejection:`, reason);
  shutdown('unhandledRejection');
});

// Start worker
runWorker().catch((error) => {
  console.error(`[Worker ${WORKER_ID}] Worker crashed:`, error);
  process.exit(1);
});
