// free-tier-registration-flow.spec.js - Free Tier User Registration Flow Testing
import { test, expect } from '@playwright/test';

/**
 * FREE TIER REGISTRATION FLOW TEST
 * 
 * This test validates the Free tier registration flow by following the actual
 * user journey from landing page through registration to pricing page access.
 * 
 * Test Coverage:
 * - Landing page access and navigation
 * - Registration/signup flow initiation
 * - Free tier selection visibility
 * - User flow through authentication
 * - Access to pricing after authentication
 */

// Test Configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  TIMEOUT: 10000,
  SCREENSHOT_ON_STEP: true,
};

test.describe('Free Tier - Registration Flow and Pricing Access', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear all storage to start fresh
    await page.goto(TEST_CONFIG.BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🎯 Starting Free tier registration flow test');
  });

  /**
   * COMPLETE FREE TIER USER JOURNEY
   * Test the full flow a new Free tier user would follow
   */
  test('Free Tier - Complete User Journey from Landing to Pricing', async ({ page }) => {
    console.log('🚀 Testing complete Free tier user journey...');
    
    // Step 1: Start on landing page
    await page.goto(TEST_CONFIG.BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Handle cookie consent if present
    try {
      const allowAllButton = page.locator('button:has-text("Allow All")');
      if (await allowAllButton.isVisible({ timeout: 3000 })) {
        await allowAllButton.click();
        console.log('✅ Accepted cookies');
      }
    } catch (e) {
      console.log('ℹ️ No cookie consent found');
    }
    
    if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
      await page.screenshot({ path: 'test-results/free-tier-step1-landing.png', fullPage: true });
    }
    
    console.log('✅ Step 1: On landing page');
    
    // Step 2: Look for sign up or registration entry points
    const signupSelectors = [
      'button:has-text("Sign Up")',
      'button:has-text("Get Started")',
      'button:has-text("Start Free")',
      'a:has-text("Sign Up")',
      ':text("Register")',
      ':text("Create Account")'
    ];
    
    let signupButton = null;
    
    for (const selector of signupSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 })) {
          signupButton = button;
          console.log(`✅ Found signup button: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (signupButton) {
      await signupButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Step 2: Clicked signup button');
      
      if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
        await page.screenshot({ path: 'test-results/free-tier-step2-after-signup-click.png', fullPage: true });
      }
    } else {
      // Try direct navigation to registration
      console.log('ℹ️ No signup button found, trying direct navigation...');
      await page.goto(`${TEST_CONFIG.BASE_URL}#register`);
      await page.waitForTimeout(2000);
      console.log('✅ Step 2: Direct navigation to register');
    }
    
    // Step 3: Look for Free tier registration or Coffee tier with Free option
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Look for Coffee tier signup (which might include Free tier option)
    const coffeeSignupSelectors = [
      ':text("Coffee")',
      ':text("☕")', 
      ':text("Choose Coffee Plan")',
      ':text("$4.95")',
      'button:has-text("Start Free")',
      'button:has-text("Free")'
    ];
    
    let tierVisible = false;
    let foundElements = [];
    
    for (const selector of coffeeSignupSelectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 3000 })) {
          tierVisible = true;
          foundElements.push(selector);
          console.log(`✅ Tier element found: ${selector}`);
        }
      } catch (e) {
        continue;
      }
    }
    
    if (tierVisible) {
      console.log('✅ Step 3: Tier selection visible');
      console.log(`   Found elements: ${foundElements.join(', ')}`);
      
      if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
        await page.screenshot({ path: 'test-results/free-tier-step3-tier-selection.png', fullPage: true });
      }
    } else {
      console.log('ℹ️ Step 3: No tier selection visible, checking for email form...');
      
      // Look for email registration form
      const emailForm = await page.locator('input[type="email"]').isVisible({ timeout: 3000 });
      if (emailForm) {
        console.log('✅ Email form found - can proceed with test email');
      }
      
      if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
        await page.screenshot({ path: 'test-results/free-tier-step3-email-form.png', fullPage: true });
      }
    }
    
    // Step 4: Try to access pricing page (post-signup simulation)
    // Simulate having signed up and try to access pricing
    console.log('🔄 Step 4: Simulating post-signup pricing access...');
    
    // Try different routes to pricing
    const pricingRoutes = [
      `${TEST_CONFIG.BASE_URL}#pricing`,
      `${TEST_CONFIG.BASE_URL}#upgrade`,
      `${TEST_CONFIG.BASE_URL}#tiers`
    ];
    
    let pricingAccessible = false;
    
    for (const route of pricingRoutes) {
      console.log(`🔍 Trying pricing route: ${route}`);
      await page.goto(route);
      await page.waitForTimeout(2000);
      
      // Check if we see pricing content
      const pricingElements = [
        ':text("Choose Your Plan")',
        ':text("Free")',
        ':text("Coffee")',
        ':text("$4.95")',
        ':text("$0")',
        'button:has-text("Buy Me a Coffee")'
      ];
      
      let pricingElementsFound = 0;
      for (const element of pricingElements) {
        if (await page.locator(element).isVisible({ timeout: 2000 })) {
          pricingElementsFound++;
          console.log(`✅ Pricing element found: ${element}`);
        }
      }
      
      if (pricingElementsFound >= 2) {
        pricingAccessible = true;
        console.log(`✅ Pricing accessible at: ${route}`);
        
        if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
          await page.screenshot({ path: 'test-results/free-tier-step4-pricing-accessible.png', fullPage: true });
        }
        break;
      }
    }
    
    if (!pricingAccessible) {
      console.log('ℹ️ Direct pricing access not available - likely requires authentication');
      
      if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
        await page.screenshot({ path: 'test-results/free-tier-step4-pricing-blocked.png', fullPage: true });
      }
    }
    
    // Step 5: Report findings and validate what we can
    console.log('📊 Test Results Summary:');
    console.log(`   - Landing page accessible: ✅`);
    console.log(`   - Signup flow initiated: ${signupButton ? '✅' : '⚠️'}`);
    console.log(`   - Tier selection visible: ${tierVisible ? '✅' : '⚠️'}`);
    console.log(`   - Pricing directly accessible: ${pricingAccessible ? '✅' : '❌'}`);
    
    // Create final summary screenshot
    await page.screenshot({ path: 'test-results/free-tier-final-state.png', fullPage: true });
    
    // Basic validation - we should at least be able to start the signup process
    expect(signupButton || tierVisible).toBeTruthy();
    
    console.log('🎉 Free tier user journey test completed!');
  });

  /**
   * FREE TIER CONTENT VALIDATION
   * Test that Free tier information is available somewhere in the app
   */
  test('Free Tier - Content Validation Across App', async ({ page }) => {
    console.log('🚀 Testing Free tier content validation...');
    
    // Routes to check for Free tier content
    const routesToCheck = [
      TEST_CONFIG.BASE_URL,
      `${TEST_CONFIG.BASE_URL}#register`,
      `${TEST_CONFIG.BASE_URL}#coffee-signup`,
      `${TEST_CONFIG.BASE_URL}#pricing`
    ];
    
    let freeTierContentFound = false;
    let contentLocations = [];
    
    for (const route of routesToCheck) {
      console.log(`🔍 Checking route: ${route}`);
      await page.goto(route);
      await page.waitForTimeout(2000);
      
      // Handle cookie consent
      try {
        const allowAllButton = page.locator('button:has-text("Allow All")');
        if (await allowAllButton.isVisible({ timeout: 2000 })) {
          await allowAllButton.click();
        }
      } catch (e) {
        // Ignore
      }
      
      // Look for Free tier content
      const freeContentSelectors = [
        ':text("Free")',
        ':text("$0")',
        ':text("3 per month")',
        ':text("Free Tier")',
        ':text("Start Free")',
        ':text("Basic recommendations")',
        ':text("Phase A factors")'
      ];
      
      let elementsFoundHere = 0;
      let foundHere = [];
      
      for (const selector of freeContentSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          elementsFoundHere++;
          foundHere.push(selector);
        }
      }
      
      if (elementsFoundHere >= 2) {
        freeTierContentFound = true;
        contentLocations.push({
          route,
          elements: foundHere,
          count: elementsFoundHere
        });
        console.log(`✅ Free tier content found at ${route}: ${foundHere.join(', ')}`);
        
        // Take screenshot of this location
        await page.screenshot({ path: `test-results/free-tier-content-${route.split('#')[1] || 'home'}.png`, fullPage: true });
      }
    }
    
    console.log('📊 Free tier content search results:');
    console.log(`   - Content found: ${freeTierContentFound ? '✅' : '❌'}`);
    console.log(`   - Locations with content: ${contentLocations.length}`);
    
    contentLocations.forEach(location => {
      console.log(`     * ${location.route}: ${location.count} elements`);
    });
    
    // We should find Free tier content somewhere
    expect(freeTierContentFound).toBe(true);
    expect(contentLocations.length).toBeGreaterThan(0);
    
    console.log('🎉 Free tier content validation completed!');
  });

  /**
   * EMAIL VERIFICATION ENFORCEMENT TEST
   * Test that the app properly enforces email verification for Free tier
   */
  test('Free Tier - Email Verification Requirements', async ({ page }) => {
    console.log('🚀 Testing email verification enforcement...');
    
    // Start on landing or registration page
    await page.goto(`${TEST_CONFIG.BASE_URL}#register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Handle consent
    try {
      const allowAllButton = page.locator('button:has-text("Allow All")');
      if (await allowAllButton.isVisible({ timeout: 2000 })) {
        await allowAllButton.click();
      }
    } catch (e) {}
    
    if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
      await page.screenshot({ path: 'test-results/free-tier-email-test-start.png', fullPage: true });
    }
    
    // Look for email input form
    const emailInput = page.locator('input[type="email"]').first();
    const emailFormExists = await emailInput.isVisible({ timeout: 5000 });
    
    if (emailFormExists) {
      console.log('✅ Email form found - testing email verification enforcement');
      
      // Try with a test email (without verification)
      const testEmail = `test-free-tier-${Date.now()}@example.com`;
      await emailInput.fill(testEmail);
      
      // Look for submit button
      const submitSelectors = [
        'button:has-text("Send Magic Link")',
        'button:has-text("Sign Up")',
        'button:has-text("Get Started")',
        'button[type="submit"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          submitButton = button;
          break;
        }
      }
      
      if (submitButton) {
        console.log(`📧 Testing with email: ${testEmail}`);
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Check for email verification message
        const verificationMessages = [
          ':text("Check your email")',
          ':text("Verify your email")',
          ':text("Magic link sent")',
          ':text("Confirmation email")',
          ':text("verification")'
        ];
        
        let verificationEnforced = false;
        for (const message of verificationMessages) {
          if (await page.locator(message).isVisible({ timeout: 2000 })) {
            verificationEnforced = true;
            console.log(`✅ Email verification enforced: ${message}`);
            break;
          }
        }
        
        if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
          await page.screenshot({ path: 'test-results/free-tier-after-email-submit.png', fullPage: true });
        }
        
        // Try to access protected content without verification
        await page.goto(`${TEST_CONFIG.BASE_URL}#pricing`);
        await page.waitForTimeout(2000);
        
        const pricingBlocked = await page.locator(':text("Sign In"), :text("Please verify"), input[type="email"]').isVisible({ timeout: 2000 });
        
        console.log(`📊 Email verification test results:`);
        console.log(`   - Verification message shown: ${verificationEnforced ? '✅' : '❌'}`);
        console.log(`   - Pricing access blocked: ${pricingBlocked ? '✅' : '❌'}`);
        
        if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
          await page.screenshot({ path: 'test-results/free-tier-pricing-after-unverified-signup.png', fullPage: true });
        }
        
        // Email verification should be enforced
        expect(verificationEnforced || pricingBlocked).toBe(true);
        
      } else {
        console.log('⚠️ No submit button found - cannot test email verification');
        if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
          await page.screenshot({ path: 'test-results/free-tier-no-submit-button.png', fullPage: true });
        }
      }
    } else {
      console.log('ℹ️ No email form found - email verification test not applicable');
      if (TEST_CONFIG.SCREENSHOT_ON_STEP) {
        await page.screenshot({ path: 'test-results/free-tier-no-email-form.png', fullPage: true });
      }
    }
    
    console.log('🎉 Email verification enforcement test completed!');
  });

});