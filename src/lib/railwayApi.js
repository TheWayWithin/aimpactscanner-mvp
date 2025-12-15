/**
 * Railway Backend API Service
 *
 * Provides interface to the Railway-hosted analysis backend.
 * Supports both synchronous and asynchronous analysis modes.
 */

import { supabaseFacade as supabase } from './supabaseFacade';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://aimpactscanner-backend-production.up.railway.app';

/**
 * Get auth headers with Supabase JWT token
 */
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated - please sign in');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

/**
 * Run analysis synchronously (waits for completion)
 * Best for: Quick analyses, testing
 *
 * @param {string} url - URL to analyze
 * @param {string} userId - User ID for tracking
 * @param {string} userTier - User's subscription tier
 * @returns {Promise<{success: boolean, overall_score?: number, factors?: Array, error?: string}>}
 */
export async function analyzeSync(url, userId, userTier = 'free') {
  const headers = await getAuthHeaders();

  const response = await fetch(`${RAILWAY_API_URL}/api/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url,
      userId,
      userTier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Analysis failed`);
  }

  return response.json();
}

/**
 * Start asynchronous analysis (returns immediately with job ID)
 * Best for: Production use, handles long-running CSR analyses
 *
 * @param {string} url - URL to analyze
 * @param {string} userId - User ID for tracking
 * @param {string} analysisId - Pre-created analysis record ID
 * @param {string} userTier - User's subscription tier
 * @returns {Promise<{success: boolean, jobId: string, analysisId: string}>}
 */
export async function analyzeAsync(url, userId, analysisId, userTier = 'free') {
  const headers = await getAuthHeaders();

  const response = await fetch(`${RAILWAY_API_URL}/api/analyze/async`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url,
      userId,
      analysisId,
      userTier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to start analysis`);
  }

  return response.json();
}

/**
 * Check status of an async analysis job
 *
 * @param {string} jobId - Job ID returned from analyzeAsync
 * @returns {Promise<{status: string, result?: object, error?: string}>}
 */
export async function getJobStatus(jobId) {
  const headers = await getAuthHeaders();

  const response = await fetch(`${RAILWAY_API_URL}/api/analyze/jobs/${jobId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to get job status`);
  }

  return response.json();
}

/**
 * Poll for job completion with exponential backoff
 *
 * @param {string} jobId - Job ID to poll
 * @param {object} options - Polling options
 * @param {number} options.maxAttempts - Max poll attempts (default: 60)
 * @param {number} options.initialInterval - Initial poll interval ms (default: 1000)
 * @param {number} options.maxInterval - Max poll interval ms (default: 5000)
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
export async function pollJobCompletion(jobId, options = {}) {
  const {
    maxAttempts = 60,
    initialInterval = 1000,
    maxInterval = 5000,
    onProgress = null,
  } = options;

  let attempts = 0;
  let interval = initialInterval;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const status = await getJobStatus(jobId);

      if (onProgress) {
        onProgress({
          attempts,
          status: status.status,
          jobId,
        });
      }

      if (status.status === 'completed') {
        return {
          success: true,
          result: status.result,
        };
      }

      if (status.status === 'failed') {
        return {
          success: false,
          error: status.error || 'Analysis failed',
        };
      }

      // Still processing - wait and try again
      await new Promise(resolve => setTimeout(resolve, interval));
      interval = Math.min(interval * 1.2, maxInterval);
    } catch (error) {
      console.error(`Poll attempt ${attempts} failed:`, error);

      // Don't fail immediately on network errors - retry
      if (attempts >= maxAttempts) {
        return {
          success: false,
          error: error.message || 'Failed to check analysis status',
        };
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  return {
    success: false,
    error: 'Analysis timed out - please try again',
  };
}

/**
 * Run full analysis with async job queue (recommended for production)
 * Creates job, polls for completion, returns results
 *
 * @param {string} url - URL to analyze
 * @param {string} userId - User ID
 * @param {string} analysisId - Pre-created analysis record ID
 * @param {string} userTier - User's subscription tier
 * @param {function} onProgress - Progress callback
 * @returns {Promise<{success: boolean, overall_score?: number, factors?: Array, error?: string}>}
 */
export async function runAnalysis(url, userId, analysisId, userTier = 'free', onProgress = null) {
  // Start async job
  const jobResponse = await analyzeAsync(url, userId, analysisId, userTier);

  if (!jobResponse.success) {
    throw new Error(jobResponse.error || 'Failed to start analysis');
  }

  // Poll for completion
  const result = await pollJobCompletion(jobResponse.jobId, {
    onProgress,
    maxAttempts: 90, // ~3 minutes with backoff
  });

  if (!result.success) {
    throw new Error(result.error || 'Analysis failed');
  }

  return result.result;
}

/**
 * Check if Railway backend should be used
 * Controlled by VITE_USE_RAILWAY_BACKEND env var
 */
export function useRailwayBackend() {
  const envValue = import.meta.env.VITE_USE_RAILWAY_BACKEND;
  const isEnabled = envValue === 'true';

  // Debug logging to help diagnose env var issues
  console.log('🔧 Railway Backend Check:', {
    VITE_USE_RAILWAY_BACKEND: envValue,
    isEnabled,
    RAILWAY_API_URL: import.meta.env.VITE_RAILWAY_API_URL || RAILWAY_API_URL,
  });

  return isEnabled;
}

/**
 * Get the Railway API URL (for debugging)
 */
export function getRailwayApiUrl() {
  return RAILWAY_API_URL;
}
