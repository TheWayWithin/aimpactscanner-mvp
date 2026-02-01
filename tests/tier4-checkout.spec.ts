import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

test.describe('Tier 4 — Checkout & Payments', () => {
  test('pricing section loads with all 4 tiers', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to pricing
    await page.getByText('Simple, Honest Pricing').scrollIntoViewIfNeeded();

    for (const tier of ['Free', 'Solo', 'Growth', 'Scale']) {
      await expect(
        page.getByRole('heading', { name: tier, exact: true }).first()
      ).toBeVisible();
    }
  });

  test('clicking upgrade CTA navigates toward checkout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "Get Started" (Solo tier CTA — most popular)
    const soloCta = page.getByRole('button', { name: /get started/i });
    await soloCta.scrollIntoViewIfNeeded();
    await soloCta.click();

    // Should navigate away from landing (to signup, checkout, or Stripe)
    await page.waitForTimeout(3_000);
    const url = page.url();
    const hash = new URL(url).hash;

    // Expect navigation to checkout, signup, stripe, or similar
    const navigated =
      hash.includes('checkout') ||
      hash.includes('signup') ||
      hash.includes('register') ||
      hash.includes('login') ||
      url.includes('stripe.com');
    expect(navigated).toBeTruthy();
  });

  test('account page loads for authenticated user', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured');

    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Navigate to account/subscription page
    await page.goto('/#account');
    await page.waitForLoadState('networkidle');

    // Should show account-related content
    await expect(
      page.getByText(/account|subscription|plan|billing|tier/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
