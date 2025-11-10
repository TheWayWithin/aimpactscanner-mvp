// tests/e2e/pdf-export-growth-tier.spec.js
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../uat/test-users.config.js';

/**
 * PDF Export - Growth Tier Access Test
 *
 * Verifies fix for commit 2c5ba9f:
 * - Bug: Database returned tier: 'growth' but state used tier: 'free' due to localStorage fallback
 * - Fix: Capture database tier in variable, use it directly instead of fallback
 *
 * Expected Result: Growth tier user should NOT see "Upgrade" badge on PDF export button
 */

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const GROWTH_USER = TEST_USERS.growthActive;

test.describe('PDF Export - Growth Tier Access Verification', () => {

  test('Growth tier user should NOT see Upgrade badge on PDF export button', async ({ page }) => {
    const consoleLogs = [];
    const consoleErrors = [];

    // Capture console logs for debugging
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      // Capture tier-related logs specifically
      if (text.includes('tier') || text.includes('hasPDFAccess')) {
        console.log(`[CONSOLE] ${text}`);
      }

      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.error(`[ERROR] ${text}`);
      }
    });

    // Step 1: Navigate to staging environment
    console.log(`\n=== Step 1: Navigating to staging environment ===`);
    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    console.log('✅ Staging environment loaded');

    // Step 2: Login with Growth tier credentials
    console.log(`\n=== Step 2: Logging in as Growth tier user ===`);
    console.log(`Email: ${GROWTH_USER.email}`);

    // Navigate to login page
    await page.goto(`${STAGING_URL}/#login`);
    await page.waitForLoadState('networkidle');

    // Check if already authenticated (from previous test run)
    const currentUrl = page.url();
    if (currentUrl.includes('#dashboard')) {
      console.log('✅ Already authenticated - skipping login');
    } else {
      // Wait for login page to load
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Enter credentials
      await page.fill('input[type="email"]', GROWTH_USER.email);
      await page.fill('input[type="password"]', GROWTH_USER.password);

      // Click login button
      const loginButton = page.locator('button[type="submit"]').filter({ hasText: /sign in|log in/i });
      await loginButton.click();

      // Wait for redirect to dashboard
      await page.waitForURL(/dashboard/, { timeout: 15000 });
      console.log('✅ Login successful - redirected to dashboard');
    }

    // Step 3: Navigate to analysis results page
    console.log(`\n=== Step 3: Navigating to analysis results ===`);

    // Check if we have existing analyses
    const analysisExists = await page.locator('a[href*="#results"]').count() > 0;

    if (!analysisExists) {
      console.log('No existing analyses found - creating new analysis...');

      // Navigate to scanner
      await page.goto(`${STAGING_URL}/#scanner`);
      await page.waitForLoadState('networkidle');

      // Enter test URL
      await page.fill('input[type="url"]', 'https://example.com');

      // Start analysis
      const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan/i });
      await analyzeButton.click();

      // Wait for results to load
      await page.waitForURL(/results/, { timeout: 60000 });
      console.log('✅ Analysis complete - results loaded');
    } else {
      // Click on first existing analysis
      await page.locator('a[href*="#results"]').first().click();
      await page.waitForURL(/results/);
      console.log('✅ Navigated to existing analysis results');
    }

    // Wait for results page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow components to mount and fetch tier data

    // Step 4: Verify PDF export button is visible
    console.log(`\n=== Step 4: Verifying PDF export button ===`);

    const pdfButton = page.locator('button').filter({
      hasText: /export.*pdf|professional pdf|download pdf/i
    }).first();

    await expect(pdfButton).toBeVisible({ timeout: 10000 });
    console.log('✅ PDF export button found and visible');

    // Step 5: Verify NO "Upgrade" badge is present
    console.log(`\n=== Step 5: Checking for Upgrade badge (should NOT exist) ===`);

    // Check for upgrade badge in multiple ways
    const upgradeBadgeInButton = pdfButton.locator('text=/upgrade/i');
    const upgradeBadgeNearButton = page.locator('text=/upgrade/i').locator('visible=true');

    const upgradeBadgeCount = await upgradeBadgeInButton.count();
    console.log(`Upgrade badges found in button: ${upgradeBadgeCount}`);

    await expect(upgradeBadgeInButton).not.toBeVisible();
    console.log('✅ PASS: No "Upgrade" badge found on PDF button');

    // Step 6: Verify button is NOT disabled
    console.log(`\n=== Step 6: Verifying button is clickable ===`);

    await expect(pdfButton).not.toBeDisabled();
    console.log('✅ PDF export button is enabled (not disabled)');

    // Step 7: Verify console logs show correct tier
    console.log(`\n=== Step 7: Checking console logs for tier value ===`);

    const tierLogs = consoleLogs.filter(log =>
      log.includes('tier') && (log.includes('growth') || log.includes('free'))
    );

    console.log('\nTier-related console logs:');
    tierLogs.forEach(log => console.log(`  ${log}`));

    const hasGrowthTier = consoleLogs.some(log =>
      log.includes('tier') && log.includes('growth') && !log.includes('free')
    );

    const hasPDFAccessLog = consoleLogs.some(log =>
      log.includes('hasPDFAccess') && log.includes('growth')
    );

    if (hasGrowthTier || hasPDFAccessLog) {
      console.log('✅ Console logs confirm Growth tier detected');
    } else {
      console.warn('⚠️  Could not verify tier from console logs');
      console.log('This may be expected if debug logging is disabled in production');
    }

    // Step 8: Check for console errors
    console.log(`\n=== Step 8: Checking for console errors ===`);

    if (consoleErrors.length > 0) {
      console.warn(`⚠️  Found ${consoleErrors.length} console errors:`);
      consoleErrors.forEach(err => console.error(`  ${err}`));
    } else {
      console.log('✅ No console errors detected');
    }

    // Step 9: Take screenshot for visual verification
    console.log(`\n=== Step 9: Capturing screenshot for evidence ===`);

    await page.screenshot({
      path: 'test-results/pdf-export-growth-tier-verification.png',
      fullPage: false
    });
    console.log('✅ Screenshot saved: test-results/pdf-export-growth-tier-verification.png');

    // Final Summary
    console.log(`\n========================================`);
    console.log(`PDF EXPORT GROWTH TIER TEST - SUMMARY`);
    console.log(`========================================`);
    console.log(`✅ Login: Successful`);
    console.log(`✅ PDF Button: Visible`);
    console.log(`✅ Upgrade Badge: Not Present (PASS)`);
    console.log(`✅ Button State: Enabled`);
    console.log(`✅ Console Errors: ${consoleErrors.length}`);
    console.log(`========================================\n`);
  });

  test('Free tier user SHOULD see Upgrade badge (regression check)', async ({ page }) => {
    const FREE_USER = TEST_USERS.freeExisting;

    console.log(`\n=== Regression Test: Free tier user should see Upgrade badge ===`);
    console.log(`Email: ${FREE_USER.email}`);

    // Navigate to staging and login
    await page.goto(`${STAGING_URL}/#login`);
    await page.waitForLoadState('networkidle');

    // Login as free tier user
    await page.fill('input[type="email"]', FREE_USER.email);
    await page.fill('input[type="password"]', FREE_USER.password);

    const loginButton = page.locator('button[type="submit"]').filter({ hasText: /sign in|log in/i });
    await loginButton.click();

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    console.log('✅ Logged in as free tier user');

    // Navigate to any results page (or create analysis)
    const analysisExists = await page.locator('a[href*="#results"]').count() > 0;

    if (analysisExists) {
      await page.locator('a[href*="#results"]').first().click();
      await page.waitForURL(/results/);
    } else {
      // Create quick analysis
      await page.goto(`${STAGING_URL}/#scanner`);
      await page.fill('input[type="url"]', 'https://example.com');
      const analyzeButton = page.locator('button').filter({ hasText: /analyze|scan/i });
      await analyzeButton.click();
      await page.waitForURL(/results/, { timeout: 60000 });
    }

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for Upgrade badge on PDF button
    const pdfButton = page.locator('button').filter({
      hasText: /export.*pdf|professional pdf|download pdf/i
    }).first();

    const upgradeBadge = pdfButton.locator('text=/upgrade/i');

    // Free tier SHOULD have upgrade badge
    await expect(upgradeBadge).toBeVisible({ timeout: 5000 });
    console.log('✅ PASS: Free tier user sees "Upgrade" badge (expected behavior)');
  });
});
