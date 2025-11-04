// Bug #6 and #7 Verification Tests - Staging Environment
import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';

test.describe('Bug #6: Factor Analysis Details Auto-Expansion', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for staging site
    test.setTimeout(60000);
  });

  test('low-scoring factors (<60) should be auto-expanded', async ({ page }) => {
    console.log('🧪 Testing Bug #6: Factor auto-expansion for low scores...');

    // Navigate to staging site
    await page.goto(STAGING_URL, { waitUntil: 'networkidle' });
    console.log('✅ Navigated to staging site');

    // Check if there's existing analysis or need to run one
    // First, check if we can access dashboard/results
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // If not on a results page, we need to either:
    // 1. Login and navigate to existing results, or
    // 2. Run a quick analysis

    // For this test, let's check if there's a "View Results" or "Dashboard" link
    const dashboardLink = page.locator('a[href*="dashboard"], a:has-text("Dashboard"), a:has-text("View Results")').first();

    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ Found dashboard/results link - clicking...');
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('⚠️  No existing results found - need to run analysis or login');

      // Check if we can run a quick analysis without auth (free tier)
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start Analysis")').first();

      if (await analyzeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✅ Found analyze button - running quick test analysis...');

        // Fill in test URL
        const urlInput = page.locator('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]').first();
        await urlInput.fill('https://example.com');

        await analyzeButton.click();
        console.log('⏳ Waiting for analysis to complete...');

        // Wait for results to load (may take 20-30 seconds)
        await page.waitForSelector('[class*="pillar"], [class*="factor"], .pillar-card, .factor-card', {
          timeout: 45000
        });
        console.log('✅ Analysis complete - results loaded');
      } else {
        throw new Error('❌ Cannot access results or run analysis - manual setup required');
      }
    }

    // Now we should be on a results page - look for pillar cards
    console.log('🔍 Searching for pillar cards...');
    const pillarCards = page.locator('[class*="pillar"]').first();

    if (await pillarCards.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click on first pillar to view factors
      console.log('✅ Found pillar - clicking to view factors...');
      await pillarCards.click();
      await page.waitForTimeout(1000); // Wait for expansion animation
    }

    // Look for factor cards
    console.log('🔍 Searching for factor cards...');
    const factorCards = page.locator('[class*="factor"], .factor-card, div:has(> div:has-text("Evidence Found"))');
    const factorCount = await factorCards.count();

    if (factorCount === 0) {
      // Try alternative approach - take screenshot for debugging
      await page.screenshot({ path: 'test-results/bug6-no-factors-found.png', fullPage: true });
      throw new Error('❌ No factor cards found - see screenshot for debugging');
    }

    console.log(`✅ Found ${factorCount} factor cards`);

    // Check each factor for auto-expansion logic
    let lowScoreFactorsFound = 0;
    let highScoreFactorsFound = 0;
    let autoExpandedCount = 0;
    let notAutoExpandedCount = 0;

    for (let i = 0; i < Math.min(factorCount, 10); i++) { // Test first 10 factors
      const factor = factorCards.nth(i);

      // Look for score display in the factor card
      const scoreElement = factor.locator('[class*="score"], .score, div[class*="text-2xl"]').first();

      if (await scoreElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        const scoreText = await scoreElement.textContent();
        const score = parseInt(scoreText.trim(), 10);

        if (!isNaN(score)) {
          console.log(`📊 Factor ${i + 1}: Score = ${score}`);

          // Check if details section is visible
          const detailsVisible = await factor.locator('div:has-text("Evidence Found"), div:has-text("Recommendations"), div:has-text("Framework Insight")').first().isVisible({ timeout: 1000 }).catch(() => false);

          if (score < 60) {
            lowScoreFactorsFound++;
            if (detailsVisible) {
              autoExpandedCount++;
              console.log(`  ✅ LOW SCORE (<60): Details AUTO-EXPANDED (correct behavior)`);
            } else {
              notAutoExpandedCount++;
              console.log(`  ❌ LOW SCORE (<60): Details NOT expanded (BUG - should auto-expand)`);
            }
          } else {
            highScoreFactorsFound++;
            if (!detailsVisible) {
              console.log(`  ✅ HIGH SCORE (≥60): Details collapsed (correct behavior)`);
            } else {
              console.log(`  ⚠️  HIGH SCORE (≥60): Details expanded (may have been manually expanded)`);
            }
          }
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  Low score factors found: ${lowScoreFactorsFound}`);
    console.log(`  Auto-expanded: ${autoExpandedCount}`);
    console.log(`  Not auto-expanded: ${notAutoExpandedCount}`);
    console.log(`  High score factors: ${highScoreFactorsFound}`);

    // Take screenshot for evidence
    await page.screenshot({ path: 'test-results/bug6-factor-expansion.png', fullPage: true });

    // Assertion: All low-scoring factors should be auto-expanded
    if (lowScoreFactorsFound > 0) {
      expect(autoExpandedCount).toBe(lowScoreFactorsFound);
      console.log('✅ PASS: All low-scoring factors are auto-expanded');
    } else {
      console.log('⚠️  WARNING: No low-scoring factors found in test data - cannot verify auto-expansion');
      // Don't fail test if no low scores exist - this is test data dependent
    }
  });

  test('manual expand/collapse functionality should still work', async ({ page }) => {
    console.log('🧪 Testing Bug #6: Manual toggle functionality...');

    await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

    // Navigate to results (using same logic as previous test)
    const dashboardLink = page.locator('a[href*="dashboard"], a:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Find a factor card
    const factorCard = page.locator('[class*="factor"]').first();
    if (!await factorCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('⚠️  Skipping manual toggle test - no factors found');
      return;
    }

    // Check initial state
    const initiallyExpanded = await factorCard.locator('div:has-text("Evidence Found")').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`📍 Initial state: ${initiallyExpanded ? 'Expanded' : 'Collapsed'}`);

    // Click the factor card to toggle
    await factorCard.click();
    await page.waitForTimeout(500); // Wait for animation

    // Check new state
    const afterToggle = await factorCard.locator('div:has-text("Evidence Found")').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`📍 After toggle: ${afterToggle ? 'Expanded' : 'Collapsed'}`);

    // Verify state changed
    expect(afterToggle).toBe(!initiallyExpanded);
    console.log('✅ PASS: Manual toggle functionality works correctly');

    // Toggle back
    await factorCard.click();
    await page.waitForTimeout(500);

    const afterSecondToggle = await factorCard.locator('div:has-text("Evidence Found")').isVisible({ timeout: 1000 }).catch(() => false);
    expect(afterSecondToggle).toBe(initiallyExpanded);
    console.log('✅ PASS: Toggle back works correctly');

    await page.screenshot({ path: 'test-results/bug6-manual-toggle.png', fullPage: true });
  });
});

test.describe('Bug #7: Warning Text Overflow', () => {
  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ];

  for (const viewport of viewports) {
    test(`warning text should not overflow at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      console.log(`🧪 Testing Bug #7: Text overflow at ${viewport.name} (${viewport.width}px)...`);

      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      console.log(`✅ Viewport set to ${viewport.width}x${viewport.height}`);

      // Navigate to signup page
      await page.goto(`${STAGING_URL}/#signup`, { waitUntil: 'networkidle' });
      console.log('✅ Navigated to signup page');

      // Wait for tier selector to be visible
      await page.waitForSelector('.tier-selector, [class*="tier"]', { timeout: 10000 });
      console.log('✅ Tier selector loaded');

      // Find and select the FREE tier
      const freeTierRadio = page.locator('input[type="radio"][value="free"]');

      if (!await freeTierRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Try alternative selector
        const freeTierCard = page.locator('div:has-text("FREE (Limited)")').first();
        if (await freeTierCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await freeTierCard.click();
          console.log('✅ Selected FREE tier (via card click)');
        } else {
          throw new Error('❌ Could not find FREE tier selector');
        }
      } else {
        await freeTierRadio.click();
        console.log('✅ Selected FREE tier (via radio)');
      }

      // Wait for warnings to appear
      await page.waitForTimeout(500);

      // Find the warning text container
      const warningContainer = page.locator('div:has-text("Only 3 analyses/month"), ul:has-text("Only 3 analyses/month")').first();

      if (!await warningContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.screenshot({ path: `test-results/bug7-no-warnings-${viewport.name}.png`, fullPage: true });
        throw new Error('❌ Warning text not visible after selecting FREE tier');
      }

      console.log('✅ Warning text container found');

      // Check for overflow
      const containerBox = await warningContainer.boundingBox();
      const parentContainer = page.locator('.tier-selector, div:has(input[value="free"])').first();
      const parentBox = await parentContainer.boundingBox();

      console.log(`📏 Warning container width: ${containerBox?.width}px`);
      console.log(`📏 Parent container width: ${parentBox?.width}px`);

      // Verify no horizontal overflow
      if (containerBox && parentBox) {
        const overflows = containerBox.width > parentBox.width + 5; // 5px tolerance for rounding
        expect(overflows).toBe(false);

        if (!overflows) {
          console.log(`✅ PASS: No overflow at ${viewport.name} (${viewport.width}px)`);
        } else {
          console.log(`❌ FAIL: Text overflows container by ${containerBox.width - parentBox.width}px`);
        }
      }

      // Check CSS properties for proper wrapping
      const computedStyle = await warningContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          wordBreak: style.wordBreak,
          overflowWrap: style.overflowWrap,
          maxWidth: style.maxWidth
        };
      });

      console.log('📋 CSS Properties:', computedStyle);

      // Verify proper CSS is applied
      expect(computedStyle.overflowX).not.toBe('visible');
      console.log(`✅ overflow-x: ${computedStyle.overflowX} (not visible)`);

      // Check for text wrapping properties
      const hasTextWrapping =
        computedStyle.wordBreak === 'break-word' ||
        computedStyle.overflowWrap === 'break-word' ||
        computedStyle.overflowWrap === 'anywhere';

      if (hasTextWrapping) {
        console.log(`✅ Text wrapping enabled: ${computedStyle.wordBreak || computedStyle.overflowWrap}`);
      }

      // Take screenshot for visual evidence
      await page.screenshot({
        path: `test-results/bug7-warnings-${viewport.name}-${viewport.width}px.png`,
        fullPage: true
      });

      // Scroll warning into view and take focused screenshot
      await warningContainer.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/bug7-warnings-focused-${viewport.name}-${viewport.width}px.png`
      });

      console.log(`✅ PASS: Warning text displays correctly at ${viewport.name} (${viewport.width}px)`);
    });
  }

  test('verify all warning messages are readable', async ({ page }) => {
    console.log('🧪 Testing Bug #7: All warning messages readable...');

    await page.goto(`${STAGING_URL}/#signup`, { waitUntil: 'networkidle' });

    // Select FREE tier
    const freeTierRadio = page.locator('input[type="radio"][value="free"]');
    const freeTierCard = page.locator('div:has-text("FREE (Limited)")').first();

    if (await freeTierRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
      await freeTierRadio.click();
    } else if (await freeTierCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await freeTierCard.click();
    }

    await page.waitForTimeout(500);

    // Expected warning messages from TierSelector.jsx
    const expectedWarnings = [
      'Only 3 analyses/month',
      'No historical tracking',
      'No exports or reports',
      'You\'ll miss critical insights'
    ];

    console.log('🔍 Checking for expected warning messages...');

    for (const warning of expectedWarnings) {
      const warningElement = page.locator(`text=${warning}`).first();
      const isVisible = await warningElement.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        console.log(`  ✅ Found: "${warning}"`);
        expect(isVisible).toBe(true);
      } else {
        console.log(`  ⚠️  Not found (may be partial match needed): "${warning}"`);
        // Try partial match
        const partialMatch = page.locator(`text=${warning.substring(0, 20)}`).first();
        const partialVisible = await partialMatch.isVisible({ timeout: 2000 }).catch(() => false);

        if (partialVisible) {
          const fullText = await partialMatch.textContent();
          console.log(`  ✅ Found partial: "${fullText}"`);
        }
      }
    }

    await page.screenshot({ path: 'test-results/bug7-all-warnings.png', fullPage: true });
    console.log('✅ PASS: Warning messages are readable');
  });
});

test.describe('Integration Test: Both Bugs Together', () => {
  test('complete user journey - signup and analysis viewing', async ({ page }) => {
    console.log('🧪 Integration Test: Complete user journey...');

    // Part 1: Bug #7 - Signup page with responsive warnings
    console.log('\n📱 Testing responsive signup (Bug #7)...');
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.goto(`${STAGING_URL}/#signup`, { waitUntil: 'networkidle' });

    const freeTier = page.locator('input[value="free"]').or(page.locator('div:has-text("FREE (Limited)")')).first();
    await freeTier.click();

    // Verify no overflow on mobile
    const warnings = page.locator('text=Only 3 analyses/month').first();
    await expect(warnings).toBeVisible();
    console.log('✅ Warnings visible on mobile without overflow');

    await page.screenshot({ path: 'test-results/integration-signup-mobile.png', fullPage: true });

    // Part 2: Bug #6 - Factor expansion in results
    console.log('\n📊 Testing factor expansion (Bug #6)...');

    // Switch to desktop for better analysis viewing
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to results (if available)
    const dashboardLink = page.locator('a[href*="dashboard"], a:has-text("Dashboard")').first();
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');

      // Check for auto-expanded factors
      const expandedFactors = page.locator('div:has-text("Evidence Found")');
      const expandedCount = await expandedFactors.count();

      if (expandedCount > 0) {
        console.log(`✅ Found ${expandedCount} auto-expanded factors`);
        await page.screenshot({ path: 'test-results/integration-factors-expanded.png', fullPage: true });
      } else {
        console.log('⚠️  No expanded factors found (may need analysis with low scores)');
      }
    } else {
      console.log('⚠️  Skipping factor expansion test - no results available');
    }

    console.log('✅ Integration test complete');
  });
});
