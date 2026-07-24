/**
 * Regression test for AIS-ISS-2: the same page must score IDENTICALLY
 * whether the user typed http:// or https:// — scoring runs against the
 * final URL after redirects, so the input scheme cannot change the result.
 */
import { describe, it, expect } from 'vitest';
import { analyzeAllFactors } from './index';
import { SiteProbeResult } from '../siteProbes';

const FINAL_URL = 'https://example.com/';

const HTML = `<!doctype html>
<html>
<head>
  <title>Example Site — A Perfectly Reasonable Page Title Here</title>
  <meta name="description" content="A meta description of sensible length that describes the page content for search engines and AI systems alike.">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://example.com/">
</head>
<body>
  <h1>Example Site</h1>
  <h2>Section one</h2>
  <p>Some content with a <a href="/about">link to about</a> and an <a href="https://other.example.org">external link</a>.</p>
  <img src="/img.png" alt="A descriptive alt text">
</body>
</html>`;

const probe: SiteProbeResult = {
  origin: 'https://example.com',
  robots: {
    attempted: true,
    fetched: true,
    status: 200,
    content: 'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n',
    sitemapUrls: ['https://example.com/sitemap.xml'],
    disallowAll: false,
  },
  sitemap: {
    attempted: true,
    found: true,
    url: 'https://example.com/sitemap.xml',
    status: 200,
    isValid: true,
    isIndex: false,
    urlCount: 221,
  },
};

describe('http vs https input equivalence', () => {
  it('produces identical scores for http:// and https:// input on an HTTPS-enforcing site', async () => {
    const fromHttp = await analyzeAllFactors(FINAL_URL, HTML, 'growth', undefined, {
      requestedUrl: 'http://example.com',
      siteProbes: probe,
    });
    const fromHttps = await analyzeAllFactors(FINAL_URL, HTML, 'growth', undefined, {
      requestedUrl: 'https://example.com',
      siteProbes: probe,
    });

    expect(fromHttp.overall_score).toBe(fromHttps.overall_score);

    const scoresByFactor = (result: typeof fromHttp) =>
      Object.fromEntries(result.factors.map(f => [f.factor_id, f.score]));
    expect(scoresByFactor(fromHttp)).toEqual(scoresByFactor(fromHttps));

    const httpsFactor = fromHttp.factors.find(f => f.factor_id === 'M.1.1');
    expect(httpsFactor?.score).toBe(100);

    const sitemapFactor = fromHttp.factors.find(f => f.factor_id === 'TS.1.4');
    expect(sitemapFactor?.score).toBe(100);
  });
});
