// tests/setup/test-helpers.js - Common Test Helper Functions
import { expect } from '@playwright/test';

/**
 * Test Helper Functions for Phase 2 Authentication and Pricing Tests
 */

// Authentication helpers
export const AuthHelpers = {
  /**
   * Fill login form with provided credentials
   */
  async fillLoginForm(page, email, password, rememberMe = false) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    if (rememberMe) {
      await page.check('input[type="checkbox"]');
    }
  },

  /**
   * Fill registration form with provided details
   */
  async fillRegistrationForm(page, email, password, agreeToTerms = true) {
    await page.fill('input[type="email"]', email);
    await page.fill('input[placeholder*="Create a password"]', password);
    await page.fill('input[placeholder*="Confirm"]', password);
    
    if (agreeToTerms) {
      await page.check('input[type="checkbox"][required]');
    }
  },

  /**
   * Generate unique test email
   */
  generateTestEmail(prefix = 'test') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  },

  /**
   * Wait for authentication state change
   */
  async waitForAuthStateChange(page, timeout = 10000) {
    return page.waitForFunction(
      () => {
        // Check for auth state indicators
        return document.querySelector('[data-testid="user-menu"]') || 
               document.querySelector('text="Dashboard"') ||
               document.querySelector('text="Sign In"');
      },
      { timeout }
    );
  },

  /**
   * Mock Supabase authentication responses
   */
  async mockAuthSuccess(page, userEmail) {
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh',
          user: {
            id: 'mock_user_id',
            email: userEmail,
            confirmed_at: new Date().toISOString(),
          }
        })
      });
    });
  },

  async mockAuthError(page, errorMessage = 'Invalid login credentials') {
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error_description: errorMessage
        })
      });
    });
  }
};

// Pricing component helpers
export const PricingHelpers = {
  /**
   * Get all visible pricing tiers
   */
  async getPricingTiers(page) {
    return page.locator('[data-testid="pricing-card"], .rounded-2xl:has(h3)').all();
  },

  /**
   * Select billing cycle (monthly/annual)
   */
  async selectBillingCycle(page, cycle = 'monthly') {
    const selector = cycle === 'monthly' ? 'text=Monthly' : 'text=Annual';
    await page.click(selector);
    await page.waitForTimeout(500); // Wait for price updates
  },

  /**
   * Select currency
   */
  async selectCurrency(page, currency = 'USD') {
    await page.selectOption('select', currency);
    await page.waitForTimeout(500);
  },

  /**
   * Get price for specific tier
   */
  async getTierPrice(page, tierName) {
    const tier = page.locator(`text=${tierName}`).locator('..').locator('..');
    const priceElement = tier.locator('span').filter({ hasText: /\$|€|£/ }).first();
    return priceElement.textContent();
  },

  /**
   * Click upgrade button for specific tier
   */
  async upgradeTo(page, tierName) {
    const tier = page.locator(`text=${tierName}`).locator('..').locator('..');
    await tier.locator('button').click();
  }
};

// Form validation helpers
export const ValidationHelpers = {
  /**
   * Check password strength indicators
   */
  async checkPasswordStrength(page, expectedStrength) {
    const strengthText = page.locator('text=Password Strength:').locator('..').locator('span').last();
    await expect(strengthText).toContainText(expectedStrength);
  },

  /**
   * Verify password requirements
   */
  async verifyPasswordRequirements(page, expectedMet = []) {
    const requirements = [
      'At least 8 characters',
      'At least one number',
      'At least one special character',
      'At least one lowercase letter',
      'At least one uppercase letter'
    ];

    for (const [index, requirement] of requirements.entries()) {
      const requirementElement = page.locator(`text=${requirement}`);
      
      if (expectedMet.includes(index)) {
        await expect(requirementElement).toHaveClass(/text-green-600/);
      } else {
        await expect(requirementElement).toHaveClass(/text-gray-500/);
      }
    }
  },

  /**
   * Check form validation message
   */
  async expectValidationMessage(page, message) {
    await expect(page.locator('.text-white').filter({ hasText: message })).toBeVisible();
  }
};

// Registration flow helpers
export const RegistrationFlowHelpers = {
  /**
   * Complete tier selection step
   */
  async selectTier(page, tierName) {
    await page.click(`text=${tierName}`);
    await page.waitForLoadState('networkidle');
  },

  /**
   * Mock Stripe checkout session creation
   */
  async mockStripeCheckout(page, tier = 'professional') {
    await page.route('**/create-checkout-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          url: `https://checkout.stripe.com/test-${tier}`,
          sessionId: `cs_test_${Date.now()}`
        })
      });
    });
  },

  /**
   * Mock Stripe payment success
   */
  async mockPaymentSuccess(page, sessionId, customerEmail, tier) {
    await page.route('**/get-checkout-session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          customer_email: customerEmail,
          customer_name: customerEmail.split('@')[0],
          tier: tier,
          customer_id: `cus_test_${Date.now()}`,
          payment_status: 'paid'
        })
      });
    });
  },

  /**
   * Navigate through registration steps
   */
  async navigateRegistrationFlow(page, tier = 'free', userEmail = null) {
    const email = userEmail || AuthHelpers.generateTestEmail();
    
    // Step 1: Select tier
    await this.selectTier(page, tier);
    
    if (tier !== 'free') {
      // Step 2: Confirm tier (for paid plans)
      await expect(page.locator('text=Confirm Your Selection')).toBeVisible();
      
      // Mock payment flow
      await this.mockStripeCheckout(page, tier);
      await page.click('text=Continue to Payment');
      
      // Mock return from successful payment
      await this.mockPaymentSuccess(page, 'cs_test_123', email, tier);
      await page.goto(`${page.url()}?payment=success&session_id=cs_test_123`);
    }
    
    // Step 3: Registration form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await AuthHelpers.fillRegistrationForm(page, email, 'TestPassword123!');
    
    return email;
  }
};

// Performance testing helpers
export const PerformanceHelpers = {
  /**
   * Measure page load time
   */
  async measurePageLoad(page, url) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  },

  /**
   * Measure form interaction responsiveness
   */
  async measureFormResponsiveness(page, formActions) {
    const startTime = Date.now();
    
    for (const action of formActions) {
      await action();
    }
    
    return Date.now() - startTime;
  },

  /**
   * Check for performance issues
   */
  async checkPerformanceIssues(page) {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      };
    });
    
    return performanceMetrics;
  }
};

// Mobile testing helpers
export const MobileHelpers = {
  /**
   * Set mobile viewport
   */
  async setMobileViewport(page, device = 'iPhone 12') {
    const viewports = {
      'iPhone 12': { width: 390, height: 844 },
      'iPhone SE': { width: 375, height: 667 },
      'Pixel 5': { width: 393, height: 851 },
      'Samsung Galaxy': { width: 360, height: 740 }
    };
    
    await page.setViewportSize(viewports[device] || viewports['iPhone 12']);
  },

  /**
   * Test responsive behavior
   */
  async testResponsiveLayout(page, breakpoints = ['mobile', 'tablet', 'desktop']) {
    const viewportSizes = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1200, height: 800 }
    };

    for (const breakpoint of breakpoints) {
      await page.setViewportSize(viewportSizes[breakpoint]);
      await page.waitForTimeout(100); // Allow layout to settle
      
      // Take screenshot for visual comparison if needed
      // await page.screenshot({ path: `screenshots/${breakpoint}.png` });
    }
  },

  /**
   * Check touch-friendly elements
   */
  async verifyTouchTargets(page) {
    const buttons = await page.locator('button, input[type="submit"], input[type="button"], a').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // Check minimum touch target size (44x44px recommended)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  }
};

// Accessibility helpers
export const AccessibilityHelpers = {
  /**
   * Check basic accessibility requirements
   */
  async checkBasicA11y(page) {
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      await expect(img).toHaveAttribute('alt');
    }
    
    // Check for form labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const hasLabel = inputId && await page.locator(`label[for="${inputId}"]`).count() > 0;
      const hasAriaLabel = await input.getAttribute('aria-label');
      const hasPlaceholder = await input.getAttribute('placeholder');
      
      expect(hasLabel || hasAriaLabel || hasPlaceholder).toBeTruthy();
    }
  },

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(page, expectedFocusOrder = []) {
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < expectedFocusOrder.length; i++) {
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      if (expectedFocusOrder[i]) {
        await expect(focusedElement).toMatch(expectedFocusOrder[i]);
      }
      
      if (i < expectedFocusOrder.length - 1) {
        await page.keyboard.press('Tab');
      }
    }
  }
};

// Export all helpers as default
export default {
  AuthHelpers,
  PricingHelpers,
  ValidationHelpers,
  RegistrationFlowHelpers,
  PerformanceHelpers,
  MobileHelpers,
  AccessibilityHelpers
};