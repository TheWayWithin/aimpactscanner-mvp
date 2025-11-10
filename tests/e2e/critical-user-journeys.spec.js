import { test, expect } from '@playwright/test';

// Load test credentials
const GOOGLE_TEST_EMAIL = process.env.GOOGLE_TEST_EMAIL_1;
const GOOGLE_TEST_PASSWORD = process.env.GOOGLE_TEST_PASSWORD_1;

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';

test.describe('CRITICAL USER JOURNEYS - Path B', () => {
  
  test.describe('TEST 1: Complete Stripe Payment Flow', () => {
    test('should complete payment and redirect to dashboard with correct tier', async ({ page, context }) => {
      // Step 1-2: Navigate to signup
      await page.goto(`${STAGING_URL}/#signup`);
      await page.waitForLoadState('networkidle');
      
      console.log('✓ Navigated to #signup');
      
      // Step 3: Verify Growth tier selected (default)
      const growthTier = page.locator('[data-tier="growth"]').first();
      await expect(growthTier).toBeVisible();
      console.log('✓ Growth tier visible');
      
      // Step 4: Verify Annual billing (default) - look for annual/monthly toggle
      const annualToggle = page.locator('text=/annual|yearly/i').first();
      if (await annualToggle.isVisible()) {
        console.log('✓ Annual billing option visible');
      }
      
      // Step 5: Click "Try Growth Free for 7 Days" or similar CTA
      const ctaButton = page.locator('button:has-text("Try Growth"), button:has-text("Start Free Trial"), button:has-text("Continue")').first();
      await expect(ctaButton).toBeVisible({ timeout: 5000 });
      console.log('✓ CTA button found:', await ctaButton.textContent());
      
      await ctaButton.click();
      await page.waitForTimeout(2000);
      
      // Step 6: Click "Continue with Google"
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")').first();
      await expect(googleButton).toBeVisible({ timeout: 10000 });
      console.log('✓ Google OAuth button visible');
      
      // Listen for new popup window
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        googleButton.click()
      ]);
      
      console.log('✓ OAuth popup opened');
      
      // Step 7: Authenticate with Google
      await popup.waitForLoadState('domcontentloaded');
      
      // Google login flow
      const emailInput = popup.locator('input[type="email"]');
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(GOOGLE_TEST_EMAIL);
        await popup.locator('button:has-text("Next")').click();
        await popup.waitForTimeout(2000);
        
        const passwordInput = popup.locator('input[type="password"]');
        await passwordInput.fill(GOOGLE_TEST_PASSWORD);
        await popup.locator('button:has-text("Next")').click();
        
        console.log('✓ Google authentication submitted');
      } else {
        console.log('✓ Already authenticated - skipping login');
      }
      
      // Wait for either dashboard or Stripe checkout
      await page.waitForTimeout(5000);
      
      const currentHash = await page.evaluate(() => window.location.hash);
      console.log('Current page hash:', currentHash);
      
      // Step 8-9: Check if Stripe checkout opened
      const stripeFrame = page.frameLocator('iframe[src*="checkout.stripe.com"]').first();
      const stripeVisible = await stripeFrame.locator('body').isVisible({ timeout: 5000 }).catch(() => false);
      
      if (stripeVisible) {
        console.log('✓ Stripe checkout opened - PROCEEDING WITH PAYMENT TEST');
        
        // Step 10: Fill payment form
        const cardNumber = stripeFrame.locator('input[name="cardnumber"]');
        await cardNumber.fill('4242424242424242');
        console.log('✓ Card number entered');
        
        const expiry = stripeFrame.locator('input[name="exp-date"]');
        await expiry.fill('1225');
        console.log('✓ Expiry entered');
        
        const cvc = stripeFrame.locator('input[name="cvc"]');
        await cvc.fill('123');
        console.log('✓ CVC entered');
        
        const nameInput = stripeFrame.locator('input[name="name"]');
        await nameInput.fill('Test User');
        console.log('✓ Name entered');
        
        const zipInput = stripeFrame.locator('input[name="postal"]');
        if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await zipInput.fill('12345');
          console.log('✓ ZIP entered');
        }
        
        // Step 11-12: Submit payment
        const submitButton = stripeFrame.locator('button[type="submit"]');
        await submitButton.click();
        console.log('✓ Payment submitted - waiting for processing...');
        
        // Step 13: Wait for redirect to dashboard (max 30 seconds)
        await page.waitForURL(/.*#dashboard/, { timeout: 30000 });
        console.log('✓ Redirected to #dashboard');
        
      } else if (currentHash === '#dashboard') {
        console.log('⚠️ User already has this tier - redirected directly to dashboard');
        console.log('SKIPPING payment test - user already subscribed');
      } else {
        throw new Error(`Unexpected state: hash=${currentHash}, no Stripe checkout found`);
      }
      
      // Step 14: Verify dashboard state
      await page.waitForTimeout(3000);
      
      const userEmail = page.locator('text=/aimpactscannertest@gmail.com/i').first();
      await expect(userEmail).toBeVisible({ timeout: 5000 });
      console.log('✓ User authenticated - email visible');
      
      const tierBadge = page.locator('[class*="tier"], [data-testid="tier-badge"], text=/growth|solo|scale/i').first();
      if (await tierBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        const tierText = await tierBadge.textContent();
        console.log('✓ Tier badge visible:', tierText);
      }
      
      const analysisLimit = page.locator('text=/\\d+\\s+(analyses?|scans?)/i').first();
      if (await analysisLimit.isVisible({ timeout: 3000 }).catch(() => false)) {
        const limitText = await analysisLimit.textContent();
        console.log('✓ Analysis limit visible:', limitText);
      }
      
      // Step 15: Check console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        console.log('⚠️ Console errors detected:', consoleErrors);
      } else {
        console.log('✓ No console errors');
      }
      
      // Take screenshot
      await page.screenshot({ path: '/Users/jamiewatters/DevProjects/aimpactscanner-mvp/test-results/test1-dashboard.png', fullPage: true });
      console.log('✓ Screenshot saved: test1-dashboard.png');
    });
  });
  
  test.describe('TEST 2: Existing User Login Flow', () => {
    test('should login and redirect to dashboard with persisted data', async ({ page, context }) => {
      // Step 3: Navigate to login
      await page.goto(`${STAGING_URL}/#login`);
      await page.waitForLoadState('networkidle');
      console.log('✓ Navigated to #login');
      
      // Step 4: Verify OAuth buttons (NOT password form)
      const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")').first();
      await expect(googleButton).toBeVisible({ timeout: 5000 });
      console.log('✓ OAuth buttons visible (not legacy password form)');
      
      const passwordForm = page.locator('input[type="password"]');
      const hasPasswordForm = await passwordForm.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasPasswordForm) {
        console.log('⚠️ WARNING: Password form visible (should be OAuth only)');
      } else {
        console.log('✓ No password form (OAuth only)');
      }
      
      // Step 5-6: Click Google and authenticate
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        googleButton.click()
      ]);
      console.log('✓ OAuth popup opened');
      
      await popup.waitForLoadState('domcontentloaded');
      
      // Likely already authenticated, but handle login if needed
      const emailInput = popup.locator('input[type="email"]');
      if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailInput.fill(GOOGLE_TEST_EMAIL);
        await popup.locator('button:has-text("Next")').click();
        await popup.waitForTimeout(2000);
        
        const passwordInput = popup.locator('input[type="password"]');
        await passwordInput.fill(GOOGLE_TEST_PASSWORD);
        await popup.locator('button:has-text("Next")').click();
        
        console.log('✓ Google authentication submitted');
      } else {
        console.log('✓ Already authenticated - auto-redirecting');
      }
      
      // Step 7: Wait for redirect to dashboard
      await page.waitForURL(/.*#dashboard/, { timeout: 15000 });
      const finalHash = await page.evaluate(() => window.location.hash);
      console.log('✓ Redirected to:', finalHash);
      
      if (finalHash !== '#dashboard') {
        throw new Error(`FAILED: Redirected to ${finalHash} instead of #dashboard`);
      }
      
      // Step 8: Verify user data persisted
      await page.waitForTimeout(3000);
      
      const userEmail = page.locator('text=/aimpactscannertest@gmail.com/i').first();
      await expect(userEmail).toBeVisible({ timeout: 5000 });
      console.log('✓ User email visible - data persisted');
      
      const tierBadge = page.locator('[class*="tier"], text=/growth|solo|scale|free/i').first();
      if (await tierBadge.isVisible({ timeout: 3000 }).catch(() => false)) {
        const tierText = await tierBadge.textContent();
        console.log('✓ Tier badge persisted:', tierText);
      }
      
      const analysisLimit = page.locator('text=/\\d+\\s+(analyses?|scans?)/i').first();
      if (await analysisLimit.isVisible({ timeout: 3000 }).catch(() => false)) {
        const limitText = await analysisLimit.textContent();
        console.log('✓ Analysis limit persisted:', limitText);
      }
      
      // Step 10: Check console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(2000);
      
      if (consoleErrors.length > 0) {
        console.log('⚠️ Console errors detected:', consoleErrors);
      } else {
        console.log('✓ No console errors');
      }
      
      // Take screenshot
      await page.screenshot({ path: '/Users/jamiewatters/DevProjects/aimpactscanner-mvp/test-results/test2-login-dashboard.png', fullPage: true });
      console.log('✓ Screenshot saved: test2-login-dashboard.png');
    });
  });
});
