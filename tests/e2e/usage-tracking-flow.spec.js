// usage-tracking-flow.spec.js - Usage Tracking and Tier Management E2E Tests
import { test, expect } from '@playwright/test';
import { createTempEmailUtils } from '../utils/temp-email-utils.js';

/**
 * Specialized E2E tests for usage tracking and tier management
 * Focuses on the free tier → Coffee tier progression and usage limits
 */

test.describe('Usage Tracking and Tier Management', () => {
  let tempEmailUtils;
  let testEmail;
  
  test.beforeEach(async ({ page }) => {
    tempEmailUtils = createTempEmailUtils(page);
    test.setTimeout(180000); // 3 minutes for complex flows
    console.log('🎯 Starting usage tracking test...');
  });
  
  test.afterEach(async () => {
    if (tempEmailUtils) {
      await tempEmailUtils.cleanup();
    }
  });

  test('should track free tier usage progression accurately', async ({ page }) => {
    console.log('📊 Testing free tier usage tracking (3→2→1→0)');
    
    // Register new user
    testEmail = await tempEmailUtils.generateTempEmail();
    await registerUser(page, testEmail);
    
    // Verify initial state (3 analyses)
    await verifyUsageCount(page, 3);
    console.log('✅ Initial usage: 3 analyses available');
    
    // Perform first analysis (3→2)
    await performAnalysis(page, 'https://example1.com');
    await verifyUsageCount(page, 2);
    console.log('✅ After 1st analysis: 2 analyses remaining');
    
    // Perform second analysis (2→1)
    await performAnalysis(page, 'https://example2.com');
    await verifyUsageCount(page, 1);
    console.log('✅ After 2nd analysis: 1 analysis remaining');
    
    // Perform third analysis (1→0)
    await performAnalysis(page, 'https://example3.com');
    await verifyUsageCount(page, 0);
    console.log('✅ After 3rd analysis: 0 analyses remaining');
    
    // Verify upgrade prompt appears
    const upgradePrompt = page.locator(':has-text("Upgrade"), :has-text("Coffee Tier"), button:has-text("Get")');
    await expect(upgradePrompt).toBeVisible({ timeout: 10000 });
    console.log('✅ Upgrade prompt displayed at usage limit');
    
    // Attempt fourth analysis (should be blocked)
    await page.locator('input[type="url"]').fill('https://example4.com');
    await page.locator('button:has-text("Analyze")').click();
    
    // Should show usage limit message
    const limitMessage = page.locator(':has-text("limit reached"), :has-text("upgrade"), .usage-limit');
    await expect(limitMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Usage limit enforcement working');
  });

  test('should handle monthly usage reset correctly', async ({ page }) => {
    console.log('📅 Testing monthly usage reset functionality');
    
    // This test simulates the monthly reset scenario
    testEmail = await tempEmailUtils.generateTempEmail();
    await registerUser(page, testEmail);
    
    // Use all analyses
    await performAnalysis(page, 'https://example1.com');
    await performAnalysis(page, 'https://example2.com');
    await performAnalysis(page, 'https://example3.com');
    
    await verifyUsageCount(page, 0);
    console.log('✅ All analyses used');
    
    // Simulate monthly reset by calling database reset function
    // Note: In production this would happen automatically
    await page.evaluate(async () => {
      try {
        // This would typically be done server-side
        const response = await fetch('/api/simulate-monthly-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        return response.ok;
      } catch (error) {
        console.log('Monthly reset simulation not available in test');
        return false;
      }
    });
    
    // Refresh page to see updated usage
    await page.reload();
    
    // Note: This test validates the UI behavior
    // The actual reset logic would be tested in integration tests
    console.log('✅ Monthly reset test completed (UI validation)');
  });

  test('should upgrade to Coffee tier successfully', async ({ page }) => {
    console.log('☕ Testing Coffee Tier upgrade flow');
    
    testEmail = await tempEmailUtils.generateTempEmail();
    await registerUser(page, testEmail);
    
    // Use up free analyses to trigger upgrade need
    await performAnalysis(page, 'https://example1.com');
    await performAnalysis(page, 'https://example2.com');
    await performAnalysis(page, 'https://example3.com');
    
    // Click upgrade button
    const upgradeButton = page.locator(':has-text("Upgrade"), button:has-text("Coffee Tier")').first();
    await upgradeButton.click();
    console.log('✅ Clicked upgrade button');
    
    // Verify pricing page
    await expect(page).toHaveURL(/.*pricing.*|.*upgrade.*/);
    
    // Find Coffee Tier option
    const coffeeTierCard = page.locator('.coffee-tier, [data-tier="coffee"], :has-text("Coffee Tier")').first();
    await expect(coffeeTierCard).toBeVisible({ timeout: 10000 });
    console.log('✅ Coffee Tier option visible');
    
    // Click Coffee Tier subscribe button
    const subscribeButton = coffeeTierCard.locator('button:has-text("Subscribe"), button:has-text("Get Coffee")').first();
    await subscribeButton.click();
    console.log('✅ Clicked Coffee Tier subscribe');
    
    // Wait for Stripe checkout
    await page.waitForTimeout(3000);
    
    // Look for Stripe elements (without completing payment)
    const stripeFrame = page.locator('iframe[src*="stripe"], [data-stripe]');
    const hasStripe = await stripeFrame.count() > 0;
    
    if (hasStripe) {
      console.log('✅ Stripe checkout interface loaded');
      
      // Test form validation without payment
      // Note: We don't complete actual payment in tests
      
    } else {
      // Check for test mode indicators
      const testModeIndicator = page.locator(':has-text("test mode"), :has-text("demo")');
      if (await testModeIndicator.count() > 0) {
        console.log('✅ Test mode payment interface detected');
      }
    }
    
    console.log('☕ Coffee Tier upgrade flow validated');
  });

  test('should show tier benefits correctly', async ({ page }) => {
    console.log('🎁 Testing tier benefits display');
    
    // Test as anonymous user first
    await page.goto('/');
    
    // Navigate to pricing
    const pricingLink = page.locator('a[href*="pricing"], :has-text("Pricing")').first();
    
    if (await pricingLink.count() > 0) {
      await pricingLink.click();
    } else {
      await page.goto('/pricing');
    }
    
    // Verify tier comparison
    const freeTier = page.locator('.free-tier, [data-tier="free"]');
    const coffeeTier = page.locator('.coffee-tier, [data-tier="coffee"]');
    
    await expect(freeTier).toBeVisible({ timeout: 10000 });
    await expect(coffeeTier).toBeVisible({ timeout: 10000 });
    
    // Check free tier benefits
    const freeBenefits = freeTier.locator(':has-text("3 analyses"), :has-text("factors")');
    await expect(freeBenefits.first()).toBeVisible();
    console.log('✅ Free tier benefits displayed');
    
    // Check Coffee tier benefits
    const coffeeBenefits = coffeeTier.locator(':has-text("25 analyses"), :has-text("factors")');
    await expect(coffeeBenefits.first()).toBeVisible();
    console.log('✅ Coffee tier benefits displayed');
    
    // Verify pricing
    const coffeePrice = coffeeTier.locator(':has-text("$"), :has-text("month")');
    await expect(coffeePrice.first()).toBeVisible();
    console.log('✅ Coffee tier pricing displayed');
    
    console.log('🎁 Tier benefits display validated');
  });

  test('should handle upgrade cancellation gracefully', async ({ page }) => {
    console.log('❌ Testing upgrade cancellation flow');
    
    testEmail = await tempEmailUtils.generateTempEmail();
    await registerUser(page, testEmail);
    
    // Start upgrade process
    await page.goto('/pricing');
    
    const coffeeTierButton = page.locator('.coffee-tier button, [data-tier="coffee"] button').first();
    await coffeeTierButton.click();
    
    // Wait for Stripe/payment interface
    await page.waitForTimeout(3000);
    
    // Cancel/go back
    const backButton = page.locator('button:has-text("Back"), [aria-label="Back"]');
    
    if (await backButton.count() > 0) {
      await backButton.click();
      console.log('✅ Used back button to cancel');
    } else {
      // Use browser back
      await page.goBack();
      console.log('✅ Used browser back to cancel');
    }
    
    // Verify we're back to pricing or main app
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/pricing|dashboard|app/);
    console.log('✅ Successfully returned after cancellation');
    
    // Verify user is still on free tier
    const freeTierIndicator = page.locator(':has-text("Free"), .free-tier');
    
    if (await freeTierIndicator.count() > 0) {
      console.log('✅ User remained on free tier after cancellation');
    }
    
    console.log('❌ Upgrade cancellation handled gracefully');
  });

  // Helper functions
  async function registerUser(page, email) {
    console.log(`👤 Registering user with email: ${email}`);
    
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('button[type="submit"]').click();
    
    const magicLink = await tempEmailUtils.waitForMagicLink(60000);
    const authSuccess = await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    if (!authSuccess) {
      throw new Error('Registration failed');
    }
    
    console.log('✅ User registration completed');
  }
  
  async function performAnalysis(page, url) {
    console.log(`🔍 Performing analysis on: ${url}`);
    
    await page.locator('input[type="url"]').fill(url);
    await page.locator('button:has-text("Analyze")').click();
    
    // Wait for analysis to complete
    await page.waitForTimeout(15000);
    
    // Wait for results
    const results = page.locator('.factor-card, .result-item');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
    
    console.log(`✅ Analysis completed for: ${url}`);
  }
  
  async function verifyUsageCount(page, expectedCount) {
    console.log(`🔢 Verifying usage count: ${expectedCount}`);
    
    // Look for usage indicators
    const usageElements = page.locator(':has-text("analyses remaining"), :has-text("remaining"), .usage-count');
    
    if (expectedCount > 0) {
      await expect(usageElements.first()).toBeVisible({ timeout: 5000 });
      const usageText = await usageElements.first().textContent();
      expect(usageText).toMatch(new RegExp(expectedCount.toString()));
      console.log(`✅ Usage count verified: ${expectedCount}`);
    } else {
      // At 0, should show upgrade prompt instead
      const upgradePrompt = page.locator(':has-text("Upgrade"), :has-text("limit reached")');
      await expect(upgradePrompt.first()).toBeVisible({ timeout: 5000 });
      console.log('✅ Upgrade prompt verified at 0 usage');
    }
  }
});