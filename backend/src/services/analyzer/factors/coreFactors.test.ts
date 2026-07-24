/**
 * Regression tests for AIS-ISS-2: M.1.1 HTTPS Security must score the FINAL
 * URL after redirects, regardless of how the user typed the URL.
 */
import { describe, it, expect } from 'vitest';
import { analyzeHTTPS } from './coreFactors';

describe('analyzeHTTPS (M.1.1)', () => {
  it('scores 100 for an https final URL', () => {
    const result = analyzeHTTPS('https://example.com/');
    expect(result.score).toBe(100);
    expect(result.recommendations).toHaveLength(0);
  });

  it('scores 100 when http input redirected to https (HTTPS enforced)', () => {
    const result = analyzeHTTPS('https://example.com/', 'http://example.com');
    expect(result.score).toBe(100);
    expect(result.recommendations).toHaveLength(0);
    expect(result.evidence.join(' ')).toContain('HTTPS is enforced');
  });

  it('scores 0 when the final URL is still http (no HTTPS redirect)', () => {
    const result = analyzeHTTPS('http://insecure.example.com/', 'http://insecure.example.com/');
    expect(result.score).toBe(0);
    expect(result.recommendations.join(' ')).toContain('HTTPS');
  });

  it('does not fabricate redirect evidence when input was already https', () => {
    const result = analyzeHTTPS('https://example.com/', 'https://example.com');
    expect(result.score).toBe(100);
    expect(result.evidence.join(' ')).not.toContain('redirected');
  });
});
