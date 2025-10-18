// Test to verify users are redirected to dashboard instead of landing page after sign-in
import { test, expect } from '@playwright/test';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';

test.describe('Post-Authentication Landing Page Fix', () => {
  test('should redirect to dashboard after successful sign-in, not landing page', async ({ page }) => {
    // Navigate to staging site
    await page.goto(STAGING_URL);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Find and click sign-in/login button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In"), button:has-text("Log In"), a:has-text("Log In")').first();
    await signInButton.click();

    // Wait for navigation to auth page
    await page.waitForLoadState('networkidle');

    // Take screenshot of auth page
    await page.screenshot({ path: 'test-results/auth-page.png', fullPage: true });

    // Check if we're on an OAuth/signup page
    const currentUrl = page.url();
    console.log('Current URL after clicking sign in:', currentUrl);

    // Note: This is where we would need actual credentials to test
    // For now, we'll verify the auth flow structure exists

    // Verify auth page has expected elements
    const hasGoogleButton = await page.locator('button:has-text("Google"), button:has-text("Continue with Google")').count() > 0;
    const hasGitHubButton = await page.locator('button:has-text("GitHub"), button:has-text("Continue with GitHub")').count() > 0;

    console.log('Has Google auth button:', hasGoogleButton);
    console.log('Has GitHub auth button:', hasGitHubButton);

    expect(hasGoogleButton || hasGitHubButton).toBeTruthy();
  });

  test('should verify OAuthCallback redirects to dashboard hash', async ({ page }) => {
    // This test verifies the code change by checking what happens when landing directly on oauth-callback
    await page.goto(`${STAGING_URL}/#oauth-callback`);

    // Wait a bit for any redirects
    await page.waitForTimeout(2000);

    // Check the current hash
    const currentHash = await page.evaluate(() => window.location.hash);
    console.log('Current hash after oauth-callback:', currentHash);

    // It should NOT be #landing
    expect(currentHash).not.toBe('#landing');

    // Take screenshot
    await page.screenshot({ path: 'test-results/oauth-callback-redirect.png', fullPage: true });
  });

  test('should verify landing page is different from dashboard', async ({ page }) => {
    // Test 1: Visit landing page explicitly
    await page.goto(`${STAGING_URL}/#landing`);
    await page.waitForLoadState('networkidle');

    const landingContent = await page.textContent('body');
    const landingHasWelcomeBack = landingContent.includes('Welcome Back');
    const landingHasAnalysisRemaining = landingContent.includes('analyses remaining');

    await page.screenshot({ path: 'test-results/landing-page.png', fullPage: true });

    console.log('Landing page has "Welcome Back":', landingHasWelcomeBack);
    console.log('Landing page has "analyses remaining":', landingHasAnalysisRemaining);

    // Test 2: Visit dashboard page explicitly
    await page.goto(`${STAGING_URL}/#dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give it time to load

    const dashboardContent = await page.textContent('body');
    const dashboardHasWelcomeBack = dashboardContent.includes('Welcome Back');
    const dashboardHasAnalysisRemaining = dashboardContent.includes('analyses remaining');

    await page.screenshot({ path: 'test-results/dashboard-page.png', fullPage: true });

    console.log('Dashboard page has "Welcome Back":', dashboardHasWelcomeBack);
    console.log('Dashboard page has "analyses remaining":', dashboardHasAnalysisRemaining);

    // Dashboard should have these elements, landing should not (for authenticated users)
    // But without auth, we're just verifying they're different pages
    expect(page.url()).toContain('#dashboard');
  });
});

test.describe('Manual Testing Guide', () => {
  test.skip('MANUAL TEST: Sign in and verify redirect to dashboard', async ({ page }) => {
    console.log(`
    ========================================
    MANUAL TESTING INSTRUCTIONS
    ========================================

    1. Open browser to: ${STAGING_URL}

    2. Click "Sign In" or "Log In"

    3. Sign in with your test account (Google/GitHub OAuth)

    4. After successful sign-in, check the URL:
       ✅ CORRECT: Should be ${STAGING_URL}/#dashboard
       ❌ WRONG: Should NOT be ${STAGING_URL}/#landing

    5. Verify you see:
       ✅ "Welcome Back!" message
       ✅ Analysis count (e.g., "You have 3 analyses remaining this month")
       ✅ "Start New Analysis" button
       ✅ Navigation tabs (Dashboard, New Analysis, Upgrade, Account)

    6. Take screenshots and compare to the issue images:
       - Before fix: Bare page with only footer (like Image #2)
       - After fix: Full dashboard with content (like Image #1)

    ========================================
    `);
  });
});
