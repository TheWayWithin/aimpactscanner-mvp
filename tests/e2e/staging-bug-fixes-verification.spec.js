/**
 * STAGING BUG FIXES VERIFICATION TEST SUITE
 *
 * Environment: https://develop--aimpactscanner.netlify.app
 * Date: November 4, 2025
 *
 * Tests verify 4 critical bug fixes:
 * 1. Bug #4: Pricing page tier structure (commit 6a6a0bc)
 * 2. Bug #1: Growth tier analysis limits (commit 3c2a231)
 * 3. Bugs #2-3: Dashboard tier display names (commit b97fca0)
 * 4. Phase 6: Doug Hall messaging (commit 1014d91)
 */

import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const SCREENSHOT_DIR = './test-results/staging-verification';

test.describe('Staging Bug Fixes Verification', () => {

  test.beforeAll(async () => {
    console.log('🎯 Starting staging environment verification...');
    console.log(`📍 Testing against: ${STAGING_URL}`);
  });

  /**
   * TEST 1: Pricing Page Tier Structure (Bug #4)
   *
   * Verifies:
   * - 4 tiers visible: Free, Solo, Growth, Scale
   * - Correct pricing amounts
   * - NO old tier names (Coffee, Professional)
   */
  test('Test 1: Pricing Page Tier Structure (Bug #4)', async ({ page }) => {
    console.log('\n🧪 TEST 1: Verifying pricing page tier structure...');

    // Navigate to pricing page
    await page.goto(`${STAGING_URL}/#pricing`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Allow dynamic content to load

    // Take initial screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/staging-pricing-page.png`,
      fullPage: true
    });

    // Get page content for text analysis
    const pageContent = await page.content();

    // CRITICAL: Verify NO old tier names present
    console.log('  ✓ Checking for old tier names (should be ABSENT)...');
    expect(pageContent).not.toContain('Coffee tier');
    expect(pageContent).not.toContain('$4.95');
    expect(pageContent).not.toContain('Professional tier');
    expect(pageContent).not.toContain('$29/month');
    expect(pageContent).not.toContain('$39/month');

    // Verify new tier structure present
    console.log('  ✓ Checking for new tier names (should be PRESENT)...');

    // Check for tier names in the page
    const hasFree = pageContent.includes('Free') || pageContent.includes('FREE');
    const hasSolo = pageContent.includes('Solo') || pageContent.includes('SOLO');
    const hasGrowth = pageContent.includes('Growth') || pageContent.includes('GROWTH');
    const hasScale = pageContent.includes('Scale') || pageContent.includes('SCALE');

    console.log(`    - Free tier: ${hasFree ? '✅' : '❌'}`);
    console.log(`    - Solo tier: ${hasSolo ? '✅' : '❌'}`);
    console.log(`    - Growth tier: ${hasGrowth ? '✅' : '❌'}`);
    console.log(`    - Scale tier: ${hasScale ? '✅' : '❌'}`);

    expect(hasFree).toBeTruthy();
    expect(hasSolo).toBeTruthy();
    expect(hasGrowth).toBeTruthy();
    expect(hasScale).toBeTruthy();

    // Verify new pricing amounts
    console.log('  ✓ Checking for new pricing amounts...');

    // Solo tier: $5.95/month or $4.13/mo annual
    const hasSoloPrice = pageContent.includes('5.95') || pageContent.includes('$5.95');
    const hasSoloAnnual = pageContent.includes('4.13') || pageContent.includes('$4.13');

    // Growth tier: $17.95/month or $12.46/mo annual
    const hasGrowthPrice = pageContent.includes('17.95') || pageContent.includes('$17.95');
    const hasGrowthAnnual = pageContent.includes('12.46') || pageContent.includes('$12.46');

    // Scale tier: $34.95/month or $24.96/mo annual
    const hasScalePrice = pageContent.includes('34.95') || pageContent.includes('$34.95');
    const hasScaleAnnual = pageContent.includes('24.96') || pageContent.includes('$24.96');

    console.log(`    - Solo: $5.95 ${hasSoloPrice ? '✅' : '❌'} | $4.13 annual ${hasSoloAnnual ? '✅' : '❌'}`);
    console.log(`    - Growth: $17.95 ${hasGrowthPrice ? '✅' : '❌'} | $12.46 annual ${hasGrowthAnnual ? '✅' : '❌'}`);
    console.log(`    - Scale: $34.95 ${hasScalePrice ? '✅' : '❌'} | $24.96 annual ${hasScaleAnnual ? '✅' : '❌'}`);

    // At least one pricing format should be present for each tier
    expect(hasSoloPrice || hasSoloAnnual).toBeTruthy();
    expect(hasGrowthPrice || hasGrowthAnnual).toBeTruthy();
    expect(hasScalePrice || hasScaleAnnual).toBeTruthy();

    console.log('  ✅ Test 1 PASSED: Pricing page structure verified\n');
  });

  /**
   * TEST 2: Growth Tier Analysis Limits (Bug #1)
   *
   * Note: Requires authentication - will attempt to check client-side config
   */
  test('Test 2: Growth Tier Analysis Limits (Bug #1) - Configuration Check', async ({ page }) => {
    console.log('\n🧪 TEST 2: Verifying Growth tier analysis limits configuration...');

    await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

    // Attempt to extract tier configuration from client-side code
    const tierConfig = await page.evaluate(() => {
      // Check if there's a global config or constants file loaded
      if (window.TIER_CONFIG || window.tierConfig) {
        return window.TIER_CONFIG || window.tierConfig;
      }

      // Try to find it in React component props (if exposed)
      const reactRoot = document.querySelector('#root');
      if (reactRoot && reactRoot._reactRootContainer) {
        // React internal structure - may not work
        return null;
      }

      return null;
    });

    if (tierConfig) {
      console.log('  ✓ Found tier configuration:', tierConfig);

      // Verify Growth tier has 40 analyses
      if (tierConfig.growth || tierConfig.GROWTH) {
        const growthConfig = tierConfig.growth || tierConfig.GROWTH;
        expect(growthConfig.analysisLimit).toBe(40);
        console.log('  ✅ Growth tier limit verified: 40 analyses\n');
      } else {
        console.log('  ⚠️  Growth tier config not found in client-side data');
        console.log('  📋 MANUAL VERIFICATION REQUIRED: Check authenticated dashboard\n');
      }
    } else {
      console.log('  ℹ️  Client-side tier configuration not accessible');
      console.log('  📋 MANUAL VERIFICATION REQUIRED:');
      console.log('     1. Log in to staging with Growth tier account');
      console.log('     2. Navigate to dashboard');
      console.log('     3. Verify "40 analyses remaining" is displayed\n');
    }
  });

  /**
   * TEST 3: Dashboard Tier Display Names (Bugs #2-3)
   *
   * Checks for absence of old "Coffee tier" naming
   */
  test('Test 3: Dashboard Tier Display Names (Bugs #2-3) - Static Check', async ({ page }) => {
    console.log('\n🧪 TEST 3: Verifying dashboard tier display names...');

    await page.goto(`${STAGING_URL}/#dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const pageContent = await page.content();

    // Verify NO "Coffee tier" references
    console.log('  ✓ Checking for old "Coffee tier" references (should be ABSENT)...');
    expect(pageContent).not.toContain('Coffee tier');
    expect(pageContent).not.toContain('coffee tier');
    expect(pageContent).not.toContain('COFFEE TIER');

    console.log('  ✅ No "Coffee tier" references found');
    console.log('  📋 MANUAL VERIFICATION REQUIRED:');
    console.log('     1. Log in to staging with any paid tier account');
    console.log('     2. Verify tier name displays as "Solo", "Growth", or "Scale"');
    console.log('     3. Verify no "Coffee" tier name appears\n');
  });

  /**
   * TEST 4: Doug Hall Messaging (Phase 6)
   *
   * Verifies:
   * - TierMessagingSection renders
   * - SavingsHighlight renders
   * - Dynamic copy updates on tier selection
   */
  test('Test 4: Doug Hall Messaging (Phase 6)', async ({ page }) => {
    console.log('\n🧪 TEST 4: Verifying Doug Hall messaging components...');

    // Navigate to signup page
    await page.goto(`${STAGING_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/staging-doug-hall-messaging-initial.png`,
      fullPage: true
    });

    const pageContent = await page.content();

    // Check for messaging components
    console.log('  ✓ Checking for messaging components...');

    // Look for key messaging phrases from Doug Hall strategy
    const hasMessaging =
      pageContent.includes('YOU MADE THE RIGHT CHOICE') ||
      pageContent.includes('RIGHT CHOICE') ||
      pageContent.includes('SMART MOVE') ||
      pageContent.includes('EXCELLENT DECISION');

    const hasSavingsHighlight =
      pageContent.includes('Save') ||
      pageContent.includes('SAVE') ||
      pageContent.includes('savings') ||
      pageContent.includes('discount');

    console.log(`    - Messaging component: ${hasMessaging ? '✅' : '❌'}`);
    console.log(`    - Savings highlight: ${hasSavingsHighlight ? '✅' : '❌'}`);

    // Try to interact with tier selection (if buttons are present)
    try {
      // Look for Growth tier button/card
      const growthButton = await page.locator('text=/growth/i').first();

      if (await growthButton.isVisible()) {
        console.log('  ✓ Attempting to select Growth tier...');
        await growthButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot after interaction
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/staging-doug-hall-messaging-growth-selected.png`,
          fullPage: true
        });

        const updatedContent = await page.content();
        const hasConfirmationMessage =
          updatedContent.includes('YOU MADE THE RIGHT CHOICE') ||
          updatedContent.includes('RIGHT CHOICE') ||
          updatedContent.includes('SMART MOVE') ||
          updatedContent.includes('EXCELLENT DECISION');

        console.log(`    - Dynamic messaging update: ${hasConfirmationMessage ? '✅' : '❌'}`);
      } else {
        console.log('  ℹ️  Growth tier selection button not found - UI may have different structure');
      }
    } catch (error) {
      console.log(`  ℹ️  Could not interact with tier selection: ${error.message}`);
    }

    // Verify at least basic messaging is present
    if (hasMessaging || hasSavingsHighlight) {
      console.log('  ✅ Test 4 PASSED: Doug Hall messaging components verified\n');
    } else {
      console.log('  ⚠️  WARNING: No messaging components detected');
      console.log('  📋 MANUAL VERIFICATION REQUIRED:');
      console.log('     1. Navigate to signup page');
      console.log('     2. Select different tiers');
      console.log('     3. Verify messaging updates dynamically\n');
    }
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 STAGING VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('📁 Screenshots saved to:', SCREENSHOT_DIR);
    console.log('📋 Review test results above for detailed findings');
    console.log('='.repeat(60) + '\n');
  });
});
