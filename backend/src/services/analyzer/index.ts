/**
 * Analysis Engine Orchestrator
 *
 * MASTERY-AI Framework v3.1.1 - 27 Factor Analysis
 * Ported from Supabase Edge Function to Node.js
 *
 * This orchestrator runs all 27 factors and calculates
 * the overall AI-readiness score.
 */

import { FactorResult, AnalysisResult, PILLAR_WEIGHTS, PageData, ProgressCallback } from './types';

// Core Factors (1-15)
import {
  analyzeHTTPS,
  analyzeTitle,
  analyzeMetaDescription,
  analyzeAuthor,
  analyzeContact,
  analyzeHeadings,
  analyzeStructuredData,
  analyzeFAQ,
  analyzeImages,
  analyzeWordCount,
  analyzeCitationWorthyContent,
  analyzeSourceAuthoritySignals,
  analyzeEvidenceChunking,
  analyzeTransparencyDisclosure,
  analyzePageLoadSpeed,
} from './factors/coreFactors';

// Additional Factors (16-18)
import {
  analyzeTopicDepth,
  analyzeCitationQuality,
  analyzeMetricsCollection,
} from './factors/additionalFactors';

// Traditional SEO Factors (19-27)
import {
  analyzeIndexability,
  analyzeMobileFriendly,
  analyzePageSpeedStub,
  analyzeBrokenLinksBasic,
  analyzeSitemapPresence,
  analyzeCanonicalTags,
  analyzeInternalLinking,
  analyzeDuplicateVersions,
  analyzeRobotsTxt,
} from './factors/traditionalSeoFactors';

/**
 * Extract page metadata from HTML content
 */
export function extractPageData(htmlContent: string): PageData {
  // Extract title
  const titleMatch = htmlContent.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extract meta description
  const metaDescMatch = htmlContent.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i
  ) || htmlContent.match(
    /<meta[^>]*content=["']([^"']*)[^>]*name=["']description["']/i
  );
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : '';

  return {
    title,
    metaDescription,
    content: htmlContent,
  };
}

/**
 * Calculate weighted overall score from factor results
 */
export function calculateOverallScore(factors: FactorResult[]): number {
  if (factors.length === 0) return 0;

  // Group factors by pillar
  const pillarScores: Record<string, { totalScore: number; totalWeight: number }> = {};

  for (const factor of factors) {
    const pillar = factor.pillar;

    if (!pillarScores[pillar]) {
      pillarScores[pillar] = { totalScore: 0, totalWeight: 0 };
    }

    pillarScores[pillar].totalScore += factor.score * factor.weight;
    pillarScores[pillar].totalWeight += factor.weight;
  }

  // Calculate weighted pillar averages
  let totalWeightedScore = 0;
  let totalPillarWeight = 0;

  for (const [pillar, data] of Object.entries(pillarScores)) {
    const pillarAverage = data.totalWeight > 0 ? data.totalScore / data.totalWeight : 0;
    const pillarWeight = PILLAR_WEIGHTS[pillar]?.weight || 5;

    totalWeightedScore += pillarAverage * pillarWeight;
    totalPillarWeight += pillarWeight;
  }

  // Return final weighted average (0-100)
  return totalPillarWeight > 0 ? Math.round(totalWeightedScore / totalPillarWeight) : 0;
}

/**
 * Get pillar breakdown from factor results
 */
export function getPillarBreakdown(factors: FactorResult[]): Record<string, {
  score: number;
  weight: number;
  factorCount: number;
  name: string;
}> {
  const pillarData: Record<string, { totalScore: number; totalWeight: number; count: number }> = {};

  for (const factor of factors) {
    const pillar = factor.pillar;

    if (!pillarData[pillar]) {
      pillarData[pillar] = { totalScore: 0, totalWeight: 0, count: 0 };
    }

    pillarData[pillar].totalScore += factor.score * factor.weight;
    pillarData[pillar].totalWeight += factor.weight;
    pillarData[pillar].count++;
  }

  const breakdown: Record<string, { score: number; weight: number; factorCount: number; name: string }> = {};

  for (const [pillar, data] of Object.entries(pillarData)) {
    breakdown[pillar] = {
      score: data.totalWeight > 0 ? Math.round(data.totalScore / data.totalWeight) : 0,
      weight: PILLAR_WEIGHTS[pillar]?.weight || 5,
      factorCount: data.count,
      name: PILLAR_WEIGHTS[pillar]?.name || pillar,
    };
  }

  return breakdown;
}

/**
 * Educational content for progress updates
 */
const EDUCATIONAL_CONTENT = {
  'metadata': 'AI assistants rely heavily on clear metadata (title, description) to understand and cite your content accurately.',
  'authority': 'Authority signals like author credentials and contact information help establish trust for both humans and AI systems.',
  'structure': 'Well-structured content with proper headings helps AI break down and retrieve specific information from your pages.',
  'ai_optimization': 'Content optimized for AI citation includes clear facts, evidence, and a structure that\'s easy to extract and reference.',
  'traditional_seo': 'Traditional SEO factors ensure your content is discoverable by search engines, which AI systems also use as sources.',
  'performance': 'Fast-loading pages provide better user experience and are more likely to be successfully crawled and indexed.',
};

/**
 * Run all 27 factor analyses
 *
 * @param url - The URL being analyzed
 * @param htmlContent - The HTML content of the page
 * @param userTier - The user's subscription tier (affects which factors run)
 * @param onProgress - Optional progress callback for real-time updates
 */
export async function analyzeAllFactors(
  url: string,
  htmlContent: string,
  userTier: string = 'free',
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  const startTime = Date.now();
  const factors: FactorResult[] = [];

  try {
    // Extract page data
    const pageData = extractPageData(htmlContent);

    // Phase 1: Core Metadata Analysis (Factors 1-3)
    if (onProgress) {
      await onProgress('metadata', 5, 'Analyzing page metadata...', EDUCATIONAL_CONTENT.metadata);
    }

    factors.push(analyzeHTTPS(url));
    factors.push(analyzeTitle(pageData.title));
    factors.push(analyzeMetaDescription(pageData.metaDescription));

    // Phase 2: Authority & Trust (Factors 4-5, 14)
    if (onProgress) {
      await onProgress('authority', 15, 'Checking authority signals...', EDUCATIONAL_CONTENT.authority);
    }

    factors.push(analyzeAuthor(htmlContent));
    factors.push(analyzeContact(url, htmlContent));
    factors.push(analyzeTransparencyDisclosure(htmlContent, url));

    // Phase 3: Content Structure (Factors 6-10)
    if (onProgress) {
      await onProgress('structure', 30, 'Analyzing content structure...', EDUCATIONAL_CONTENT.structure);
    }

    factors.push(analyzeHeadings(htmlContent));
    factors.push(analyzeStructuredData(htmlContent));
    factors.push(analyzeFAQ(htmlContent));
    factors.push(analyzeImages(htmlContent));
    factors.push(analyzeWordCount(htmlContent));

    // Phase 4: AI Citation Optimization (Factors 11-13)
    if (onProgress) {
      await onProgress('ai_optimization', 50, 'Evaluating AI citation readiness...', EDUCATIONAL_CONTENT.ai_optimization);
    }

    factors.push(analyzeCitationWorthyContent(htmlContent, pageData.title));
    factors.push(analyzeSourceAuthoritySignals(htmlContent, url));
    factors.push(analyzeEvidenceChunking(htmlContent));

    // Phase 5: Performance (Factor 15)
    if (onProgress) {
      await onProgress('performance', 60, 'Analyzing page performance...', EDUCATIONAL_CONTENT.performance);
    }

    factors.push(analyzePageLoadSpeed(htmlContent));

    // Phase 6: Additional Factors (16-18)
    if (onProgress) {
      await onProgress('additional', 70, 'Running additional analysis...', EDUCATIONAL_CONTENT.ai_optimization);
    }

    factors.push(analyzeTopicDepth(htmlContent));
    factors.push(analyzeCitationQuality(htmlContent, url));
    factors.push(analyzeMetricsCollection(htmlContent));

    // Phase 7: Traditional SEO (Factors 19-27) - Tier-dependent
    if (onProgress) {
      await onProgress('traditional_seo', 85, 'Checking traditional SEO factors...', EDUCATIONAL_CONTENT.traditional_seo);
    }

    // Indexability is always checked (Factor 19)
    factors.push(analyzeIndexability(htmlContent, url));

    // Remaining SEO factors for paid tiers (Factors 20-27)
    if (userTier !== 'free') {
      factors.push(analyzeMobileFriendly(htmlContent));
      factors.push(analyzePageSpeedStub(htmlContent));
      factors.push(analyzeBrokenLinksBasic(htmlContent, url));
      factors.push(analyzeSitemapPresence(htmlContent, url));
      factors.push(analyzeCanonicalTags(htmlContent, url));
      factors.push(analyzeInternalLinking(htmlContent, url));
      factors.push(analyzeDuplicateVersions(htmlContent, url));
      factors.push(analyzeRobotsTxt(htmlContent, url));
    }

    // Calculate final score
    if (onProgress) {
      await onProgress('complete', 100, 'Analysis complete!', '');
    }

    const overallScore = calculateOverallScore(factors);
    const processingTime = Date.now() - startTime;

    return {
      factors,
      overall_score: overallScore,
      processing_time_ms: processingTime,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      factors,
      overall_score: factors.length > 0 ? calculateOverallScore(factors) : 0,
      processing_time_ms: Date.now() - startTime,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get analysis summary for display
 */
export function getAnalysisSummary(result: AnalysisResult): {
  score: number;
  grade: string;
  factorCount: number;
  topIssues: Array<{ factor: string; score: number; recommendation: string }>;
  pillarBreakdown: Record<string, { score: number; name: string }>;
} {
  const grade = getGradeFromScore(result.overall_score);

  // Get top issues (lowest scoring factors with recommendations)
  const factorsWithIssues = result.factors
    .filter(f => f.recommendations.length > 0 && f.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const topIssues = factorsWithIssues.map(f => ({
    factor: f.factor_name,
    score: f.score,
    recommendation: f.recommendations[0] || '',
  }));

  // Get pillar breakdown
  const pillarBreakdown = getPillarBreakdown(result.factors);
  const simplifiedPillarBreakdown: Record<string, { score: number; weight: number; factorCount: number; name: string }> = {};

  for (const [pillar, data] of Object.entries(pillarBreakdown)) {
    simplifiedPillarBreakdown[pillar] = {
      score: data.score,
      weight: data.weight,
      factorCount: data.factorCount,
      name: data.name,
    };
  }

  return {
    score: result.overall_score,
    grade,
    factorCount: result.factors.length,
    topIssues,
    pillarBreakdown: simplifiedPillarBreakdown,
  };
}

/**
 * Convert score to letter grade
 */
function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D+';
  if (score >= 40) return 'D';
  return 'F';
}

// Export types
export * from './types';
