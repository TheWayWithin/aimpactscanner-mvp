/**
 * Database Types
 *
 * Aligned with existing Supabase schema from architecture.md
 *
 * To regenerate:
 * npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Subscription tier types - aligned with tierUtils.js
 *
 * Note: The database may contain legacy tier names:
 * - 'professional' -> mapped to 'growth'
 * - 'enterprise' -> mapped to 'scale'
 */
export type SubscriptionTier = 'free' | 'coffee' | 'growth' | 'scale';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'pending' | 'expired';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          tier: string | null;
          subscription_tier: string | null;
          stripe_customer_id: string | null;
          subscription_id: string | null;
          subscription_status: string | null;
          analyses_used_this_month: number;
          monthly_limit: number;
          is_first_login: boolean;
          tier_refresh_needed: boolean;
          tier_expires_at: string | null;
          // LLMs.txt usage tracking (Sprint 1)
          llmstxt_generations_this_month: number;
          llmstxt_monthly_limit: number;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          tier?: string | null;
          subscription_tier?: string | null;
          stripe_customer_id?: string | null;
          subscription_id?: string | null;
          subscription_status?: string | null;
          analyses_used_this_month?: number;
          monthly_limit?: number;
          is_first_login?: boolean;
          tier_refresh_needed?: boolean;
          tier_expires_at?: string | null;
          llmstxt_generations_this_month?: number;
          llmstxt_monthly_limit?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          tier?: string | null;
          subscription_tier?: string | null;
          stripe_customer_id?: string | null;
          subscription_id?: string | null;
          subscription_status?: string | null;
          analyses_used_this_month?: number;
          monthly_limit?: number;
          is_first_login?: boolean;
          tier_refresh_needed?: boolean;
          tier_expires_at?: string | null;
          llmstxt_generations_this_month?: number;
          llmstxt_monthly_limit?: number;
        };
      };
      analyses: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          status: string;
          overall_score: number | null;
          created_at: string;
          completed_at: string | null;
          framework_version: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          status?: string;
          overall_score?: number | null;
          created_at?: string;
          completed_at?: string | null;
          framework_version?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          url?: string;
          status?: string;
          overall_score?: number | null;
          created_at?: string;
          completed_at?: string | null;
          framework_version?: string;
        };
      };
      analysis_progress: {
        Row: {
          id: string;
          analysis_id: string;
          progress_percent: number;
          stage: string | null;
          message: string | null;
          educational_content: string | null;
          phase: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          progress_percent?: number;
          stage?: string | null;
          message?: string | null;
          educational_content?: string | null;
          phase?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          progress_percent?: number;
          stage?: string | null;
          message?: string | null;
          educational_content?: string | null;
          phase?: string;
          updated_at?: string;
        };
      };
      analysis_factors: {
        Row: {
          id: string;
          analysis_id: string;
          factor_id: string;
          factor_name: string;
          pillar: string;
          score: number;
          reasoning: string | null;
          recommendations: string | null;
          weight: number;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          factor_id: string;
          factor_name: string;
          pillar: string;
          score: number;
          reasoning?: string | null;
          recommendations?: string | null;
          weight?: number;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          factor_id?: string;
          factor_name?: string;
          pillar?: string;
          score?: number;
          reasoning?: string | null;
          recommendations?: string | null;
          weight?: number;
        };
      };
      analysis_jobs: {
        Row: {
          id: string;
          analysis_id: string;
          user_id: string;
          url: string;
          status: JobStatus;
          priority: number;
          attempts: number;
          max_attempts: number;
          error_message: string | null;
          worker_id: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          analysis_id: string;
          user_id: string;
          url: string;
          status?: JobStatus;
          priority?: number;
          attempts?: number;
          max_attempts?: number;
          error_message?: string | null;
          worker_id?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          analysis_id?: string;
          user_id?: string;
          url?: string;
          status?: JobStatus;
          priority?: number;
          attempts?: number;
          max_attempts?: number;
          error_message?: string | null;
          worker_id?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_actual_user_tier: {
        Args: { user_id: string };
        Returns: {
          actual_tier: string;
          subscription_status: string;
          has_active_subscription: boolean;
          stripe_subscription_id: string | null;
        }[];
      };
      increment_analysis_count: {
        Args: { user_id: string };
        Returns: void;
      };
      claim_next_job: {
        Args: { worker_id_param: string };
        Returns: Database['public']['Tables']['analysis_jobs']['Row'][];
      };
    };
    Enums: Record<string, never>;
  };
}

/**
 * Helper types for easier usage
 * Aligned with existing data models from architecture.md
 */
export type User = Database['public']['Tables']['users']['Row'];
export type Analysis = Database['public']['Tables']['analyses']['Row'];
export type AnalysisProgress = Database['public']['Tables']['analysis_progress']['Row'];
export type AnalysisFactor = Database['public']['Tables']['analysis_factors']['Row'];
export type AnalysisJob = Database['public']['Tables']['analysis_jobs']['Row'];
export type AnalysisJobInsert = Database['public']['Tables']['analysis_jobs']['Insert'];
export type AnalysisJobUpdate = Database['public']['Tables']['analysis_jobs']['Update'];

/**
 * Factor result interface - aligned with existing Edge Function FactorResult
 */
export interface FactorResult {
  factor_id: string;
  factor_name: string;
  pillar: string;
  phase: 'instant' | 'background';
  score: number;
  confidence: number;
  weight: number;
  evidence: string[];
  recommendations: string[];
  processing_time_ms: number;
  cache_hit?: boolean;
}

/**
 * Analysis result interface - aligned with existing Edge Function AnalysisResult
 */
export interface AnalysisResult {
  factors: FactorResult[];
  overall_score: number;
  processing_time_ms: number;
  success: boolean;
  error?: string;
}
