/**
 * Tests for siteProbes (AIS-ISS-3): robots.txt and sitemap.xml must be
 * actually fetched and validated, not inferred from page HTML.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { probeSiteFiles, parseRobotsTxt } from './siteProbes';

const ROBOTS_WITH_SITEMAP = [
  'User-Agent: *',
  'Allow: /',
  'Disallow: /admin',
  '',
  'Sitemap: https://example.com/sitemap.xml',
  '',
].join('\n');

const VALID_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc></url>
  <url><loc>https://example.com/about</loc></url>
  <url><loc>https://example.com/blog</loc></url>
</urlset>`;

function mockFetchRoutes(routes: Record<string, { status: number; body: string }>) {
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
    const url = String(input);
    const route = routes[url];
    if (!route) return new Response('not found', { status: 404 });
    return new Response(route.body, { status: route.status });
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseRobotsTxt', () => {
  it('extracts sitemap declarations and detects no blanket disallow', () => {
    const parsed = parseRobotsTxt(ROBOTS_WITH_SITEMAP, 'https://example.com');
    expect(parsed.sitemapUrls).toEqual(['https://example.com/sitemap.xml']);
    expect(parsed.disallowAll).toBe(false);
  });

  it('detects a blanket Disallow: / under User-agent: *', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /\n', 'https://example.com');
    expect(parsed.disallowAll).toBe(true);
  });

  it('does not flag disallowAll when the rule is scoped to one bot', () => {
    const parsed = parseRobotsTxt('User-agent: BadBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n', 'https://example.com');
    expect(parsed.disallowAll).toBe(false);
  });
});

describe('probeSiteFiles', () => {
  it('finds a valid sitemap declared in robots.txt', async () => {
    mockFetchRoutes({
      'https://example.com/robots.txt': { status: 200, body: ROBOTS_WITH_SITEMAP },
      'https://example.com/sitemap.xml': { status: 200, body: VALID_SITEMAP },
    });

    const probe = await probeSiteFiles('https://example.com/some-page');
    expect(probe.robots.fetched).toBe(true);
    expect(probe.robots.sitemapUrls).toEqual(['https://example.com/sitemap.xml']);
    expect(probe.sitemap.found).toBe(true);
    expect(probe.sitemap.isValid).toBe(true);
    expect(probe.sitemap.urlCount).toBe(3);
  });

  it('falls back to /sitemap.xml when robots.txt is missing', async () => {
    mockFetchRoutes({
      'https://example.com/sitemap.xml': { status: 200, body: VALID_SITEMAP },
    });

    const probe = await probeSiteFiles('https://example.com/');
    expect(probe.robots.fetched).toBe(false);
    expect(probe.sitemap.found).toBe(true);
    expect(probe.sitemap.isValid).toBe(true);
  });

  it('reports no sitemap when nothing exists', async () => {
    mockFetchRoutes({});

    const probe = await probeSiteFiles('https://example.com/');
    expect(probe.robots.fetched).toBe(false);
    expect(probe.sitemap.found).toBe(false);
    expect(probe.sitemap.isValid).toBe(false);
    expect(probe.sitemap.urlCount).toBe(0);
  });

  it('marks a 200 response that is not XML as found but invalid', async () => {
    mockFetchRoutes({
      'https://example.com/sitemap.xml': { status: 200, body: '<!doctype html><html><body>SPA shell</body></html>' },
    });

    const probe = await probeSiteFiles('https://example.com/');
    expect(probe.sitemap.found).toBe(true);
    expect(probe.sitemap.isValid).toBe(false);
  });

  it('does not treat an HTML page served at /robots.txt as a robots file', async () => {
    mockFetchRoutes({
      'https://example.com/robots.txt': { status: 200, body: '<!doctype html><html><body>404 page</body></html>' },
    });

    const probe = await probeSiteFiles('https://example.com/');
    expect(probe.robots.fetched).toBe(false);
  });

  it('detects a sitemap index', async () => {
    const index = `<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
    </sitemapindex>`;
    mockFetchRoutes({
      'https://example.com/sitemap.xml': { status: 200, body: index },
    });

    const probe = await probeSiteFiles('https://example.com/');
    expect(probe.sitemap.isValid).toBe(true);
    expect(probe.sitemap.isIndex).toBe(true);
    expect(probe.sitemap.urlCount).toBe(1);
  });
});
