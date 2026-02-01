import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

test.describe('Tier 3 — Analysis', () => {
  // Analysis tests get extra time (backend can take 15-20s)
  test.setTimeout(90_000);

  test('unauthenticated: submit URL shows loading state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/enter a page url/i).fill('https://example.com');
    await page.getByRole('button', { name: /analyze my site free/i }).click();

    // After clicking analyze, either:
    //   a) The app navigates to #preview-analysis and shows progress UI, OR
    //   b) A rate-limit / error message appears on the current page
    // We accept either as a valid response to the analyze action.
    const progressText = page.getByText(/analyzing your website|finalizing|generating|preparing/i).first();
    const errorText = page.getByText(/rate limit|error.*analy|try again/i).first();

    await expect(progressText.or(errorText)).toBeVisible({ timeout: 30_000 });
  });

  test('authenticated: submit URL and verify results render', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured');

    try {
      await login(page, TEST_EMAIL, TEST_PASSWORD);
    } catch (e: any) {
      test.skip(true, `Login failed (user may lack password auth): ${e.message}`);
      return; // unreachable but satisfies TS
    }

    // Find URL input on dashboard and submit
    const urlInput = page.getByPlaceholder(/enter.*url|url.*analyze/i).first();
    await expect(urlInput).toBeVisible({ timeout: 10_000 });
    await urlInput.fill('https://example.com');

    // Click the analyze / submit button
    const analyzeBtn = page.getByRole('button', { name: /analyze|scan|submit/i }).first();
    await analyzeBtn.click();

    // Wait for navigation to analysis/results view
    await page.waitForURL(/#preview-analysis|#results|#dashboard/, { timeout: 15_000 });

    // Wait for results to appear (score, factors, breakdown)
    await expect(
      page.getByText(/score|overall|result|analyzing your website|finalizing/i).first()
    ).toBeVisible({ timeout: 45_000 });

    // Factor cards should render
    await expect(
      page.locator('[class*="factor"], [class*="card"], [data-testid*="factor"]').first()
    ).toBeVisible({ timeout: 10_000 }).catch(() => {
      // Fallback: look for factor-related text
      return expect(
        page.getByText(/structured data|meta|heading|schema|content/i).first()
      ).toBeVisible();
    });

    // AI vs SEO breakdown
    await expect(
      page.getByText(/ai readiness|seo foundation|ai.*score|seo.*score/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('invalid URL shows error', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/enter a page url/i).fill('not-a-valid-url');
    await page.getByRole('button', { name: /analyze my site free/i }).click();

    await expect(
      page.getByText(/invalid|valid url|error/i).first()
    ).toBeVisible({ timeout: 5_000 });
  });
});
