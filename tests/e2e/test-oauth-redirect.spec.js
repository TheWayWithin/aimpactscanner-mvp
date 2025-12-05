// Simple test to verify OAuth redirects to dashboard
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

test.describe('OAuth Redirect Fix', () => {
  test.slow(); // Mark as slow test (3x timeout)
  
  test('verify OAuth redirects to dashboard not landing', async ({ page }) => {
    console.log('🧪 Testing OAuth redirect fix...');
    console.log('📧 Email:', GOOGLE_EMAIL);

    // Navigate to login
    await page.goto(`${STAGING_URL}/#login`, { waitUntil: 'networkidle' });
    console.log('✅ At login page');

    // Verify OAuth button shows
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    console.log('✅ OAuth login visible (not legacy password form)');

    // Click Google button
    await page.locator('button:has-text("Continue with Google")').click();
    console.log('✅ Clicked Continue with Google');

    // Wait for Google page
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
    console.log('✅ At Google OAuth page');

    // Fill email
    await page.locator('input[type="email"]').fill(GOOGLE_EMAIL);
    // Click Next button (Google changed their UI)
    await page.getByRole('button', { name: 'Next' }).click();
    console.log('✅ Entered email');

    // Wait for password field and fill
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.locator('input[type="password"]').fill(GOOGLE_PASSWORD);
    await page.getByRole('button', { name: 'Next' }).click();
    console.log('✅ Entered password');

    // Handle Google consent screen (may show "Continue" button)
    try {
      const continueButton = page.getByRole('button', { name: 'Continue' });
      await continueButton.waitFor({ state: 'visible', timeout: 10000 });
      await continueButton.click();
      console.log('✅ Clicked Continue on consent screen');
    } catch (e) {
      console.log('ℹ️  No consent screen - continuing');
    }

    // Wait for redirect back to app (60 second timeout for OAuth)
    await page.waitForURL(new RegExp(STAGING_URL), { timeout: 60000 });
    console.log('✅ Redirected back to app');

    // Critical test: Check final URL
    await page.waitForTimeout(2000); // Wait for any final redirects
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);

    // Assertions
    if (finalUrl.includes('#dashboard')) {
      console.log('✅ PASS: Landed on dashboard');
    } else if (finalUrl.includes('#landing')) {
      console.log('❌ FAIL: Still landing on landing page - OAuth redirect fix not working');
    } else if (finalUrl.includes('#oauth-callback')) {
      console.log('⚠️  PARTIAL: Stuck on oauth-callback page - routing issue');
    }

    expect(finalUrl).toContain('dashboard');
    expect(finalUrl).not.toContain('landing');
  });
});
