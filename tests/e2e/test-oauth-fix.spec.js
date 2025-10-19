// Test the OAuth fix on staging environment
import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.test') });

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const GOOGLE_EMAIL = process.env.GOOGLE_TEST_EMAIL_1;
const GOOGLE_PASSWORD = process.env.GOOGLE_TEST_PASSWORD_1;

test.describe('OAuth Fix Validation on Staging', () => {
  test('should complete Google OAuth and land on dashboard', async ({ page }) => {
    console.log('🧪 Testing OAuth fix on staging...');
    console.log('📧 Using test account:', GOOGLE_EMAIL);

    // Step 1: Navigate to login page
    await page.goto(`${STAGING_URL}/#login`);
    console.log('✅ Step 1: Navigated to login page');

    // Step 2: Verify OAuth login page shows (not legacy password form)
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 2: OAuth login page visible (no legacy password form)');

    // Step 3: Click Continue with Google
    await page.locator('button:has-text("Continue with Google")').click();
    console.log('✅ Step 3: Clicked Continue with Google');

    // Step 4: Wait for Google login page
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
    console.log('✅ Step 4: Redirected to Google OAuth page');

    // Step 5: Enter email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(GOOGLE_EMAIL);
    await page.locator('button:has-text("Next"), #identifierNext').click();
    console.log('✅ Step 5: Entered email');

    // Step 6: Enter password
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(GOOGLE_PASSWORD);
    await page.locator('button:has-text("Next"), #passwordNext').click();
    console.log('✅ Step 6: Entered password');

    // Step 7: Wait for redirect back to app
    await page.waitForURL(new RegExp(STAGING_URL), { timeout: 60000 });
    console.log('✅ Step 7: Redirected back to app');

    // Step 8: Verify we land on dashboard (NOT landing page)
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    const currentUrl = page.url();
    console.log('✅ Step 8: Current URL:', currentUrl);

    expect(currentUrl).toContain('dashboard');
    expect(currentUrl).not.toContain('landing');
    console.log('✅ PASS: Landed on dashboard (not landing page)');

    // Step 9: Verify user is authenticated
    const isDashboardVisible = await page.locator('text=/Welcome|Dashboard|analyses/i').isVisible();
    expect(isDashboardVisible).toBe(true);
    console.log('✅ PASS: User is authenticated and dashboard is visible');

    console.log('');
    console.log('🎉 OAuth Fix Validation: ALL TESTS PASSED');
    console.log('✅ Hash routing fix: Working');
    console.log('✅ OAuth redirect fix: Working');
    console.log('✅ Lands on dashboard: Yes');
    console.log('✅ User authenticated: Yes');
  });
});
