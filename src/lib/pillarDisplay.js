/**
 * Pillar display helpers (AIS-ISS-4)
 *
 * Single source of truth for how MASTERY-AI pillars are named, weighted and
 * grouped for display (dashboard + PDF report). Fixes the report showing
 * "Topical Expertise & Experience 0/100, weight 0%" while its factor scored
 * 55: the PDF looked pillars up under keys the data never contained, and
 * silently dumped Traditional SEO / Performance factors into the Machine
 * Readability group.
 *
 * Rules:
 * - Pillar cards show the REAL score, weight and factor count from the
 *   analysis data.
 * - Pillars with no analysed factors are excluded from the scorecards (a
 *   0/100 card for a pillar that was never scored is a lie, not a result).
 */

// Canonical pillar list. `code` matches backend factor.pillar / pillar
// breakdown keys; `key`/`aliases` match the lowercase keys used by the
// dashboard transform and older data shapes. Weights mirror the backend
// PILLAR_WEIGHTS (MASTERY-AI v3.1.1).
export const PILLAR_META = [
  { code: 'AI', key: 'ai', aliases: [], name: 'AI Response Optimization & Citation', weight: 23.8, color: '#1E3A5F' },
  { code: 'A', key: 'authority', aliases: [], name: 'Authority & Trust Signals', weight: 17.9, color: '#7C3AED' },
  { code: 'M', key: 'machine_readability', aliases: [], name: 'Machine Readability & Technical Infrastructure', weight: 14.6, color: '#059669' },
  { code: 'S', key: 'semantic', aliases: [], name: 'Semantic Content Quality', weight: 13.9, color: '#EA580C' },
  { code: 'E', key: 'engagement', aliases: [], name: 'Engagement & User Experience', weight: 10.9, color: '#EAB308' },
  { code: 'T', key: 'topical', aliases: ['technical'], name: 'Topical Expertise & Experience', weight: 8.9, color: '#6366F1' },
  { code: 'P', key: 'performance', aliases: [], name: 'Performance & Speed', weight: 7.5, color: '#DC2626' },
  { code: 'TS', key: 'traditional_seo', aliases: [], name: 'Traditional SEO', weight: 7.0, color: '#0369A1' },
  { code: 'R', key: 'reference', aliases: [], name: 'Reference Networks & Citations', weight: 5.9, color: '#6B7280' },
  { code: 'Y', key: 'yield', aliases: [], name: 'Yield Optimization & Freshness', weight: 4.1, color: '#0D9488' },
];

// Legacy full-name pillar labels used by mock/demo factor data
const LEGACY_NAME_TO_CODE = {
  'AI Response Optimization': 'AI',
  'Authority & Trust': 'A',
  'Machine Readability': 'M',
  'Semantic Content': 'S',
  'Engagement': 'E',
  'Topical Expertise': 'T',
  'Topical Expertise & Experience': 'T',
  'Technical SEO & Foundation': 'T',
  'Traditional SEO': 'TS',
  'Reference Networks': 'R',
  'Yield Optimization': 'Y',
  'Performance': 'P',
};

/** Resolve a factor's pillar (code or legacy name) to a canonical code */
export function resolvePillarCode(pillar) {
  if (PILLAR_META.some(meta => meta.code === pillar)) return pillar;
  return LEGACY_NAME_TO_CODE[pillar] || null;
}

function findPillarData(pillarsData, meta) {
  if (!pillarsData) return null;
  const candidates = [meta.code, meta.key, ...meta.aliases];
  for (const candidate of candidates) {
    if (pillarsData[candidate]) return pillarsData[candidate];
  }
  return null;
}

function weightedAverage(factors) {
  let totalScore = 0;
  let totalWeight = 0;
  for (const factor of factors) {
    const weight = factor.weight || 1;
    totalScore += (factor.score || 0) * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Build truthful pillar groups for display.
 *
 * @param {object} pillarsData - pillar breakdown keyed by code (backend) or
 *   lowercase key (dashboard transform); values {score, weight, factorCount|factors, name}
 * @param {Array} factors - factor results with {pillar, score, weight, ...}
 * @returns Array of {code, key, name, color, score, weight, factorCount, factors[]}
 *   ordered by weight, containing only pillars that were actually analysed.
 */
export function buildPillarGroups(pillarsData, factors = []) {
  return PILLAR_META.map(meta => {
    const data = findPillarData(pillarsData, meta);
    const pillarFactors = factors.filter(
      factor => resolvePillarCode(factor.pillar) === meta.code
    );

    const factorCount = pillarFactors.length ||
      (data ? (data.factorCount ?? data.factors ?? 0) : 0);
    if (factorCount === 0) return null; // not analysed — no scorecard

    const score = data?.score ?? weightedAverage(pillarFactors);

    return {
      code: meta.code,
      key: meta.key,
      name: data?.name || meta.name,
      color: meta.color,
      score,
      weight: data?.weight || meta.weight,
      factorCount,
      factors: pillarFactors,
    };
  }).filter(Boolean);
}
