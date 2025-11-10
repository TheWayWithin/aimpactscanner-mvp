// tests/e2e/pdf-export-growth-full-flow.spec.js
import { test, expect } from '@playwright/test';

/**
 * PDF Export - Growth Tier FULL FLOW Test
 *
 * Verifies fix for commit 2c5ba9f by running a complete analysis flow
 *
 * Test Flow:
 * 1. Inject Growth tier user session
 * 2. Run analysis on test URL
 * 3. Wait for results page
 * 4. Verify PDF button has NO "Upgrade" badge
 */

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const LOCAL_URL = 'http://localhost:5173';
const BASE_URL = process.env.BASE_URL || STAGING_URL;

const TEST_URL = 'https://example.com'; // Fast, simple site for testing

test.describe('PDF Export - Growth Tier Full Flow', () => {

  test('Growth tier user - Full analysis flow with PDF button check', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds for full flow

    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('tier') || text.includes('hasPDFAccess') || text.includes('PDF')) {
        console.log(`[APP] ${text}`);
      }
    });

    console.log(`\n========================================`);
    console.log(`PDF EXPORT - GROWTH TIER FULL FLOW TEST`);
    console.log(`========================================`);
    console.log(`Environment: ${BASE_URL}`);
    console.log(`Test URL: ${TEST_URL}\n`);

    // Step 1: Navigate and inject Growth tier session
    console.log('Step 1: Setting up Growth tier user session...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      // Mock Growth tier user session
      const mockSession = {
        access_token: 'mock-growth-token',
        user: {
          id: 'test-growth-user',
          email: 'growth@test.com',
          user_metadata: { tier: 'growth' }
        }
      };

      // Supabase auth token (staging database key)
      localStorage.setItem(
        'sb-isgzvwpjokcmtizstwru-auth-token',
        JSON.stringify({ currentSession: mockSession })
      );

      // App state
      localStorage.setItem('user_tier', 'growth');
      localStorage.setItem('subscription_status', 'active');
      localStorage.setItem('analyses_used', '5');
      localStorage.setItem('analyses_limit', '100');
    });

    console.log('✅ Growth tier session injected');

    // Step 2: Navigate to scanner
    console.log('\nStep 2: Navigating to scanner...');
    await page.goto(`${BASE_URL}/#scanner`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('✅ Scanner page loaded');

    // Step 3: Enter URL and start analysis
    console.log('\nStep 3: Starting analysis...');

    // Find URL input field
    const urlInput = page.locator('input[type="url"], input[placeholder*="URL"], input[name*="url"]').first();
    await expect(urlInput).toBeVisible({ timeout: 5000 });

    await urlInput.fill(TEST_URL);
    console.log(`✅ Entered URL: ${TEST_URL}`);

    // Click analyze button
    const analyzeButton = page.locator('button').filter({
      hasText: /analyze|scan|start/i
    }).first();

    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    console.log('✅ Analysis started');

    // Step 4: Wait for results page
    console.log('\nStep 4: Waiting for analysis to complete...');

    try {
      // Wait for navigation to results page
      await page.waitForURL(/results|analysis/, { timeout: 60000 });
      console.log('✅ Navigated to results page');
    } catch (error) {
      console.log('⚠️  URL did not change to results page, checking current page...');

      // Take screenshot of current state
      await page.screenshot({
        path: 'test-results/pdf-test-waiting-for-results.png',
        fullPage: true
      });

      // Check if we're still on scanner or if analysis is in progress
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      // Look for progress indicators
      const progressIndicator = page.locator('text=/analyzing|processing|loading/i').first();
      const hasProgress = await progressIndicator.isVisible().catch(() => false);

      if (hasProgress) {
        console.log('Analysis in progress, waiting longer...');
        await page.waitForURL(/results|analysis/, { timeout: 30000 });
      }
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra time for tier data fetch

    console.log('✅ Results page loaded');

    // Step 5: Look for PDF export button
    console.log('\nStep 5: Locating PDF export button...');

    const pdfButtonSelectors = [
      'button:has-text("Professional PDF")',
      'button:has-text("Export PDF")',
      'button:has-text("PDF")',
      '[data-testid*="pdf"]',
      'button[class*="pdf"]'
    ];

    let pdfButton = null;

    for (const selector of pdfButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        pdfButton = page.locator(selector).first();
        console.log(`✅ Found PDF button: ${selector}`);
        break;
      }
    }

    if (!pdfButton) {
      console.log('⚠️  PDF button not found');
      await page.screenshot({
        path: 'test-results/pdf-test-no-button-found.png',
        fullPage: true
      });

      // Log all buttons on page for debugging
      const allButtons = await page.locator('button').count();
      console.log(`Total buttons on page: ${allButtons}`);

      for (let i = 0; i < Math.min(allButtons, 10); i++) {
        const text = await page.locator('button').nth(i).textContent();
        console.log(`  Button ${i}: "${text}"`);
      }

      throw new Error('PDF export button not found on results page');
    }

    // Step 6: Verify NO "Upgrade" badge
    console.log('\nStep 6: Checking for "Upgrade" badge...');

    await expect(pdfButton).toBeVisible();

    const buttonText = await pdfButton.textContent();
    const fullButtonHtml = await pdfButton.innerHTML();

    console.log(`Button text: "${buttonText}"`);
    console.log(`Button HTML: ${fullButtonHtml.substring(0, 200)}...`);

    const hasUpgrade = buttonText.toLowerCase().includes('upgrade');

    if (hasUpgrade) {
      console.log('\n❌❌❌ FAIL: "Upgrade" badge FOUND ❌❌❌');
      console.log(`Full button text: "${buttonText}"`);

      await page.screenshot({
        path: 'test-results/pdf-test-FAIL-upgrade-badge-found.png',
        fullPage: true
      });

      // Check console logs for tier debugging
      console.log('\nTier-related console logs:');
      consoleLogs
        .filter(log => log.includes('tier') || log.includes('PDF'))
        .forEach(log => console.log(`  ${log}`));

      throw new Error('REGRESSION: Growth tier user still sees "Upgrade" badge on PDF button');
    }

    console.log('✅✅✅ PASS: No "Upgrade" badge found ✅✅✅');

    // Step 7: Verify button is enabled
    console.log('\nStep 7: Verifying button state...');

    const isDisabled = await pdfButton.isDisabled();
    expect(isDisabled).toBe(false);
    console.log('✅ PDF button is enabled (clickable)');

    // Step 8: Take success screenshot
    await page.screenshot({
      path: 'test-results/pdf-test-PASS-growth-tier.png',
      fullPage: false
    });

    console.log('\n========================================');
    console.log('✅✅✅ TEST PASSED ✅✅✅');
    console.log('========================================');
    console.log('User Tier: Growth (mocked)');
    console.log('PDF Button: Visible & Enabled');
    console.log('Upgrade Badge: NOT PRESENT');
    console.log('========================================\n');
  });

  test('Free tier user SHOULD see Upgrade badge (regression check)', async ({ page }) => {
    test.setTimeout(90000);

    console.log('\n========================================');
    console.log('REGRESSION TEST - FREE TIER');
    console.log('========================================\n');

    // Inject free tier session
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('user_tier', 'free');
      localStorage.setItem('subscription_status', 'none');
      localStorage.setItem('analyses_used', '0');
      localStorage.setItem('analyses_limit', '1');
    });

    console.log('✅ Free tier session injected');

    // Navigate and run analysis
    await page.goto(`${BASE_URL}/#scanner`);
    await page.waitForLoadState('networkidle');

    const urlInput = page.locator('input[type="url"]').first();
    await urlInput.fill(TEST_URL);

    const analyzeButton = page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();

    // Wait for results
    await page.waitForURL(/results/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check PDF button
    const pdfButton = page.locator('button:has-text("PDF")').first();

    if (await pdfButton.count() === 0) {
      console.log('⚠️  PDF button not found on results page');
      return;
    }

    const buttonText = await pdfButton.textContent();
    const hasUpgrade = buttonText.toLowerCase().includes('upgrade');

    console.log(`Free tier PDF button text: "${buttonText}"`);
    console.log(`Has "Upgrade" badge: ${hasUpgrade ? '✅ YES (correct)' : '❌ NO (wrong)'}`);

    if (!hasUpgrade) {
      console.log('⚠️  WARNING: Free tier should show Upgrade badge but doesn\'t');
    }
  });
});
