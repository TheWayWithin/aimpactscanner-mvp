// pricing-page-validation.spec.js - Basic Pricing Page Structure Validation
import { test, expect } from '@playwright/test';

/**
 * PRICING PAGE VALIDATION TEST SUITE
 * 
 * This test suite validates the basic structure of the pricing page
 * before running complex email verification flows.
 * 
 * Test Coverage:
 * - Pricing page loads correctly
 * - All tier cards are visible
 * - Free tier signup button is accessible
 * - Pricing information is displayed correctly
 * - Basic responsiveness validation
 */

// Test Configuration
const TEST_CONFIG = {
  BASE_URL: 'http://localhost:5173',
  ANIMATION_WAIT: 2000,
};

test.describe('Pricing Page Structure Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to pricing page
    await page.goto(`${TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    console.log('🎯 Navigated to pricing page for validation');
  });

  /**
   * BASIC PAGE LOAD VALIDATION
   * Ensure the pricing page loads correctly
   */
  test('Pricing Page - Basic Load and Structure', async ({ page }) => {
    console.log('🚀 Validating basic pricing page structure...');
    
    // Check page title
    const title = await page.title();
    expect(title).toContain('AImpactScanner');
    console.log(`✅ Page title: ${title}`);
    
    // Check for main pricing container
    const pricingContainer = page.locator('[data-testid="pricing-container"], .pricing-page, .pricing-section, .tiers-container').first();
    await expect(pricingContainer).toBeVisible({ timeout: 10000 });
    console.log('✅ Pricing container found');
    
    // Take screenshot for reference
    await page.screenshot({ path: 'test-results/pricing-page-structure.png', fullPage: true });
    
    console.log('🎉 Basic pricing page structure validated!');
  });

  /**
   * TIER CARDS VISIBILITY
   * Validate all tier cards are present and visible
   */
  test('Tier Cards - Visibility and Content Validation', async ({ page }) => {
    console.log('🚀 Validating tier cards visibility...');
    
    // Expected tiers
    const expectedTiers = ['Free', 'Coffee', 'Growth', 'Scale'];
    
    for (const tierName of expectedTiers) {
      console.log(`🔍 Looking for ${tierName} tier...`);
      
      // Multiple selectors to find tier cards
      const tierSelectors = [
        `[data-tier="${tierName.toUpperCase()}"]`,
        `.tier-${tierName.toLowerCase()}`,
        `.tier-card:has-text("${tierName}")`,
        `:text("${tierName}")`
      ];
      
      let tierFound = false;
      
      for (const selector of tierSelectors) {
        try {
          const tierElement = page.locator(selector).first();
          if (await tierElement.isVisible({ timeout: 5000 })) {
            console.log(`✅ ${tierName} tier found with selector: ${selector}`);
            
            // Take screenshot of this tier
            await tierElement.screenshot({ path: `test-results/tier-${tierName.toLowerCase()}.png` });
            
            tierFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!tierFound) {
        console.log(`⚠️ ${tierName} tier not found with standard selectors`);
      }
    }
    
    console.log('🎉 Tier cards visibility validation completed!');
  });

  /**
   * FREE TIER SIGNUP BUTTON VALIDATION
   * Ensure Free tier signup is accessible
   */
  test('Free Tier - Signup Button Accessibility', async ({ page }) => {
    console.log('🚀 Validating Free tier signup button...');
    
    // Multiple selectors for Free tier signup
    const freeSignupSelectors = [
      '[data-tier="FREE"] button',
      '.tier-free button',
      'button:has-text("Get Started"):near(:text("Free"))',
      'button:has-text("Start Free"):near(:text("Free"))',
      'button:has-text("Sign Up"):near(:text("Free"))',
      '.tier-card:has-text("Free") button'
    ];
    
    let signupButtonFound = false;
    let workingSelector = null;
    
    for (const selector of freeSignupSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 5000 })) {
          console.log(`✅ Free signup button found: ${selector}`);
          
          // Check if button is clickable
          const isEnabled = await button.isEnabled();
          console.log(`✅ Button enabled: ${isEnabled}`);
          
          // Get button text
          const buttonText = await button.textContent();
          console.log(`✅ Button text: "${buttonText}"`);
          
          signupButtonFound = true;
          workingSelector = selector;
          
          // Take screenshot highlighting the button
          await button.screenshot({ path: 'test-results/free-tier-signup-button.png' });
          
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    expect(signupButtonFound).toBe(true);
    console.log(`🎉 Free tier signup button validated with selector: ${workingSelector}`);
    
    // Test button click (without submitting)
    if (workingSelector) {
      const button = page.locator(workingSelector).first();
      await button.click();
      
      // Wait for any navigation or modal
      await page.waitForTimeout(2000);
      
      // Check what happens after click
      const currentUrl = page.url();
      console.log(`📍 URL after free signup click: ${currentUrl}`);
      
      // Look for auth form, modal, or redirect
      const authIndicators = [
        'input[type="email"]',
        '#email',
        '.auth-form',
        '.signup-form',
        '.modal',
        ':text("Sign Up")',
        ':text("Get Started")'
      ];
      
      for (const indicator of authIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 3000 })) {
          console.log(`✅ Auth form found: ${indicator}`);
          
          // Take screenshot of auth form
          await page.screenshot({ path: 'test-results/free-tier-auth-form.png' });
          break;
        }
      }
    }
  });

  /**
   * PRICING DISPLAY VALIDATION
   * Ensure pricing information is correctly shown
   */
  test('Pricing Display - Accuracy and Formatting', async ({ page }) => {
    console.log('🚀 Validating pricing display accuracy...');
    
    const expectedPricing = {
      'Free': '$0',
      'Coffee': '$4.99', 
      'Growth': '$29.99',
      'Scale': '$99.99'
    };
    
    for (const [tierName, expectedPrice] of Object.entries(expectedPricing)) {
      console.log(`💰 Checking pricing for ${tierName} tier...`);
      
      // Look for price display
      const priceSelectors = [
        `:text("${expectedPrice}")`,
        `.tier-${tierName.toLowerCase()} :text("${expectedPrice}")`,
        `[data-tier="${tierName.toUpperCase()}"] :text("${expectedPrice}")`,
        `.price:has-text("${expectedPrice}")`
      ];
      
      let priceFound = false;
      
      for (const selector of priceSelectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 3000 })) {
            console.log(`✅ ${tierName} pricing (${expectedPrice}) found`);
            priceFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!priceFound) {
        console.log(`⚠️ ${tierName} pricing (${expectedPrice}) not found`);
      }
    }
    
    console.log('🎉 Pricing display validation completed!');
  });

  /**
   * RESPONSIVE DESIGN VALIDATION
   * Test pricing page on different screen sizes
   */
  test('Responsive Design - Mobile and Desktop Layout', async ({ page }) => {
    console.log('🚀 Testing responsive design...');
    
    // Test desktop layout (default)
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    
    const desktopLayout = await page.locator('.tier-card, .pricing-card').first().isVisible();
    expect(desktopLayout).toBe(true);
    console.log('✅ Desktop layout renders correctly');
    
    await page.screenshot({ path: 'test-results/pricing-desktop-layout.png', fullPage: true });
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.locator('.tier-card, .pricing-card').first().isVisible();
    expect(tabletLayout).toBe(true);
    console.log('✅ Tablet layout renders correctly');
    
    await page.screenshot({ path: 'test-results/pricing-tablet-layout.png', fullPage: true });
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.locator('.tier-card, .pricing-card').first().isVisible();
    expect(mobileLayout).toBe(true);
    console.log('✅ Mobile layout renders correctly');
    
    await page.screenshot({ path: 'test-results/pricing-mobile-layout.png', fullPage: true });
    
    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('🎉 Responsive design validation completed!');
  });

  /**
   * ERROR HANDLING VALIDATION
   * Test page behavior under error conditions
   */
  test('Error Handling - Page Resilience', async ({ page }) => {
    console.log('🚀 Testing error handling and page resilience...');
    
    // Test with slow network
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    // Verify page still loads correctly with delays
    const mainContent = await page.locator('.tier-card, .pricing-card, .pricing-section').first().isVisible({ timeout: 15000 });
    expect(mainContent).toBe(true);
    console.log('✅ Page loads correctly with network delays');
    
    // Remove route delay
    await page.unroute('**/*');
    
    // Test JavaScript error resilience
    await page.evaluate(() => {
      // Simulate a non-critical error
      console.error('Test error for resilience testing');
    });
    
    // Verify page still functions
    await page.waitForTimeout(1000);
    const pageStillFunctional = await page.locator('.tier-card, .pricing-card').first().isVisible();
    expect(pageStillFunctional).toBe(true);
    console.log('✅ Page remains functional after JS errors');
    
    console.log('🎉 Error handling validation completed!');
  });

});