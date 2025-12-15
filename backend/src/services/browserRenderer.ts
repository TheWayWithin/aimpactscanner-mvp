/**
 * Browser Renderer Service
 *
 * Uses Puppeteer to render JavaScript-heavy (CSR) pages.
 * Features:
 * - Browser instance pooling for efficiency
 * - Request interception to block ads/tracking
 * - Configurable timeouts and viewport
 * - Graceful error handling and recovery
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Configuration
const PAGE_LOAD_TIMEOUT_MS = 60000; // 60 seconds for initial load
const BROWSER_IDLE_TIMEOUT_MS = 300000; // 5 minutes idle before closing

// Blocked resource types for faster loading
const BLOCKED_RESOURCE_TYPES = [
  'image',
  'media',
  'font',
  'stylesheet', // We only need HTML content
];

// Blocked URL patterns (ads, tracking, analytics)
const BLOCKED_URL_PATTERNS = [
  'google-analytics',
  'googletagmanager',
  'facebook.net',
  'doubleclick',
  'hotjar',
  'mixpanel',
  'segment.io',
  'amplitude',
  'intercom',
  'crisp.chat',
  'hubspot',
  'drift.com',
];

export interface RenderResult {
  success: boolean;
  html: string;
  url: string;
  finalUrl: string;
  loadTimeMs: number;
  error?: string;
}

// Browser pool
let browserInstance: Browser | null = null;
let browserLastUsed: number = 0;
let browserIdleTimer: NodeJS.Timeout | null = null;

/**
 * Get or create browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    browserLastUsed = Date.now();
    return browserInstance;
  }

  console.log('[BrowserRenderer] Launching new browser instance...');

  // Use system Chromium in production (set via PUPPETEER_EXECUTABLE_PATH)
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // Required for some container environments
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--metrics-recording-only',
      '--mute-audio',
      '--safebrowsing-disable-auto-update',
    ],
  });

  browserLastUsed = Date.now();

  // Set up idle cleanup
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
  }

  browserIdleTimer = setInterval(async () => {
    if (browserInstance && Date.now() - browserLastUsed > BROWSER_IDLE_TIMEOUT_MS) {
      console.log('[BrowserRenderer] Closing idle browser instance');
      await closeBrowser();
    }
  }, 60000); // Check every minute

  console.log('[BrowserRenderer] Browser instance ready');
  return browserInstance;
}

/**
 * Close browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browserIdleTimer) {
    clearInterval(browserIdleTimer);
    browserIdleTimer = null;
  }

  if (browserInstance) {
    try {
      await browserInstance.close();
    } catch (error) {
      console.error('[BrowserRenderer] Error closing browser:', error);
    }
    browserInstance = null;
  }
}

/**
 * Configure page for efficient rendering
 */
async function configurePage(page: Page): Promise<void> {
  // Set viewport
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Set user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AImpactScanner/1.0'
  );

  // Enable request interception
  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const resourceType = request.resourceType();
    const url = request.url().toLowerCase();

    // Block unnecessary resource types
    if (BLOCKED_RESOURCE_TYPES.includes(resourceType)) {
      request.abort();
      return;
    }

    // Block tracking/analytics URLs
    if (BLOCKED_URL_PATTERNS.some(pattern => url.includes(pattern))) {
      request.abort();
      return;
    }

    request.continue();
  });

  // Suppress console messages from the page
  page.on('console', () => {});
  page.on('pageerror', () => {});
}

/**
 * Render a page using Puppeteer
 */
export async function renderPage(url: string): Promise<RenderResult> {
  const startTime = Date.now();
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await configurePage(page);

    // Set timeouts
    page.setDefaultTimeout(PAGE_LOAD_TIMEOUT_MS);
    page.setDefaultNavigationTimeout(PAGE_LOAD_TIMEOUT_MS);

    console.log(`[BrowserRenderer] Navigating to ${url}`);

    // Navigate with wait until networkidle2 (allows 2 connections)
    // This is more lenient than networkidle0 but still waits for most content
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });

    if (!response) {
      throw new Error('No response received from page');
    }

    const status = response.status();
    if (status >= 400) {
      throw new Error(`HTTP error: ${status}`);
    }

    // Additional wait for JavaScript to render
    // Wait for body to have substantial content (or timeout after 10s)
    try {
      await page.waitForFunction(
        'document.body && document.body.innerText && document.body.innerText.length > 500',
        { timeout: 10000 }
      );
    } catch {
      // Timeout is acceptable - continue with whatever content we have
      console.log('[BrowserRenderer] Content wait timeout - continuing with available content');
    }

    // Extract rendered HTML
    const html = await page.content();
    const finalUrl = page.url();

    const loadTimeMs = Date.now() - startTime;
    console.log(`[BrowserRenderer] Rendered ${url} in ${loadTimeMs}ms (${html.length} bytes)`);

    return {
      success: true,
      html,
      url,
      finalUrl,
      loadTimeMs,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BrowserRenderer] Failed to render ${url}:`, errorMessage);

    return {
      success: false,
      html: '',
      url,
      finalUrl: url,
      loadTimeMs: Date.now() - startTime,
      error: errorMessage,
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch {
        // Ignore page close errors
      }
    }
  }
}

/**
 * Check if browser is healthy and restart if needed
 */
export async function ensureBrowserHealth(): Promise<boolean> {
  try {
    if (!browserInstance || !browserInstance.connected) {
      await getBrowser();
    }

    // Quick health check - try to create and close a page
    const page = await browserInstance!.newPage();
    await page.close();

    return true;
  } catch (error) {
    console.error('[BrowserRenderer] Browser health check failed:', error);

    // Try to restart browser
    await closeBrowser();
    try {
      await getBrowser();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Get browser stats for monitoring
 */
export function getBrowserStats(): {
  isRunning: boolean;
  lastUsed: number;
  idleMs: number;
} {
  return {
    isRunning: browserInstance !== null && browserInstance.connected,
    lastUsed: browserLastUsed,
    idleMs: browserLastUsed ? Date.now() - browserLastUsed : 0,
  };
}
