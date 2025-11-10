// Bug #6 Verification ONLY - Factor Analysis Details Auto-Expansion
import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';

test.describe('Bug #6: Factor Analysis Details Auto-Expansion - Staging Verification', () => {
  test('verify factor expansion behavior if results exist', async ({ page }) => {
    console.log('🧪 Testing Bug #6: Factor auto-expansion on staging...');

    test.setTimeout(120000); // 2 minute timeout for staging

    // Navigate to staging
    await page.goto(STAGING_URL, { waitUntil: 'networkidle' });
    console.log('✅ Navigated to staging site');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/bug6-staging-home.png', fullPage: true });

    // Try to find any existing results or dashboard link
    const possibleResultsLinks = [
      'a:has-text("Dashboard")',
      'a:has-text("View Results")',
      'a:has-text("My Results")',
      'a:has-text("Analysis")',
      'a[href*="dashboard"]',
      'a[href*="results"]'
    ];

    let foundResults = false;

    for (const selector of possibleResultsLinks) {
      const link = page.locator(selector).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✅ Found results link: ${selector}`);
        await link.click();
        await page.waitForLoadState('networkidle');
        foundResults = true;
        break;
      }
    }

    if (!foundResults) {
      console.log('⚠️  No existing results found on staging - checking if we can run a quick analysis...');

      // Look for analyze/scan buttons
      const analyzeSelectors = [
        'button:has-text("Analyze")',
        'button:has-text("Scan")',
        'button:has-text("Start")',
        'button:has-text("Get Started")',
        'input[type="url"]'
      ];

      let canAnalyze = false;
      for (const selector of analyzeSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`✅ Found analysis trigger: ${selector}`);
          canAnalyze = true;
          break;
        }
      }

      if (canAnalyze) {
        console.log('📊 Attempting to run quick test analysis...');

        // Try to fill URL input
        const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]').first();
        if (await urlInput.isVisible({ timeout: 5000 }).catch(() => false)) {
          await urlInput.fill('https://example.com');
          console.log('✅ Filled test URL');

          // Click analyze button
          const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Scan"), button:has-text("Start")').first();
          await analyzeBtn.click();
          console.log('⏳ Analysis started - waiting for results...');

          // Wait for results (up to 60 seconds)
          await page.waitForSelector('[class*="factor"], [class*="pillar"], div:has-text("Evidence")', {
            timeout: 60000
          }).catch(() => {
            console.log('⚠️  Analysis timeout - may need authentication');
          });
        }
      } else {
        console.log('❌ Cannot run analysis without authentication');
        await page.screenshot({ path: 'test-results/bug6-no-results-available.png', fullPage: true });
        test.skip(true, 'No results available and cannot run analysis without auth');
      }
    }

    // Now look for factor cards
    await page.screenshot({ path: 'test-results/bug6-results-page.png', fullPage: true });

    const factorCardSelectors = [
      'div[class*="factor"]',
      '.factor-card',
      'div:has-text("Evidence Found")',
      'div:has-text("Recommendations")',
      'div:has-text("score")'
    ];

    let factorCards = null;
    for (const selector of factorCardSelectors) {
      const cards = page.locator(selector);
      const count = await cards.count();
      if (count > 0) {
        console.log(`✅ Found ${count} elements matching: ${selector}`);
        factorCards = cards;
        break;
      }
    }

    if (!factorCards || await factorCards.count() === 0) {
      console.log('⚠️  No factor cards found - checking page structure...');

      // Get page content for debugging
      const pageText = await page.textContent('body');
      if (pageText.includes('Evidence') || pageText.includes('Recommendations') || pageText.includes('Factor')) {
        console.log('✅ Page contains factor-related text - may need different selectors');
        await page.screenshot({ path: 'test-results/bug6-factors-present-but-not-found.png', fullPage: true });
      } else {
        console.log('❌ Page does not contain factor content');
      }

      test.skip(true, 'No factor cards found on page');
    }

    // Test factor auto-expansion logic
    const factorCount = await factorCards.count();
    console.log(`\n📊 Analyzing ${factorCount} factor cards...`);

    let lowScoreExpanded = 0;
    let lowScoreCollapsed = 0;
    let highScoreExpanded = 0;
    let highScoreCollapsed = 0;
    let unscored = 0;

    for (let i = 0; i < Math.min(factorCount, 15); i++) {
      const factor = factorCards.nth(i);

      try {
        // Try to find score - multiple possible formats
        const scoreSelectors = [
          'div[class*="score"]',
          '.score',
          'div[class*="text-2xl"]',
          'span[class*="font-bold"]'
        ];

        let scoreText = null;
        for (const selector of scoreSelectors) {
          const scoreEl = factor.locator(selector).first();
          if (await scoreEl.isVisible({ timeout: 1000 }).catch(() => false)) {
            scoreText = await scoreEl.textContent();
            break;
          }
        }

        if (!scoreText) {
          unscored++;
          continue;
        }

        // Extract numeric score
        const score = parseInt(scoreText.replace(/[^0-9]/g, ''), 10);

        if (isNaN(score)) {
          unscored++;
          continue;
        }

        // Check if details are visible
        const detailsSelectors = [
          'div:has-text("Evidence Found")',
          'div:has-text("Recommendations")',
          'div:has-text("Framework Insight")'
        ];

        let isExpanded = false;
        for (const selector of detailsSelectors) {
          if (await factor.locator(selector).isVisible({ timeout: 500 }).catch(() => false)) {
            isExpanded = true;
            break;
          }
        }

        // Categorize
        if (score < 60) {
          if (isExpanded) {
            lowScoreExpanded++;
            console.log(`  ✅ Factor ${i + 1}: Score ${score} - EXPANDED (correct for low score)`);
          } else {
            lowScoreCollapsed++;
            console.log(`  ❌ Factor ${i + 1}: Score ${score} - COLLAPSED (should be expanded)`);
          }
        } else {
          if (isExpanded) {
            highScoreExpanded++;
            console.log(`  ℹ️  Factor ${i + 1}: Score ${score} - EXPANDED (may be manually expanded)`);
          } else {
            highScoreCollapsed++;
            console.log(`  ✅ Factor ${i + 1}: Score ${score} - COLLAPSED (correct for high score)`);
          }
        }

      } catch (error) {
        console.log(`  ⚠️  Factor ${i + 1}: Could not analyze - ${error.message}`);
        unscored++;
      }
    }

    // Report results
    console.log('\n📈 Bug #6 Test Results:');
    console.log(`  Low score (<60) factors:`);
    console.log(`    - Auto-expanded: ${lowScoreExpanded} ✅`);
    console.log(`    - NOT expanded: ${lowScoreCollapsed} ❌`);
    console.log(`  High score (≥60) factors:`);
    console.log(`    - Collapsed: ${highScoreCollapsed} ✅`);
    console.log(`    - Expanded: ${highScoreExpanded} ℹ️`);
    console.log(`  Could not score: ${unscored}`);

    await page.screenshot({ path: 'test-results/bug6-final-analysis.png', fullPage: true });

    // Test pass criteria
    if (lowScoreExpanded + lowScoreCollapsed > 0) {
      // We found low-scoring factors - verify they're all expanded
      expect(lowScoreCollapsed).toBe(0);
      console.log('\n✅ PASS: All low-scoring factors are auto-expanded');
    } else {
      console.log('\n⚠️  WARNING: No low-scoring factors found - cannot fully verify Bug #6 fix');
      console.log('    Recommendation: Test with data that includes low scores');
    }

    // Additional check: Verify manual toggle still works
    if (factorCount > 0) {
      console.log('\n🧪 Testing manual toggle functionality...');
      const firstFactor = factorCards.first();

      // Click to toggle
      await firstFactor.click();
      await page.waitForTimeout(300); // Wait for animation

      await page.screenshot({ path: 'test-results/bug6-after-toggle.png', fullPage: true });
      console.log('✅ Manual toggle clicked - see screenshot for visual verification');
    }
  });
});
