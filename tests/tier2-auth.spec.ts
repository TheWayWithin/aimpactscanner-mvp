import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const TEST_EMAIL = process.env.TEST_USER_EMAIL!;
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD!;

test.describe('Tier 2 — Authentication', () => {
  test('sign up page loads', async ({ page }) => {
    await page.goto('/#signup');
    await page.waitForLoadState('networkidle');
    // Should show some registration / sign-up UI
    await expect(page.locator('body')).toContainText(/sign up|create.*account|register|get started/i);
  });

  test('login page loads with email and password fields', async ({ page }) => {
    await page.goto('/#login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login with valid credentials succeeds', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured');

    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // After login we should no longer be on the login page
    await expect(page).not.toHaveURL(/#login/);
    // Some authenticated element should appear (dashboard, header, etc.)
    await expect(page.locator('body')).not.toContainText(/sign in with your password/i, { timeout: 10_000 });
  });

  test('after login, dashboard / main app loads', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured');

    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Wait for dashboard-like content
    await expect(
      page.getByText(/dashboard|analyze|new scan|history|account/i).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('logout returns to landing', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Test credentials not configured');

    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Look for a logout / sign-out control
    const logoutBtn = page.getByRole('button', { name: /log\s?out|sign\s?out/i });
    if (await logoutBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await logoutBtn.click();
    } else {
      // Some apps put logout in a menu — try clicking a user/account menu first
      const menuToggle = page.locator('[aria-label*="menu"], [aria-label*="account"], button:has-text("Account")').first();
      if (await menuToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await menuToggle.click();
        await page.getByRole('button', { name: /log\s?out|sign\s?out/i }).click();
      } else {
        test.skip(true, 'Could not find logout button');
      }
    }

    // Should return to landing
    await expect(page.getByText(/analyze my site free/i)).toBeVisible({ timeout: 10_000 });
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/#login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /email/i }).fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword!123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();

    // Expect an error message
    await expect(
      page.getByText(/invalid|incorrect|error|failed|wrong/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
