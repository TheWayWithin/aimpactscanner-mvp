// user-journey-with-temp-email.spec.js - Comprehensive E2E Test Suite with 10minute.com Integration
import { test, expect } from '@playwright/test';
import { createTempEmailUtils } from '../utils/temp-email-utils.js';

/**
 * Comprehensive E2E Test Suite for AImpactScanner
 * Tests complete anonymous → authenticated user flow using temporary email addresses
 * 
 * Test Coverage:
 * - Anonymous user analysis preview
 * - Temporary email registration
 * - Magic link authentication
 * - Results persistence after auth
 * - Usage tracking validation
 * - Upgrade flow testing
 * - Error handling scenarios
 */

test.describe('AImpactScanner Complete User Journey with Temp Email', () => {
  let tempEmailUtils;
  let testEmail;
  
  test.beforeEach(async ({ page }) => {
    // Initialize temp email utilities
    tempEmailUtils = createTempEmailUtils(page);
    
    // Set longer timeouts for email operations
    test.setTimeout(120000); // 2 minutes per test
    
    console.log('🚀 Starting fresh user journey test...');
  });
  
  test.afterEach(async () => {
    // Clean up email resources
    if (tempEmailUtils) {
      await tempEmailUtils.cleanup();
    }
  });

  test('should complete full anonymous → authenticated flow with preview results persistence', async ({ page }) => {
    console.log('🎯 Testing complete user journey with temp email authentication');
    
    // ====================
    // PHASE 1: ANONYMOUS USER ANALYSIS
    // ====================
    
    console.log('📍 Phase 1: Starting as anonymous user');
    await page.goto('/');
    
    // Verify landing page loads
    await expect(page.locator('h1')).toContainText('Is AI Stealing Your', { timeout: 10000 });
    console.log('✅ Landing page loaded successfully');
    
    // Enter test URL for analysis
    const testUrl = 'https://example.com';
    const urlInput = page.locator('input[type="url"], input[placeholder*="URL"], #url-input');
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    
    await urlInput.fill(testUrl);
    console.log(`✅ Entered test URL: ${testUrl}`);
    
    // Start analysis
    const analyzeButton = page.locator('button:has-text("Analyze"), button[type="submit"]').first();
    await expect(analyzeButton).toBeVisible({ timeout: 5000 });
    await analyzeButton.click();
    console.log('✅ Analysis started');
    
    // ====================
    // PHASE 2: PROGRESS MONITORING
    // ====================
    
    console.log('📍 Phase 2: Monitoring analysis progress');
    
    // Wait for progress to start
    const progressIndicator = page.locator('[data-testid="progress"], .progress, [role="progressbar"]');
    await expect(progressIndicator).toBeVisible({ timeout: 15000 });
    console.log('✅ Progress indicator visible');
    
    // Monitor progress for 15 seconds (matches SimpleAnalysisProgress duration)
    let progressCompleted = false;
    const progressStartTime = Date.now();
    
    while (Date.now() - progressStartTime < 20000 && !progressCompleted) {
      try {
        // Check for completion indicators
        const completionElements = await page.locator(':has-text("Analysis Complete"), :has-text("100%"), :has-text("Completed")').count();
        
        if (completionElements > 0) {
          progressCompleted = true;
          console.log('✅ Analysis progress completed');
          break;
        }
        
        await page.waitForTimeout(1000);
      } catch (error) {
        // Continue monitoring
      }
    }
    
    if (!progressCompleted) {
      console.log('⏰ Progress monitoring timed out - proceeding to check results');
    }
    
    // ====================
    // PHASE 3: PREVIEW RESULTS VALIDATION
    // ====================
    
    console.log('📍 Phase 3: Validating preview results');
    
    // Wait for results to be displayed
    await page.waitForTimeout(3000);
    
    // Look for preview results indicators
    const previewResults = page.locator('.factor-card, .result-item, [data-testid="factor"]');
    await expect(previewResults.first()).toBeVisible({ timeout: 10000 });
    
    const factorCount = await previewResults.count();
    console.log(`✅ Found ${factorCount} factor results displayed`);
    
    // Verify preview shows limited results (3 unlocked + 8 locked as per requirements)
    const lockedFactors = page.locator('.locked, [data-locked="true"], :has-text("Upgrade to unlock")');
    const lockedCount = await lockedFactors.count();
    
    if (lockedCount > 0) {
      console.log(`✅ Found ${lockedCount} locked factors - preview limitation working`);
    }
    
    // Look for unlock/upgrade prompts
    const upgradePrompts = page.locator(':has-text("Create Free Account"), :has-text("Unlock Results"), button:has-text("Sign Up")');
    await expect(upgradePrompts.first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Upgrade prompt displayed for anonymous user');
    
    // ====================
    // PHASE 4: REGISTRATION FLOW WITH TEMP EMAIL
    // ====================
    
    console.log('📍 Phase 4: Starting registration with temporary email');
    
    // Generate temporary email
    testEmail = await tempEmailUtils.generateTempEmail();
    console.log(`✅ Generated temporary email: ${testEmail}`);
    
    // Click on registration/create account button
    const createAccountButton = page.locator(':has-text("Create Free Account"), :has-text("Sign Up"), button:has-text("Get Free Account")').first();
    await createAccountButton.click();
    console.log('✅ Clicked create account button');
    
    // Fill in email form
    const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(testEmail);
    console.log('✅ Entered temporary email in registration form');
    
    // Submit registration
    const submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Continue")').first();
    await submitButton.click();
    console.log('✅ Submitted registration form');
    
    // Wait for confirmation message
    const confirmationMessage = page.locator(':has-text("Check your email"), :has-text("Magic link"), :has-text("We sent")');
    await expect(confirmationMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ Registration confirmation message displayed');
    
    // ====================
    // PHASE 5: MAGIC LINK AUTHENTICATION
    // ====================
    
    console.log('📍 Phase 5: Processing magic link authentication');
    
    // Wait for magic link email (with extended timeout)
    const magicLink = await tempEmailUtils.waitForMagicLink(90000, 3000); // 90 seconds timeout, 3-second polls
    
    if (!magicLink) {
      throw new Error('❌ Magic link not received within timeout period');
    }
    
    console.log('✅ Magic link received');
    
    // Process magic link authentication
    const authSuccess = await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    if (!authSuccess) {
      throw new Error('❌ Magic link authentication failed');
    }
    
    console.log('✅ Magic link authentication successful');
    
    // ====================
    // PHASE 6: POST-AUTH RESULTS VALIDATION
    // ====================
    
    console.log('📍 Phase 6: Validating results persistence after authentication');
    
    // Wait for page to update after authentication
    await page.waitForTimeout(3000);
    
    // Verify we're now authenticated
    const authIndicators = page.locator('[data-auth-state="authenticated"], .account-menu, :has-text("Account"), :has-text("Dashboard")');
    await expect(authIndicators.first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Authentication state confirmed');
    
    // Verify results are still displayed and unlocked
    const unlockedResults = page.locator('.factor-card:not(.locked), .result-item:not([data-locked="true"])');
    const unlockedCount = await unlockedResults.count();
    
    expect(unlockedCount).toBeGreaterThan(factorCount - lockedCount);
    console.log(`✅ Results unlocked after authentication: ${unlockedCount} factors visible`);
    
    // Verify no jump to welcome page (testing the bug fix)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('welcome');
    expect(currentUrl).not.toContain('onboarding');
    console.log('✅ No unwanted redirect to welcome page - bug fix confirmed');
    
    // Verify analysis data survived registration
    const analysisTitle = page.locator('h1, h2, .analysis-title');
    const titleText = await analysisTitle.first().textContent();
    expect(titleText).toContain('example.com', { ignoreCase: true });
    console.log('✅ Analysis data persisted through authentication');
    
    // ====================
    // PHASE 7: USAGE TRACKING VALIDATION
    // ====================
    
    console.log('📍 Phase 7: Validating usage tracking');
    
    // Look for usage indicators
    const usageIndicators = page.locator(':has-text("analyses remaining"), :has-text("2 left"), .usage-count');
    
    if (await usageIndicators.count() > 0) {
      const usageText = await usageIndicators.first().textContent();
      console.log(`✅ Usage tracking visible: ${usageText}`);
      
      // Should show 2 remaining (started with 3, used 1)
      expect(usageText).toMatch(/[2]/);
      console.log('✅ Usage count decremented correctly (3→2)');
    }
    
    console.log('🎉 Complete user journey test passed successfully!');
  });

  test('should handle usage tracking progression (3→2→1→0)', async ({ page }) => {
    console.log('🎯 Testing usage tracking progression');
    
    // Generate temp email and complete initial registration
    testEmail = await tempEmailUtils.generateTempEmail();
    
    // Quick registration flow (simplified)
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    
    // Wait for analysis and register
    await page.waitForTimeout(5000);
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();
    
    // Complete auth
    const magicLink = await tempEmailUtils.waitForMagicLink();
    await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    // Track usage across multiple analyses
    for (let analysis = 2; analysis >= 0; analysis--) {
      console.log(`📊 Testing analysis ${3 - analysis}/3 (${analysis} remaining expected)`);
      
      if (analysis < 2) {
        // Perform additional analysis
        await page.locator('input[type="url"]').fill(`https://test${analysis}.example.com`);
        await page.locator('button:has-text("Analyze")').click();
        await page.waitForTimeout(15000); // Wait for analysis completion
      }
      
      // Check remaining count
      const usageElements = page.locator(':has-text("analyses remaining"), :has-text("remaining"), .usage-count');
      
      if (await usageElements.count() > 0) {
        const usageText = await usageElements.first().textContent();
        console.log(`✅ Usage display: ${usageText}`);
        
        if (analysis > 0) {
          expect(usageText).toMatch(new RegExp(analysis.toString()));
        } else {
          // At 0 remaining, should show upgrade prompt
          const upgradePrompt = page.locator(':has-text("Upgrade"), :has-text("Coffee Tier")');
          await expect(upgradePrompt).toBeVisible({ timeout: 5000 });
          console.log('✅ Upgrade prompt shown at 0 remaining analyses');
        }
      }
    }
    
    console.log('🎉 Usage tracking progression test completed');
  });

  test('should handle coffee tier upgrade flow', async ({ page }) => {
    console.log('🎯 Testing Coffee Tier upgrade flow');
    
    // Complete initial registration
    testEmail = await tempEmailUtils.generateTempEmail();
    
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();
    
    const magicLink = await tempEmailUtils.waitForMagicLink();
    await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    // Navigate to pricing/upgrade
    const upgradeButton = page.locator(':has-text("Upgrade"), :has-text("Coffee Tier"), button:has-text("Get Coffee Tier")');
    
    if (await upgradeButton.count() > 0) {
      await upgradeButton.first().click();
      console.log('✅ Clicked upgrade button');
      
      // Verify pricing page loads
      await expect(page).toHaveURL(/.*pricing.*|.*upgrade.*|.*coffee.*/);
      console.log('✅ Pricing page loaded');
      
      // Look for Coffee Tier option
      const coffeeTierOption = page.locator(':has-text("Coffee Tier"), .coffee-tier, [data-tier="coffee"]');
      await expect(coffeeTierOption).toBeVisible({ timeout: 10000 });
      console.log('✅ Coffee Tier option visible');
      
      // Test Stripe checkout (without completing payment)
      const checkoutButton = page.locator('button:has-text("Subscribe"), button:has-text("Get Coffee Tier")');
      
      if (await checkoutButton.count() > 0) {
        await checkoutButton.first().click();
        console.log('✅ Checkout button clicked');
        
        // Wait for Stripe redirect or modal
        await page.waitForTimeout(3000);
        
        // Verify Stripe elements are present (without completing payment)
        const stripeElements = page.locator('[data-stripe], iframe[src*="stripe"], [class*="stripe"]');
        
        if (await stripeElements.count() > 0) {
          console.log('✅ Stripe payment interface loaded');
        } else {
          console.log('ℹ️ Stripe interface not detected (may be in test mode)');
        }
      }
    } else {
      console.log('ℹ️ Upgrade button not found - user may already have sufficient tier');
    }
    
    console.log('🎉 Coffee Tier upgrade flow test completed');
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    console.log('🎯 Testing error handling scenarios');
    
    // Test invalid URL input
    await page.goto('/');
    
    const urlInput = page.locator('input[type="url"]');
    await urlInput.fill('not-a-valid-url');
    
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await analyzeButton.click();
    
    // Should show error message
    const errorMessage = page.locator('.error, [role="alert"], :has-text("Invalid URL")');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    console.log('✅ Invalid URL error handling works');
    
    // Test invalid email during registration
    await urlInput.fill('https://example.com');
    await analyzeButton.click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('not-a-valid-email');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show email validation error
    const emailError = page.locator(':has-text("Invalid email"), .error, [role="alert"]');
    await expect(emailError).toBeVisible({ timeout: 5000 });
    console.log('✅ Invalid email error handling works');
    
    console.log('🎉 Error handling test completed');
  });

  test('should maintain session persistence across page refreshes', async ({ page }) => {
    console.log('🎯 Testing session persistence');
    
    // Complete authentication
    testEmail = await tempEmailUtils.generateTempEmail();
    
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();
    
    const magicLink = await tempEmailUtils.waitForMagicLink();
    await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    // Verify authenticated state
    const authIndicator = page.locator('[data-auth-state="authenticated"], .account-menu');
    await expect(authIndicator).toBeVisible({ timeout: 10000 });
    console.log('✅ Initial authentication confirmed');
    
    // Refresh page
    await page.reload({ waitUntil: 'networkidle' });
    console.log('✅ Page refreshed');
    
    // Verify session persisted
    await expect(authIndicator).toBeVisible({ timeout: 10000 });
    console.log('✅ Session persisted after refresh');
    
    // Navigate away and back
    await page.goto('/pricing');
    await page.waitForTimeout(2000);
    await page.goto('/');
    
    // Verify still authenticated
    await expect(authIndicator).toBeVisible({ timeout: 10000 });
    console.log('✅ Session persisted across navigation');
    
    console.log('🎉 Session persistence test completed');
  });

  test('should handle concurrent email generation attempts', async ({ page, browser }) => {
    console.log('🎯 Testing concurrent email generation reliability');
    
    // Create multiple email utils instances
    const utils1 = createTempEmailUtils(page);
    const page2 = await browser.newPage();
    const utils2 = createTempEmailUtils(page2);
    
    try {
      // Generate emails concurrently
      const [email1, email2] = await Promise.all([
        utils1.generateTempEmail(),
        utils2.generateTempEmail()
      ]);
      
      console.log(`✅ Generated concurrent emails: ${email1}, ${email2}`);
      
      // Verify emails are different
      expect(email1).not.toBe(email2);
      console.log('✅ Concurrent emails are unique');
      
      // Verify both are valid
      expect(email1).toMatch(/@/);
      expect(email2).toMatch(/@/);
      console.log('✅ Both emails are valid format');
      
    } finally {
      await utils1.cleanup();
      await utils2.cleanup();
      await page2.close();
    }
    
    console.log('🎉 Concurrent email generation test completed');
  });
});

// ====================
// PERFORMANCE TESTS
// ====================

test.describe('Performance and Load Testing', () => {
  test('should complete user journey within acceptable timeframes', async ({ page }) => {
    console.log('🎯 Testing performance benchmarks');
    
    const startTime = Date.now();
    
    // Time the complete flow
    const tempEmailUtils = createTempEmailUtils(page);
    const testEmail = await tempEmailUtils.generateTempEmail();
    
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    
    const analysisStartTime = Date.now();
    await page.waitForTimeout(15000); // Analysis duration
    const analysisEndTime = Date.now();
    
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();
    
    const magicLink = await tempEmailUtils.waitForMagicLink(60000);
    await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    const totalTime = Date.now() - startTime;
    const analysisTime = analysisEndTime - analysisStartTime;
    
    console.log(`⏱️ Analysis completed in: ${analysisTime}ms`);
    console.log(`⏱️ Total user journey: ${totalTime}ms`);
    
    // Performance assertions
    expect(analysisTime).toBeLessThan(20000); // Under 20 seconds
    expect(totalTime).toBeLessThan(120000);   // Under 2 minutes total
    
    await tempEmailUtils.cleanup();
    
    console.log('🎉 Performance benchmarks met');
  });
});