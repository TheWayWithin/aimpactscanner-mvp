// tier-setup-validation.spec.js - Quick Setup Validation for Tier Testing System
// Validates that all testing components are properly configured

import { test, expect } from '@playwright/test';
import { TempEmailUtils } from '../utils/temp-email-utils.js';
import { TIER_DEFINITIONS, TIER_TEST_CONFIG } from '../setup/tier-test-config.js';
import { TierTestUtils } from '../utils/tier-test-utils.js';

/**
 * TIER TESTING SETUP VALIDATION
 * 
 * Quick validation suite to ensure all tier testing components
 * are properly configured and functional before running full tests.
 */

test.describe('Tier Testing Setup Validation', () => {
  
  test('Validate Test Configuration and Environment', async ({ page }) => {
    console.log('🔍 Validating tier test configuration...');
    
    // Check configuration objects
    expect(TIER_DEFINITIONS).toBeDefined();
    expect(TIER_TEST_CONFIG).toBeDefined();
    
    // Validate all required tiers are defined
    const requiredTiers = ['FREE', 'COFFEE', 'GROWTH', 'SCALE'];
    for (const tier of requiredTiers) {
      expect(TIER_DEFINITIONS[tier]).toBeDefined();
      console.log(`✅ ${tier} tier configuration found`);
    }
    
    // Check environment variables
    const baseUrl = TIER_TEST_CONFIG.BASE_URL;
    expect(baseUrl).toBeTruthy();
    console.log(`✅ Base URL configured: ${baseUrl}`);
    
    console.log('🎉 Configuration validation passed!');
  });

  test('Validate Pricing Page Accessibility', async ({ page }) => {
    console.log('🌐 Testing pricing page accessibility...');
    
    // Navigate to pricing page
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✅ Page title: ${title}`);
    
    // Validate pricing page elements
    const pricingIndicators = [
      'text=Pricing',
      'text=Choose Your Plan', 
      'text=Free',
      'text=Coffee',
      '.pricing-page',
      '.tier-card',
      '[data-tier]'
    ];
    
    let foundIndicator = false;
    for (const selector of pricingIndicators) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        foundIndicator = true;
        console.log(`✅ Pricing page element found: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    expect(foundIndicator).toBe(true);
    console.log('🎉 Pricing page accessibility validated!');
  });

  test('Validate Email Utilities Integration', async ({ page }) => {
    console.log('📧 Testing email utilities integration...');
    
    // Create temp email utils instance
    const tempEmailUtils = new TempEmailUtils(page);
    expect(tempEmailUtils).toBeDefined();
    console.log('✅ TempEmailUtils instance created');
    
    // Test email generation capability (don't actually generate)
    expect(tempEmailUtils.generateTempEmail).toBeDefined();
    expect(tempEmailUtils.waitForMagicLink).toBeDefined();
    expect(tempEmailUtils.handleMagicLinkAuth).toBeDefined();
    console.log('✅ Email utilities methods available');
    
    // Validate current email state
    expect(tempEmailUtils.getCurrentEmail()).toBeNull();
    expect(tempEmailUtils.isReady()).toBe(false);
    console.log('✅ Email utilities in expected initial state');
    
    // Test cleanup
    await tempEmailUtils.cleanup();
    console.log('✅ Email utilities cleanup works');
    
    console.log('🎉 Email utilities validation passed!');
  });

  test('Validate Tier Test Utils Integration', async ({ page }) => {
    console.log('🛠️ Testing tier utilities integration...');
    
    // Create tier test utils instance
    const tierUtils = new TierTestUtils(page, page.context());
    expect(tierUtils).toBeDefined();
    console.log('✅ TierTestUtils instance created');
    
    // Validate method availability
    expect(tierUtils.navigateToPricingPage).toBeDefined();
    expect(tierUtils.executeCompleteSignupFlow).toBeDefined();
    expect(tierUtils.validateFinalUserState).toBeDefined();
    expect(tierUtils.cleanup).toBeDefined();
    console.log('✅ Tier utilities methods available');
    
    // Test performance metrics initialization
    const perfSummary = tierUtils.getPerformanceSummary();
    expect(perfSummary).toBeDefined();
    console.log('✅ Performance tracking initialized');
    
    // Test cleanup
    await tierUtils.cleanup();
    console.log('✅ Tier utilities cleanup works');
    
    console.log('🎉 Tier utilities validation passed!');
  });

  test('Validate Tier Card Visibility', async ({ page }) => {
    console.log('🎯 Testing tier card visibility...');
    
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    // Test each tier card visibility
    let visibleTiers = 0;
    
    for (const [tierKey, tierConfig] of Object.entries(TIER_DEFINITIONS)) {
      try {
        const tierCard = page.locator(tierConfig.testSelectors.tierCard).first();
        await expect(tierCard).toBeVisible({ timeout: 5000 });
        
        // Check price display
        const priceVisible = await page.locator(`:text("${tierConfig.price}")`).isVisible({ timeout: 3000 });
        
        console.log(`✅ ${tierKey} tier card visible (price: ${priceVisible ? 'shown' : 'not shown'})`);
        visibleTiers++;
        
      } catch (error) {
        console.log(`⚠️ ${tierKey} tier card not found: ${error.message}`);
      }
    }
    
    expect(visibleTiers).toBeGreaterThanOrEqual(2); // At least FREE and COFFEE should be visible
    console.log(`🎉 Tier card validation passed! (${visibleTiers}/4 tiers visible)`);
  });

  test('Validate Responsive Design', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check that pricing content is still visible
      const pricingContent = await page.locator('.tier-card, .pricing-card, [data-tier]').first().isVisible();
      
      expect(pricingContent).toBe(true);
      console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) layout working`);
    }
    
    console.log('🎉 Responsive design validation passed!');
  });

  test('Validate Form Elements Accessibility', async ({ page }) => {
    console.log('📝 Testing form elements accessibility...');
    
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    // Try to find and click a signup button
    const signupButtons = [
      '[data-tier="FREE"] button',
      '.tier-free .signup-button',
      'button:has-text("Get Started")',
      'button:has-text("Sign Up")',
      'button:has-text("Choose Plan")'
    ];
    
    let foundSignupButton = false;
    for (const selector of signupButtons) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 })) {
          await button.click();
          foundSignupButton = true;
          console.log(`✅ Signup button found and clickable: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (foundSignupButton) {
      // Check if email form appears
      const emailForm = await page.locator('input[type="email"], #email').isVisible({ timeout: 5000 });
      if (emailForm) {
        console.log('✅ Email form accessible after signup click');
      } else {
        console.log('⚠️ Email form not immediately visible (may require navigation)');
      }
    } else {
      console.log('⚠️ No signup buttons found - may require manual investigation');
    }
    
    console.log('🎉 Form accessibility validation completed!');
  });

  test('Validate Network Configuration', async ({ page }) => {
    console.log('🌐 Testing network configuration...');
    
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    // Check for essential requests
    const hasStyleRequests = requests.some(url => url.includes('.css') || url.includes('style'));
    const hasScriptRequests = requests.some(url => url.includes('.js') || url.includes('script'));
    
    console.log(`✅ Network requests captured: ${requests.length}`);
    console.log(`✅ Style requests: ${hasStyleRequests ? 'found' : 'none'}`);
    console.log(`✅ Script requests: ${hasScriptRequests ? 'found' : 'none'}`);
    
    // Check for errors in console
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait a moment for any console errors
    await page.waitForTimeout(2000);
    
    if (consoleLogs.length > 0) {
      console.log(`⚠️ Console errors detected: ${consoleLogs.length}`);
      consoleLogs.forEach(log => console.log(`   - ${log}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    console.log('🎉 Network configuration validation completed!');
  });

});

// Quick validation for CI/automated testing
test.describe('Quick Validation Suite', () => {
  
  test('Quick Health Check', async ({ page }) => {
    console.log('⚡ Running quick health check...');
    
    // Navigate to pricing page
    await page.goto(`${TIER_TEST_CONFIG.BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    // Basic checks
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    
    const hasContent = await page.locator('body').textContent();
    expect(hasContent.length).toBeGreaterThan(100);
    
    const hasPricingElements = await page.locator('text=Free, text=Coffee, text=Pricing, .tier').isVisible({ timeout: 10000 });
    expect(hasPricingElements).toBe(true);
    
    console.log('✅ Quick health check passed!');
  });
  
});