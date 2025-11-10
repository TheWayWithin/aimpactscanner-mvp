import { test, expect } from '@playwright/test';

/**
 * Test Gate 6: Feature Gating Tests (Phase 8.2)
 *
 * Tests tier-based feature restrictions across 4 tiers:
 * - Free: All exports disabled
 * - Solo (Coffee): CSV/LLMS.txt disabled, PDF enabled
 * - Growth: CSV/LLMS.txt/PDF enabled, no API badge
 * - Scale: All features enabled + API badge visible
 *
 * Tests verify:
 * 1. Disabled state + tooltips for restricted features
 * 2. Enabled state functionality
 * 3. CSV export downloads valid file
 * 4. LLMS.txt shows "Coming soon" message
 */

test.describe('Feature Gating - Tier Restrictions (Phase 8.2)', () => {

  /**
   * Helper function to set user tier in localStorage
   * Simulates logged-in user with tier-specific data
   */
  async function setUserTier(page, tier, analysesRemaining = null) {
    const analysisLimits = {
      'free': 3,
      'coffee': 10,
      'growth': 40,
      'scale': 100
    };

    const remaining = analysesRemaining !== null ? analysesRemaining : analysisLimits[tier];

    await page.addInitScript((tier, remaining) => {
      const mockDashboardData = {
        tier: tier,
        email: `test-${tier}@example.com`,
        analyses_remaining: remaining,
        subscription_status: tier === 'free' ? null : 'active',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('dashboardData', JSON.stringify(mockDashboardData));

      // Also set auth context
      const mockAuthContext = {
        selectedTier: tier,
        billingFrequency: 'annual',
        mode: 'signup'
      };
      localStorage.setItem('authContext', JSON.stringify(mockAuthContext));
    }, tier, remaining);
  }

  /**
   * Helper function to run a quick analysis
   * Needed to access export buttons on results page
   */
  async function runAnalysis(page, url = 'https://example.com') {
    await page.goto('http://localhost:5173/#landing');
    await page.waitForSelector('input[name="url"]', { timeout: 10000 });

    // Enter URL and submit
    await page.fill('input[name="url"]', url);
    await page.click('button:has-text("Analyze")');

    // Wait for results page
    await page.waitForSelector('text="Overall Score"', { timeout: 30000 });
  }

  test('Free tier: All export buttons disabled with lock icons', async ({ page }) => {
    await setUserTier(page, 'free');
    await runAnalysis(page);

    // PDF export button should be disabled
    const pdfButton = page.locator('button:has-text("PDF")').first();
    await expect(pdfButton).toBeDisabled();

    // CSV export button should be disabled
    const csvButton = page.locator('button:has-text("CSV")').first();
    await expect(csvButton).toBeDisabled();

    // LLMS.txt button should be disabled
    const llmsTxtButton = page.locator('button:has-text("LLMS.txt")').first();
    await expect(llmsTxtButton).toBeDisabled();

    // Verify upgrade prompts visible
    await expect(page.locator('text="Upgrade to Solo"')).toBeVisible();

    console.log('✅ Free tier: All exports disabled with upgrade prompts');
  });

  test('Solo tier: PDF enabled, CSV/LLMS.txt disabled with tooltips', async ({ page }) => {
    await setUserTier(page, 'coffee'); // Internal ID for Solo
    await runAnalysis(page);

    // PDF export should be enabled
    const pdfButton = page.locator('button:has-text("Export to PDF")').first();
    await expect(pdfButton).toBeEnabled();

    // CSV export should be disabled
    const csvButton = page.locator('button:has-text("CSV")').first();
    await expect(csvButton).toBeDisabled();

    // Hover to check tooltip
    await csvButton.hover();
    await expect(page.locator('text=/Upgrade to Growth/i')).toBeVisible({ timeout: 2000 });

    // LLMS.txt should be disabled
    const llmsTxtButton = page.locator('button:has-text("LLMS.txt")').first();
    await expect(llmsTxtButton).toBeDisabled();

    console.log('✅ Solo tier: PDF enabled, CSV/LLMS.txt disabled with upgrade prompts');
  });

  test('Growth tier: CSV and LLMS.txt enabled, no lock icons', async ({ page }) => {
    await setUserTier(page, 'growth');
    await runAnalysis(page);

    // All export buttons should be enabled
    const pdfButton = page.locator('button:has-text("PDF")').first();
    await expect(pdfButton).toBeEnabled();

    const csvButton = page.locator('button:has-text("CSV")').first();
    await expect(csvButton).toBeEnabled();

    const llmsTxtButton = page.locator('button:has-text("LLMS.txt")').first();
    await expect(llmsTxtButton).toBeEnabled();

    // Verify no lock icons visible
    await expect(csvButton.locator('text="🔒"')).not.toBeVisible();
    await expect(llmsTxtButton.locator('text="🔒"')).not.toBeVisible();

    // Navigate to dashboard to verify NO API badge
    await page.goto('http://localhost:5173/#dashboard');
    const apiBadge = page.locator('text="API Access"');
    await expect(apiBadge).not.toBeVisible();

    console.log('✅ Growth tier: CSV/LLMS.txt enabled, no API badge');
  });

  test('Scale tier: All features enabled + API badge visible', async ({ page }) => {
    await setUserTier(page, 'scale');

    // Check dashboard for API badge FIRST (before running analysis)
    await page.goto('http://localhost:5173/#dashboard');
    await page.waitForSelector('[data-testid="tier-badge"]', { timeout: 10000 });

    const apiBadge = page.locator('text=/API Access/i');
    await expect(apiBadge).toBeVisible();

    // Now run analysis to check export buttons
    await runAnalysis(page);

    // All export buttons should be enabled
    await expect(page.locator('button:has-text("PDF")').first()).toBeEnabled();
    await expect(page.locator('button:has-text("CSV")').first()).toBeEnabled();
    await expect(page.locator('button:has-text("LLMS.txt")').first()).toBeEnabled();

    console.log('✅ Scale tier: All exports enabled + API badge visible');
  });

  test('CSV export downloads valid file (Growth tier)', async ({ page }) => {
    await setUserTier(page, 'growth');
    await runAnalysis(page);

    // Wait for CSV button to be enabled
    const csvButton = page.locator('button:has-text("CSV")').first();
    await expect(csvButton).toBeEnabled();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click CSV export button
    await csvButton.click();

    // Wait for download to complete
    const download = await downloadPromise;

    // Verify filename ends with .csv
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.csv$/);

    // Verify file is not empty
    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const fileContent = fs.readFileSync(path, 'utf-8');
      expect(fileContent.length).toBeGreaterThan(0);
      expect(fileContent).toContain('URL'); // CSV should have header row
      console.log(`✅ CSV export downloaded: ${filename} (${fileContent.length} bytes)`);
    }
  });

  test('LLMS.txt button shows "Coming soon" for Growth tier', async ({ page }) => {
    await setUserTier(page, 'growth');
    await runAnalysis(page);

    // Wait for LLMS.txt button to be enabled
    const llmsTxtButton = page.locator('button:has-text("LLMS.txt")').first();
    await expect(llmsTxtButton).toBeEnabled();

    // Click LLMS.txt button
    await llmsTxtButton.click();

    // Should show alert/toast with "Coming soon" message
    // (Until Edge Function is implemented in Phase 8.4)
    const comingSoonMessage = page.locator('text=/Coming soon|Not yet implemented/i');
    await expect(comingSoonMessage).toBeVisible({ timeout: 2000 });

    console.log('✅ LLMS.txt shows "Coming soon" message');
  });

  test('Feature gating: Tier upgrade flow from Free to Solo', async ({ page }) => {
    await setUserTier(page, 'free');
    await runAnalysis(page);

    // Click on disabled CSV button
    const csvButton = page.locator('button:has-text("CSV")').first();
    await expect(csvButton).toBeDisabled();

    // Click "Upgrade to Solo" prompt
    const upgradeButton = page.locator('text="Upgrade to Solo"').first();
    await upgradeButton.click();

    // Should navigate to pricing or signup page
    await page.waitForURL(/\#(pricing|signup)/, { timeout: 5000 });

    // Verify user is directed to upgrade flow
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\#(pricing|signup)/);

    console.log('✅ Upgrade flow triggered from Free tier');
  });

  test('Dashboard: Free tier shows correct analysis limit (3 analyses)', async ({ page }) => {
    await setUserTier(page, 'free', 3);

    await page.goto('http://localhost:5173/#dashboard');
    await page.waitForSelector('[data-testid="analyses-remaining"]', { timeout: 10000 });

    // Verify "3 analyses remaining" displays
    const analysesText = await page.locator('[data-testid="analyses-remaining"]').textContent();
    expect(analysesText).toContain('3');
    expect(analysesText.toLowerCase()).toContain('remaining');

    console.log('✅ Free tier: 3 analyses remaining displayed correctly');
  });

  test('Dashboard: Growth tier shows correct analysis limit (40 analyses)', async ({ page }) => {
    await setUserTier(page, 'growth', 40);

    await page.goto('http://localhost:5173/#dashboard');
    await page.waitForSelector('[data-testid="analyses-remaining"]', { timeout: 10000 });

    // Verify "40 analyses remaining" displays (NOT unlimited)
    const analysesText = await page.locator('[data-testid="analyses-remaining"]').textContent();
    expect(analysesText).toContain('40');
    expect(analysesText.toLowerCase()).not.toContain('unlimited');

    console.log('✅ Growth tier: 40 analyses remaining displayed correctly (NOT unlimited)');
  });

  test('Dashboard: Scale tier shows correct analysis limit (100 analyses)', async ({ page }) => {
    await setUserTier(page, 'scale', 100);

    await page.goto('http://localhost:5173/#dashboard');
    await page.waitForSelector('[data-testid="analyses-remaining"]', { timeout: 10000 });

    // Verify "100 analyses remaining" displays
    const analysesText = await page.locator('[data-testid="analyses-remaining"]').textContent();
    expect(analysesText).toContain('100');

    console.log('✅ Scale tier: 100 analyses remaining displayed correctly');
  });

  test('Tier display names: "Solo" shown instead of "Coffee"', async ({ page }) => {
    await setUserTier(page, 'coffee'); // Internal ID

    await page.goto('http://localhost:5173/#dashboard');
    await page.waitForSelector('[data-testid="tier-badge"]', { timeout: 10000 });

    // Verify "Solo" is displayed (NOT "Coffee")
    await expect(page.locator('text=/Solo/i')).toBeVisible();
    await expect(page.locator('text=/Coffee/i')).not.toBeVisible();

    console.log('✅ Tier display name: "Solo" shown instead of "Coffee"');
  });
});
