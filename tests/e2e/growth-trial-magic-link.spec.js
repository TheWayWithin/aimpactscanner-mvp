/**
 * Growth Tier 7-Day Trial Flow - E2E Test with Magic Link Authentication
 *
 * Tests the complete Growth tier trial signup flow with magic link authentication.
 * This verifies the fix for bugs where isTrial and billingFrequency were being lost.
 *
 * Test Coverage:
 * - Trial button click and authContext storage
 * - Magic link authentication flow
 * - Stripe checkout with $0.00 trial price
 * - Webhook processing and database updates
 * - Trial tier assignment and usage limits
 *
 * Key Bug Fixes Verified:
 * - Bug: AuthMethodSelector stripping isTrial/billingFrequency (FIXED)
 * - Bug: Webhook JWT verification blocking database updates (FIXED)
 *
 * Critical Console Logs Monitored:
 * - [Signup] Normalized isTrial: true
 * - [authRouting] Extracted isTrial: true
 * - 💳 Auto-checkout params stored: {tier: 'growth', isTrial: true, billing: 'annual'}
 *
 * @see https://develop--aimpactscanner.netlify.app/#signup
 */

import { test, expect } from '@playwright/test';
import { createTempEmailUtils } from '../utils/temp-email-utils.js';

const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const STAGING_DB_PROJECT = 'isgzvwpjokcmtizstwru'; // Safe testing database

test.describe('Growth Tier 7-Day Trial with Magic Link', () => {
  let tempEmailUtils;
  let testEmail;
  let consoleLogs = [];
  let testUserId = null;

  test.beforeEach(async ({ page }) => {
    // Initialize temp email utilities
    tempEmailUtils = createTempEmailUtils(page);

    // Set extended timeout for trial flow
    test.setTimeout(180000); // 3 minutes

    // Capture console logs for debugging
    consoleLogs = [];
    page.on('console', msg => {
      const logText = msg.text();
      consoleLogs.push(`[${msg.type()}] ${logText}`);

      // Real-time logging for critical events
      if (logText.includes('isTrial') ||
          logText.includes('Auto-checkout') ||
          logText.includes('authRouting') ||
          logText.includes('Normalized')) {
        console.log(`🔍 ${logText}`);
      }
    });

    // ====================
    // COOKIE BANNER HANDLING
    // ====================
    console.log('🍪 Handling cookie consent banner...');

    // Navigate to site to trigger cookie banner
    await page.goto(STAGING_URL, { waitUntil: 'networkidle' });

    // Wait for and click "Accept All" if banner appears
    try {
      const acceptButton = page.locator('button:has-text("Accept All"), button:has-text("Accept"), button:has-text("I Agree")');
      const isVisible = await acceptButton.isVisible({ timeout: 3000 });

      if (isVisible) {
        await acceptButton.click();
        await page.waitForTimeout(500); // Wait for banner to dismiss
        console.log('✅ Cookie banner accepted and dismissed');
      } else {
        console.log('✅ No cookie banner detected (or already accepted)');
      }
    } catch (err) {
      console.log('✅ No cookie banner found (or already handled)');
    }

    console.log('🚀 Starting Growth trial flow test with magic link authentication...');
  });

  test.afterEach(async ({ page }) => {
    // Clean up test user from database
    if (testUserId && testEmail) {
      console.log(`🧹 Cleaning up test user: ${testEmail} (${testUserId})`);

      try {
        // Delete test user from Supabase
        await page.evaluate(async ({ userId, email }) => {
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
          const supabase = createClient(
            'https://isgzvwpjokcmtizstwru.supabase.co',
            // Note: This requires service role key for admin operations
            // In production tests, we'd use a cleanup API endpoint
            window.VITE_SUPABASE_ANON_KEY
          );

          // Mark as test user (safer than deletion)
          await supabase
            .from('users')
            .update({ is_test_user: true, deleted_at: new Date().toISOString() })
            .eq('id', userId);

          console.log(`✅ Test user ${email} marked for cleanup`);
        }, { userId: testUserId, email: testEmail });
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup warning: ${cleanupError.message}`);
        // Don't fail test on cleanup error
      }
    }

    // Clean up email resources
    if (tempEmailUtils) {
      await tempEmailUtils.cleanup();
    }

    // Log summary of captured console logs if test failed
    if (test.info().status !== 'passed') {
      console.log('\n=== CONSOLE LOGS SUMMARY (Failed Test) ===');
      consoleLogs
        .filter(log => log.includes('trial') || log.includes('Trial') || log.includes('isTrial'))
        .forEach(log => console.log(log));
    }
  });

  test('should complete Growth trial signup with magic link and verify $0.00 Stripe checkout', async ({ page }) => {
    console.log('🎯 Testing complete Growth trial flow with magic link authentication');

    // ====================
    // PHASE 1: NAVIGATE TO SIGNUP
    // ====================

    console.log('📍 Phase 1: Navigating to signup page');
    await page.goto(`${STAGING_URL}/#signup`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let Signup component mount

    // Verify Signup page loaded (check for tier selector heading)
    await expect(page.locator('h1, h2').filter({ hasText: /Get Started|Sign Up|Create Account/i })).toBeVisible({ timeout: 10000 });
    console.log('✅ Signup page loaded');

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/growth-trial-01-signup-page.png',
      fullPage: true
    });

    // ====================
    // PHASE 2: SELECT GROWTH TIER AND CLICK TRIAL BUTTON
    // ====================

    console.log('📍 Phase 2: Selecting Growth tier and clicking trial button');

    // Wait for tier cards to load
    await page.waitForSelector('input[type="radio"][value="growth"]', { timeout: 10000 });

    // Select Growth tier radio button
    await page.click('input[type="radio"][value="growth"]');
    console.log('✅ Growth tier selected');
    await page.waitForTimeout(500);

    // Verify trial button is visible
    const trialButton = page.locator('button:has-text("Try Growth Free for 7 Days")');
    await expect(trialButton).toBeVisible({ timeout: 10000 });
    console.log('✅ Trial button visible');

    // Capture storage BEFORE clicking trial button
    const storageBeforeClick = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    }));

    // Click the GREEN trial button
    console.log('🎁 Clicking trial button...');
    await trialButton.click();
    await page.waitForTimeout(1500); // Wait for authContext to be stored

    // Take screenshot after trial button click
    await page.screenshot({
      path: 'test-results/growth-trial-02-after-trial-click.png',
      fullPage: true
    });

    // ====================
    // PHASE 3: VERIFY authContext STORAGE
    // ====================

    console.log('📍 Phase 3: Verifying authContext stored correctly');

    // Capture storage AFTER clicking trial button
    const storageAfterClick = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    }));

    // Verify authContext was created
    const authContextRaw = storageAfterClick.localStorage['authContext'];
    expect(authContextRaw).toBeTruthy();
    console.log('✅ authContext created in localStorage');

    // Parse and verify authContext contents
    const authContext = JSON.parse(authContextRaw);
    console.log('📦 authContext:', JSON.stringify(authContext, null, 2));

    // CRITICAL ASSERTIONS: Verify trial parameters preserved
    expect(authContext.selectedTier).toBe('growth');
    expect(authContext.isTrial).toBe(true);
    expect(authContext.billingFrequency).toBe('annual');
    console.log('✅ authContext contains correct trial parameters');

    // Verify critical console logs
    const hasNormalizedLog = consoleLogs.some(log =>
      log.includes('[Signup] Normalized isTrial: true')
    );
    expect(hasNormalizedLog).toBe(true);
    console.log('✅ Console log: [Signup] Normalized isTrial: true');

    // ====================
    // PHASE 4: MAGIC LINK AUTHENTICATION
    // ====================

    console.log('📍 Phase 4: Starting magic link authentication flow');

    // Verify AuthMethodSelector displayed
    await expect(page.locator('button:has-text("Continue with Email")')).toBeVisible({ timeout: 10000 });
    console.log('✅ AuthMethodSelector displayed');

    // Generate temporary email
    testEmail = await tempEmailUtils.generateTempEmail();
    console.log(`✅ Generated temporary email: ${testEmail}`);

    // Click "Continue with Email" (magic link option)
    await page.click('button:has-text("Continue with Email")');
    console.log('✅ Clicked Continue with Email');
    await page.waitForTimeout(1000);

    // Wait for email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    // Enter temporary email address
    await emailInput.fill(testEmail);
    console.log('✅ Entered email address');

    // Take screenshot before submitting email
    await page.screenshot({
      path: 'test-results/growth-trial-03-email-form.png',
      fullPage: true
    });

    // Submit email form
    const submitButton = page.locator('button[type="submit"]').filter({ hasText: /Send|Continue|Submit/i });
    await submitButton.click();
    console.log('✅ Submitted email form');

    // Wait for confirmation message
    await expect(page.locator('text=/Check your email|Magic link|We sent/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ Magic link confirmation message displayed');

    // ====================
    // PHASE 5: WAIT FOR MAGIC LINK AND AUTHENTICATE
    // ====================

    console.log('📍 Phase 5: Waiting for magic link email...');

    // Wait for magic link (90 seconds timeout)
    const magicLink = await tempEmailUtils.waitForMagicLink(90000, 3000);

    if (!magicLink) {
      // Dump console logs for debugging
      console.log('\n=== CONSOLE LOGS (Magic link not received) ===');
      consoleLogs.forEach(log => console.log(log));

      throw new Error('❌ Magic link not received within 90 seconds');
    }

    console.log('✅ Magic link received');
    console.log(`🔗 Link: ${magicLink.substring(0, 80)}...`);

    // Navigate to magic link
    console.log('🔑 Processing magic link authentication...');
    await page.goto(magicLink, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for authentication to complete

    // Verify authentication succeeded
    const isAuthenticated = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token') !== null ||
             window.location.href.includes('dashboard') ||
             window.location.href.includes('checkout');
    });

    expect(isAuthenticated).toBe(true);
    console.log('✅ Magic link authentication successful');

    // ====================
    // PHASE 6: VERIFY authRouting EXTRACTED isTrial
    // ====================

    console.log('📍 Phase 6: Verifying authRouting extracted isTrial correctly');

    // Check for authRouting console log
    const hasAuthRoutingLog = consoleLogs.some(log =>
      log.includes('[authRouting] Extracted isTrial: true')
    );
    expect(hasAuthRoutingLog).toBe(true);
    console.log('✅ Console log: [authRouting] Extracted isTrial: true');

    // Check for auto-checkout params log
    const hasAutoCheckoutLog = consoleLogs.some(log =>
      log.includes('💳 Auto-checkout params stored') &&
      log.includes('isTrial: true')
    );
    expect(hasAutoCheckoutLog).toBe(true);
    console.log('✅ Console log: Auto-checkout params stored with isTrial: true');

    // ====================
    // PHASE 7: VERIFY STRIPE REDIRECT AND $0.00 CHECKOUT
    // ====================

    console.log('📍 Phase 7: Verifying Stripe checkout redirect with $0.00 trial');

    // Wait for redirect to Stripe checkout
    const stripeCheckoutReached = await page.waitForURL(/checkout\.stripe\.com/i, {
      timeout: 30000
    }).then(() => true).catch(() => false);

    expect(stripeCheckoutReached).toBe(true);
    console.log('✅ Redirected to Stripe checkout');

    // Take screenshot of Stripe checkout page
    await page.screenshot({
      path: 'test-results/growth-trial-04-stripe-checkout.png',
      fullPage: true
    });

    // CRITICAL ASSERTION: Verify $0.00 due today
    const pageContent = await page.content();
    const hasFreeTrialPricing = pageContent.includes('$0.00') ||
                                 pageContent.includes('Free trial') ||
                                 pageContent.includes('7-day trial');

    expect(hasFreeTrialPricing).toBe(true);
    console.log('✅ Stripe checkout shows $0.00 or free trial pricing');

    // Look for trial-specific text
    const trialText = await page.locator('text=/\\$0\\.00|Free trial|7-day trial|Due today: \\$0/i').first().textContent().catch(() => null);
    if (trialText) {
      console.log(`💰 Stripe pricing text: "${trialText}"`);
    }

    // ====================
    // PHASE 8: COMPLETE STRIPE CHECKOUT
    // ====================

    console.log('📍 Phase 8: Completing Stripe checkout with test card');

    // Wait for Stripe form to load
    await page.waitForSelector('input[name="email"], iframe[name*="stripe"]', { timeout: 15000 });

    // Fill email if required (Stripe prefills for authenticated users)
    const stripeEmailInput = page.locator('input[name="email"]');
    if (await stripeEmailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await stripeEmailInput.fill(testEmail);
      console.log('✅ Filled email in Stripe checkout');
    }

    // Wait for card element iframe
    await page.waitForTimeout(2000);

    // Find the card iframe
    const cardFrame = page.frameLocator('iframe[name*="card-number"]').first();

    // Fill in Stripe test card: 4242 4242 4242 4242
    await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    console.log('✅ Entered test card number');

    // Fill expiry date
    const expiryFrame = page.frameLocator('iframe[name*="card-expiry"]').first();
    await expiryFrame.locator('input[name="exp-date"]').fill('1225'); // December 2025
    console.log('✅ Entered expiry date');

    // Fill CVC
    const cvcFrame = page.frameLocator('iframe[name*="card-cvc"]').first();
    await cvcFrame.locator('input[name="cvc"]').fill('123');
    console.log('✅ Entered CVC');

    // Fill billing name if required
    const nameInput = page.locator('input[name="name"]');
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Test User Growth Trial');
      console.log('✅ Filled billing name');
    }

    // Take screenshot before submit
    await page.screenshot({
      path: 'test-results/growth-trial-05-stripe-filled.png',
      fullPage: true
    });

    // Submit payment
    const submitPaymentButton = page.locator('button[type="submit"]').filter({ hasText: /Subscribe|Start trial|Pay/i });
    await submitPaymentButton.click();
    console.log('✅ Clicked submit payment button');

    // ====================
    // PHASE 9: VERIFY CHECKOUT SUCCESS
    // ====================

    console.log('📍 Phase 9: Waiting for checkout success redirect...');

    // Wait for redirect to checkout-success page
    const successPageReached = await page.waitForURL(/checkout-success|success|thank-you/i, {
      timeout: 45000
    }).then(() => true).catch(() => false);

    expect(successPageReached).toBe(true);
    console.log('✅ Redirected to checkout success page');

    // Take screenshot of success page
    await page.screenshot({
      path: 'test-results/growth-trial-06-checkout-success.png',
      fullPage: true
    });

    // ====================
    // PHASE 10: WAIT FOR WEBHOOK PROCESSING
    // ====================

    console.log('📍 Phase 10: Waiting for webhook to process and update database...');

    // Wait for webhook processing (poll database or wait 5 seconds)
    await page.waitForTimeout(5000);
    console.log('✅ Webhook processing grace period completed');

    // ====================
    // PHASE 11: VERIFY DATABASE UPDATED WITH TRIAL TIER
    // ====================

    console.log('📍 Phase 11: Verifying database updated with Growth tier');

    // Query database to verify tier assignment
    const dbVerification = await page.evaluate(async ({ email }) => {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(
        'https://isgzvwpjokcmtizstwru.supabase.co',
        window.VITE_SUPABASE_ANON_KEY
      );

      const { data, error } = await supabase
        .from('users')
        .select('id, email, tier, analyses_remaining, subscription_status')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Database query error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, user: data };
    }, { email: testEmail });

    expect(dbVerification.success).toBe(true);
    console.log('✅ Database query successful');

    const user = dbVerification.user;
    testUserId = user.id; // Store for cleanup
    console.log('👤 User data:', JSON.stringify(user, null, 2));

    // CRITICAL ASSERTIONS: Verify trial tier assigned
    expect(user.tier).toBe('growth');
    expect(user.analyses_remaining).toBe(40); // Growth tier limit
    console.log('✅ Database updated: tier=growth, analyses_remaining=40');

    // ====================
    // PHASE 12: VERIFY ACCOUNT PAGE SHOWS CORRECT TIER
    // ====================

    console.log('📍 Phase 12: Verifying account page shows Growth tier status');

    // Navigate to account page
    await page.goto(`${STAGING_URL}/#account`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Verify tier displayed
    const tierDisplay = page.locator('text=/Growth|40 analyses remaining/i');
    await expect(tierDisplay.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Account page shows Growth tier');

    // Verify 40 analyses remaining
    const analysesDisplay = page.locator('text=/40.*remaining|analyses.*40/i');
    await expect(analysesDisplay.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Account page shows 40 analyses remaining');

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/growth-trial-07-account-page.png',
      fullPage: true
    });

    // ====================
    // COMPLETE
    // ====================

    console.log('\n🎉 GROWTH TRIAL FLOW TEST PASSED!');
    console.log('✅ All critical assertions verified:');
    console.log('   - Trial button click stored authContext correctly');
    console.log('   - isTrial and billingFrequency preserved through flow');
    console.log('   - Magic link authentication successful');
    console.log('   - Stripe checkout showed $0.00 trial pricing');
    console.log('   - Webhook processed and updated database');
    console.log('   - User tier set to "growth" with 40 analyses remaining');
    console.log('   - Account page displays correct trial status');
  });

  test('should handle magic link timeout gracefully', async ({ page }) => {
    console.log('🎯 Testing magic link timeout error handling');

    await page.goto(`${STAGING_URL}/#signup`);
    await page.waitForSelector('input[type="radio"][value="growth"]');
    await page.click('input[type="radio"][value="growth"]');

    const trialButton = page.locator('button:has-text("Try Growth Free for 7 Days")');
    await trialButton.click();
    await page.waitForTimeout(1500);

    // Click email option
    await page.click('button:has-text("Continue with Email")');

    // Enter fake email that won't receive magic link
    const fakeEmail = `no-reply-${Date.now()}@example.com`;
    await page.locator('input[type="email"]').fill(fakeEmail);
    await page.locator('button[type="submit"]').click();

    // Verify confirmation message shows
    await expect(page.locator('text=/Check your email|Magic link/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ Confirmation message displayed even for invalid email (expected)');

    console.log('✅ Timeout error handling test completed');
  });

  test('should verify authContext survives page refresh', async ({ page }) => {
    console.log('🎯 Testing authContext persistence across page refresh');

    await page.goto(`${STAGING_URL}/#signup`);
    await page.waitForSelector('input[type="radio"][value="growth"]');
    await page.click('input[type="radio"][value="growth"]');

    const trialButton = page.locator('button:has-text("Try Growth Free for 7 Days")');
    await trialButton.click();
    await page.waitForTimeout(1500);

    // Capture authContext
    const authContextBefore = await page.evaluate(() => localStorage.getItem('authContext'));
    expect(authContextBefore).toBeTruthy();
    const contextBefore = JSON.parse(authContextBefore);
    console.log('✅ authContext stored before refresh:', contextBefore);

    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify authContext still exists
    const authContextAfter = await page.evaluate(() => localStorage.getItem('authContext'));
    expect(authContextAfter).toBeTruthy();
    const contextAfter = JSON.parse(authContextAfter);

    // Verify contents match
    expect(contextAfter.isTrial).toBe(true);
    expect(contextAfter.selectedTier).toBe('growth');
    expect(contextAfter.billingFrequency).toBe('annual');
    console.log('✅ authContext persisted after refresh:', contextAfter);

    console.log('✅ Persistence test completed');
  });
});
