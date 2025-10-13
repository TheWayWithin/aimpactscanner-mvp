// Test transparency detection patterns against freecalchub.com content
// Developer Investigation: Transparency Scoring Analysis

const content = `
FreeCalcHub is an independent project. It is not funded by or affiliated with any financial institution, corporation, or healthcare organization. Its operational costs are covered by me personally, supplemented by unobtrusive, standard contextual advertising.

I have no financial stake in the outcomes of any calculations. My sole goal is to provide a reliable and helpful tool.

The tools on this website are provided for informational and educational purposes only. They are not a substitute for professional financial, medical, or legal advice. Please consult with a qualified professional before making any significant decisions.

Site built and maintained entirely by Jamie Watters. Created as a personal coding challenge and passion project. Every calculator created as part of personal development journey.

To provide simple, accurate, and easy-to-use online calculators without intrusive ads, fees, or sign-ups.
`;

console.log('=================================================');
console.log('TRANSPARENCY PATTERN DETECTION TEST');
console.log('Site: freecalchub.com/about');
console.log('=================================================\n');

// PATTERN 1: Disclosure statements (30 points)
console.log('1. DISCLOSURE PATTERN TEST (30 points)');
console.log('   Pattern: /disclosure|conflict\\s+of\\s+interest|sponsored|paid\\s+partnership|affiliate|disclaimer/i');
const disclosureTerms = /disclosure|conflict\s+of\s+interest|sponsored|paid\s+partnership|affiliate|disclaimer/i;
const hasDisclosure = disclosureTerms.test(content);
console.log(`   Result: ${hasDisclosure ? '✅ MATCH' : '❌ NO MATCH'}`);
console.log(`   Points Awarded: ${hasDisclosure ? '30' : '0'}`);

if (hasDisclosure) {
  const matches = content.match(disclosureTerms);
  console.log(`   Matched Text: "${matches[0]}"`);
} else {
  console.log('   Why it failed:');
  console.log('     - User wrote: "no financial stake" (not exact phrase "conflict of interest")');
  console.log('     - User wrote: "for informational and educational purposes only" (no word "disclaimer")');
  console.log('     - Pattern requires exact phrases, not semantic equivalents');
}
console.log('');

// PATTERN 2: Funding information (25 points)
console.log('2. FUNDING PATTERN TEST (25 points)');
console.log('   Pattern: /funded\\s+by|grant|supported\\s+by|sponsored\\s+by/i');
const fundingTerms = /funded\s+by|grant|supported\s+by|sponsored\s+by/i;
const hasFunding = fundingTerms.test(content);
console.log(`   Result: ${hasFunding ? '✅ MATCH' : '❌ NO MATCH'}`);
console.log(`   Points Awarded: ${hasFunding ? '25' : '0'}`);

if (hasFunding) {
  const matches = content.match(fundingTerms);
  console.log(`   Matched Text: "${matches[0]}"`);
  console.log('   ⚠️  SEMANTIC ISSUE: User wrote "NOT funded by" (negative statement)');
  console.log('   ⚠️  Pattern matches literal text but meaning is opposite of "funded by X"');
} else {
  console.log('   Why it failed:');
  console.log('     - User wrote: "not funded by" but pattern may require positive funding');
}
console.log('');

// PATTERN 3: Methodology (25 points)
console.log('3. METHODOLOGY PATTERN TEST (25 points)');
console.log('   Pattern: /method|process|approach|criteria|how\\s+we|our\\s+process/i');
const methodTerms = /method|process|approach|criteria|how\s+we|our\s+process/i;
const hasMethod = methodTerms.test(content);
console.log(`   Result: ${hasMethod ? '✅ MATCH' : '❌ NO MATCH'}`);
console.log(`   Points Awarded: ${hasMethod ? '25' : '0'}`);

if (hasMethod) {
  const matches = content.match(methodTerms);
  console.log(`   Matched Text: "${matches[0]}"`);
}
console.log('');

// PATTERN 4: Update information (20 points)
console.log('4. UPDATE INFO PATTERN TEST (20 points)');
console.log('   Pattern: /updated|revised|last\\s+modified|published/i');
const updatedTerms = /updated|revised|last\s+modified|published/i;
const hasUpdated = updatedTerms.test(content);
console.log(`   Result: ${hasUpdated ? '✅ MATCH' : '❌ NO MATCH'}`);
console.log(`   Points Awarded: ${hasUpdated ? '20' : '0'}`);

if (hasUpdated) {
  const matches = content.match(updatedTerms);
  console.log(`   Matched Text: "${matches[0]}"`);
}
console.log('');

// CALCULATE TOTAL SCORE
let score = 0;
if (hasDisclosure) score += 30;
if (hasFunding) score += 25;
if (hasMethod) score += 25;
if (hasUpdated) score += 20;

// Apply base score logic
if (score === 0) {
  score = 15;
} else if (score < 30) {
  score += 10;
}

console.log('=================================================');
console.log('SCORE CALCULATION');
console.log('=================================================');
console.log(`Disclosure (30 pts): ${hasDisclosure ? '✅ 30' : '❌ 0'}`);
console.log(`Funding (25 pts):    ${hasFunding ? '✅ 25' : '❌ 0'}`);
console.log(`Methodology (25 pts): ${hasMethod ? '✅ 25' : '❌ 0'}`);
console.log(`Updates (20 pts):     ${hasUpdated ? '✅ 20' : '❌ 0'}`);

const rawScore = (hasDisclosure ? 30 : 0) + (hasFunding ? 25 : 0) + (hasMethod ? 25 : 0) + (hasUpdated ? 20 : 0);
console.log(`\nRaw Score: ${rawScore}`);

if (rawScore === 0) {
  console.log('Base Score Applied: +15 (nothing detected)');
} else if (rawScore < 30) {
  console.log(`Partial Bonus Applied: +10 (score < 30)`);
}

console.log(`\nFINAL SCORE: ${score}/100`);
console.log(`USER REPORTED SCORE: 45/100`);
console.log(`MATCH: ${score === 45 ? '✅ YES' : '❌ NO (difference: ' + Math.abs(score - 45) + ')'}`);

console.log('\n=================================================');
console.log('ROOT CAUSE ANALYSIS');
console.log('=================================================');
console.log('❌ Disclosure: Pattern requires exact phrases like "conflict of interest" or "disclaimer"');
console.log('   User wrote semantic equivalents: "no financial stake", "for informational purposes"');
console.log('');
console.log('❌ Funding: Pattern matches "funded by" but user wrote "NOT funded by"');
console.log('   Negative statements about funding are transparency signals but may not be detected properly');
console.log('');
console.log('✅ Methodology: Pattern matches "process", "approach" - Working correctly');
console.log('');
console.log('❓ Updates: Need to check if update dates are present in full HTML');

console.log('\n=================================================');
console.log('RECOMMENDED PATTERN IMPROVEMENTS');
console.log('=================================================');

console.log('\n1. IMPROVED DISCLOSURE PATTERN:');
console.log('   CURRENT: /disclosure|conflict\\s+of\\s+interest|sponsored|paid\\s+partnership|affiliate|disclaimer/i');
console.log('   IMPROVED: /disclosure|disclaimer|conflict[s]?\\s+of\\s+interest|no\\s+conflicts?|financial\\s+stake|no\\s+financial\\s+(?:interest|stake)|sponsored|paid\\s+partnership|affiliate|for\\s+informational\\s+purposes|educational\\s+purposes\\s+only/i');

console.log('\n2. IMPROVED FUNDING PATTERN:');
console.log('   CURRENT: /funded\\s+by|grant|supported\\s+by|sponsored\\s+by/i');
console.log('   IMPROVED: /(?:not\\s+)?(?:funded|sponsored|supported)\\s+by|independent\\s+project|no\\s+(?:funding|affiliation)|personally\\s+(?:funded|covered)|grant|advertising\\s+revenue/i');

console.log('\n3. TEST IMPROVED PATTERNS:');
const improvedDisclosure = /disclosure|disclaimer|conflict[s]?\s+of\s+interest|no\s+conflicts?|financial\s+stake|no\s+financial\s+(?:interest|stake)|sponsored|paid\s+partnership|affiliate|for\s+informational\s+purposes|educational\s+purposes\s+only/i;
const improvedFunding = /(?:not\s+)?(?:funded|sponsored|supported)\s+by|independent\s+project|no\s+(?:funding|affiliation)|personally\s+(?:funded|covered)|grant|advertising\s+revenue/i;

console.log(`\n   Improved Disclosure Pattern: ${improvedDisclosure.test(content) ? '✅ MATCH' : '❌ NO MATCH'}`);
if (improvedDisclosure.test(content)) {
  const matches = content.match(improvedDisclosure);
  console.log(`   Matched: "${matches[0]}"`);
}

console.log(`   Improved Funding Pattern: ${improvedFunding.test(content) ? '✅ MATCH' : '❌ NO MATCH'}`);
if (improvedFunding.test(content)) {
  const matches = content.match(improvedFunding);
  console.log(`   Matched: "${matches[0]}"`);
}

const improvedScore = (improvedDisclosure.test(content) ? 30 : 0) +
                       (improvedFunding.test(content) ? 25 : 0) +
                       (hasMethod ? 25 : 0) +
                       (hasUpdated ? 20 : 0);
console.log(`\n   IMPROVED SCORE: ${improvedScore}/100 (from ${rawScore})`);
console.log(`   IMPROVEMENT: +${improvedScore - rawScore} points`);

console.log('\n=================================================');
console.log('ACTIONABLE RECOMMENDATIONS');
console.log('=================================================');
console.log('Current recommendations are too vague:');
console.log('  ❌ "Add disclosure statements for transparency"');
console.log('  ❌ "Include conflict of interest information if applicable"');
console.log('');
console.log('Should be specific and actionable:');
console.log('  ✅ "Add disclosure using phrases like: \\"disclosure\\", \\"disclaimer\\", \\"conflict of interest\\", or \\"no financial stake\\""');
console.log('  ✅ "Include funding transparency: \\"funded by [source]\\" or \\"not funded by\\" or \\"independent project\\""');
console.log('  ✅ "Add disclaimer using: \\"Disclaimer:\\" or \\"for informational purposes only\\" or \\"not a substitute for professional advice\\""');
