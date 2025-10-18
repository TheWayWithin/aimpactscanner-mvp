// tests/setup/auth.setup.js - Authenticate and save session state for OAuth testing
import { test as setup, expect } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

const authDir = path.join(__dirname, '.auth');

// Ensure .auth directory exists
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
  console.log('✅ Created .auth directory for storing authentication state');
}

const GOOGLE_AUTH_FILE = path.join(authDir, 'google-user1.json');
const GITHUB_AUTH_FILE = path.join(authDir, 'github-user1.json');

/**
 * Check if auth state is expired
 * @param {string} authFile - Path to auth state file
 * @param {number} expiryDays - Number of days before expiry
 * @returns {boolean} - True if expired or missing
 */
function isAuthStateExpired(authFile, expiryDays) {
  if (!fs.existsSync(authFile)) {
    console.log(`⚠️ Auth state not found: ${path.basename(authFile)}`);
    return true;
  }

  const stats = fs.statSync(authFile);
  const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  if (ageInDays >= expiryDays) {
    console.warn(`⚠️ Auth state expired: ${path.basename(authFile)} (${ageInDays.toFixed(1)} days old)`);
    return true;
  }

  console.log(`✅ Auth state valid: ${path.basename(authFile)} (${ageInDays.toFixed(1)} days old, expires in ${(expiryDays - ageInDays).toFixed(1)} days)`);
  return false;
}

/**
 * Google OAuth Authentication Setup
 * This runs ONCE manually in headed mode, then reuses saved state
 */
setup('authenticate with Google OAuth', async ({ page }) => {
  // Skip if auth state exists and not expired (7 days for Google test users)
  if (!isAuthStateExpired(GOOGLE_AUTH_FILE, 7)) {
    console.log('✅ Google auth state still valid, skipping re-authentication');
    return;
  }

  console.log('🔄 Google auth state expired or missing, re-authenticating...');
  console.log('⏳ This requires MANUAL authentication in headed browser mode');
  console.log('📧 Email:', process.env.GOOGLE_TEST_EMAIL_1 || 'NOT SET IN .env.test');

  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  try {
    // Navigate to landing page
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await signInButton.click();

    // Wait for auth page to load (unified registration or login)
    await page.waitForURL(/unified-registration|login/, { timeout: 15000 });

    // Click Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")').first();
    await expect(googleButton).toBeVisible({ timeout: 10000 });
    await googleButton.click();

    // MANUAL STEP: Developer must complete Google login in headed browser
    // This will open Google login page - enter credentials manually
    console.log('⏳ Please complete Google login in the browser window...');
    console.log('   1. Enter email:', process.env.GOOGLE_TEST_EMAIL_1);
    console.log('   2. Enter password');
    console.log('   3. Approve OAuth consent if prompted');
    console.log('   4. Wait for redirect to dashboard...');

    // Wait for OAuth callback redirect to complete (60 second timeout)
    await page.waitForURL(/dashboard|oauth-callback/, { timeout: 60000 });

    // Verify authentication succeeded by checking we're on dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    console.log('✅ Google authentication successful - redirected to dashboard');

    // Verify authenticated user elements are visible
    await expect(page.locator('text=/Welcome Back|analyses remaining/i')).toBeVisible({ timeout: 5000 });
    console.log('✅ Dashboard loaded with authenticated user data');

    // Save authentication state (cookies + localStorage)
    await page.context().storageState({ path: GOOGLE_AUTH_FILE });
    console.log('💾 Google auth state saved to:', GOOGLE_AUTH_FILE);
    console.log('✅ Google OAuth setup complete - tests can now reuse this session');

  } catch (error) {
    console.error('❌ Google OAuth authentication failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify GOOGLE_TEST_EMAIL_1 is set in .env.test');
    console.error('2. Add test account to Google Cloud Console > OAuth Consent Screen > Test Users');
    console.error('3. Run with --headed flag to see browser: npx playwright test auth.setup --headed');
    console.error('4. Check network tab for OAuth errors');
    throw error;
  }
});

/**
 * GitHub OAuth Authentication Setup
 * This runs ONCE manually in headed mode, then reuses saved state
 */
setup('authenticate with GitHub OAuth', async ({ page }) => {
  // Skip if auth state exists and not expired (30 days for GitHub)
  if (!isAuthStateExpired(GITHUB_AUTH_FILE, 30)) {
    console.log('✅ GitHub auth state still valid, skipping re-authentication');
    return;
  }

  console.log('🔄 GitHub auth state expired or missing, re-authenticating...');
  console.log('⏳ This requires MANUAL authentication in headed browser mode');
  console.log('📧 Email:', process.env.GITHUB_TEST_EMAIL_1 || 'NOT SET IN .env.test');

  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  try {
    // Navigate to landing page
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await signInButton.click();

    // Wait for auth page to load
    await page.waitForURL(/unified-registration|login/, { timeout: 15000 });

    // Click GitHub OAuth button
    const githubButton = page.locator('button:has-text("Continue with GitHub"), button:has-text("GitHub")').first();
    await expect(githubButton).toBeVisible({ timeout: 10000 });
    await githubButton.click();

    // MANUAL STEP: Developer must complete GitHub login in headed browser
    console.log('⏳ Please complete GitHub login in the browser window...');
    console.log('   1. Enter username or email:', process.env.GITHUB_TEST_EMAIL_1);
    console.log('   2. Enter password');
    console.log('   3. Authorize OAuth app if prompted');
    console.log('   4. Wait for redirect to dashboard...');

    // Wait for OAuth callback redirect to complete (60 second timeout)
    await page.waitForURL(/dashboard|oauth-callback/, { timeout: 60000 });

    // Verify authentication succeeded by checking we're on dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    console.log('✅ GitHub authentication successful - redirected to dashboard');

    // Verify authenticated user elements are visible
    await expect(page.locator('text=/Welcome Back|analyses remaining/i')).toBeVisible({ timeout: 5000 });
    console.log('✅ Dashboard loaded with authenticated user data');

    // Save authentication state
    await page.context().storageState({ path: GITHUB_AUTH_FILE });
    console.log('💾 GitHub auth state saved to:', GITHUB_AUTH_FILE);
    console.log('✅ GitHub OAuth setup complete - tests can now reuse this session');

  } catch (error) {
    console.error('❌ GitHub OAuth authentication failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify GITHUB_TEST_EMAIL_1 is set in .env.test');
    console.error('2. Check GitHub OAuth app configuration in Supabase dashboard');
    console.error('3. Run with --headed flag to see browser: npx playwright test auth.setup --headed');
    console.error('4. Verify redirect URL is correct in GitHub OAuth app settings');
    throw error;
  }
});
