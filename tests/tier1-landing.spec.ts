import { test, expect } from '@playwright/test';

test.describe('Tier 1 — Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('landing page loads successfully', async ({ page }) => {
    // Page should have content (not an error page)
    await expect(page).toHaveTitle(/AImpact/i);
  });

  test('hero section renders with URL input and CTA button', async ({ page }) => {
    // URL input
    await expect(
      page.getByPlaceholder(/enter a page url/i)
    ).toBeVisible();

    // CTA button
    await expect(
      page.getByRole('button', { name: /analyze my site free/i })
    ).toBeVisible();
  });

  test('Early Access badge is visible', async ({ page }) => {
    await expect(page.getByText(/early access/i)).toBeVisible();
  });

  test('stats section shows key numbers', async ({ page }) => {
    await expect(page.getByText('15s').first()).toBeVisible();
    await expect(page.getByText('Factors Checked').first()).toBeVisible();
    await expect(page.getByText('AI + SEO').first()).toBeVisible();
  });

  test('"One Scan. Two Critical Audits." section renders', async ({ page }) => {
    await expect(page.getByText('One Scan. Two Critical Audits.').first()).toBeVisible();
    await expect(page.getByText('AI Readiness Check').first()).toBeVisible();
    await expect(page.getByText('SEO Foundation Audit').first()).toBeVisible();
  });

  test('pricing section renders 4 tiers with correct prices', async ({ page }) => {
    await expect(page.getByText('Simple, Honest Pricing')).toBeVisible();

    // Tier names
    for (const name of ['Free', 'Solo', 'Growth', 'Scale']) {
      await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible();
    }

    // Prices
    for (const price of ['$0', '$5.95', '$17.95', '$34.95']) {
      await expect(page.getByText(price, { exact: true })).toBeVisible();
    }
  });

  test('solopreneur story section renders', async ({ page }) => {
    await expect(
      page.getByText(/built by a solopreneur/i)
    ).toBeVisible();
  });

  test('final CTA section renders', async ({ page }) => {
    await expect(
      page.getByText(/see how your site performs in ai search/i)
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /analyze my site now/i })
    ).toBeVisible();
  });

  test('Sign In and Sign Up buttons visible in header', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign in/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /sign up/i })
    ).toBeVisible();
  });

  test('mobile viewport: no horizontal scroll', async ({ page, browserName }) => {
    // This test is most meaningful in the "mobile" project, but runs everywhere
    test.skip(browserName !== 'chromium', 'Mobile test runs on chromium only');

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForLoadState('networkidle');

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // 1px tolerance
  });
});
