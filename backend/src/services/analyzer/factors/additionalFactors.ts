/**
 * Additional Factor Analysis Functions
 *
 * MASTERY-AI Framework v3.1.1 - Factors 16-18
 * Topic Depth, Citation Quality, Metrics Collection
 *
 * Ported from Supabase Edge Function to Node.js
 */

import { FactorResult } from '../types';

/**
 * Factor 16: T.1.1 - Topic Knowledge Depth
 *
 * Analyzes depth of topic coverage based on semantic indicators,
 * vocabulary richness, and related concept mentions.
 */
export function analyzeTopicDepth(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];

  try {
    // Strip HTML and get clean text
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = textContent.split(' ').filter(w => w.length > 2);
    const wordCount = words.length;

    // Unique words indicate vocabulary richness
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const vocabularyRichness = uniqueWords.size / wordCount;

    evidence.push(`Word count: ${wordCount}`);
    evidence.push(`Unique terms: ${uniqueWords.size}`);
    evidence.push(`Vocabulary richness: ${(vocabularyRichness * 100).toFixed(1)}%`);

    // Score based on vocabulary richness (higher = more diverse vocabulary)
    if (vocabularyRichness >= 0.6) {
      score += 35;
      evidence.push('Excellent vocabulary diversity');
    } else if (vocabularyRichness >= 0.45) {
      score += 25;
      evidence.push('Good vocabulary diversity');
    } else if (vocabularyRichness >= 0.3) {
      score += 15;
      evidence.push('Moderate vocabulary diversity');
      recommendations.push('Expand topic coverage with related concepts');
    } else {
      score += 5;
      evidence.push('Limited vocabulary diversity');
      recommendations.push('Add more comprehensive topic coverage');
    }

    // Check for topical depth indicators
    const depthIndicators = {
      definitions: /\b(defined\s+as|definition|means\s+that|refers\s+to|is\s+a)\b/gi,
      examples: /\b(for\s+example|such\s+as|including|like|instance)\b/gi,
      comparisons: /\b(compared\s+to|versus|vs\.?|unlike|similar\s+to|different\s+from)\b/gi,
      causation: /\b(because|therefore|consequently|as\s+a\s+result|leads\s+to|causes)\b/gi,
      elaboration: /\b(furthermore|moreover|additionally|in\s+addition|also|specifically)\b/gi,
    };

    let totalIndicators = 0;
    for (const [type, pattern] of Object.entries(depthIndicators)) {
      const matches = (textContent.match(pattern) || []).length;
      if (matches >= 2) {
        score += 10;
        totalIndicators += matches;
        evidence.push(`${type}: ${matches} indicators found`);
      } else if (matches === 1) {
        score += 5;
        totalIndicators += matches;
      }
    }

    if (totalIndicators < 3) {
      recommendations.push('Add more definitions, examples, and comparisons');
    }

    // Check for headings suggesting topic organization
    const headingMatches = content.match(/<h[2-6][^>]*>([^<]*)<\/h[2-6]>/gi) || [];
    if (headingMatches.length >= 5) {
      score += 20;
      evidence.push(`Well-organized with ${headingMatches.length} subheadings`);
    } else if (headingMatches.length >= 3) {
      score += 10;
      evidence.push(`${headingMatches.length} subheadings for organization`);
    } else {
      recommendations.push('Add more subheadings to organize topic coverage');
    }

    score = Math.min(score, 100);
  } catch (error) {
    evidence.push(`Error analyzing topic depth: ${(error as Error).message}`);
    score = 30;
  }

  return {
    factor_id: 'T.1.1',
    factor_name: 'Topic Knowledge Depth',
    pillar: 'T',
    phase: 'instant',
    score,
    confidence: 75,
    weight: 0.85,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
  };
}

/**
 * Factor 17: R.1.1 - Citation Source Quality
 *
 * Analyzes outbound links and references for authority and relevance.
 */
export function analyzeCitationQuality(content: string, url: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];

  try {
    // Extract all links
    const linkMatches = content.match(/<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi) || [];
    const baseUrl = new URL(url);

    const outboundLinks: Array<{ href: string; text: string }> = [];

    for (const match of linkMatches) {
      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      const textMatch = match.match(/>([^<]*)<\/a>/i);

      if (hrefMatch) {
        const href = hrefMatch[1];

        // Skip internal, anchor, javascript, mailto links
        if (
          href.startsWith('#') ||
          href.startsWith('javascript:') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:')
        ) {
          continue;
        }

        try {
          const linkUrl = href.startsWith('http')
            ? new URL(href)
            : new URL(href, url);

          // Only count external links
          if (linkUrl.hostname !== baseUrl.hostname) {
            outboundLinks.push({
              href: linkUrl.href,
              text: textMatch ? textMatch[1].trim() : '',
            });
          }
        } catch {
          // Invalid URL, skip
        }
      }
    }

    evidence.push(`Outbound links found: ${outboundLinks.length}`);

    if (outboundLinks.length === 0) {
      score = 20;
      evidence.push('No external citations found');
      recommendations.push('Add references to authoritative sources');
      recommendations.push('Link to supporting research and data');
    } else {
      // Count authoritative domains
      const authoritativeDomains = [
        '.gov', '.edu', '.org', 'wikipedia.org', 'scholar.google',
        'ncbi.nlm.nih', 'pubmed', 'nature.com', 'sciencedirect',
        'ieee.org', 'acm.org', 'springer', 'wiley', 'reuters',
        'bbc.com', 'nytimes', 'wsj.com', 'forbes', 'hbr.org',
      ];

      let authoritativeCount = 0;
      const authorityExamples: string[] = [];

      for (const link of outboundLinks) {
        const isAuthoritative = authoritativeDomains.some(domain =>
          link.href.includes(domain)
        );
        if (isAuthoritative) {
          authoritativeCount++;
          if (authorityExamples.length < 3) {
            authorityExamples.push(new URL(link.href).hostname);
          }
        }
      }

      if (authoritativeCount >= 3) {
        score += 50;
        evidence.push(`${authoritativeCount} authoritative sources cited`);
        if (authorityExamples.length > 0) {
          evidence.push(`Including: ${authorityExamples.join(', ')}`);
        }
      } else if (authoritativeCount >= 1) {
        score += 30;
        evidence.push(`${authoritativeCount} authoritative source(s) cited`);
        recommendations.push('Add more authoritative sources (.gov, .edu, academic)');
      } else {
        score += 10;
        evidence.push('No recognized authoritative sources');
        recommendations.push('Link to government, academic, or industry authority sites');
      }

      // Score based on total external references
      if (outboundLinks.length >= 5) {
        score += 25;
        evidence.push('Good number of external references');
      } else if (outboundLinks.length >= 3) {
        score += 15;
        evidence.push('Moderate external references');
        recommendations.push('Consider adding more supporting references');
      } else {
        score += 5;
        recommendations.push('Increase external citations for credibility');
      }

      // Check for descriptive anchor text
      const descriptiveAnchors = outboundLinks.filter(
        link => link.text.length > 5 && !['click here', 'here', 'link', 'source'].includes(link.text.toLowerCase())
      );

      if (descriptiveAnchors.length >= outboundLinks.length * 0.7) {
        score += 25;
        evidence.push('Good use of descriptive anchor text for citations');
      } else {
        recommendations.push('Use descriptive anchor text for external links');
      }
    }

    // Check for inline citations (academic style)
    const inlineCitations = content.match(/\[\d+\]|\(\d{4}\)|et\s+al\./gi) || [];
    if (inlineCitations.length >= 2) {
      score += 10;
      evidence.push('Academic-style inline citations detected');
    }

    // Check for bibliography/references section
    const refSection = /references?|bibliography|sources|citations?/i.test(content);
    if (refSection) {
      score += 10;
      evidence.push('References section detected');
    } else if (outboundLinks.length > 0) {
      recommendations.push('Consider adding a dedicated references section');
    }

    score = Math.min(score, 100);
  } catch (error) {
    evidence.push(`Error analyzing citations: ${(error as Error).message}`);
    score = 20;
  }

  return {
    factor_id: 'R.1.1',
    factor_name: 'Citation Source Quality',
    pillar: 'R',
    phase: 'instant',
    score,
    confidence: 80,
    weight: 0.75,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
  };
}

/**
 * Factor 18: Y.1.1 - Comprehensive Metrics Collection
 *
 * Analyzes content freshness indicators and timestamp metadata.
 */
export function analyzeMetricsCollection(content: string): FactorResult {
  const startTime = Date.now();
  let score = 0;
  const evidence: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check for publication/modified dates
    const datePatterns = [
      /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
      /<meta[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["']/i,
      /<time[^>]*datetime=["']([^"']+)["']/i,
      /published[:\s]*(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
      /updated[:\s]*(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
      /last\s+modified[:\s]*(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
    ];

    let hasDate = false;
    let dateFound = '';

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        hasDate = true;
        dateFound = match[1];
        break;
      }
    }

    if (hasDate) {
      score += 30;
      evidence.push(`Date metadata found: ${dateFound}`);

      // Check if date is recent (within last year)
      try {
        const pubDate = new Date(dateFound);
        const now = new Date();
        const monthsAgo = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        if (monthsAgo <= 6) {
          score += 20;
          evidence.push('Content is fresh (within 6 months)');
        } else if (monthsAgo <= 12) {
          score += 10;
          evidence.push('Content updated within past year');
        } else {
          evidence.push(`Content is ${Math.round(monthsAgo)} months old`);
          recommendations.push('Update content to maintain freshness signals');
        }
      } catch {
        evidence.push('Date found but format could not be parsed');
      }
    } else {
      evidence.push('No date metadata found');
      recommendations.push('Add publication and modification dates');
      recommendations.push('Use article:published_time and article:modified_time meta tags');
    }

    // Check for structured data with date info
    const jsonLdMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis) || [];

    let hasSchemaDate = false;
    for (const match of jsonLdMatches) {
      if (/datePublished|dateModified|dateCreated/i.test(match)) {
        hasSchemaDate = true;
        break;
      }
    }

    if (hasSchemaDate) {
      score += 20;
      evidence.push('Date information in structured data (JSON-LD)');
    } else {
      recommendations.push('Add datePublished/dateModified to structured data');
    }

    // Check for freshness indicators in content
    const freshnessIndicators = /\b(updated|revised|latest|recent|current|new|202[3-9]|2024|2025)\b/gi;
    const freshnessMatches = (content.match(freshnessIndicators) || []).length;

    if (freshnessMatches >= 3) {
      score += 15;
      evidence.push('Content contains freshness indicators');
    } else if (freshnessMatches >= 1) {
      score += 5;
      evidence.push('Some freshness indicators present');
    }

    // Check for analytics tracking (indicates metrics awareness)
    const analyticsPatterns = [
      /google-analytics|gtag|ga\('send'/i,
      /mixpanel|amplitude|segment/i,
      /plausible|fathom|umami/i,
    ];

    const hasAnalytics = analyticsPatterns.some(pattern => pattern.test(content));
    if (hasAnalytics) {
      score += 15;
      evidence.push('Analytics tracking implemented');
    } else {
      recommendations.push('Consider implementing analytics for performance metrics');
    }

    // Minimum score
    if (score < 20) {
      score = 20;
    }

    score = Math.min(score, 100);
  } catch (error) {
    evidence.push(`Error analyzing metrics: ${(error as Error).message}`);
    score = 20;
  }

  return {
    factor_id: 'Y.1.1',
    factor_name: 'Comprehensive Metrics & Freshness',
    pillar: 'Y',
    phase: 'instant',
    score,
    confidence: 70,
    weight: 0.65,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
  };
}
