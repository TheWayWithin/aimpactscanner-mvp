/**
 * CSR Detection Service
 *
 * Detects whether a webpage is Client-Side Rendered (CSR) and needs
 * Puppeteer for proper content extraction.
 *
 * Detection signals:
 * - Empty or minimal body content
 * - React/Vue/Angular/Svelte root elements
 * - Large JavaScript bundles with minimal HTML
 * - Noscript fallback content
 */

export interface CSRDetectionResult {
  isCSR: boolean;
  confidence: number; // 0-100
  signals: string[];
  contentLength: number;
  scriptCount: number;
  textContentLength: number;
}

/**
 * Patterns that indicate CSR frameworks
 */
const CSR_FRAMEWORK_PATTERNS = [
  // React
  { pattern: /<div\s+id=["']root["']\s*>/i, name: 'React root element' },
  { pattern: /<div\s+id=["']app["']\s*>/i, name: 'Vue/generic app root' },
  { pattern: /<div\s+id=["']__next["']/i, name: 'Next.js root' },
  { pattern: /data-reactroot/i, name: 'React data attribute' },
  { pattern: /ng-app|ng-controller/i, name: 'Angular 1.x directives' },
  { pattern: /<app-root/i, name: 'Angular component' },
  { pattern: /data-v-[a-f0-9]+/i, name: 'Vue scoped styles' },
  { pattern: /__NUXT__/i, name: 'Nuxt.js hydration' },
  { pattern: /__NEXT_DATA__/i, name: 'Next.js data' },
  { pattern: /svelte-[a-z0-9]+/i, name: 'Svelte component' },
];

/**
 * Patterns that indicate the page has meaningful content (SSR/SSG)
 */
const SSR_CONTENT_PATTERNS = [
  /<article/i,
  /<main[^>]*>[^<]{100,}/i, // Main with substantial content
  /<h1[^>]*>[^<]+<\/h1>/i,  // H1 with content
  /<p[^>]*>[^<]{50,}<\/p>/i, // Paragraphs with content
];

/**
 * Extract text content length from HTML (rough estimate)
 */
function getTextContentLength(html: string): number {
  // Remove scripts, styles, and HTML tags
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '');
  const withoutTags = withoutStyles.replace(/<[^>]+>/g, ' ');
  const text = withoutTags.replace(/\s+/g, ' ').trim();
  return text.length;
}

/**
 * Count script tags in HTML
 */
function countScripts(html: string): number {
  const matches = html.match(/<script/gi);
  return matches ? matches.length : 0;
}

/**
 * Check for noscript fallback content
 */
function hasNoscriptFallback(html: string): boolean {
  const noscriptMatch = html.match(/<noscript[^>]*>([\s\S]*?)<\/noscript>/i);
  if (!noscriptMatch) return false;

  // Check if noscript has meaningful content (not just a message)
  const noscriptContent = noscriptMatch[1];
  return noscriptContent.length > 100 ||
         /enable\s+javascript|javascript\s+required/i.test(noscriptContent);
}

/**
 * Check if body content is minimal (typical of CSR apps)
 */
function hasMinimalBody(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return false;

  const bodyContent = bodyMatch[1];
  // Remove scripts and check remaining content
  const withoutScripts = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, '');
  const textLength = withoutScripts.replace(/<[^>]+>/g, '').trim().length;

  // If body has very little text but scripts, likely CSR
  return textLength < 500 && countScripts(bodyContent) > 2;
}

/**
 * Detect if a webpage is Client-Side Rendered
 */
export function detectCSR(html: string): CSRDetectionResult {
  const signals: string[] = [];
  let csrScore = 0;

  const contentLength = html.length;
  const scriptCount = countScripts(html);
  const textContentLength = getTextContentLength(html);

  // Check for CSR framework patterns
  for (const { pattern, name } of CSR_FRAMEWORK_PATTERNS) {
    if (pattern.test(html)) {
      signals.push(`Found: ${name}`);
      csrScore += 15;
    }
  }

  // Check for minimal body content
  if (hasMinimalBody(html)) {
    signals.push('Minimal body content detected');
    csrScore += 25;
  }

  // Check for noscript fallback
  if (hasNoscriptFallback(html)) {
    signals.push('JavaScript required fallback detected');
    csrScore += 20;
  }

  // Check text-to-HTML ratio
  const textRatio = textContentLength / contentLength;
  if (textRatio < 0.1 && scriptCount > 3) {
    signals.push(`Low text ratio (${(textRatio * 100).toFixed(1)}%) with ${scriptCount} scripts`);
    csrScore += 20;
  }

  // Check for SSR indicators (reduce CSR score)
  for (const pattern of SSR_CONTENT_PATTERNS) {
    if (pattern.test(html)) {
      csrScore -= 10;
    }
  }

  // Normalize score
  const confidence = Math.max(0, Math.min(100, csrScore));
  const isCSR = confidence >= 40;

  return {
    isCSR,
    confidence,
    signals,
    contentLength,
    scriptCount,
    textContentLength,
  };
}

/**
 * Quick check if page definitely needs Puppeteer
 * (for cases where we want to skip detailed detection)
 */
export function quickCSRCheck(html: string): boolean {
  // Very minimal content is a strong CSR indicator
  const textLength = getTextContentLength(html);
  if (textLength < 200 && countScripts(html) > 2) {
    return true;
  }

  // Check for obvious CSR framework markers
  if (/<div\s+id=["'](root|app|__next)["']\s*><\/div>/i.test(html)) {
    return true;
  }

  return false;
}
