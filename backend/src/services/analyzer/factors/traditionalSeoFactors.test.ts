/**
 * Regression tests for AIS-ISS-3: TS.1.4 (Sitemap Presence) and TS.2.4
 * (Robots.txt Configuration) must score the actually-fetched files.
 */
import { describe, it, expect } from 'vitest';
import { analyzeSitemapPresence, analyzeRobotsTxt, analyzeIndexability } from './traditionalSeoFactors';
import { SiteProbeResult } from '../../siteProbes';

const PAGE_URL = 'https://example.com/';
// Page HTML with NO sitemap reference — the jamiewatters.work case
const HTML_NO_SITEMAP_REF = '<html><head><title>Test</title></head><body>Hello</body></html>';

function probeWith(overrides: {
  robots?: Partial<SiteProbeResult['robots']>;
  sitemap?: Partial<SiteProbeResult['sitemap']>;
}): SiteProbeResult {
  return {
    origin: 'https://example.com',
    robots: {
      attempted: true,
      fetched: true,
      status: 200,
      content: 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n',
      sitemapUrls: ['https://example.com/sitemap.xml'],
      disallowAll: false,
      ...overrides.robots,
    },
    sitemap: {
      attempted: true,
      found: true,
      url: 'https://example.com/sitemap.xml',
      status: 200,
      isValid: true,
      isIndex: false,
      urlCount: 221,
      ...overrides.sitemap,
    },
  };
}

describe('analyzeSitemapPresence (TS.1.4)', () => {
  it('scores 100 when a valid sitemap was fetched, even with no HTML reference', () => {
    const result = analyzeSitemapPresence(HTML_NO_SITEMAP_REF, PAGE_URL, probeWith({}));
    expect(result.score).toBe(100);
    expect(result.evidence.join(' ')).toContain('221');
    // Must NOT tell the user to create a sitemap they already have
    expect(result.recommendations.join(' ')).not.toContain('Create XML sitemap');
  });

  it('scores 0 with creation advice when no sitemap exists', () => {
    const result = analyzeSitemapPresence(
      HTML_NO_SITEMAP_REF,
      PAGE_URL,
      probeWith({ sitemap: { found: false, url: undefined, status: 404, isValid: false, urlCount: 0 } })
    );
    expect(result.score).toBe(0);
    expect(result.recommendations.join(' ')).toContain('Create XML sitemap');
  });

  it('scores partial credit when a sitemap URL returns 200 but invalid XML', () => {
    const result = analyzeSitemapPresence(
      HTML_NO_SITEMAP_REF,
      PAGE_URL,
      probeWith({ sitemap: { isValid: false, urlCount: 0 } })
    );
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.recommendations.join(' ')).toContain('Fix the sitemap');
  });

  it('falls back to low-confidence HTML heuristic when the probe failed', () => {
    const failedProbe = probeWith({
      robots: { fetched: false, status: undefined, content: undefined, sitemapUrls: [], error: 'network down' },
      sitemap: { found: false, url: undefined, status: undefined, isValid: false, urlCount: 0, error: 'network down' },
    });
    const result = analyzeSitemapPresence(HTML_NO_SITEMAP_REF, PAGE_URL, failedProbe);
    expect(result.confidence).toBeLessThan(50);
    expect(result.evidence.join(' ')).toContain('Could not fetch');
  });
});

describe('analyzeRobotsTxt (TS.2.4)', () => {
  it('credits a real fetched robots.txt with a sitemap declaration', () => {
    const result = analyzeRobotsTxt(HTML_NO_SITEMAP_REF, PAGE_URL, probeWith({}));
    expect(result.score).toBe(100);
    expect(result.evidence.join(' ')).toContain('Fetched robots.txt');
    // The old dishonest disclaimer must be gone
    expect(result.evidence.join(' ')).not.toContain('not fetched');
  });

  it('penalises a robots.txt that blocks all crawlers', () => {
    const result = analyzeRobotsTxt(
      HTML_NO_SITEMAP_REF,
      PAGE_URL,
      probeWith({ robots: { content: 'User-agent: *\nDisallow: /\n', sitemapUrls: [], disallowAll: true } })
    );
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.recommendations.join(' ')).toContain('Disallow');
  });

  it('mildly penalises a missing robots.txt', () => {
    const result = analyzeRobotsTxt(
      HTML_NO_SITEMAP_REF,
      PAGE_URL,
      probeWith({ robots: { fetched: false, status: 404, content: undefined, sitemapUrls: [], disallowAll: false } })
    );
    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.evidence.join(' ')).toContain('No robots.txt file found');
  });

  it('still applies page-level meta robots deductions', () => {
    const html = '<html><head><meta name="robots" content="noindex, nofollow"></head><body></body></html>';
    const result = analyzeRobotsTxt(html, PAGE_URL, probeWith({}));
    expect(result.score).toBeLessThan(60);
  });
});

describe('analyzeIndexability (TS.1.1)', () => {
  it('treats a canonical without trailing slash as self-referencing for the slashed URL', () => {
    const html = '<html><head><meta name="robots" content="index, follow"><link rel="canonical" href="https://example.com"></head><body></body></html>';
    const result = analyzeIndexability(html, 'https://example.com/');
    expect(result.score).toBe(100);
    expect(result.evidence.join(' ')).not.toContain('points elsewhere');
  });

  it('still flags a canonical pointing to a genuinely different site', () => {
    const html = '<html><head><link rel="canonical" href="https://other.example.org/page"></head><body></body></html>';
    const result = analyzeIndexability(html, 'https://example.com/');
    expect(result.score).toBeLessThan(100);
    expect(result.evidence.join(' ')).toContain('points elsewhere');
  });
});
