/**
 * Traditional SEO Factor Analysis Functions
 * Sprint 2 Phase 2: 5 Traditional SEO Factors
 *
 * Pattern: Each function follows the FactorResult interface
 * - Analyzes HTML content for specific SEO signals
 * - Returns structured evidence and recommendations
 * - Includes timing metrics for performance monitoring
 */

// Severity levels for SEO factors
type FactorSeverity = 'blocker' | 'warning' | 'info' | 'ok';

/**
 * Determine severity based on score and factor criticality
 * - blocker: Critical issues that completely block SEO
 * - warning: Important issues that significantly impact SEO
 * - info: Minor issues or informational
 * - ok: No issues
 */
function getSeverity(score: number, factorType: 'indexability' | 'mobile' | 'speed' | 'links' | 'sitemap' | 'canonical' | 'internal-links' | 'duplicate-versions' | 'robots-txt'): FactorSeverity {
  switch (factorType) {
    case 'indexability':
      // Most critical - noindex blocks everything
      if (score < 50) return 'blocker';
      if (score < 90) return 'warning';
      return 'ok';
    case 'mobile':
      // Important for mobile-first indexing
      if (score < 60) return 'warning';
      if (score < 85) return 'info';
      return 'ok';
    case 'speed':
      // Impacts user experience and rankings
      if (score < 50) return 'warning';
      if (score < 75) return 'info';
      return 'ok';
    case 'links':
      // Broken links hurt credibility
      if (score < 70) return 'warning';
      if (score < 90) return 'info';
      return 'ok';
    case 'sitemap':
      // Important for discovery - most sites should have one
      if (score < 60) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'canonical':
      // Missing canonical causes duplicate content issues
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'internal-links':
      // Poor internal linking affects crawl efficiency
      if (score < 40) return 'warning';
      if (score < 70) return 'info';
      return 'ok';
    case 'duplicate-versions':
      // Multiple site versions can split ranking signals
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'robots-txt':
      // Misconfigured robots.txt can block crawlers
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    default:
      return 'ok';
  }
}

// FactorResult interface (matches main index.ts)
interface FactorResult {
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
  severity?: FactorSeverity; // New: indicates issue severity
}

/**
 * T.1.1 - Indexability Status (Critical - Weight: 1.0)
 *
 * Checks if page allows search engine indexing via robots meta tags
 * and X-Robots-Tag headers. If blocked, SEO effectiveness is zero.
 */
export function analyzeIndexability(
  content: string,
  url: string
): FactorResult {
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
        recommendations.push(
          'Remove noindex directive to allow search engines to index this page'
        );
      } else if (robotsContent.includes('index')) {
        evidence.push('Page explicitly allows indexing');
      }

      if (robotsContent.includes('nofollow')) {
        score = Math.max(score - 20, 0);
        evidence.push('Links are blocked from crawling (nofollow directive)');
        recommendations.push(
          'Consider removing nofollow if you want search engines to follow links'
        );
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
        evidence.push(
          `Canonical URL points elsewhere: ${canonicalUrl}`
        );
        recommendations.push(
          'Verify canonical URL is correct - this page may be treated as duplicate content'
        );
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

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'indexability'),
  };
}

/**
 * T.1.2 - Mobile-Friendliness (Weight: 0.85)
 *
 * Checks viewport configuration and responsive design indicators.
 * Critical since Google uses mobile-first indexing.
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

      // Check for width=device-width
      if (viewportContent.includes('width=device-width')) {
        score += 50;
        evidence.push('Viewport width set to device width');
      } else if (viewportContent.includes('width=')) {
        score += 25;
        evidence.push('Viewport width set to fixed value (not responsive)');
        recommendations.push(
          'Use width=device-width for responsive design'
        );
      } else {
        recommendations.push('Add width=device-width to viewport meta tag');
      }

      // Check for initial-scale
      if (viewportContent.includes('initial-scale=1')) {
        score += 30;
        evidence.push('Initial scale set to 1 (no zoom)');
      } else if (viewportContent.includes('initial-scale=')) {
        score += 15;
        evidence.push('Non-standard initial scale');
      } else {
        recommendations.push('Add initial-scale=1 to viewport meta tag');
      }

      // Bonus points for good practices
      if (!viewportContent.includes('user-scalable=no')) {
        score += 10;
        evidence.push('User scaling allowed (accessibility)');
      } else {
        evidence.push('User scaling disabled (accessibility issue)');
        recommendations.push(
          'Remove user-scalable=no for better accessibility'
        );
      }

      if (
        viewportContent.includes('maximum-scale=1') ||
        viewportContent.includes('minimum-scale=1')
      ) {
        evidence.push('Scale limits restrict user zoom');
      }

      // Additional responsive indicators
      if (/<link[^>]*media=["'].*screen.*["']/i.test(content)) {
        score += 10;
        evidence.push('Responsive CSS media queries detected');
      }
    } else {
      score = 0;
      evidence.push('No viewport meta tag found');
      recommendations.push(
        'Add viewport meta tag: <meta name="viewport" content="width=device-width, initial-scale=1">'
      );
      recommendations.push(
        'Without viewport configuration, site will not display correctly on mobile devices'
      );
    }

    // Cap score at 100
    score = Math.min(score, 100);
  } catch (error) {
    evidence.push(`Error analyzing mobile-friendliness: ${(error as Error).message}`);
    confidence = 50;
    score = 0;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'mobile'),
  };
}

/**
 * P.1.1 - Page Speed Mobile (Stub - Weight: 0.80)
 *
 * PLACEHOLDER: Estimates performance based on content analysis.
 * Actual PageSpeed Insights API integration in Phase 3 separate Edge Function.
 */
export function analyzePageSpeedStub(content: string): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 40; // Low confidence - this is estimation only

  try {
    evidence.push(
      'Estimated performance score (actual PageSpeed API in Phase 3)'
    );

    // Estimate based on page size
    const contentSize = content.length;
    if (contentSize > 500000) {
      score -= 30;
      evidence.push(
        `Large page size: ${Math.round(contentSize / 1024)}KB`
      );
      recommendations.push('Consider code splitting and lazy loading');
    } else if (contentSize > 250000) {
      score -= 15;
      evidence.push(
        `Moderate page size: ${Math.round(contentSize / 1024)}KB`
      );
    } else {
      evidence.push(
        `Reasonable page size: ${Math.round(contentSize / 1024)}KB`
      );
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
    const blockingScripts = content.match(
      /<script[^>]*src=[^>]*(?!async|defer)[^>]*>/gi
    );
    if (blockingScripts && blockingScripts.length > 3) {
      score -= 15;
      evidence.push(
        `${blockingScripts.length} render-blocking scripts found`
      );
      recommendations.push(
        'Add async or defer attributes to non-critical scripts'
      );
    }

    // Check for large images without lazy loading
    const imgTags = content.match(/<img[^>]*>/gi) || [];
    const lazyImages = content.match(/<img[^>]*loading=["']lazy["']/gi) || [];
    const nonLazyImages = imgTags.length - lazyImages.length;

    if (nonLazyImages > 10) {
      score -= 15;
      evidence.push(
        `${nonLazyImages} images without lazy loading`
      );
      recommendations.push('Add loading="lazy" to below-the-fold images');
    } else if (nonLazyImages > 5) {
      score -= 8;
      evidence.push(
        `${nonLazyImages} images could use lazy loading`
      );
    }

    // Check for inline CSS (can be good for critical CSS)
    const inlineStyleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    const inlineStyleSize = inlineStyleMatch
      ? inlineStyleMatch.join('').length
      : 0;

    if (inlineStyleSize > 50000) {
      score -= 10;
      evidence.push(
        `Large inline CSS: ${Math.round(inlineStyleSize / 1024)}KB`
      );
      recommendations.push('Extract large CSS to external stylesheets');
    } else if (inlineStyleSize > 0) {
      evidence.push(
        `Inline critical CSS detected (${Math.round(inlineStyleSize / 1024)}KB)`
      );
    }

    // Check for preload/prefetch hints
    if (/<link[^>]*rel=["']preload["']/i.test(content)) {
      score += 5;
      evidence.push('Resource preloading configured');
    }

    if (/<link[^>]*rel=["']dns-prefetch["']/i.test(content)) {
      evidence.push('DNS prefetching configured');
    }

    // Ensure score stays within bounds
    score = Math.max(0, Math.min(100, score));

    recommendations.push(
      'Run actual PageSpeed Insights test for detailed performance metrics'
    );
  } catch (error) {
    evidence.push(`Error estimating page speed: ${(error as Error).message}`);
    confidence = 30;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'speed'),
  };
}

/**
 * T.1.3 - Broken Links (Basic - Weight: 0.65)
 *
 * Analyzes link quality without making HTTP requests.
 * Checks for malformed URLs and obvious issues.
 * Full link validation with HTTP checks in Phase 3.
 */
export function analyzeBrokenLinksBasic(
  content: string,
  url: string
): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 60; // Lower confidence - no HTTP validation yet

  try {
    // Extract all links
    const linkMatches = content.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);

    if (!linkMatches || linkMatches.length === 0) {
      evidence.push('No links found on page');
      recommendations.push(
        'Consider adding internal links for better site navigation'
      );
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

      // Check for obviously broken patterns
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

      if (href === 'javascript:void(0)') {
        suspiciousLinks++;
        issues.push('Placeholder link (javascript:void)');
        continue;
      }

      // Check for malformed URLs
      try {
        let fullUrl: string;
        if (href.startsWith('http://') || href.startsWith('https://')) {
          fullUrl = href;
        } else if (href.startsWith('//')) {
          fullUrl = `https:${href}`;
        } else if (href.startsWith('/')) {
          fullUrl = `${baseUrl}${href}`;
        } else if (href.startsWith('#')) {
          continue; // Skip anchor links in this analysis
        } else {
          // Relative URL
          fullUrl = new URL(href, url).href;
        }

        const linkUrl = new URL(fullUrl);

        if (linkUrl.origin === baseUrl) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch (error) {
        suspiciousLinks++;
        issues.push(`Malformed URL: ${href}`);
      }
    }

    // Calculate score based on suspicious links ratio
    const suspiciousRatio = suspiciousLinks / totalLinks;
    score = Math.max(0, 100 - suspiciousRatio * 100);

    // Add evidence
    evidence.push(
      `Total links analyzed: ${totalLinks} (${internalLinks} internal, ${externalLinks} external)`
    );

    if (suspiciousLinks > 0) {
      evidence.push(
        `Found ${suspiciousLinks} suspicious/malformed links (${Math.round(suspiciousRatio * 100)}%)`
      );
      recommendations.push(
        `Fix ${suspiciousLinks} suspicious links for better user experience`
      );

      // Show first few issues as examples
      const issueExamples = [...new Set(issues)].slice(0, 3);
      evidence.push(`Issues found: ${issueExamples.join(', ')}`);
    } else {
      evidence.push('No obviously malformed links detected');
    }

    // Check internal/external link balance
    if (internalLinks === 0 && externalLinks > 0) {
      score -= 10;
      evidence.push('No internal links found (poor site navigation)');
      recommendations.push(
        'Add internal links to help users navigate your site'
      );
    }

    if (externalLinks > internalLinks * 3 && internalLinks > 0) {
      evidence.push(
        'Many external links relative to internal links'
      );
      recommendations.push(
        'Balance external links with more internal navigation'
      );
    }

    // Note about full validation
    if (totalLinks > 10) {
      recommendations.push(
        `Full HTTP validation of ${totalLinks} links available in Phase 3 background analysis`
      );
    }
  } catch (error) {
    evidence.push(`Error analyzing links: ${(error as Error).message}`);
    confidence = 40;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'links'),
  };
}

/**
 * T.1.4 - Sitemap Presence (Basic Detection - Weight: 0.60)
 *
 * Checks for sitemap references in HTML and common locations.
 * Full sitemap validation (XML parsing, URL testing) in Phase 3.
 */
export function analyzeSitemapPresence(
  content: string,
  url: string
): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 70; // Medium confidence - checking references only

  try {
    const baseUrl = new URL(url).origin;
    let sitemapFound = false;

    // Check for sitemap link in HTML
    const sitemapLinkMatch = content.match(
      /<link[^>]*rel=["']sitemap["'][^>]*href=["']([^"']+)["']/i
    );

    if (sitemapLinkMatch) {
      sitemapFound = true;
      const sitemapUrl = sitemapLinkMatch[1];
      score = 100;
      evidence.push(
        `Sitemap link found in HTML: ${sitemapUrl}`
      );
    }

    // Check for sitemap.xml reference in content
    if (content.includes('sitemap.xml')) {
      if (!sitemapFound) {
        score = 80;
        sitemapFound = true;
      }
      evidence.push(
        'sitemap.xml referenced in page content'
      );
    }

    // Check for robots.txt reference (often contains sitemap)
    if (content.includes('robots.txt')) {
      evidence.push(
        'robots.txt referenced (may contain sitemap location)'
      );
    }

    // Check for structured data references to sitemap
    if (
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*sitemap[\s\S]*<\/script>/i.test(
        content
      )
    ) {
      if (!sitemapFound) {
        score = 70;
        sitemapFound = true;
      }
      evidence.push(
        'Sitemap reference in structured data (JSON-LD)'
      );
    }

    // Check for alternative sitemap formats
    const alternativeSitemaps = [
      'sitemap_index.xml',
      'sitemap-index.xml',
      'sitemap.php',
      'sitemap.txt',
    ];

    for (const altSitemap of alternativeSitemaps) {
      if (content.includes(altSitemap)) {
        if (!sitemapFound) {
          score = 75;
          sitemapFound = true;
        }
        evidence.push(
          `Alternative sitemap format found: ${altSitemap}`
        );
        break;
      }
    }

    if (!sitemapFound) {
      score = 0;
      evidence.push(
        'No sitemap references found in page content'
      );
      recommendations.push(
        'Add sitemap.xml link: <link rel="sitemap" type="application/xml" href="/sitemap.xml" />'
      );
      recommendations.push(
        `Create XML sitemap at ${baseUrl}/sitemap.xml`
      );
      recommendations.push(
        'Submit sitemap to Google Search Console and Bing Webmaster Tools'
      );
    } else {
      recommendations.push(
        'Full sitemap validation (XML parsing, URL testing) available in Phase 3'
      );
      recommendations.push(
        'Verify sitemap is accessible and properly formatted'
      );
    }

    // Additional context about sitemap importance
    evidence.push(
      'Sitemaps help search engines discover and crawl all pages efficiently'
    );
  } catch (error) {
    evidence.push(`Error analyzing sitemap presence: ${(error as Error).message}`);
    confidence = 50;
    score = 0;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'sitemap'),
  };
}

/**
 * TS.2.1 - Canonical Tags Assessment (Sprint 3 Phase 1)
 *
 * Analyzes canonical tag configuration to prevent duplicate content issues.
 * Checks for presence, self-referencing, cross-domain, and conflicting canonicals.
 */
export function analyzeCanonicalTags(
  content: string,
  url: string
): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 100;

  try {
    // Parse the page URL for comparison
    let pageUrl: URL;
    try {
      pageUrl = new URL(url);
    } catch (e) {
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

    // Extract all canonical tags from HTML
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

    // Case 1: No canonical tag found
    if (canonicalMatches.length === 0) {
      score = 0;
      evidence.push('No canonical tag found');
      recommendations.push(
        `Add a self-referencing canonical tag: <link rel="canonical" href="${url}">`
      );
      recommendations.push(
        'Canonical tags help prevent duplicate content issues and consolidate ranking signals'
      );
    }
    // Case 2: Multiple canonical tags (conflicting)
    else if (canonicalMatches.length > 1) {
      score = 20;
      evidence.push(
        `Multiple canonical tags found (${canonicalMatches.length}): ${canonicalMatches.join(', ')}`
      );
      recommendations.push(
        'Remove duplicate canonical tags - only one canonical tag should exist per page'
      );
      recommendations.push(
        'Multiple canonicals confuse search engines and may cause indexing issues'
      );
    }
    // Case 3: Single canonical tag - validate it
    else {
      const canonicalUrl = canonicalMatches[0];
      evidence.push(`Canonical tag found: ${canonicalUrl}`);

      // Check if it's an absolute URL
      let parsedCanonical: URL;
      try {
        // Try parsing as absolute URL first
        parsedCanonical = new URL(canonicalUrl);
      } catch (e) {
        // It's a relative URL - try to resolve it
        try {
          parsedCanonical = new URL(canonicalUrl, url);
          score = 60;
          evidence.push('Canonical URL is relative (not absolute format)');
          recommendations.push(
            `Convert to absolute URL: ${parsedCanonical.href}`
          );
          recommendations.push(
            'Canonical tags should always use absolute URLs for clarity'
          );
        } catch (e2) {
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

      // Compare canonical with page URL
      const isSameDomain = parsedCanonical.hostname === pageUrl.hostname;
      const normalizedCanonicalPath = parsedCanonical.pathname.replace(/\/$/, '').toLowerCase();
      const normalizedPagePath = pageUrl.pathname.replace(/\/$/, '').toLowerCase();
      const isSamePath = normalizedCanonicalPath === normalizedPagePath;

      if (isSameDomain && isSamePath) {
        // Perfect: Self-referencing canonical
        score = 100;
        evidence.push('Self-referencing canonical properly configured');
      } else if (isSameDomain && !isSamePath) {
        // Same domain, different path (intentional duplicate consolidation)
        score = 80;
        evidence.push(
          `Canonical points to different page on same domain: ${parsedCanonical.pathname}`
        );
        recommendations.push(
          'This is correct if this page is a duplicate. If not, update canonical to: ' + url
        );
      } else if (!isSameDomain) {
        // Cross-domain canonical
        score = 40;
        evidence.push(
          `Cross-domain canonical: ${parsedCanonical.hostname} (page domain: ${pageUrl.hostname})`
        );
        recommendations.push(
          'Cross-domain canonical tells search engines to attribute this content to another site'
        );
        recommendations.push(
          'Only use this for syndicated content. For original content, use: ' + url
        );
      }
    }
  } catch (error) {
    evidence.push(`Error analyzing canonical tags: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'canonical'),
  };
}

/**
 * TS.2.2 - Internal Linking Analysis (Sprint 3 Phase 2)
 *
 * Analyzes internal link count, anchor text quality, and linking patterns.
 * Good internal linking helps users navigate and distributes link equity.
 */
export function analyzeInternalLinking(
  content: string,
  url: string
): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let confidence = 90;

  try {
    const baseUrl = new URL(url);
    const domain = baseUrl.hostname;

    // Extract all anchor tags with href and text
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const allLinks: Array<{ href: string; text: string; isNofollow: boolean }> = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const href = match[1];
      // Strip HTML tags from anchor text
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      const fullTag = match[0];
      const isNofollow = /rel=["'][^"']*nofollow[^"']*["']/i.test(fullTag);

      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        allLinks.push({ href, text, isNofollow });
      }
    }

    // Separate internal and external links
    const internalLinks = allLinks.filter(link => {
      try {
        if (link.href.startsWith('/') && !link.href.startsWith('//')) {
          return true; // Relative path is internal
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

    // Count unique internal links by href
    const uniqueInternalHrefs = new Set(internalLinks.map(l => l.href.split('?')[0].split('#')[0]));
    const uniqueCount = uniqueInternalHrefs.size;

    evidence.push(`Total links found: ${allLinks.length} (${internalLinks.length} internal, ${externalLinks.length} external)`);
    evidence.push(`Unique internal link destinations: ${uniqueCount}`);

    // 1. Score based on internal link count
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

    // 2. Analyze anchor text quality
    const genericAnchors = ['click here', 'read more', 'learn more', 'here', 'this', 'link', 'more'];
    const internalAnchorTexts = internalLinks.map(l => l.text.toLowerCase());
    const genericCount = internalAnchorTexts.filter(text =>
      genericAnchors.some(generic => text === generic || text.includes(generic))
    ).length;

    if (internalLinks.length > 0) {
      const genericPercentage = (genericCount / internalLinks.length) * 100;

      if (genericPercentage > 50) {
        score -= 15;
        evidence.push(`${Math.round(genericPercentage)}% of anchors use generic text ("click here", "read more")`);
        recommendations.push('Use descriptive anchor text that indicates linked page content');
      } else {
        score += 20;
        evidence.push(`Good anchor text variety (${Math.round(100 - genericPercentage)}% descriptive)`);
      }
    }

    // 3. Check for nofollow on internal links
    const nofollowInternal = internalLinks.filter(l => l.isNofollow);
    if (nofollowInternal.length > 0) {
      score -= 20;
      evidence.push(`${nofollowInternal.length} internal link(s) have rel="nofollow"`);
      recommendations.push('Remove rel="nofollow" from internal links to pass link equity between pages');
    } else if (internalLinks.length > 0) {
      score += 20;
      evidence.push('No nofollow on internal links (link equity flows properly)');
    }

    // 4. Check for links to key pages
    const keyPagePatterns = [/^\/$/, /\/about/i, /\/contact/i, /\/services/i, /\/products/i, /\/blog/i, /\/pricing/i];
    const keyPageLinks = internalLinks.filter(link => {
      try {
        const linkUrl = new URL(link.href, url);
        return keyPagePatterns.some(pattern => pattern.test(linkUrl.pathname));
      } catch {
        return keyPagePatterns.some(pattern => pattern.test(link.href));
      }
    });

    if (keyPageLinks.length > 0) {
      score += 15;
      evidence.push(`Links to ${keyPageLinks.length} key page(s) detected (homepage, about, etc.)`);
    } else if (uniqueCount > 0) {
      recommendations.push('Consider linking to key pages like homepage, about, or contact');
    }

    // 5. Internal vs external link ratio
    if (internalLinks.length > 0 && externalLinks.length > 0) {
      const ratio = internalLinks.length / externalLinks.length;
      if (ratio >= 1) {
        score += 15;
        evidence.push(`Balanced ratio: ${internalLinks.length} internal vs ${externalLinks.length} external`);
      } else {
        evidence.push(`More external (${externalLinks.length}) than internal (${internalLinks.length}) links`);
        recommendations.push('Balance link ratio - add more internal navigation links');
      }
    } else if (internalLinks.length > 0 && externalLinks.length === 0) {
      score += 15;
      evidence.push('All links are internal (good for navigation-focused pages)');
    }

    // Cap score
    score = Math.min(Math.max(score, 0), 100);

  } catch (error) {
    evidence.push(`Error analyzing internal linking: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'internal-links'),
  };
}

/**
 * TS.2.3 - Duplicate Site Versions (Sprint 3 Phase 3)
 *
 * Analyzes potential duplicate versions (HTTP/HTTPS, www/non-www).
 * Detects issues from HTML content and URL analysis (no external HTTP requests).
 */
export function analyzeDuplicateVersions(
  content: string,
  url: string
): FactorResult {
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

    // Check 1: Protocol (HTTP vs HTTPS)
    if (!isHttps) {
      score -= 40;
      evidence.push('Site is using HTTP instead of HTTPS');
      recommendations.push('Migrate to HTTPS for security and SEO benefits');
      recommendations.push('Configure 301 redirects from HTTP to HTTPS');
    } else {
      evidence.push('Site is using HTTPS protocol (good)');
    }

    // Check 2: Mixed content warnings (HTTP resources on HTTPS page)
    const httpResourcePattern = /<(?:img|script|link|iframe)[^>]+(?:src|href)=["']http:\/\//gi;
    const mixedContentMatches = content.match(httpResourcePattern);

    if (isHttps && mixedContentMatches && mixedContentMatches.length > 0) {
      score -= 20;
      evidence.push(`Mixed content: ${mixedContentMatches.length} HTTP resource(s) on HTTPS page`);
      recommendations.push('Update all resource URLs to use HTTPS or protocol-relative URLs');
    } else if (isHttps) {
      evidence.push('No mixed content detected');
    }

    // Check 3: Internal links using HTTP while page is HTTPS
    const domainEscaped = urlObj.hostname.replace(/\./g, '\\.');
    const internalHttpLinksRegex = new RegExp(`<a[^>]+href=["']http://${domainEscaped}`, 'gi');
    const internalHttpLinks = content.match(internalHttpLinksRegex);

    if (isHttps && internalHttpLinks && internalHttpLinks.length > 0) {
      score -= 15;
      evidence.push(`${internalHttpLinks.length} internal link(s) using HTTP on HTTPS page`);
      recommendations.push('Update internal links to use HTTPS or relative URLs');
    }

    // Check 4: Canonical tag analysis
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
          score += 10; // Bonus for proper HTTPS canonical
          evidence.push('Canonical tag uses HTTPS (good)');
        } else {
          score -= 10;
          evidence.push('Canonical tag uses HTTP instead of HTTPS');
          recommendations.push('Update canonical tag to use HTTPS URL');
        }

        // Check www consistency
        const canonicalHasWww = canonicalObj.hostname.startsWith('www.');
        if (hasWww !== canonicalHasWww) {
          evidence.push(`URL uses ${hasWww ? 'www' : 'non-www'} but canonical uses ${canonicalHasWww ? 'www' : 'non-www'}`);
          recommendations.push('Ensure consistent www/non-www usage and set up 301 redirects');
        }
      } catch (e) {
        evidence.push('Canonical URL could not be parsed');
      }
    } else {
      score -= 10;
      evidence.push('No canonical tag to declare preferred version');
      recommendations.push('Add canonical tag to specify preferred URL version (HTTPS, www or non-www)');
    }

    // Check 5: Hreflang tags with mixed protocols
    const hreflangPattern = /<link[^>]+rel=["']alternate["'][^>]+hreflang=["'][^"']+["'][^>]+href=["']([^"']+)["']/gi;
    let hreflangMatch;
    const hreflangUrls: string[] = [];
    while ((hreflangMatch = hreflangPattern.exec(content)) !== null) {
      hreflangUrls.push(hreflangMatch[1]);
    }

    if (hreflangUrls.length > 0) {
      const hasHttpHreflang = hreflangUrls.some(u => u.startsWith('http://'));
      const hasHttpsHreflang = hreflangUrls.some(u => u.startsWith('https://'));

      if (hasHttpHreflang && hasHttpsHreflang) {
        evidence.push('Hreflang tags reference both HTTP and HTTPS versions');
        recommendations.push('Ensure all hreflang URLs use consistent protocol (HTTPS)');
      }
    }

    // Cap score
    score = Math.min(Math.max(score, 0), 100);

  } catch (error) {
    evidence.push(`Error analyzing duplicate versions: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'duplicate-versions'),
  };
}

/**
 * TS.2.4 - Robots.txt Configuration (Sprint 3 Phase 4)
 *
 * Analyzes robot directives from HTML meta tags.
 * NOTE: Instant analysis - does NOT fetch actual robots.txt file.
 * Analyzes meta robots, X-Robots-Tag, and bot-specific directives.
 */
export function analyzeRobotsTxt(
  content: string,
  url: string
): FactorResult {
  const startTime = Date.now();
  const evidence: string[] = [];
  const recommendations: string[] = [];
  let score = 100;
  let confidence = 80; // Lower confidence - HTML meta analysis only, not actual robots.txt

  try {
    let hasBlockingIssues = false;

    // 1. Check for meta robots tag
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

      if (robotsContent.includes('noarchive')) {
        evidence.push('Page has noarchive directive (cached versions blocked)');
      }

      if (robotsContent.includes('nosnippet')) {
        evidence.push('Page has nosnippet directive (snippets in SERPs blocked)');
      }
    } else {
      evidence.push('No meta robots tag (indexing allowed by default)');
    }

    // 2. Check for X-Robots-Tag meta equivalent
    const xRobotsMatch = content.match(
      /<meta\s+http-equiv=["']X-Robots-Tag["']\s+content=["']([^"']+)["']/i
    );

    if (xRobotsMatch) {
      const xRobotsContent = xRobotsMatch[1].toLowerCase();
      evidence.push(`X-Robots-Tag meta equivalent: ${xRobotsMatch[1]}`);

      if (xRobotsContent.includes('noindex') || xRobotsContent.includes('none')) {
        score -= 25;
        hasBlockingIssues = true;
        evidence.push('X-Robots-Tag is blocking indexing');
        recommendations.push('Review X-Robots-Tag configuration');
      }
    }

    // 3. Check for googlebot-specific directives
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

    // 4. Check for bingbot-specific directives
    const bingbotMatch = content.match(
      /<meta\s+name=["']bingbot["']\s+content=["']([^"']+)["']/i
    );

    if (bingbotMatch) {
      const bingbotContent = bingbotMatch[1].toLowerCase();
      evidence.push(`Bingbot directive: ${bingbotMatch[1]}`);

      if (bingbotContent.includes('noindex') || bingbotContent.includes('none')) {
        score -= 15;
        hasBlockingIssues = true;
        evidence.push('Bingbot specifically blocked from indexing');
        recommendations.push('Remove Bingbot noindex to allow Bing indexing');
      }
    }

    // 5. Check for conflicting directives
    const allBotMetas = content.match(/<meta\s+name=["'][^"']*bot[^"']*["'][^>]*>/gi) || [];
    if (allBotMetas.length > 1) {
      // Extract content from each
      const directives = allBotMetas.map(tag => {
        const contentMatch = tag.match(/content=["']([^"']+)["']/i);
        return contentMatch ? contentMatch[1].toLowerCase() : '';
      });

      const hasIndex = directives.some(d => d.includes('index') && !d.includes('noindex'));
      const hasNoindex = directives.some(d => d.includes('noindex'));

      if (hasIndex && hasNoindex) {
        score -= 10;
        evidence.push('Conflicting robot directives detected');
        recommendations.push('Ensure consistent directives across all robot meta tags');
        confidence -= 10;
      }
    }

    // 6. Check for sitemap references (bonus)
    const hasSitemapRef = content.toLowerCase().includes('sitemap.xml') ||
      /<link[^>]*rel=["']sitemap["']/i.test(content);

    if (hasSitemapRef) {
      score += 10;
      evidence.push('Sitemap reference found (aids discoverability)');
    }

    // Add positive message if no issues
    if (!hasBlockingIssues) {
      evidence.push('No robot blocking directives detected in HTML');
    }

    // Add analysis note
    evidence.push('Analysis based on HTML meta tags (actual robots.txt file not fetched)');

    // Cap score
    score = Math.min(Math.max(score, 0), 100);

  } catch (error) {
    evidence.push(`Error analyzing robot directives: ${(error as Error).message}`);
    confidence = 50;
    score = 50;
  }

  const processingTimeMs = Date.now() - startTime;

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
    processing_time_ms: processingTimeMs,
    severity: getSeverity(score, 'robots-txt'),
  };
}

/**
 * Analyze all traditional SEO factors
 * Convenience function to run all factors at once (Sprint 2 + Sprint 3)
 */
export function analyzeAllTraditionalSeoFactors(
  content: string,
  url: string,
  userTier: string = 'free'
): FactorResult[] {
  const results: FactorResult[] = [];

  // T.1.1 - Indexability Status (Free tier)
  results.push(analyzeIndexability(content, url));

  // T.1.2 - Mobile Friendliness (Solo+ tier)
  if (userTier !== 'free') {
    results.push(analyzeMobileFriendly(content));
  }

  // P.1.1 - Page Speed Mobile (Solo+ tier)
  if (userTier !== 'free') {
    results.push(analyzePageSpeedStub(content));
  }

  // T.1.3 - Broken Links (Solo+ tier)
  if (userTier !== 'free') {
    results.push(analyzeBrokenLinksBasic(content, url));
  }

  // T.1.4 - Sitemap Presence (Solo+ tier)
  if (userTier !== 'free') {
    results.push(analyzeSitemapPresence(content, url));
  }

  // TS.2.1 - Canonical Tags (Solo+ tier) - Sprint 3 Phase 1
  if (userTier !== 'free') {
    results.push(analyzeCanonicalTags(content, url));
  }

  // TS.2.2 - Internal Linking (Solo+ tier) - Sprint 3 Phase 2
  if (userTier !== 'free') {
    results.push(analyzeInternalLinking(content, url));
  }

  // TS.2.3 - Duplicate Site Versions (Solo+ tier) - Sprint 3 Phase 3
  if (userTier !== 'free') {
    results.push(analyzeDuplicateVersions(content, url));
  }

  // TS.2.4 - Robots.txt Configuration (Solo+ tier) - Sprint 3 Phase 4
  if (userTier !== 'free') {
    results.push(analyzeRobotsTxt(content, url));
  }

  return results;
}
