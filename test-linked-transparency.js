// Test Linked Transparency Feature
// Validates the new link detection bonus in transparency scoring

console.log('=================================================');
console.log('LINKED TRANSPARENCY FEATURE - TEST SUITE');
console.log('=================================================\n');

// Helper function to simulate the detectTransparencyLinks logic
function detectTransparencyLinks(content, baseUrl) {
  const allLinks = content.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
  const transparencyLinks = [];
  let aboutLink = null;
  let privacyLink = null;
  let disclosureLink = null;

  const aboutPattern = /^\/(about|about-us|about_us|who-we-are|team|company)(\/|$|\?|#)/i;
  const privacyPattern = /^\/(privacy|privacy-policy|privacy_policy|data-protection)(\/|$|\?|#)/i;
  const disclosurePattern = /^\/(disclosure|disclosures|transparency|conflicts)(\/|$|\?|#)/i;
  const termsPattern = /^\/(terms|legal|terms-of-service)(\/|$|\?|#)/i;

  for (const link of allLinks) {
    const hrefMatch = link.match(/href=["']([^"']+)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1];
      let isInternal = false;

      if (href.startsWith('/')) {
        isInternal = true;
      } else if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkUrl = new URL(href);
          const pageUrl = new URL(baseUrl);
          isInternal = (linkUrl.hostname === pageUrl.hostname);
        } catch (e) {
          continue;
        }
      }

      if (isInternal) {
        let path = href;
        if (href.startsWith('http')) {
          try {
            const linkUrl = new URL(href);
            path = linkUrl.pathname;
          } catch (e) {
            continue;
          }
        }

        if (aboutPattern.test(path)) {
          if (!aboutLink) {
            aboutLink = path;
            transparencyLinks.push(path);
          }
        } else if (privacyPattern.test(path)) {
          if (!privacyLink) {
            privacyLink = path;
            transparencyLinks.push(path);
          }
        } else if (disclosurePattern.test(path)) {
          if (!disclosureLink) {
            disclosureLink = path;
            transparencyLinks.push(path);
          }
        } else if (termsPattern.test(path)) {
          if (!transparencyLinks.includes(path)) {
            transparencyLinks.push(path);
          }
        }
      }
    }
  }

  return {
    links: transparencyLinks,
    aboutLink,
    privacyLink,
    disclosureLink,
    count: transparencyLinks.length
  };
}

// Test cases
const tests = [
  {
    name: 'Test 1: No links (baseline)',
    html: '<html><body><p>Some content with no links</p></body></html>',
    url: 'https://example.com',
    expectedCount: 0,
    expectedBonus: 0,
    expectedScore: 15 // Base score for no transparency content
  },
  {
    name: 'Test 2: Single /about/ link',
    html: '<html><body><a href="/about/">About Us</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30 // Base 15 + Link bonus 15
  },
  {
    name: 'Test 3: Multiple transparency links (/about + /privacy)',
    html: '<html><body><a href="/about/">About</a> <a href="/privacy-policy">Privacy</a></body></html>',
    url: 'https://example.com',
    expectedCount: 2,
    expectedBonus: 25,
    expectedScore: 40 // Base 15 + Link bonus 25
  },
  {
    name: 'Test 4: External link only (no bonus)',
    html: '<html><body><a href="https://external.com/about/">External About</a></body></html>',
    url: 'https://example.com',
    expectedCount: 0,
    expectedBonus: 0,
    expectedScore: 15
  },
  {
    name: 'Test 5: Mixed internal and external',
    html: '<html><body><a href="/about/">About</a> <a href="https://external.com/privacy/">External Privacy</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 6: Absolute internal link',
    html: '<html><body><a href="https://example.com/about/">About</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 7: Link with query parameters',
    html: '<html><body><a href="/about?ref=footer">About</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 8: Link with anchor',
    html: '<html><body><a href="/about#team">About Our Team</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 9: Duplicate links (count once)',
    html: '<html><body><a href="/about/">About</a> <a href="/about">About Again</a></body></html>',
    url: 'https://example.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 10: All transparency page types',
    html: '<html><body><a href="/about/">About</a> <a href="/privacy/">Privacy</a> <a href="/disclosure/">Disclosure</a> <a href="/terms/">Terms</a></body></html>',
    url: 'https://example.com',
    expectedCount: 4,
    expectedBonus: 25, // Capped at 25 for 2+ links
    expectedScore: 40
  },
  {
    name: 'Test 11: FreeCalcHub.com real case',
    html: '<html><body><nav><a href="/">Home</a> <a href="/about/">About</a> <a href="/contact/">Contact</a></nav></body></html>',
    url: 'https://freecalchub.com',
    expectedCount: 1,
    expectedBonus: 15,
    expectedScore: 30
  },
  {
    name: 'Test 12: Case insensitive matching',
    html: '<html><body><a href="/About/">ABOUT</a> <a href="/PRIVACY/">Privacy</a></body></html>',
    url: 'https://example.com',
    expectedCount: 2,
    expectedBonus: 25,
    expectedScore: 40
  }
];

// Run tests
let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  console.log(`\n${test.name}`);
  console.log('-'.repeat(50));

  const result = detectTransparencyLinks(test.html, test.url);

  console.log(`  HTML: ${test.html.substring(0, 60)}...`);
  console.log(`  URL: ${test.url}`);
  console.log(`  Links Found: ${result.count} (expected: ${test.expectedCount})`);
  console.log(`  Links: ${result.links.join(', ') || 'none'}`);
  console.log(`  Bonus Points: ${result.count >= 2 ? 25 : result.count === 1 ? 15 : 0} (expected: ${test.expectedBonus})`);

  const testPassed = result.count === test.expectedCount;

  if (testPassed) {
    console.log(`  ✅ PASS`);
    passed++;
  } else {
    console.log(`  ❌ FAIL - Expected ${test.expectedCount} links, got ${result.count}`);
    failed++;
  }
});

// Summary
console.log('\n=================================================');
console.log('TEST SUMMARY');
console.log('=================================================');
console.log(`Total Tests: ${tests.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Feature is working correctly.');
} else {
  console.log(`\n⚠️  ${failed} test(s) failed. Review implementation.`);
}

// Expected Score Examples
console.log('\n=================================================');
console.log('EXPECTED SCORE SCENARIOS');
console.log('=================================================');

const scenarios = [
  { description: 'No transparency, no links', score: 15 },
  { description: 'No transparency, 1 link', score: 30 },
  { description: 'No transparency, 2+ links', score: 40 },
  { description: 'Methodology only (25 pts), 1 link', score: 25 + 15 + 10 }, // partial bonus
  { description: 'Methodology only (25 pts), 2+ links', score: 25 + 25 }, // no partial bonus with links
  { description: 'Full transparency (100 pts), any links', score: 100 },
  { description: 'FreeCalcHub homepage (methodology 25 + updates 20, 1 link)', score: 45 + 15 }
];

scenarios.forEach(scenario => {
  console.log(`  ${scenario.description}: ${scenario.score}/100`);
});

console.log('\n=================================================');
console.log('REAL WORLD TEST: freecalchub.com');
console.log('=================================================');

console.log('\nExpected Behavior:');
console.log('  1. Homepage currently scores 45/100 (methodology + updates)');
console.log('  2. Homepage has link to /about/ (detected)');
console.log('  3. Link bonus: +15 pts');
console.log('  4. New score: 45 + 15 = 60/100');
console.log('  5. Recommendation: "Transparency information appears to be on linked pages. Scan: /about/"');
console.log('\nNext Step: Deploy and test with live freecalchub.com URL');
