import { type Page, expect } from '@playwright/test';

/**
 * Login helper — navigates to login page and authenticates with email/password.
 * Waits for navigation away from the login view before returning.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // Navigate to login page via hash route
  await page.goto('/#login');
  await page.waitForLoadState('networkidle');

  // Fill credentials
  const emailInput = page.getByRole('textbox', { name: /email/i });
  const passwordInput = page.locator('input[type="password"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Submit
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for navigation away from login (dashboard or other authenticated view)
  await expect(page).not.toHaveURL(/#login/, { timeout: 15_000 });
}
