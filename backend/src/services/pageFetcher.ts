/**
 * Page Fetcher Service
 *
 * Intelligent page content fetching with hybrid strategy:
 * 1. First, try direct fetch (fast, efficient)
 * 2. Detect if page is CSR (Client-Side Rendered)
 * 3. If CSR detected, use Puppeteer to render JavaScript
 *
 * This approach ensures:
 * - Fast analysis for SSR/SSG sites (majority of web)
 * - Accurate analysis for React/Vue/Angular SPAs
 * - Efficient resource usage (Puppeteer only when needed)
 */

import { detectCSR, quickCSRCheck, CSRDetectionResult } from './csrDetector';
import { renderPage, RenderResult } from './browserRenderer';

export interface FetchResult {
  success: boolean;
  html: string;
  url: string;
  finalUrl: string;
  method: 'fetch' | 'puppeteer';
  statusCode?: number;
  csrDetection?: CSRDetectionResult;
  renderResult?: RenderResult;
  error?: string;
  fetchTimeMs: number;
}

const FETCH_TIMEOUT_MS = 30000; // 30 seconds for direct fetch

/**
 * Direct fetch using native fetch API
 */
async function directFetch(url: string): Promise<{
  success: boolean;
  html: string;
  statusCode: number;
  finalUrl: string;
  error?: string;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AImpactScanner/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const html = await response.text();

    return {
      success: response.ok,
      html,
      statusCode: response.status,
      finalUrl: response.url,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeout);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      html: '',
      statusCode: 0,
      finalUrl: url,
      error: errorMessage,
    };
  }
}

/**
 * Fetch page content with intelligent CSR detection
 *
 * @param url - URL to fetch
 * @param forcePuppeteer - Skip CSR detection and always use Puppeteer
 * @param skipPuppeteer - Never use Puppeteer (for free tier)
 */
export async function fetchPageContent(
  url: string,
  options: {
    forcePuppeteer?: boolean;
    skipPuppeteer?: boolean;
  } = {}
): Promise<FetchResult> {
  const startTime = Date.now();
  const { forcePuppeteer = false, skipPuppeteer = false } = options;

  // Option 1: Force Puppeteer (skip direct fetch)
  if (forcePuppeteer && !skipPuppeteer) {
    console.log(`[PageFetcher] Forced Puppeteer rendering for ${url}`);
    const renderResult = await renderPage(url);

    return {
      success: renderResult.success,
      html: renderResult.html,
      url,
      finalUrl: renderResult.finalUrl,
      method: 'puppeteer',
      renderResult,
      error: renderResult.error,
      fetchTimeMs: Date.now() - startTime,
    };
  }

  // Option 2: Direct fetch first
  console.log(`[PageFetcher] Direct fetch for ${url}`);
  const fetchResult = await directFetch(url);

  if (!fetchResult.success) {
    // Direct fetch failed - try Puppeteer as fallback (unless disabled)
    if (!skipPuppeteer) {
      console.log(`[PageFetcher] Direct fetch failed, trying Puppeteer for ${url}`);
      const renderResult = await renderPage(url);

      return {
        success: renderResult.success,
        html: renderResult.html,
        url,
        finalUrl: renderResult.finalUrl,
        method: 'puppeteer',
        renderResult,
        error: renderResult.error,
        fetchTimeMs: Date.now() - startTime,
      };
    }

    return {
      success: false,
      html: '',
      url,
      finalUrl: url,
      method: 'fetch',
      statusCode: fetchResult.statusCode,
      error: fetchResult.error,
      fetchTimeMs: Date.now() - startTime,
    };
  }

  // Option 3: Check if content is CSR and needs rendering
  if (!skipPuppeteer) {
    // Quick check first (fast)
    if (quickCSRCheck(fetchResult.html)) {
      console.log(`[PageFetcher] Quick CSR check positive, using Puppeteer for ${url}`);
      const renderResult = await renderPage(url);

      // If Puppeteer fails, fall back to direct fetch content
      if (!renderResult.success) {
        console.log(`[PageFetcher] Puppeteer failed, using direct fetch content for ${url}`);
        return {
          success: true,
          html: fetchResult.html,
          url,
          finalUrl: fetchResult.finalUrl,
          method: 'fetch',
          statusCode: fetchResult.statusCode,
          fetchTimeMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        html: renderResult.html,
        url,
        finalUrl: renderResult.finalUrl,
        method: 'puppeteer',
        renderResult,
        fetchTimeMs: Date.now() - startTime,
      };
    }

    // Full CSR detection (more accurate but slower)
    const csrDetection = detectCSR(fetchResult.html);

    if (csrDetection.isCSR) {
      console.log(
        `[PageFetcher] CSR detected (confidence: ${csrDetection.confidence}%) for ${url}`,
        csrDetection.signals
      );

      const renderResult = await renderPage(url);

      // If Puppeteer fails, fall back to direct fetch content
      if (!renderResult.success) {
        console.log(`[PageFetcher] Puppeteer failed, using direct fetch content for ${url}`);
        return {
          success: true,
          html: fetchResult.html,
          url,
          finalUrl: fetchResult.finalUrl,
          method: 'fetch',
          statusCode: fetchResult.statusCode,
          csrDetection,
          fetchTimeMs: Date.now() - startTime,
        };
      }

      return {
        success: true,
        html: renderResult.html,
        url,
        finalUrl: renderResult.finalUrl,
        method: 'puppeteer',
        csrDetection,
        renderResult,
        fetchTimeMs: Date.now() - startTime,
      };
    }

    // Not CSR - use direct fetch content
    console.log(
      `[PageFetcher] SSR/SSG detected (CSR confidence: ${csrDetection.confidence}%) for ${url}`
    );

    return {
      success: true,
      html: fetchResult.html,
      url,
      finalUrl: fetchResult.finalUrl,
      method: 'fetch',
      statusCode: fetchResult.statusCode,
      csrDetection,
      fetchTimeMs: Date.now() - startTime,
    };
  }

  // Puppeteer disabled - return direct fetch result
  return {
    success: true,
    html: fetchResult.html,
    url,
    finalUrl: fetchResult.finalUrl,
    method: 'fetch',
    statusCode: fetchResult.statusCode,
    fetchTimeMs: Date.now() - startTime,
  };
}

/**
 * Check if Puppeteer should be available for a user tier
 */
export function isPuppeteerEnabledForTier(tier: string): boolean {
  // Free tier doesn't get Puppeteer (too resource-intensive)
  const puppeteerTiers = ['coffee', 'growth', 'scale', 'professional', 'enterprise'];
  return puppeteerTiers.includes(tier.toLowerCase());
}
