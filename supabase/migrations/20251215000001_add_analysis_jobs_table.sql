-- Phase 3: Async Job Processing - Analysis Jobs Queue
-- This migration adds the analysis_jobs table for managing background URL analysis processing

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create analysis_jobs table
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  worker_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient job polling and selection
CREATE INDEX idx_analysis_jobs_status ON public.analysis_jobs(status);
CREATE INDEX idx_analysis_jobs_queue ON public.analysis_jobs(status, priority DESC, created_at ASC)
  WHERE status IN ('pending', 'processing');
CREATE INDEX idx_analysis_jobs_user_id ON public.analysis_jobs(user_id);
CREATE INDEX idx_analysis_jobs_analysis_id ON public.analysis_jobs(analysis_id);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_analysis_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analysis_jobs_updated_at
  BEFORE UPDATE ON public.analysis_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_jobs_updated_at();

-- Enable Row Level Security
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own jobs
CREATE POLICY "Users can view their own analysis jobs"
  ON public.analysis_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own jobs
CREATE POLICY "Users can create their own analysis jobs"
  ON public.analysis_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Service role can manage all jobs
CREATE POLICY "Service role can manage all analysis jobs"
  ON public.analysis_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.analysis_jobs IS 'Queue table for managing background URL analysis processing jobs';
COMMENT ON COLUMN public.analysis_jobs.priority IS 'Higher priority jobs are processed first (0 = normal, higher = priority)';
COMMENT ON COLUMN public.analysis_jobs.attempts IS 'Number of processing attempts made for this job';
COMMENT ON COLUMN public.analysis_jobs.max_attempts IS 'Maximum number of attempts before marking job as failed';
COMMENT ON COLUMN public.analysis_jobs.worker_id IS 'Identifier of the worker process that picked up this job';
COMMENT ON COLUMN public.analysis_jobs.started_at IS 'Timestamp when job processing started';
COMMENT ON COLUMN public.analysis_jobs.completed_at IS 'Timestamp when job processing completed (success or failure)';

-- Create RPC function for atomic job claiming
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions
CREATE OR REPLACE FUNCTION public.claim_next_job(worker_id_param TEXT)
RETURNS SETOF public.analysis_jobs AS $$
DECLARE
  claimed_job public.analysis_jobs;
BEGIN
  -- Atomically claim the next pending job (highest priority, oldest first)
  SELECT * INTO claimed_job
  FROM public.analysis_jobs
  WHERE status = 'pending'
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- If job found, update it to processing status with worker assignment
  IF FOUND THEN
    UPDATE public.analysis_jobs
    SET
      status = 'processing',
      worker_id = worker_id_param,
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = claimed_job.id;

    -- Return the updated job
    RETURN QUERY SELECT * FROM public.analysis_jobs WHERE id = claimed_job.id;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.claim_next_job(TEXT) TO service_role;

COMMENT ON FUNCTION public.claim_next_job IS 'Atomically claims the next pending job for processing. Uses FOR UPDATE SKIP LOCKED to prevent race conditions in concurrent worker scenarios.';
