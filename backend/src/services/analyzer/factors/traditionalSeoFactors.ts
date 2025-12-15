/**
 * Traditional SEO Factor Analysis Functions
 *
 * MASTERY-AI Framework v3.1.1 - Factors 19-27
 * Ported from Supabase Edge Function to Node.js
 *
 * Pattern: Each function follows the FactorResult interface
 * - Analyzes HTML content for specific SEO signals
 * - Returns structured evidence and recommendations
 * - Includes timing metrics for performance monitoring
 */

import { FactorResult, FactorSeverity } from '../types';

/**
 * Determine severity based on score and factor criticality
 */
function getSeverity(score: number, factorType: 'indexability' | 'mobile' | 'speed' | 'links' | 'sitemap' | 'canonical' | 'internal-links' | 'duplicate-versions' | 'robots-txt'): FactorSeverity {
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
      return 'ok';
  }
}

/**
 * Factor 19: TS.1.1 - Indexability Status (Critical - Weight: 1.0)
 */
export function analyzeIndexability(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 100;

  try {
    // Check for robots meta tag
    const robotsMetaMatch = content.match(
      /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i
    );

    if (robotsMetaMatch) {
      const robotsContent = robotsMetaMatch[1].toLowerCase();
      evidence.push(`Robots meta tag found: ${robotsMetaMatch[1]}`);

      if (robotsContent.includes('noindex')) {
        score = 0;
        evidence.push('Page is blocked from indexing (noindex directive)');
        recommendations.push('Remove noindex directive to allow search engines to index this page');
      } else if (robotsContent.includes('index')) {
        evidence.push('Page explicitly allows indexing');
      }

      if (robotsContent.includes('nofollow')) {
        score = Math.max(score - 20, 0);
        evidence.push('Links are blocked from crawling (nofollow directive)');
        recommendations.push('Consider removing nofollow if you want search engines to follow links');
      }
    } else {
      evidence.push('No robots meta tag (indexing allowed by default)');
    }

    // Check for noindex in meta tags variations
    const noindexVariations = [
      /<meta\s+name=["']googlebot["']\s+content=["'][^"']*noindex[^"']*["']/i,
      /<meta\s+name=["']bingbot["']\s+content=["'][^"']*noindex[^"']*["']/i,
    ];

    for (const pattern of noindexVariations) {
      if (pattern.test(content)) {
        score = Math.min(score, 30);
        evidence.push('Bot-specific noindex directive found');
        break;
      }
    }

    // Check for canonical tag (affects indexing priority)
    const canonicalMatch = content.match(
      /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i
    );
    if (canonicalMatch) {
      const canonicalUrl = canonicalMatch[1];
      if (canonicalUrl !== url && !canonicalUrl.startsWith(url)) {
        score = Math.max(score - 15, 0);
        evidence.push(`Canonical URL points elsewhere: ${canonicalUrl}`);
        recommendations.push('Verify canonical URL is correct - this page may be treated as duplicate content');
        confidence = 80;
      } else {
        evidence.push('Canonical URL properly configured');
      }
    }

    if (score === 100 && evidence.length === 0) {
      evidence.push('Page is indexable (default behavior)');
    }
  } catch (error) {
    evidence.push(`Error analyzing indexability: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  return {
    factor_id: 'TS.1.1',
    factor_name: 'Indexability Status',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 1.0,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'indexability'),
  };
}

/**
 * Factor 20: TS.1.2 - Mobile-Friendliness (Weight: 0.85)
 */
export function analyzeMobileFriendly(content: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 100;

  try {
    // Check for viewport meta tag
    const viewportMatch = content.match(
      /<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i
    );

    if (viewportMatch) {
      const viewportContent = viewportMatch[1].toLowerCase();
      evidence.push(`Viewport meta tag found: ${viewportMatch[1]}`);

      if (viewportContent.includes('width=device-width')) {
        score += 50;
        evidence.push('Viewport width set to device width');
      } else if (viewportContent.includes('width=')) {
        score += 25;
        evidence.push('Viewport width set to fixed value (not responsive)');
        recommendations.push('Use width=device-width for responsive design');
      } else {
        recommendations.push('Add width=device-width to viewport meta tag');
      }

      if (viewportContent.includes('initial-scale=1')) {
        score += 30;
        evidence.push('Initial scale set to 1 (no zoom)');
      } else if (viewportContent.includes('initial-scale=')) {
        score += 15;
        evidence.push('Non-standard initial scale');
      } else {
        recommendations.push('Add initial-scale=1 to viewport meta tag');
      }

      if (!viewportContent.includes('user-scalable=no')) {
        score += 10;
        evidence.push('User scaling allowed (accessibility)');
      } else {
        evidence.push('User scaling disabled (accessibility issue)');
        recommendations.push('Remove user-scalable=no for better accessibility');
      }

      if (/<link[^>]*media=["'].*screen.*["']/i.test(content)) {
        score += 10;
        evidence.push('Responsive CSS media queries detected');
      }
    } else {
      score = 0;
      evidence.push('No viewport meta tag found');
      recommendations.push('Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">');
      recommendations.push('Without viewport configuration, site will not display correctly on mobile devices');
    }

    score = Math.min(score, 100);
  } catch (error) {
    evidence.push(`Error analyzing mobile-friendliness: ${(error as Error).message}`);
    confidence = 50;
    score = 0;
  }

  return {
    factor_id: 'TS.1.2',
    factor_name: 'Mobile Friendliness',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.85,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'mobile'),
  };
}

/**
 * Factor 21: P.1.1 - Page Speed Mobile (Stub - Weight: 0.80)
 */
export function analyzePageSpeedStub(content: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 40; // Low confidence - this is estimation only

  try {
    evidence.push('Estimated performance score (actual PageSpeed API in Phase 3)');

    // Estimate based on page size
    const contentSize = content.length;
    if (contentSize > 500000) {
      score -= 30;
      evidence.push(`Large page size: ${Math.round(contentSize / 1024)}KB`);
      recommendations.push('Consider code splitting and lazy loading');
    } else if (contentSize > 250000) {
      score -= 15;
      evidence.push(`Moderate page size: ${Math.round(contentSize / 1024)}KB`);
    } else {
      evidence.push(`Reasonable page size: ${Math.round(contentSize / 1024)}KB`);
    }

    // Count external scripts
    const scriptMatches = content.match(/<script[^>]*src=["'][^"']+["']/gi);
    const scriptCount = scriptMatches ? scriptMatches.length : 0;
    if (scriptCount > 10) {
      score -= 20;
      evidence.push(`Many external scripts: ${scriptCount}`);
      recommendations.push('Reduce number of third-party scripts');
    } else if (scriptCount > 5) {
      score -= 10;
      evidence.push(`Moderate external scripts: ${scriptCount}`);
    }

    // Check for blocking resources
    const blockingScripts = content.match(/<script[^>]*src=[^>]*(?!async|defer)[^>]*>/gi);
    if (blockingScripts && blockingScripts.length > 3) {
      score -= 15;
      evidence.push(`${blockingScripts.length} render-blocking scripts found`);
      recommendations.push('Add async or defer attributes to non-critical scripts');
    }

    // Check for large images without lazy loading
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    const lazyImages = content.match(/<img[^>]*loading=["']lazy["']/gi) || [];
    const nonLazyImages = imgTags.length - lazyImages.length;

    if (nonLazyImages > 10) {
      score -= 15;
      evidence.push(`${nonLazyImages} images without lazy loading`);
      recommendations.push('Add loading="lazy" to below-the-fold images');
    } else if (nonLazyImages > 5) {
      score -= 8;
      evidence.push(`${nonLazyImages} images could use lazy loading`);
    }

    // Check for preload/prefetch hints
    if (/<link[^>]*rel=["']preload["']/i.test(content)) {
      score += 5;
      evidence.push('Resource preloading configured');
    }

    score = Math.max(0, Math.min(100, score));
    recommendations.push('Run actual PageSpeed Insights test for detailed performance metrics');
  } catch (error) {
    evidence.push(`Error estimating page speed: ${(error as Error).message}`);
    confidence = 30;
    score = 50;
  }

  return {
    factor_id: 'P.1.1',
    factor_name: 'Page Speed (Mobile)',
    pillar: 'P',
    phase: 'instant',
    score,
    confidence,
    weight: 0.80,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'speed'),
  };
}

/**
 * Factor 22: TS.1.3 - Broken Links (Basic - Weight: 0.65)
 */
export function analyzeBrokenLinksBasic(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 60;

  try {
    const linkMatches = content.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);

    if (!linkMatches || linkMatches.length === 0) {
      evidence.push('No links found on page');
      recommendations.push('Consider adding internal links for better site navigation');
      confidence = 100;
      return {
        factor_id: 'TS.1.3',
        factor_name: 'Broken Links Check',
        pillar: 'TS',
        phase: 'instant',
        score: 100,
        confidence,
        weight: 0.65,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime,
      };
    }

    const totalLinks = linkMatches.length;
    let internalLinks = 0;
    let externalLinks = 0;
    let suspiciousLinks = 0;
    const issues: string[] = [];
    const baseUrl = new URL(url).origin;

    for (const linkMatch of linkMatches) {
      const hrefMatch = linkMatch.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;

      const href = hrefMatch[1].trim();

      if (!href || href === '#' || href === '') {
        suspiciousLinks++;
        issues.push('Empty or anchor-only link');
        continue;
      }

      if (href.startsWith('javascript:')) {
        suspiciousLinks++;
        issues.push('JavaScript link (may not work without JS)');
        continue;
      }

      try {
        let fullUrl: string;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = `https:${href}`;
        } else if (href.startsWith('/')) {
          fullUrl = `${baseUrl}${href}`;
        } else if (href.startsWith('#')) {
          continue;
        } else {
          fullUrl = new URL(href, url).href;
        }

        const linkUrl = new URL(fullUrl);
        if (linkUrl.origin === baseUrl) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        suspiciousLinks++;
        issues.push(`Malformed URL: ${href}`);
      }
    }

    const suspiciousRatio = suspiciousLinks / totalLinks;
    score = Math.max(0, 100 - suspiciousRatio * 100);

    evidence.push(`Total links analyzed: ${totalLinks} (${internalLinks} internal, ${externalLinks} external)`);

    if (suspiciousLinks > 0) {
      evidence.push(`Found ${suspiciousLinks} suspicious/malformed links (${Math.round(suspiciousRatio * 100)}%)`);
      recommendations.push(`Fix ${suspiciousLinks} suspicious links for better user experience`);
      const issueExamples = [...new Set(issues)].slice(0, 3);
      evidence.push(`Issues found: ${issueExamples.join(', ')}`);
    } else {
      evidence.push('No obviously malformed links detected');
    }

    if (internalLinks === 0 && externalLinks > 0) {
      score -= 10;
      evidence.push('No internal links found (poor site navigation)');
      recommendations.push('Add internal links to help users navigate your site');
    }
  } catch (error) {
    evidence.push(`Error analyzing links: ${(error as Error).message}`);
    confidence = 40;
    score = 50;
  }

  return {
    factor_id: 'TS.1.3',
    factor_name: 'Broken Links Check',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.65,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'links'),
  };
}

/**
 * Factor 23: TS.1.4 - Sitemap Presence (Basic Detection - Weight: 0.60)
 */
export function analyzeSitemapPresence(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 70;

  try {
    const baseUrl = new URL(url).origin;
    let sitemapFound = false;

    const sitemapLinkMatch = content.match(
      /<link[^>]*rel=["']sitemap["'][^>]*href=["']([^"']+)["']/i
    );

    if (sitemapLinkMatch) {
      sitemapFound = true;
      score = 100;
      evidence.push(`Sitemap link found in HTML: ${sitemapLinkMatch[1]}`);
    }

    if (content.includes('sitemap.xml')) {
      if (!sitemapFound) {
        score = 80;
        sitemapFound = true;
      }
      evidence.push('sitemap.xml referenced in page content');
    }

    if (content.includes('robots.txt')) {
      evidence.push('robots.txt referenced (may contain sitemap location)');
    }

    if (!sitemapFound) {
      score = 0;
      evidence.push('No sitemap references found in page content');
      recommendations.push('Add sitemap.xml link: <link rel="sitemap" type="application/xml" href="/sitemap.xml" />');
      recommendations.push(`Create XML sitemap at ${baseUrl}/sitemap.xml`);
      recommendations.push('Submit sitemap to Google Search Console and Bing Webmaster Tools');
    } else {
      recommendations.push('Full sitemap validation (XML parsing, URL testing) available in Phase 3');
    }

    evidence.push('Sitemaps help search engines discover and crawl all pages efficiently');
  } catch (error) {
    evidence.push(`Error analyzing sitemap presence: ${(error as Error).message}`);
    confidence = 50;
    score = 0;
  }

  return {
    factor_id: 'TS.1.4',
    factor_name: 'Sitemap Presence',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.60,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'sitemap'),
  };
}

/**
 * Factor 24: TS.2.1 - Canonical Tags Assessment
 */
export function analyzeCanonicalTags(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 100;

  try {
    let pageUrl: URL;
    try {
      pageUrl = new URL(url);
    } catch {
      evidence.push('Invalid page URL provided');
      recommendations.push('Unable to validate canonical URL against page URL.');
      return {
        factor_id: 'TS.2.1',
        factor_name: 'Canonical Tag Configuration',
        pillar: 'TS',
        phase: 'instant',
        score: 0,
        confidence: 0,
        weight: 0.75,
        evidence,
        recommendations,
        processing_time_ms: Date.now() - startTime,
        severity: 'warning',
      };
    }

    const canonicalMatches: string[] = [];
    const canonicalRegex = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
    const canonicalRegex2 = /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/gi;

    let match;
    while ((match = canonicalRegex.exec(content)) !== null) {
      canonicalMatches.push(match[1]);
    }
    while ((match = canonicalRegex2.exec(content)) !== null) {
      if (!canonicalMatches.includes(match[1])) {
        canonicalMatches.push(match[1]);
      }
    }

    if (canonicalMatches.length === 0) {
      score = 0;
      evidence.push('No canonical tag found');
      recommendations.push(`Add a self-referencing canonical tag: <link rel="canonical" href="${url}">`);
      recommendations.push('Canonical tags help prevent duplicate content issues and consolidate ranking signals');
    } else if (canonicalMatches.length > 1) {
      score = 20;
      evidence.push(`Multiple canonical tags found (${canonicalMatches.length}): ${canonicalMatches.join(', ')}`);
      recommendations.push('Remove duplicate canonical tags - only one canonical tag should exist per page');
    } else {
      const canonicalUrl = canonicalMatches[0];
      evidence.push(`Canonical tag found: ${canonicalUrl}`);

      let parsedCanonical: URL;
      try {
        parsedCanonical = new URL(canonicalUrl);
      } catch {
        try {
          parsedCanonical = new URL(canonicalUrl, url);
          score = 60;
          evidence.push('Canonical URL is relative (not absolute format)');
          recommendations.push(`Convert to absolute URL: ${parsedCanonical.href}`);
        } catch {
          score = 20;
          evidence.push('Canonical URL is malformed and cannot be parsed');
          recommendations.push('Fix the canonical URL format');
          return {
            factor_id: 'TS.2.1',
            factor_name: 'Canonical Tag Configuration',
            pillar: 'TS',
            phase: 'instant',
            score,
            confidence,
            weight: 0.75,
            evidence,
            recommendations,
            processing_time_ms: Date.now() - startTime,
            severity: getSeverity(score, 'canonical'),
          };
        }
      }

      const isSameDomain = parsedCanonical.hostname === pageUrl.hostname;
      const normalizedCanonicalPath = parsedCanonical.pathname.replace(/\/$/, '').toLowerCase();
      const normalizedPagePath = pageUrl.pathname.replace(/\/$/, '').toLowerCase();
      const isSamePath = normalizedCanonicalPath === normalizedPagePath;

      if (isSameDomain && isSamePath) {
        score = 100;
        evidence.push('Self-referencing canonical properly configured');
      } else if (isSameDomain && !isSamePath) {
        score = 80;
        evidence.push(`Canonical points to different page on same domain: ${parsedCanonical.pathname}`);
        recommendations.push('This is correct if this page is a duplicate. If not, update canonical to: ' + url);
      } else if (!isSameDomain) {
        score = 40;
        evidence.push(`Cross-domain canonical: ${parsedCanonical.hostname} (page domain: ${pageUrl.hostname})`);
        recommendations.push('Cross-domain canonical tells search engines to attribute this content to another site');
      }
    }
  } catch (error) {
    evidence.push(`Error analyzing canonical tags: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  return {
    factor_id: 'TS.2.1',
    factor_name: 'Canonical Tag Configuration',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.75,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'canonical'),
  };
}

/**
 * Factor 25: TS.2.2 - Internal Linking Analysis
 */
export function analyzeInternalLinking(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 90;

  try {
    const baseUrl = new URL(url);
    const domain = baseUrl.hostname;

    const anchorTags = content.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || [];
    const MAX_LINKS = 500;
    const tagsToProcess = anchorTags.slice(0, MAX_LINKS);

    const allLinks: Array<{ href: string; text: string; isNofollow: boolean }> = [];

    for (const tag of tagsToProcess) {
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;

      const href = hrefMatch[1];

      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      const textMatch = tag.match(/>([^]*?)<\/a>/i);
      const rawText = textMatch ? textMatch[1] : '';
      const text = rawText.replace(/<[^>]*>/g, '').trim();
      const isNofollow = /rel=["'][^"']*nofollow/i.test(tag);

      allLinks.push({ href, text, isNofollow });
    }

    if (anchorTags.length > MAX_LINKS) {
      evidence.push(`Analyzed ${MAX_LINKS} of ${anchorTags.length} links (sampled for performance)`);
    }

    const internalLinks = allLinks.filter(link => {
      try {
        if (link.href.startsWith('/') && !link.href.startsWith('//')) {
          return true;
        }
        const linkUrl = new URL(link.href, url);
        return linkUrl.hostname === domain;
      } catch {
        return false;
      }
    });

    const externalLinks = allLinks.filter(link => {
      try {
        if (link.href.startsWith('/') && !link.href.startsWith('//')) {
          return false;
        }
        const linkUrl = new URL(link.href, url);
        return linkUrl.hostname !== domain;
      } catch {
        return false;
      }
    });

    const uniqueInternalHrefs = new Set(internalLinks.map(l => l.href.split('?')[0].split('#')[0]));
    const uniqueCount = uniqueInternalHrefs.size;

    evidence.push(`Total links found: ${allLinks.length} (${internalLinks.length} internal, ${externalLinks.length} external)`);
    evidence.push(`Unique internal link destinations: ${uniqueCount}`);

    if (uniqueCount >= 5) {
      score += 30;
      evidence.push('Good internal link count (5+ unique destinations)');
    } else if (uniqueCount >= 3) {
      score += 20;
      evidence.push('Moderate internal link count (3-4 destinations)');
      recommendations.push('Consider adding 2-3 more internal links to key pages');
    } else if (uniqueCount >= 1) {
      score += 10;
      evidence.push('Limited internal links (1-2 destinations)');
      recommendations.push('Add more internal links to improve navigation and SEO (aim for 5+)');
    } else {
      evidence.push('No internal links found');
      recommendations.push('Add internal links to connect your content and help search engines discover pages');
    }

    const genericAnchors = ['click here', 'read more', 'learn more', 'here', 'this', 'link', 'more'];
    const internalAnchorTexts = internalLinks.map(l => l.text.toLowerCase());
    const genericCount = internalAnchorTexts.filter(text =>
      genericAnchors.some(generic => text === generic || text.includes(generic))
    ).length;

    if (internalLinks.length > 0) {
      const genericPercentage = (genericCount / internalLinks.length) * 100;

      if (genericPercentage > 50) {
        score -= 15;
        evidence.push(`${Math.round(genericPercentage)}% of anchors use generic text`);
        recommendations.push('Use descriptive anchor text that indicates linked page content');
      } else {
        score += 20;
        evidence.push(`Good anchor text variety (${Math.round(100 - genericPercentage)}% descriptive)`);
      }
    }

    const nofollowInternal = internalLinks.filter(l => l.isNofollow);
    if (nofollowInternal.length > 0) {
      score -= 20;
      evidence.push(`${nofollowInternal.length} internal link(s) have rel="nofollow"`);
      recommendations.push('Remove rel="nofollow" from internal links to pass link equity between pages');
    } else if (internalLinks.length > 0) {
      score += 20;
      evidence.push('No nofollow on internal links (link equity flows properly)');
    }

    if (internalLinks.length > 0 && externalLinks.length > 0) {
      const ratio = internalLinks.length / externalLinks.length;
      if (ratio >= 1) {
        score += 15;
        evidence.push(`Balanced ratio: ${internalLinks.length} internal vs ${externalLinks.length} external`);
      } else {
        evidence.push(`More external (${externalLinks.length}) than internal (${internalLinks.length}) links`);
        recommendations.push('Balance link ratio - add more internal navigation links');
      }
    }

    score = Math.min(Math.max(score, 0), 100);
  } catch (error) {
    evidence.push(`Error analyzing internal linking: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  return {
    factor_id: 'TS.2.2',
    factor_name: 'Internal Linking Structure',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.70,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'internal-links'),
  };
}

/**
 * Factor 26: TS.2.3 - Duplicate Site Versions (HTTP/HTTPS, www/non-www)
 */
export function analyzeDuplicateVersions(content: string, url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 95;

  try {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const hasWww = urlObj.hostname.startsWith('www.');

    evidence.push(`Current URL: ${isHttps ? 'HTTPS' : 'HTTP'}, ${hasWww ? 'with www' : 'without www'}`);

    if (!isHttps) {
      score -= 40;
      evidence.push('Site is using HTTP instead of HTTPS');
      recommendations.push('Migrate to HTTPS for security and SEO benefits');
      recommendations.push('Configure 301 redirects from HTTP to HTTPS');
    } else {
      evidence.push('Site is using HTTPS protocol (good)');
    }

    const httpResourcePattern = /<(?:img|script|link|iframe)[^>]+(?:src|href)=["']http:\/\//gi;
    const mixedContentMatches = content.match(httpResourcePattern);

    if (isHttps && mixedContentMatches && mixedContentMatches.length > 0) {
      score -= 20;
      evidence.push(`Mixed content: ${mixedContentMatches.length} HTTP resource(s) on HTTPS page`);
      recommendations.push('Update all resource URLs to use HTTPS or protocol-relative URLs');
    } else if (isHttps) {
      evidence.push('No mixed content detected');
    }

    const canonicalMatch = content.match(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i
    ) || content.match(
      /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i
    );

    if (canonicalMatch) {
      const canonicalUrl = canonicalMatch[1];
      try {
        const canonicalObj = new URL(canonicalUrl, url);

        if (canonicalObj.protocol === 'https:') {
          score += 10;
          evidence.push('Canonical tag uses HTTPS (good)');
        } else {
          score -= 10;
          evidence.push('Canonical tag uses HTTP instead of HTTPS');
          recommendations.push('Update canonical tag to use HTTPS URL');
        }

        const canonicalHasWww = canonicalObj.hostname.startsWith('www.');
        if (hasWww !== canonicalHasWww) {
          evidence.push(`URL uses ${hasWww ? 'www' : 'non-www'} but canonical uses ${canonicalHasWww ? 'www' : 'non-www'}`);
          recommendations.push('Ensure consistent www/non-www usage and set up 301 redirects');
        }
      } catch {
        evidence.push('Canonical URL could not be parsed');
      }
    } else {
      score -= 10;
      evidence.push('No canonical tag to declare preferred version');
      recommendations.push('Add canonical tag to specify preferred URL version (HTTPS, www or non-www)');
    }

    score = Math.min(Math.max(score, 0), 100);
  } catch (error) {
    evidence.push(`Error analyzing duplicate versions: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  return {
    factor_id: 'TS.2.3',
    factor_name: 'Duplicate Site Versions',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.65,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'duplicate-versions'),
  };
}

/**
 * Factor 27: TS.2.4 - Robots.txt Configuration (HTML meta analysis)
 */
export function analyzeRobotsTxt(content: string, _url: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 80;

  try {
    let hasBlockingIssues = false;

    const metaRobotsMatch = content.match(
      /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i
    ) || content.match(
      /<meta\s+content=["']([^"']+)["']\s+name=["']robots["']/i
    );

    if (metaRobotsMatch) {
      const robotsContent = metaRobotsMatch[1].toLowerCase();
      evidence.push(`Meta robots tag found: ${metaRobotsMatch[1]}`);

      if (robotsContent.includes('noindex')) {
        score -= 30;
        hasBlockingIssues = true;
        evidence.push('Page blocked from indexing (noindex directive)');
        recommendations.push('Remove "noindex" from meta robots if you want this page indexed');
      }

      if (robotsContent.includes('nofollow')) {
        score -= 20;
        hasBlockingIssues = true;
        evidence.push('Links blocked from following (nofollow directive)');
        recommendations.push('Remove "nofollow" from meta robots if you want link equity to flow');
      }

      if (robotsContent.includes('none')) {
        score -= 35;
        hasBlockingIssues = true;
        evidence.push('Page has "none" directive (blocks indexing and following)');
        recommendations.push('Remove "none" directive to allow crawling and indexing');
      }
    } else {
      evidence.push('No meta robots tag (indexing allowed by default)');
    }

    const googlebotMatch = content.match(
      /<meta\s+name=["']googlebot["']\s+content=["']([^"']+)["']/i
    );

    if (googlebotMatch) {
      const googlebotContent = googlebotMatch[1].toLowerCase();
      evidence.push(`Googlebot directive: ${googlebotMatch[1]}`);

      if (googlebotContent.includes('noindex') || googlebotContent.includes('none')) {
        score -= 15;
        hasBlockingIssues = true;
        evidence.push('Googlebot specifically blocked from indexing');
        recommendations.push('Remove Googlebot noindex to allow Google indexing');
      }
    }

    const hasSitemapRef = content.toLowerCase().includes('sitemap.xml') ||
      /<link[^>]*rel=["']sitemap["']/i.test(content);

    if (hasSitemapRef) {
      score += 10;
      evidence.push('Sitemap reference found (aids discoverability)');
    }

    if (!hasBlockingIssues) {
      evidence.push('No robot blocking directives detected in HTML');
    }

    evidence.push('Analysis based on HTML meta tags (actual robots.txt file not fetched)');
    score = Math.min(Math.max(score, 0), 100);
  } catch (error) {
    evidence.push(`Error analyzing robot directives: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  return {
    factor_id: 'TS.2.4',
    factor_name: 'Robots.txt Configuration',
    pillar: 'TS',
    phase: 'instant',
    score,
    confidence,
    weight: 0.60,
    evidence,
    recommendations,
    processing_time_ms: Date.now() - startTime,
    severity: getSeverity(score, 'robots-txt'),
  };
}

/**
 * Analyze all traditional SEO factors (for paid tiers)
 */
export function analyzeAllTraditionalSeoFactors(
  content: string,
  url: string,
  userTier: string = 'free'
): FactorResult[] {
  const results: FactorResult[] = [];

  // TS.1.1 - Indexability (Free tier)
  results.push(analyzeIndexability(content, url));

  // Paid tier factors
  if (userTier !== 'free') {
    results.push(analyzeMobileFriendly(content));
    results.push(analyzePageSpeedStub(content));
    results.push(analyzeBrokenLinksBasic(content, url));
    results.push(analyzeSitemapPresence(content, url));
    results.push(analyzeCanonicalTags(content, url));
    results.push(analyzeInternalLinking(content, url));
    results.push(analyzeDuplicateVersions(content, url));
    results.push(analyzeRobotsTxt(content, url));
  }

  return results;
}
