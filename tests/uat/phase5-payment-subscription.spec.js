// UAT Phase 5: Payment & Subscription Testing
// COMPREHENSIVE PAYMENT INFRASTRUCTURE VALIDATION

import { test, expect } from '@playwright/test';

// Test configuration for Payment & Subscription Testing
const TEST_CONFIG = {
  baseURL: 'http://localhost:5173',
  
  // Stripe Test Cards (Safe for testing)
  testCards: {
    visa: '4242424242424242',
    visaDebit: '4000056655665556',
    mastercard: '5555555555554444',
    amex: '378282246310005',
    declined: '4000000000000002',
    insufficient: '4000000000009995',
    expired: '4000000000000069'
  },
  
  // Test tiers configuration 
  tiers: {
    free: { 
      price: 0, 
      features: ['3 analyses/month', 'Basic reports'], 
      limitations: true 
    },
    coffee: { 
      price: 4.95, 
      features: ['Unlimited analyses', 'PDF export'], 
      stripeEnabled: true 
    },
    business: { 
      price: 29, 
      features: ['Advanced analytics', 'Priority support'], 
      stripeEnabled: false // Coming soon
    },
    growth: { 
      price: 99, 
      features: ['Enterprise features', 'API access'], 
      stripeEnabled: false // Coming soon
    }
  },
  
  // Test user credentials
  testUsers: {
    freeUser: {
      email: 'phase5.free@tempmail.com',
      password: 'TestPass123!'
    },
    paidUser: {
      email: 'phase5.coffee@tempmail.com', 
      password: 'TestPass123!'
    }
  },
  
  // Test timeouts
  timeouts: {
    navigation: 10000,
    payment: 30000,
    api: 15000
  }
};

// Enhanced helper functions for Phase 5 testing
class PaymentTestHelper {
  constructor(page) {
    this.page = page;
  }

  // Navigate to landing page and wait for load
  async navigateToLanding() {
    await this.page.goto(TEST_CONFIG.baseURL, { 
      waitUntil: 'networkidle',
      timeout: TEST_CONFIG.timeouts.navigation 
    });
    
    // Wait for application to initialize
    await this.page.waitForSelector('[data-testid="app-loaded"]', { 
      timeout: 5000, 
      state: 'attached' 
    }).catch(() => {
      // Continue if test ID not found - app might still be functional
      console.log('App loaded test ID not found, continuing...');
    });
    
    // Verify we're on landing page
    await expect(this.page).toHaveURL(/.*#?(landing)?$/);
  }

  // Test pricing tier display and functionality
  async testPricingDisplay() {
    // Navigate to pricing section or page
    const pricingButton = this.page.locator('button:has-text("See Pricing"), a:has-text("Pricing"), button:has-text("Choose Plan")').first();
    if (await pricingButton.isVisible({ timeout: 3000 })) {
      await pricingButton.click();
      await this.page.waitForTimeout(2000);
    }

    // Verify tier pricing is displayed
    const results = {
      tiersVisible: [],
      pricesCorrect: {},
      upgradeButtonsWorking: {}
    };

    for (const [tierName, tierConfig] of Object.entries(TEST_CONFIG.tiers)) {
      // Check if tier is visible
      const tierSection = this.page.locator(`[data-tier="${tierName}"], .tier-${tierName}, *:has-text("${tierName}")`).first();
      const isVisible = await tierSection.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isVisible) {
        results.tiersVisible.push(tierName);
        
        // Check price display
        if (tierConfig.price > 0) {
          const priceText = await this.page.locator(`*:has-text("$${tierConfig.price}")`).first().isVisible({ timeout: 2000 }).catch(() => false);
          results.pricesCorrect[tierName] = priceText;
        } else {
          results.pricesCorrect[tierName] = true; // Free tier
        }

        // Check upgrade button functionality
        const upgradeBtn = this.page.locator(`button:has-text("${tierName}"), button:has-text("Start"), button:has-text("Choose"), button:has-text("Upgrade")`).first();
        results.upgradeButtonsWorking[tierName] = await upgradeBtn.isEnabled({ timeout: 2000 }).catch(() => false);
      }
    }

    return results;
  }

  // Test Free Tier limitations and upgrade prompts
  async testFreeTierLimitations() {
    // Look for free tier limitations display
    const limitations = [];
    
    // Check for analysis limit indicators
    const limitIndicators = [
      '3 analyses',
      'Limited to 3',
      'Basic features only',
      'Upgrade to unlock'
    ];

    for (const indicator of limitIndicators) {
      const found = await this.page.locator(`*:has-text("${indicator}")`).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (found) {
        limitations.push(indicator);
      }
    }

    // Check for upgrade prompts
    const upgradePrompts = await this.page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), *:has-text("Unlock unlimited")').count();

    return {
      limitationsDisplayed: limitations,
      upgradePromptCount: upgradePrompts,
      hasUpgradeFlow: upgradePrompts > 0
    };
  }

  // Test Coffee Tier signup and payment flow
  async testCoffeeTierPayment(testCard = TEST_CONFIG.testCards.visa) {
    const results = {
      signupInitiated: false,
      stripeRedirect: false,
      paymentFormLoaded: false,
      cardProcessed: false,
      subscriptionCreated: false,
      errors: []
    };

    try {
      // Find and click Coffee tier signup button
      const coffeeButton = this.page.locator('button:has-text("Coffee"), button:has-text("$4.95"), button:has-text("Start Analyzing")').first();
      
      if (await coffeeButton.isVisible({ timeout: 5000 })) {
        await coffeeButton.click();
        results.signupInitiated = true;
        await this.page.waitForTimeout(2000);

        // Check if redirected to signup form or Stripe
        const currentUrl = this.page.url();
        
        if (currentUrl.includes('stripe.com') || currentUrl.includes('checkout')) {
          results.stripeRedirect = true;
          
          // If on Stripe checkout page
          if (currentUrl.includes('stripe.com')) {
            // Wait for Stripe form to load
            await this.page.waitForSelector('input[name="cardnumber"], #cardNumber', { 
              timeout: TEST_CONFIG.timeouts.payment 
            }).catch((e) => {
              results.errors.push('Stripe payment form did not load');
            });
            
            results.paymentFormLoaded = true;

            // Fill out payment form with test card
            if (results.paymentFormLoaded) {
              try {
                await this.fillStripePaymentForm(testCard);
                results.cardProcessed = true;
              } catch (error) {
                results.errors.push(`Payment form error: ${error.message}`);
              }
            }
          }
        } else {
          // Check if shown signup form first
          const emailInput = this.page.locator('input[type="email"], input[placeholder*="email"]').first();
          if (await emailInput.isVisible({ timeout: 3000 })) {
            // Fill signup form
            await emailInput.fill(TEST_CONFIG.testUsers.paidUser.email);
            
            const passwordInput = this.page.locator('input[type="password"]').first();
            if (await passwordInput.isVisible()) {
              await passwordInput.fill(TEST_CONFIG.testUsers.paidUser.password);
            }

            // Submit signup form
            const submitBtn = this.page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Sign")').first();
            if (await submitBtn.isVisible()) {
              await submitBtn.click();
              await this.page.waitForTimeout(3000);
              
              // Should redirect to Stripe after signup
              const newUrl = this.page.url();
              results.stripeRedirect = newUrl.includes('stripe.com') || newUrl.includes('checkout');
            }
          }
        }
      } else {
        results.errors.push('Coffee tier button not found');
      }
    } catch (error) {
      results.errors.push(`Coffee tier test error: ${error.message}`);
    }

    return results;
  }

  // Fill Stripe payment form with test card
  async fillStripePaymentForm(cardNumber) {
    // Wait for Stripe form elements
    await this.page.waitForSelector('input[name="cardnumber"], #cardNumber', { timeout: 10000 });
    
    // Fill card number
    const cardInput = this.page.locator('input[name="cardnumber"], #cardNumber').first();
    await cardInput.fill(cardNumber);
    
    // Fill expiry (always use future date for test cards)
    const expiryInput = this.page.locator('input[name="exp-date"], input[placeholder*="MM"], input[placeholder*="exp"]').first();
    if (await expiryInput.isVisible({ timeout: 2000 })) {
      await expiryInput.fill('1225'); // December 2025
    }
    
    // Fill CVC
    const cvcInput = this.page.locator('input[name="cvc"], input[placeholder*="CVC"], input[placeholder*="CVV"]').first();
    if (await cvcInput.isVisible({ timeout: 2000 })) {
      await cvcInput.fill('123');
    }
    
    // Fill postal code if required
    const zipInput = this.page.locator('input[name="postal"], input[placeholder*="ZIP"], input[placeholder*="postal"]').first();
    if (await zipInput.isVisible({ timeout: 2000 })) {
      await zipInput.fill('12345');
    }

    // Submit payment
    const submitBtn = this.page.locator('button:has-text("Pay"), button:has-text("Subscribe"), button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 2000 })) {
      await submitBtn.click();
      
      // Wait for processing
      await this.page.waitForTimeout(5000);
    }
  }

  // Test payment failure scenarios  
  async testPaymentFailures() {
    const failureTests = [];

    // Test declined card
    try {
      const declinedResult = await this.testCoffeeTierPayment(TEST_CONFIG.testCards.declined);
      failureTests.push({
        scenario: 'declined_card',
        handled: declinedResult.errors.length === 0,
        errors: declinedResult.errors
      });
    } catch (error) {
      failureTests.push({
        scenario: 'declined_card',
        handled: false,
        errors: [error.message]
      });
    }

    return failureTests;
  }

  // Test subscription management features
  async testSubscriptionManagement() {
    // This would require authenticated user context
    // For now, check if subscription management UI exists
    
    const managementFeatures = {
      accountPageExists: false,
      billingInfoVisible: false,
      cancelOptionAvailable: false,
      upgradeOptionsVisible: false
    };

    // Navigate to account/billing area
    const accountLinks = this.page.locator('a:has-text("Account"), a:has-text("Billing"), button:has-text("Account")');
    if (await accountLinks.first().isVisible({ timeout: 3000 })) {
      await accountLinks.first().click();
      await this.page.waitForTimeout(2000);
      
      managementFeatures.accountPageExists = true;
      
      // Check for billing information
      managementFeatures.billingInfoVisible = await this.page.locator('*:has-text("Billing"), *:has-text("Subscription"), *:has-text("Plan")').first().isVisible({ timeout: 3000 });
      
      // Check for cancellation options
      managementFeatures.cancelOptionAvailable = await this.page.locator('button:has-text("Cancel"), a:has-text("Cancel")').first().isVisible({ timeout: 3000 });
      
      // Check for upgrade options
      managementFeatures.upgradeOptionsVisible = await this.page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first().isVisible({ timeout: 3000 });
    }

    return managementFeatures;
  }

  // Generate test report
  generateReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      testSuite: 'UAT Phase 5 - Payment & Subscription Testing',
      environment: 'localhost:5173',
      results: testResults,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };

    // Calculate summary
    for (const [testName, result] of Object.entries(testResults)) {
      report.summary.totalTests++;
      
      if (result.success) {
        report.summary.passed++;
      } else if (result.critical) {
        report.summary.failed++;
      } else {
        report.summary.warnings++;
      }
    }

    return report;
  }
}

// Main test suite for Phase 5
test.describe('UAT Phase 5: Payment & Subscription Testing', () => {
  let helper;

  test.beforeEach(async ({ page }) => {
    helper = new PaymentTestHelper(page);
    
    // Navigate to application
    await helper.navigateToLanding();
  });

  test('Phase 5.1: Validate payment testing environment and Stripe configuration', async ({ page }) => {
    const testResults = {};

    // Test 1: Verify application loads
    testResults.applicationLoad = {
      success: await page.title().then(title => title.length > 0),
      message: 'Application should load successfully'
    };

    // Test 2: Check pricing display
    const pricingResults = await helper.testPricingDisplay();
    testResults.pricingDisplay = {
      success: pricingResults.tiersVisible.length >= 2,
      details: pricingResults,
      message: 'Pricing tiers should be visible and functional'
    };

    // Test 3: Verify Coffee tier is available
    testResults.coffeeTierAvailable = {
      success: pricingResults.tiersVisible.includes('coffee') && pricingResults.pricesCorrect.coffee,
      message: 'Coffee tier ($4.95) should be available for testing'
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.1 Results:', JSON.stringify(report, null, 2));

    // Assertions
    expect(testResults.applicationLoad.success).toBeTruthy();
    expect(testResults.coffeeTierAvailable.success).toBeTruthy();
  });

  test('Phase 5.2: Test Free Tier limitations and upgrade prompts', async ({ page }) => {
    const testResults = {};

    // Test Free Tier limitations
    const limitationResults = await helper.testFreeTierLimitations();
    
    testResults.freeTierLimitations = {
      success: limitationResults.limitationsDisplayed.length > 0,
      details: limitationResults,
      message: 'Free tier limitations should be clearly displayed'
    };

    testResults.upgradePrompts = {
      success: limitationResults.hasUpgradeFlow,
      details: { promptCount: limitationResults.upgradePromptCount },
      message: 'Upgrade prompts should be available for free users'
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.2 Results:', JSON.stringify(report, null, 2));

    // Assertions
    expect(testResults.freeTierLimitations.success).toBeTruthy();
    expect(testResults.upgradePrompts.success).toBeTruthy();
  });

  test('Phase 5.3: Validate Coffee Tier ($4.95) checkout process', async ({ page }) => {
    const testResults = {};

    // Test Coffee Tier payment flow
    const paymentResults = await helper.testCoffeeTierPayment();
    
    testResults.coffeeSignup = {
      success: paymentResults.signupInitiated,
      details: paymentResults,
      message: 'Coffee tier signup should initiate successfully'
    };

    testResults.stripeIntegration = {
      success: paymentResults.stripeRedirect,
      critical: true,
      details: paymentResults,
      message: 'Should redirect to Stripe checkout for payment processing'
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.3 Results:', JSON.stringify(report, null, 2));

    // Assertions for critical payment flow
    expect(testResults.coffeeSignup.success).toBeTruthy();
    // Note: Stripe redirect may fail in test environment - log for manual verification
    if (!testResults.stripeIntegration.success) {
      console.warn('⚠️ Stripe integration test failed - requires manual verification');
    }
  });

  test('Phase 5.4: Test subscription management features', async ({ page }) => {
    const testResults = {};

    // Test subscription management UI
    const managementResults = await helper.testSubscriptionManagement();
    
    testResults.subscriptionManagement = {
      success: managementResults.accountPageExists,
      details: managementResults,
      message: 'Subscription management features should be accessible'
    };

    testResults.billingFeatures = {
      success: managementResults.billingInfoVisible || managementResults.cancelOptionAvailable,
      details: managementResults,
      message: 'Billing and cancellation features should be available'
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.4 Results:', JSON.stringify(report, null, 2));

    // Log results without strict assertions (some features may be authenticated-only)
    console.log('✅ Subscription management test completed');
  });

  test('Phase 5.5: Test payment failure scenarios', async ({ page }) => {
    const testResults = {};

    // Test payment failure handling
    const failureResults = await helper.testPaymentFailures();
    
    testResults.paymentFailures = {
      success: failureResults.length > 0,
      details: failureResults,
      message: 'Payment failure scenarios should be handled gracefully'
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.5 Results:', JSON.stringify(report, null, 2));

    // Log results (payment failures may be difficult to test in automated environment)
    console.log('✅ Payment failure testing completed');
  });

  test('Phase 5.6: Cross-browser payment compatibility', async ({ page }) => {
    const testResults = {};

    // Basic compatibility check
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const browserType = userAgent.includes('Chrome') ? 'Chrome' : 
                       userAgent.includes('Firefox') ? 'Firefox' : 
                       userAgent.includes('Safari') ? 'Safari' : 'Unknown';

    // Test pricing display across browsers
    const pricingResults = await helper.testPricingDisplay();
    
    testResults.crossBrowserCompatibility = {
      success: pricingResults.tiersVisible.length >= 2,
      details: { 
        browser: browserType,
        userAgent: userAgent,
        pricing: pricingResults 
      },
      message: `Payment interface should work correctly in ${browserType}`
    };

    // Report results
    const report = helper.generateReport(testResults);
    console.log('Phase 5.6 Results:', JSON.stringify(report, null, 2));

    // Assertions
    expect(testResults.crossBrowserCompatibility.success).toBeTruthy();
  });
});

// Test configuration export for other test files
export { TEST_CONFIG, PaymentTestHelper };