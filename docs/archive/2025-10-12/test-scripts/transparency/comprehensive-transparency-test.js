// Comprehensive Transparency Pattern Analysis
// Testing all scenarios to explain the 45/100 score

console.log('═══════════════════════════════════════════════════════════');
console.log('COMPREHENSIVE TRANSPARENCY SCORING ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

// Test content from freecalchub.com/about
const contentWithAffiliate = `
FreeCalcHub is an independent project. It is not funded by or affiliated with any financial institution, corporation, or healthcare organization. Its operational costs are covered by me personally, supplemented by unobtrusive, standard contextual advertising.

I have no financial stake in the outcomes of any calculations. My sole goal is to provide a reliable and helpful tool.

The tools on this website are provided for informational and educational purposes only. They are not a substitute for professional financial, medical, or legal advice. Please consult with a qualified professional before making any significant decisions.

Site built and maintained entirely by Jamie Watters
Created as a personal coding challenge and passion project
`;

// Same content but WITHOUT the word "affiliated" (testing if that was added after scan)
const contentWithoutAffiliate = `
FreeCalcHub is an independent project. It is not funded by any financial institution, corporation, or healthcare organization. Its operational costs are covered by me personally, supplemented by unobtrusive, standard contextual advertising.

I have no financial stake in the outcomes of any calculations. My sole goal is to provide a reliable and helpful tool.

The tools on this website are provided for informational and educational purposes only. They are not a substitute for professional financial, medical, or legal advice. Please consult with a qualified professional before making any significant decisions.

Site built and maintained entirely by Jamie Watters
Created as a personal coding challenge and passion project
`;

// Current patterns from code
const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
const fundingTerms = /funded\s+by|grant|supported\s+by|sponsored\s+by/i;
const methodTerms = /method|process|approach|criteria|how\s+we|our\s+process/i;
const updatedTerms = /updated|revised|last\s+modified|published/i;

function calculateScore(content, label) {
  console.log(`\n─────────────────────────────────────────────────────────── `);
  console.log(`SCENARIO: ${label}`);
  console.log(`───────────────────────────────────────────────────────────\n`);

  let score = 0;
  const matched = {};

  // Test each pattern
  matched.disclosure = disclosureTerms.test(content);
  matched.funding = fundingTerms.test(content);
  matched.methodology = methodTerms.test(content);
  matched.updates = updatedTerms.test(content);

  console.log('Pattern Matches:');
  console.log(`  Disclosure (30 pts):   ${matched.disclosure ? '✅ YES' : '❌ NO'}`);
  if (matched.disclosure) {
    const match = content.match(disclosureTerms);
    console.log(`    → Matched: "${match[0]}"`);
  }

  console.log(`  Funding (25 pts):      ${matched.funding ? '✅ YES' : '❌ NO'}`);
  if (matched.funding) {
    const match = content.match(fundingTerms);
    console.log(`    → Matched: "${match[0]}"`);
  }

  console.log(`  Methodology (25 pts):  ${matched.methodology ? '✅ YES' : '❌ NO'}`);
  if (matched.methodology) {
    const match = content.match(methodTerms);
    console.log(`    → Matched: "${match[0]}"`);
  }

  console.log(`  Updates (20 pts):      ${matched.updates ? '✅ YES' : '❌ NO'}`);
  if (matched.updates) {
    const match = content.match(updatedTerms);
    console.log(`    → Matched: "${match[0]}"`);
  }

  // Calculate raw score
  if (matched.disclosure) score += 30;
  if (matched.funding) score += 25;
  if (matched.methodology) score += 25;
  if (matched.updates) score += 20;

  const rawScore = score;
  console.log(`\nRaw Score: ${rawScore}`);

  // Apply base score logic from index.ts lines 967-972
  if (score === 0) {
    score = 15;
    console.log('Applied: Base score = 15 (nothing detected)');
  } else if (score < 30) {
    score += 10;
    console.log(`Applied: Bonus +10 (score < 30) = ${score}`);
  }

  console.log(`\n🎯 FINAL SCORE: ${score}/100`);

  return { score, rawScore, matched };
}

// Test Scenario 1: With "affiliate" word
const scenario1 = calculateScore(contentWithAffiliate, 'Current content WITH "affiliate" word');

// Test Scenario 2: Without "affiliate" word
const scenario2 = calculateScore(contentWithoutAffiliate, 'Content WITHOUT "affiliate" word');

// Test Scenario 3: Only methodology detected
const contentMethodologyOnly = `
Created as a personal coding challenge and passion project
Our process is to provide simple, accurate calculators
We approach each tool with care
`;
const scenario3 = calculateScore(contentMethodologyOnly, 'Only methodology detected (testing 25 + 10 bonus = 35)');

// Test Scenario 4: Nothing detected
const contentNothing = `
About FreeCalcHub
A calculator website
`;
const scenario4 = calculateScore(contentNothing, 'Nothing detected (testing base 15 score)');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('COMPARISON TO USER REPORTED SCORE');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('User Reported Score: 45/100\n');

console.log('Scenario Analysis:');
console.log(`  Scenario 1 (with "affiliate"): ${scenario1.score} ${scenario1.score === 45 ? '✅ MATCH!' : '❌'}`);
console.log(`  Scenario 2 (without "affiliate"): ${scenario2.score} ${scenario2.score === 45 ? '✅ MATCH!' : '❌'}`);
console.log(`  Scenario 3 (only methodology): ${scenario3.score} ${scenario3.score === 45 ? '✅ MATCH!' : '❌'}`);
console.log(`  Scenario 4 (nothing): ${scenario4.score} ${scenario4.score === 45 ? '✅ MATCH!' : '❌'}`);

console.log('\n═══════════════════════════════════════════════════════════');
console.log('ROOT CAUSE DETERMINATION');
console.log('═══════════════════════════════════════════════════════════\n');

if (scenario2.score === 45) {
  console.log('🔍 ROOT CAUSE IDENTIFIED:');
  console.log('   The score of 45 matches Scenario 2 (without "affiliate")');
  console.log('   This means:');
  console.log('   • Funding pattern matches "funded by" (even though "NOT funded") = 25 pts');
  console.log('   • Methodology pattern does NOT match (missing "method", "process", etc.) = 0 pts');
  console.log('   • Updates pattern does NOT match = 0 pts');
  console.log('   • Disclosure pattern does NOT match (no "affiliate", "disclaimer", etc.) = 0 pts');
  console.log('   • Bonus applied for score < 30: 25 + 10 = 35... wait, that\'s 35, not 45!\n');
  console.log('   ⚠️  DISCREPANCY: 35 ≠ 45, need to investigate further');
} else if (scenario1.score === 55) {
  console.log('🔍 PATTERN DETECTION:');
  console.log('   Current content WITH "affiliate" scores 55/100');
  console.log('   • Disclosure: 30 (matches "affiliate")');
  console.log('   • Funding: 25 (matches "funded by")');
  console.log('   • Methodology: 0');
  console.log('   • Updates: 0');
  console.log('   Total: 55\n');
  console.log('   User reports 45, meaning either:');
  console.log('   A) Content was different when scanned (didn\'t have "affiliate")');
  console.log('   B) Caching issue showing old score');
  console.log('   C) Different scoring logic in production');
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('HYPOTHESIS: MULTIPLE ISSUES');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Theory 1: Funding Alone = 25 + 20 Bonus = 45');
console.log('  IF funding (25) is the ONLY thing detected');
console.log('  AND there\'s a different bonus calculation');
console.log('  THEN 25 + 20 = 45\n');

console.log('Theory 2: Methodology + Updates = 25 + 20 = 45');
console.log('  IF methodology (25) detected');
console.log('  AND updates (20) detected');
console.log('  THEN 25 + 20 = 45 (no bonus, raw score ≥ 30)\n');

console.log('Theory 3: Two Partial Matches + Bonus');
console.log('  IF two small matches totaling < 30');
console.log('  AND bonus of 10 applied');
console.log('  Could create various scores\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('NEXT STEPS FOR INVESTIGATION');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('1. Check actual HTML from freecalchub.com/about for:');
console.log('   • Presence of words: "affiliate", "funded", "process", "updated"');
console.log('   • Full page content vs just visible text');
console.log('   • Hidden elements or comments\n');

console.log('2. Check if there are OTHER bonuses or score adjustments:');
console.log('   • Review lines 966-972 more carefully');
console.log('   • Check if score is capped or modified elsewhere');
console.log('   • Verify no other bonus logic exists\n');

console.log('3. Test with actual Supabase function:');
console.log('   • Deploy and run against freecalchub.com');
console.log('   • Log intermediate scores');
console.log('   • Compare with user reported score\n');

console.log('4. Consider pattern improvements regardless:');
console.log('   • Current patterns detected "affiliate" and "funded by"');
console.log('   • But semantic meaning doesn\'t match (not affiliated, not funded)');
console.log('   • Need smarter patterns that understand context');
