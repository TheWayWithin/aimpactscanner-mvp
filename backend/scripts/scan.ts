/**
 * Local end-to-end scan runner (no DB, no server).
 *
 * Runs the real production pipeline — fetchPageContent (redirects followed)
 * then analyzeAllFactors on the FINAL URL — and prints a score summary.
 * Used to prove AIS-ISS-2/3 fixes against live sites.
 *
 * Usage: npx tsx scripts/scan.ts <url> [tier]
 */
import { fetchPageContent } from '../src/services/pageFetcher';
import { analyzeAllFactors, getPillarBreakdown } from '../src/services/analyzer';

async function main() {
  const inputUrl = process.argv[2];
  const tier = process.argv[3] || 'growth';
  if (!inputUrl) {
    console.error('Usage: npx tsx scripts/scan.ts <url> [tier]');
    process.exit(1);
  }

  const fetchResult = await fetchPageContent(inputUrl, { skipPuppeteer: true });
  if (!fetchResult.success) {
    console.error(`Fetch failed: ${fetchResult.error}`);
    process.exit(1);
  }

  const finalUrl = fetchResult.finalUrl || inputUrl;
  const result = await analyzeAllFactors(finalUrl, fetchResult.html, tier, undefined, {
    requestedUrl: inputUrl,
  });

  const pillars = getPillarBreakdown(result.factors);

  console.log('==============================================');
  console.log(`Input URL:    ${inputUrl}`);
  console.log(`Resolved URL: ${finalUrl}`);
  console.log(`Tier:         ${tier}`);
  console.log(`OVERALL SCORE: ${result.overall_score}/100`);
  console.log('--- Pillars ---');
  for (const [code, p] of Object.entries(pillars)) {
    console.log(`  ${code.padEnd(3)} ${p.name.padEnd(50)} ${String(p.score).padStart(3)}/100  weight ${p.weight}%  (${p.factorCount} factors)`);
  }
  console.log('--- Factors ---');
  const sorted = [...result.factors].sort((a, b) => a.factor_id.localeCompare(b.factor_id));
  for (const f of sorted) {
    console.log(`  [${f.factor_id}] ${f.factor_name}: ${f.score}/100`);
  }
  const highlight = (id: string) => {
    const f = result.factors.find(x => x.factor_id === id);
    if (!f) return;
    console.log(`--- ${id} ${f.factor_name} (${f.score}/100) ---`);
    f.evidence.forEach(e => console.log(`  • ${e}`));
    f.recommendations.forEach(r => console.log(`  → ${r}`));
  };
  highlight('M.1.1');
  highlight('TS.1.4');
  highlight('TS.2.4');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
