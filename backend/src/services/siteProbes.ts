/**
 * Site File Probes
 *
 * Fetches the site files that several Traditional SEO factors score against
 * (robots.txt and the XML sitemap) so those factors evaluate reality instead
 * of guessing from page-HTML references (AIS-ISS-3).
 *
 * One probe runs per analysis and the result is passed into the factors, so
 * robots.txt is fetched exactly once even though two factors use it.
 */

export interface RobotsProbe {
  attempted: boolean;
  fetched: boolean; // true only when we got a 200 that looks like a robots.txt
  status?: number;
  content?: string;
  sitemapUrls: string[]; // absolute URLs from "Sitemap:" declarations
  disallowAll: boolean; // a "User-agent: *" group contains "Disallow: /"
  error?: string;
}

export interface SitemapProbe {
  attempted: boolean;
  found: boolean; // an HTTP 200 response existed at a candidate URL
  url?: string;
  status?: number;
  isValid: boolean; // parses as <urlset> or <sitemapindex>
  isIndex: boolean;
  urlCount: number; // <loc> entries in the fetched document
  error?: string;
}

export interface SiteProbeResult {
  origin: string;
  robots: RobotsProbe;
  sitemap: SitemapProbe;
}

const PROBE_TIMEOUT_MS = 8000;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // sitemaps can be large; cap what we inspect

async function fetchText(url: string): Promise<{ status: number; body: string } | { error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AImpactScanner/1.0; +https://aimpactscanner.com)',
        'Accept': 'text/plain,application/xml,text/xml,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    const body = (await response.text()).slice(0, MAX_BODY_BYTES);
    return { status: response.status, body };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown fetch error' };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse robots.txt content for Sitemap declarations and a blanket
 * "Disallow: /" under a "User-agent: *" group.
 */
export function parseRobotsTxt(content: string, origin: string): { sitemapUrls: string[]; disallowAll: boolean } {
  const sitemapUrls: string[] = [];
  let disallowAll = false;
  let inWildcardGroup = false;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'sitemap' && value) {
      try {
        sitemapUrls.push(new URL(value, origin).href);
      } catch {
        // Ignore malformed sitemap URLs
      }
    } else if (key === 'user-agent') {
      inWildcardGroup = value === '*';
    } else if (key === 'disallow' && inWildcardGroup && value === '/') {
      disallowAll = true;
    }
  }

  return { sitemapUrls, disallowAll };
}

function looksLikeRobotsTxt(body: string): boolean {
  // Guard against hosts serving an HTML error/SPA page with a 200 status
  const head = body.slice(0, 500).trimStart().toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html')) return false;
  return true;
}

async function probeRobots(origin: string): Promise<RobotsProbe> {
  const result = await fetchText(`${origin}/robots.txt`);

  if ('error' in result) {
    return { attempted: true, fetched: false, sitemapUrls: [], disallowAll: false, error: result.error };
  }

  if (result.status !== 200 || !looksLikeRobotsTxt(result.body)) {
    return { attempted: true, fetched: false, status: result.status, sitemapUrls: [], disallowAll: false };
  }

  const { sitemapUrls, disallowAll } = parseRobotsTxt(result.body, origin);
  return {
    attempted: true,
    fetched: true,
    status: result.status,
    content: result.body,
    sitemapUrls,
    disallowAll,
  };
}

function evaluateSitemapBody(body: string): { isValid: boolean; isIndex: boolean; urlCount: number } {
  const isIndex = /<sitemapindex[\s>]/i.test(body);
  const isUrlset = /<urlset[\s>]/i.test(body);
  const urlCount = (body.match(/<loc[\s>]/gi) || []).length;
  return { isValid: isIndex || isUrlset, isIndex, urlCount };
}

async function probeSitemap(origin: string, declaredUrls: string[]): Promise<SitemapProbe> {
  // Prefer sitemaps the site itself declares in robots.txt, then well-known paths
  const candidates = [
    ...declaredUrls,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ].filter((url, index, all) => all.indexOf(url) === index);

  let firstError: string | undefined;
  let lastStatus: number | undefined;

  for (const candidate of candidates) {
    const result = await fetchText(candidate);

    if ('error' in result) {
      firstError = firstError || result.error;
      continue;
    }

    lastStatus = result.status;
    if (result.status !== 200) continue;

    const evaluation = evaluateSitemapBody(result.body);
    return {
      attempted: true,
      found: true,
      url: candidate,
      status: result.status,
      ...evaluation,
    };
  }

  return {
    attempted: true,
    found: false,
    status: lastStatus,
    isValid: false,
    isIndex: false,
    urlCount: 0,
    error: firstError,
  };
}

/**
 * Fetch robots.txt and discover/validate the XML sitemap for the site
 * that hosts pageUrl. Never throws; failures are reported in the result.
 */
export async function probeSiteFiles(pageUrl: string): Promise<SiteProbeResult> {
  const origin = new URL(pageUrl).origin;
  const robots = await probeRobots(origin);
  const sitemap = await probeSitemap(origin, robots.sitemapUrls);
  return { origin, robots, sitemap };
}
