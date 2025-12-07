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
function getSeverity(score: number, factorType: 'indexability' | 'mobile' | 'speed' | 'links' | 'sitemap'): FactorSeverity {
  switch (factorType) {
    case 'indexability':
      // Most critical - noindex blocks everything
      if (score < 30) return 'blocker';
      if (score < 70) return 'warning';
      return 'ok';
    case 'mobile':
      // Important for mobile-first indexing
      if (score < 40) return 'warning';
      if (score < 70) return 'info';
      return 'ok';
    case 'speed':
      // Impacts user experience and rankings
      if (score < 30) return 'warning';
      if (score < 60) return 'info';
      return 'ok';
    case 'links':
      // Broken links hurt credibility
      if (score < 50) return 'warning';
      if (score < 80) return 'info';
      return 'ok';
    case 'sitemap':
      // Helpful but not critical
      if (score < 50) return 'info';
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
    factor_id: 'T.1.1',
    factor_name: 'Indexability Status',
    pillar: 'T',
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
    factor_id: 'T.1.2',
    factor_name: 'Mobile Friendliness',
    pillar: 'T',
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
        factor_id: 'T.1.3',
        factor_name: 'Broken Links Check',
        pillar: 'T',
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
    factor_id: 'T.1.3',
    factor_name: 'Broken Links Check',
    pillar: 'T',
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
    factor_id: 'T.1.4',
    factor_name: 'Sitemap Presence',
    pillar: 'T',
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
 * Analyze all traditional SEO factors
 * Convenience function to run all 5 factors at once
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

  return results;
}
