/**
 * Regression tests for AIS-ISS-4: pillar scorecards must show the REAL
 * score/weight/factor count. The bug: the PDF looked up the "Topical
 * Expertise & Experience" card under a key the data never contained, so it
 * rendered 0/100 at 0% weight while its factor T.1.1 scored 55 — and
 * Traditional SEO / Performance factors were silently dumped into the
 * Machine Readability group.
 */
import { describe, it, expect } from 'vitest';
import { buildPillarGroups, resolvePillarCode } from '../../src/lib/pillarDisplay';

// Backend-shaped pillar breakdown (keys are pillar codes)
const backendPillars = {
  AI: { score: 59, weight: 23.8, factorCount: 4, name: 'AI Response Optimization & Citation' },
  A: { score: 72, weight: 17.9, factorCount: 3, name: 'Authority & Trust Signals' },
  M: { score: 89, weight: 14.6, factorCount: 5, name: 'Machine Readability & Technical Infrastructure' },
  S: { score: 100, weight: 13.9, factorCount: 2, name: 'Semantic Content Quality' },
  E: { score: 80, weight: 10.9, factorCount: 1, name: 'Engagement & User Experience' },
  T: { score: 55, weight: 8.9, factorCount: 1, name: 'Topical Expertise & Experience' },
  TS: { score: 74, weight: 7.0, factorCount: 8, name: 'Traditional SEO' },
  P: { score: 80, weight: 7.5, factorCount: 1, name: 'Performance & Speed' },
  R: { score: 20, weight: 5.9, factorCount: 1, name: 'Reference Networks & Citations' },
  Y: { score: 30, weight: 4.1, factorCount: 1, name: 'Yield Optimization & Freshness' },
};

const factors = [
  { factor_id: 'M.1.1', pillar: 'M', score: 100, weight: 0.73 },
  { factor_id: 'T.1.1', pillar: 'T', score: 55, weight: 0.8 },
  { factor_id: 'TS.1.4', pillar: 'TS', score: 100, weight: 0.6 },
  { factor_id: 'TS.2.4', pillar: 'TS', score: 100, weight: 0.6 },
  { factor_id: 'P.1.1', pillar: 'P', score: 80, weight: 0.8 },
  { factor_id: 'AI.2.3', pillar: 'AI', score: 30, weight: 0.9 },
];

describe('buildPillarGroups', () => {
  it('shows the real Topical Expertise score and weight (never 0/0%)', () => {
    const groups = buildPillarGroups(backendPillars, factors);
    const topical = groups.find(g => g.code === 'T');

    expect(topical).toBeDefined();
    expect(topical.score).toBe(55);
    expect(topical.weight).toBe(8.9);
    expect(topical.factorCount).toBe(1);
    expect(topical.name).toBe('Topical Expertise & Experience');
  });

  it('never renders a card with 0% weight', () => {
    const groups = buildPillarGroups(backendPillars, factors);
    for (const group of groups) {
      expect(group.weight).toBeGreaterThan(0);
    }
  });

  it('groups Traditional SEO and Performance factors under their own pillars, not Machine Readability', () => {
    const groups = buildPillarGroups(backendPillars, factors);
    const machine = groups.find(g => g.code === 'M');
    const traditional = groups.find(g => g.code === 'TS');
    const performance = groups.find(g => g.code === 'P');

    expect(machine.factors.map(f => f.factor_id)).toEqual(['M.1.1']);
    expect(traditional.factors.map(f => f.factor_id)).toEqual(['TS.1.4', 'TS.2.4']);
    expect(performance.factors.map(f => f.factor_id)).toEqual(['P.1.1']);
  });

  it('excludes pillars that were never analysed', () => {
    const onlyTwoPillars = {
      M: { score: 90, weight: 14.6, factorCount: 1 },
      AI: { score: 50, weight: 23.8, factorCount: 1 },
    };
    const twoFactors = [
      { factor_id: 'M.1.1', pillar: 'M', score: 90, weight: 1 },
      { factor_id: 'AI.1.1', pillar: 'AI', score: 50, weight: 1 },
    ];
    const groups = buildPillarGroups(onlyTwoPillars, twoFactors);
    expect(groups.map(g => g.code).sort()).toEqual(['AI', 'M']);
  });

  it('accepts dashboard-shaped lowercase keys including the legacy "technical" alias for T', () => {
    const dashboardPillars = {
      topicalless: undefined,
      technical: { score: 55, weight: 8.9, factors: 1, name: 'Topical Expertise & Experience' },
      machine_readability: { score: 89, weight: 14.6, factors: 1 },
      traditional_seo: { score: 74, weight: 7.0, factors: 2 },
    };
    const groups = buildPillarGroups(dashboardPillars, factors);
    const topical = groups.find(g => g.code === 'T');
    expect(topical.score).toBe(55);
    expect(topical.weight).toBe(8.9);
  });

  it('computes the score from factors when pillar data is missing it', () => {
    const groups = buildPillarGroups({}, [
      { factor_id: 'TS.1.4', pillar: 'TS', score: 100, weight: 0.6 },
      { factor_id: 'TS.2.4', pillar: 'TS', score: 50, weight: 0.6 },
    ]);
    const traditional = groups.find(g => g.code === 'TS');
    expect(traditional.score).toBe(75);
    expect(traditional.weight).toBe(7.0);
  });
});

describe('resolvePillarCode', () => {
  it('passes through canonical codes and maps legacy names', () => {
    expect(resolvePillarCode('TS')).toBe('TS');
    expect(resolvePillarCode('Topical Expertise')).toBe('T');
    expect(resolvePillarCode('Machine Readability')).toBe('M');
    expect(resolvePillarCode('unknown-thing')).toBe(null);
  });
});
