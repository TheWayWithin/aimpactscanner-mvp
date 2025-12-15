/**
 * Job Queue Service
 *
 * Manages asynchronous processing of website analysis jobs with:
 * - Priority-based job processing
 * - Automatic retry handling with exponential backoff
 * - Safe concurrent job claiming using FOR UPDATE SKIP LOCKED
 * - Worker assignment tracking
 */

import { supabaseAdmin } from '../lib/supabase';
import {
  AnalysisJob,
  AnalysisJobInsert,
  AnalysisJobUpdate,
  JobStatus,
} from '../types/database.types';

const DEFAULT_PRIORITY = 0;
const DEFAULT_MAX_ATTEMPTS = 3;

export interface CreateJobParams {
  userId: string;
  url: string;
  analysisId: string;
  priority?: number;
  maxAttempts?: number;
}

export interface JobQueueError extends Error {
  code?: string;
  details?: unknown;
}

/**
 * Creates a new analysis job in the queue
 */
export async function createJob(params: CreateJobParams): Promise<AnalysisJob> {
  const {
    userId,
    url,
    analysisId,
    priority = DEFAULT_PRIORITY,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
  } = params;

  const jobData: AnalysisJobInsert = {
    user_id: userId,
    analysis_id: analysisId,
    url,
    status: 'pending',
    priority,
    max_attempts: maxAttempts,
  };

  const { data, error } = await supabaseAdmin
    .from('analysis_jobs')
    .insert(jobData as never)
    .select()
    .single();

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to create job: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }

  return data as AnalysisJob;
}

/**
 * Atomically claims the next pending job for processing
 * Uses PostgreSQL FOR UPDATE SKIP LOCKED to prevent race conditions
 *
 * @param workerId Unique identifier for the worker claiming the job
 * @returns Claimed job or null if no jobs available
 */
export async function claimNextJob(workerId: string): Promise<AnalysisJob | null> {
  // @ts-expect-error - RPC function type is defined in database.types.ts but Supabase client may not recognize it
  const { data: jobs, error } = await supabaseAdmin.rpc('claim_next_job', {
    worker_id_param: workerId,
  } as { worker_id_param: string });

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to claim job: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }

  // RPC returns array, get first job
  const jobArray = jobs as AnalysisJob[] | null;
  return jobArray && jobArray.length > 0 ? jobArray[0] : null;
}

/**
 * Updates job status
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  errorMessage?: string
): Promise<void> {
  const updates: AnalysisJobUpdate = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabaseAdmin
    .from('analysis_jobs')
    .update(updates as never)
    .eq('id', jobId);

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to update job status: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }
}

/**
 * Marks job as completed successfully
 */
export async function completeJob(jobId: string): Promise<void> {
  const updates: AnalysisJobUpdate = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('analysis_jobs')
    .update(updates as never)
    .eq('id', jobId);

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to complete job: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }
}

/**
 * Marks job as failed and handles retry logic
 * Automatically resets to pending if under max_attempts
 */
export async function failJob(jobId: string, errorMessage: string): Promise<void> {
  // Get current job to check attempt count
  const { data: job, error: fetchError } = await supabaseAdmin
    .from('analysis_jobs')
    .select('attempts, max_attempts')
    .eq('id', jobId)
    .single();

  if (fetchError) {
    const jobError: JobQueueError = new Error(
      `Failed to fetch job for retry check: ${fetchError.message}`
    );
    jobError.code = fetchError.code;
    jobError.details = fetchError.details;
    throw jobError;
  }

  const jobData = job as { attempts: number; max_attempts: number };
  const newAttemptCount = jobData.attempts + 1;
  const shouldRetry = newAttemptCount < jobData.max_attempts;

  const updates: AnalysisJobUpdate = {
    attempts: newAttemptCount,
    error_message: errorMessage,
    updated_at: new Date().toISOString(),
    worker_id: null, // Release worker assignment
  };

  if (shouldRetry) {
    // Reset to pending for retry
    updates.status = 'pending';
    updates.started_at = null;
    console.log(`[JobQueue] Job ${jobId} failed (attempt ${newAttemptCount}/${jobData.max_attempts}), retrying...`);
  } else {
    // Max attempts reached, mark as permanently failed
    updates.status = 'failed';
    updates.completed_at = new Date().toISOString();
    console.log(`[JobQueue] Job ${jobId} permanently failed after ${newAttemptCount} attempts`);
  }

  const { error: updateError } = await supabaseAdmin
    .from('analysis_jobs')
    .update(updates as never)
    .eq('id', jobId);

  if (updateError) {
    const jobError: JobQueueError = new Error(
      `Failed to update job retry status: ${updateError.message}`
    );
    jobError.code = updateError.code;
    jobError.details = updateError.details;
    throw jobError;
  }
}

/**
 * Gets job by ID
 */
export async function getJobById(jobId: string): Promise<AnalysisJob | null> {
  const { data, error } = await supabaseAdmin
    .from('analysis_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    const jobError: JobQueueError = new Error(
      `Failed to fetch job: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }

  return data as AnalysisJob;
}

/**
 * Gets user's job history
 */
export async function getUserJobs(
  userId: string,
  limit: number = 50
): Promise<AnalysisJob[]> {
  const { data, error } = await supabaseAdmin
    .from('analysis_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to fetch user jobs: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }

  return (data as AnalysisJob[]) || [];
}

/**
 * Gets jobs by status (for monitoring/admin)
 */
export async function getJobsByStatus(
  status: JobStatus,
  limit: number = 100
): Promise<AnalysisJob[]> {
  const { data, error } = await supabaseAdmin
    .from('analysis_jobs')
    .select('*')
    .eq('status', status)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    const jobError: JobQueueError = new Error(
      `Failed to fetch jobs by status: ${error.message}`
    );
    jobError.code = error.code;
    jobError.details = error.details;
    throw jobError;
  }

  return (data as AnalysisJob[]) || [];
}

/**
 * Gets count of pending jobs (for monitoring)
 */
export async function getPendingJobCount(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('analysis_jobs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  if (error) {
    console.error('[JobQueue] Failed to get pending job count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Releases stale jobs that have been processing too long
 * (worker may have crashed)
 */
export async function releaseStaleJobs(
  maxProcessingMinutes: number = 10
): Promise<number> {
  const staleThreshold = new Date(
    Date.now() - maxProcessingMinutes * 60 * 1000
  ).toISOString();

  const { data, error } = await supabaseAdmin
    .from('analysis_jobs')
    .update({
      status: 'pending',
      worker_id: null,
      started_at: null,
      error_message: 'Job released: worker timeout',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('status', 'processing')
    .lt('started_at', staleThreshold)
    .select();

  if (error) {
    console.error('[JobQueue] Failed to release stale jobs:', error);
    return 0;
  }

  const releasedCount = (data as AnalysisJob[])?.length || 0;
  if (releasedCount > 0) {
    console.log(`[JobQueue] Released ${releasedCount} stale jobs`);
  }

  return releasedCount;
}
