/**
 * Analysis Engine Types
 * 
 * Aligned with MASTERY-AI Framework v3.1.1
 * Ported from Supabase Edge Function
 */

export type FactorPhase = 'instant' | 'background';
export type FactorSeverity = 'blocker' | 'warning' | 'info' | 'ok';

export interface FactorResult {
  factor_id: string;
  factor_name: string;
  pillar: string;
  phase: FactorPhase;
  score: number;
  confidence: number;
  weight: number;
  evidence: string[];
  recommendations: string[];
  processing_time_ms: number;
  severity?: FactorSeverity;
}

export interface AnalysisResult {
  factors: FactorResult[];
  overall_score: number;
  processing_time_ms: number;
  success: boolean;
  error?: string;
}

export interface PageData {
  title: string;
  metaDescription: string;
  content: string;
}

export interface PillarData {
  score: number;
  weight: number;
  factors: number;
  totalWeight: number;
  name: string;
}

export interface AnalysisProgress {
  stage: string;
  percent: number;
  message: string;
  educational: string;
}

export type ProgressCallback = (
  stage: string,
  percent: number,
  message: string,
  educational: string
) => Promise<void>;

/**
 * MASTERY-AI Framework Pillars
 * - M: Machine Readability & Technical Infrastructure
 * - A: Authority & Trust Signals
 * - S: Semantic Content Quality
 * - T: Topical Expertise & Experience
 * - E: Engagement & User Experience
 * - R: Reference Networks & Citations
 * - Y: Yield Optimization & Freshness
 * - AI: AI Response Optimization & Citation
 * - P: Performance & Speed
 * - TS: Traditional SEO
 */
export const PILLAR_WEIGHTS: Record<string, { weight: number; name: string }> = {
  AI: { weight: 23.8, name: "AI Response Optimization & Citation" },
  A: { weight: 17.9, name: "Authority & Trust Signals" },
  M: { weight: 14.6, name: "Machine Readability & Technical Infrastructure" },
  S: { weight: 13.9, name: "Semantic Content Quality" },
  E: { weight: 10.9, name: "Engagement & User Experience" },
  T: { weight: 8.9, name: "Topical Expertise & Experience" },
  R: { weight: 5.9, name: "Reference Networks & Citations" },
  Y: { weight: 4.1, name: "Yield Optimization & Freshness" },
  P: { weight: 7.5, name: "Performance & Speed" },
  TS: { weight: 7.0, name: "Traditional SEO" }
};

/**
 * Get severity level based on score and factor type
 */
export function getSeverity(
  score: number,
  factorType: 'indexability' | 'mobile' | 'speed' | 'links' | 'sitemap' | 'canonical' | 'internal-links' | 'duplicate-versions' | 'robots-txt' | 'default'
): FactorSeverity {
  switch (factorType) {
    case 'indexability':
      if (score < 50) return 'blocker';
      if (score < 90) return 'warning';
      return 'ok';
    case 'mobile':
      if (score < 60) return 'warning';
      if (score < 85) return 'info';
      return 'ok';
    case 'speed':
      if (score < 50) return 'warning';
      if (score < 75) return 'info';
      return 'ok';
    case 'links':
      if (score < 70) return 'warning';
      if (score < 90) return 'info';
      return 'ok';
    case 'sitemap':
      if (score < 60) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'canonical':
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'internal-links':
      if (score < 40) return 'warning';
      if (score < 70) return 'info';
      return 'ok';
    case 'duplicate-versions':
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'robots-txt':
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    default:
      if (score < 40) return 'warning';
      if (score < 70) return 'info';
      return 'ok';
  }
}
