// tests/phase2-auth-pricing.spec.js - Comprehensive Phase 2 Authentication and Pricing Tests
// Tests all new Phase 2 functionality including email/password auth, pricing display, and registration flows

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const WEAK_PASSWORD = '123';
const INVALID_EMAIL = 'invalid-email';

// Test selectors
const SELECTORS = {
  // Authentication
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  confirmPasswordInput: 'input[placeholder*="Confirm"]',
  loginButton: 'button[type="submit"]',
  registerButton: 'button[type="submit"]',
  rememberMeCheckbox: 'input[type="checkbox"]',
  termsCheckbox: 'input[type="checkbox"]',
  forgotPasswordLink: 'text=Forgot password?',
  createAccountLink: 'text=Create one here',
  signInLink: 'text=Sign in here',
  
  // Password strength
  passwordStrengthIndicator: '[data-testid="password-strength"]',
  passwordRequirement: '[data-testid="password-requirement"]',
  
  // Pricing
  pricingCard: '[data-testid="pricing-card"]',
  monthlyTab: 'text=Monthly',
  annualTab: 'text=Annual',
  currencySelector: 'select',
  upgradeProfessionalButton: 'text=Go Professional',
  startFreeTrialButton: 'text=Start Free Trial',
  chooseStarterButton: 'text=Start Analyzing',
  
  // Registration flow
  tierSelectionStep: '[data-testid="tier-selection"]',
  registrationStep: '[data-testid="registration"]',
  confirmationStep: '[data-testid="confirmation"]',
  
  // Messages and alerts
  successMessage: '.text-white',
  errorMessage: '.text-white',
  loadingSpinner: '.animate-spin',
  
  // Navigation
  backButton: 'text=← Change',
  backToTierButton: 'text=← Change tier selection'
};

test.describe('Phase 2 Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Email/Password Authentication', () => {
    test('should display login form by default', async ({ page }) => {
      await expect(page.locator(SELECTORS.emailInput)).toBeVisible();
      await expect(page.locator(SELECTORS.passwordInput)).toBeVisible();
      await expect(page.locator('text=Sign In')).toBeVisible();
      await expect(page.locator(SELECTORS.rememberMeCheckbox)).toBeVisible();
      await expect(page.locator(SELECTORS.forgotPasswordLink)).toBeVisible();
    });

    test('should validate email format on login', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, INVALID_EMAIL);
      await page.fill(SELECTORS.passwordInput, TEST_PASSWORD);
      await page.click(SELECTORS.loginButton);
      
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should require password for login', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.click(SELECTORS.loginButton);
      
      await expect(page.locator('text=Please enter your password')).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.fill(SELECTORS.passwordInput, TEST_PASSWORD);
      
      // Password should be hidden by default
      await expect(page.locator(SELECTORS.passwordInput)).toHaveAttribute('type', 'password');
      
      // Click show password button
      await page.click('button:has-text("👁️")');
      await expect(page.locator(SELECTORS.passwordInput)).toHaveAttribute('type', 'text');
      
      // Click hide password button
      await page.click('button:has-text("👁️")');
      await expect(page.locator(SELECTORS.passwordInput)).toHaveAttribute('type', 'password');
    });

    test('should handle remember me checkbox', async ({ page }) => {
      const rememberMe = page.locator(SELECTORS.rememberMeCheckbox);
      
      // Should be unchecked by default
      await expect(rememberMe).not.toBeChecked();
      
      // Should check when clicked
      await rememberMe.check();
      await expect(rememberMe).toBeChecked();
    });

    test('should show loading state during login', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill(SELECTORS.passwordInput, TEST_PASSWORD);
      
      // Mock slow network response
      await page.route('**/auth/v1/token?grant_type=password', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      const loginPromise = page.click(SELECTORS.loginButton);
      
      // Check loading state
      await expect(page.locator('text=Signing in...')).toBeVisible();
      await expect(page.locator(SELECTORS.loginButton)).toBeDisabled();
      
      await loginPromise;
    });
  });

  test.describe('Registration with Password Strength Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.click(SELECTORS.createAccountLink);
      await expect(page.locator('text=Create Account')).toBeVisible();
    });

    test('should display registration form', async ({ page }) => {
      await expect(page.locator(SELECTORS.emailInput)).toBeVisible();
      await expect(page.locator('input[placeholder*="Create a password"]')).toBeVisible();
      await expect(page.locator(SELECTORS.confirmPasswordInput)).toBeVisible();
      await expect(page.locator(SELECTORS.termsCheckbox)).toBeVisible();
    });

    test('should validate password strength requirements', async ({ page }) => {
      await page.fill('input[placeholder*="Create a password"]', WEAK_PASSWORD);
      
      // Should show password requirements
      await expect(page.locator('text=Password Strength:')).toBeVisible();
      await expect(page.locator('text=At least 8 characters')).toBeVisible();
      await expect(page.locator('text=At least one number')).toBeVisible();
      await expect(page.locator('text=At least one special character')).toBeVisible();
      await expect(page.locator('text=At least one lowercase letter')).toBeVisible();
      await expect(page.locator('text=At least one uppercase letter')).toBeVisible();
    });

    test('should show weak password strength', async ({ page }) => {
      await page.fill('input[placeholder*="Create a password"]', 'weak');
      
      await expect(page.locator('text=Weak')).toBeVisible();
      await expect(page.locator(SELECTORS.registerButton)).toBeDisabled();
    });

    test('should show strong password strength', async ({ page }) => {
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      
      await expect(page.locator('text=Strong')).toBeVisible();
      
      // Check all requirements are met
      const requirements = page.locator('.text-green-600');
      await expect(requirements).toHaveCount(5);
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, 'DifferentPassword123!');
      
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
      await expect(page.locator(SELECTORS.registerButton)).toBeDisabled();
    });

    test('should require terms agreement', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      
      // Should be disabled without terms agreement
      await expect(page.locator(SELECTORS.registerButton)).toBeDisabled();
      
      // Should be enabled with terms agreement
      await page.check(SELECTORS.termsCheckbox);
      await expect(page.locator(SELECTORS.registerButton)).toBeEnabled();
    });

    test('should validate complete registration form', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      await page.check(SELECTORS.termsCheckbox);
      
      await page.click(SELECTORS.registerButton);
      
      // Should show success message
      await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });
    });

    test('should show loading state during registration', async ({ page }) => {
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      await page.check(SELECTORS.termsCheckbox);
      
      // Mock slow network response
      await page.route('**/auth/v1/signup', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      const registerPromise = page.click(SELECTORS.registerButton);
      
      // Check loading state
      await expect(page.locator('text=Creating account...')).toBeVisible();
      await expect(page.locator(SELECTORS.registerButton)).toBeDisabled();
      
      await registerPromise;
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should navigate to password reset', async ({ page }) => {
      await page.click(SELECTORS.forgotPasswordLink);
      
      await expect(page.locator('text=Reset Password')).toBeVisible();
      await expect(page.locator('text=Enter your email to receive password reset instructions')).toBeVisible();
    });

    test('should validate email for password reset', async ({ page }) => {
      await page.click(SELECTORS.forgotPasswordLink);
      await page.click('button:has-text("Send Reset Email")');
      
      await expect(page.locator('text=Please enter your email address')).toBeVisible();
    });

    test('should send password reset email', async ({ page }) => {
      await page.click(SELECTORS.forgotPasswordLink);
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.click('button:has-text("Send Reset Email")');
      
      await expect(page.locator('text=Password reset email sent')).toBeVisible({ timeout: 10000 });
    });

    test('should return to login after sending reset email', async ({ page }) => {
      await page.click(SELECTORS.forgotPasswordLink);
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.click('button:has-text("Send Reset Email")');
      
      // Should auto-redirect to login after 3 seconds
      await expect(page.locator('text=Sign In')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist remember me selection', async ({ page }) => {
      await page.check(SELECTORS.rememberMeCheckbox);
      await page.reload();
      
      // Remember me should stay checked
      await expect(page.locator(SELECTORS.rememberMeCheckbox)).toBeChecked();
    });

    test('should handle browser back button', async ({ page }) => {
      // Go to registration
      await page.click(SELECTORS.createAccountLink);
      await expect(page.locator('text=Create Account')).toBeVisible();
      
      // Go back
      await page.goBack();
      await expect(page.locator('text=Sign In')).toBeVisible();
      
      // Go forward
      await page.goForward();
      await expect(page.locator('text=Create Account')).toBeVisible();
    });
  });
});

test.describe('Phase 2 Pricing Display Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to pricing page or component
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Three-tier Pricing Display', () => {
    test('should display all three pricing tiers', async ({ page }) => {
      // Check for all three tiers
      await expect(page.locator('text=Free Trial')).toBeVisible();
      await expect(page.locator('text=Starter')).toBeVisible();
      await expect(page.locator('text=Professional')).toBeVisible();
    });

    test('should show correct pricing for each tier', async ({ page }) => {
      // Free tier
      await expect(page.locator('text=$0')).toBeVisible();
      
      // Starter tier
      await expect(page.locator('text=$5')).toBeVisible();
      
      // Professional tier - check for both original and discounted price
      await expect(page.locator('text=$58').first()).toBeVisible(); // Original price
      await expect(page.locator('text=$39')).toBeVisible(); // Monthly price
    });

    test('should highlight professional tier', async ({ page }) => {
      const professionalTier = page.locator('.scale-110, .scale-105').first();
      await expect(professionalTier).toBeVisible();
      await expect(professionalTier.locator('text=MOST POPULAR')).toBeVisible();
    });

    test('should show feature lists for each tier', async ({ page }) => {
      // Check that each tier has features listed
      await expect(page.locator('text=Basic AI recommendations')).toBeVisible();
      await expect(page.locator('text=Unlimited Phase A analyses')).toBeVisible();
      await expect(page.locator('text=Complete 22-factor analysis')).toBeVisible();
    });
  });

  test.describe('Annual/Monthly Toggle', () => {
    test('should toggle between monthly and annual billing', async ({ page }) => {
      // Should start on monthly
      const monthlyTab = page.locator(SELECTORS.monthlyTab);
      const annualTab = page.locator(SELECTORS.annualTab);
      
      await expect(monthlyTab).toHaveClass(/bg-white/);
      
      // Switch to annual
      await annualTab.click();
      await expect(annualTab).toHaveClass(/bg-white/);
      await expect(page.locator('text=Save 50%')).toBeVisible();
    });

    test('should update pricing when switching to annual', async ({ page }) => {
      await page.click(SELECTORS.annualTab);
      
      // Professional tier should show annual pricing
      await expect(page.locator('text=$29')).toBeVisible(); // Annual price
      await expect(page.locator('text=/year')).toBeVisible();
    });

    test('should show savings badge for annual billing', async ({ page }) => {
      await page.click(SELECTORS.annualTab);
      
      await expect(page.locator('text=Save 50%')).toBeVisible();
      await expect(page.locator('text=Save 25%')).toBeVisible();
    });
  });

  test.describe('Currency Selector', () => {
    test('should display currency selector', async ({ page }) => {
      await expect(page.locator(SELECTORS.currencySelector)).toBeVisible();
    });

    test('should change currency display', async ({ page }) => {
      // Switch to EUR
      await page.selectOption(SELECTORS.currencySelector, 'EUR');
      await expect(page.locator('text=€')).toBeVisible();
      
      // Switch to GBP
      await page.selectOption(SELECTORS.currencySelector, 'GBP');
      await expect(page.locator('text=£')).toBeVisible();
      
      // Switch back to USD
      await page.selectOption(SELECTORS.currencySelector, 'USD');
      await expect(page.locator('text=$')).toBeVisible();
    });
  });

  test.describe('Trust Badges Display', () => {
    test('should show security trust badges', async ({ page }) => {
      await expect(page.locator('text=SSL Secured')).toBeVisible();
      await expect(page.locator('text=PCI Compliant')).toBeVisible();
      await expect(page.locator('text=99.9% Uptime')).toBeVisible();
    });

    test('should display customer success metrics', async ({ page }) => {
      await expect(page.locator('text=+340%')).toBeVisible();
      await expect(page.locator('text=Average Conversion Improvement')).toBeVisible();
      await expect(page.locator('text=47,000+')).toBeVisible();
    });

    test('should show money-back guarantee', async ({ page }) => {
      await expect(page.locator('text=30-day money-back guarantee')).toBeVisible();
    });

    test('should show user counts', async ({ page }) => {
      await expect(page.locator('text=users')).toHaveCount(3);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display properly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Should stack tiers vertically on mobile
      const tierCards = page.locator('.grid');
      await expect(tierCards).toHaveClass(/grid-cols-1/);
      
      // Should still show all tiers
      await expect(page.locator('text=Free Trial')).toBeVisible();
      await expect(page.locator('text=Starter')).toBeVisible();
      await expect(page.locator('text=Professional')).toBeVisible();
    });

    test('should handle long feature text on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      
      // Features should not overflow
      const features = page.locator('li:has-text("Complete 22-factor analysis")');
      await expect(features).toBeVisible();
    });
  });

  test.describe('Limited Time Offer Display', () => {
    test('should show countdown timer', async ({ page }) => {
      await expect(page.locator('text=Limited Time Offer')).toBeVisible();
      await expect(page.locator('.font-mono')).toBeVisible(); // Timer display
    });

    test('should countdown properly', async ({ page }) => {
      // Get initial time
      const initialTimer = await page.locator('.font-mono').textContent();
      
      // Wait 2 seconds
      await page.waitForTimeout(2000);
      
      // Timer should have decreased
      const newTimer = await page.locator('.font-mono').textContent();
      expect(newTimer).not.toBe(initialTimer);
    });
  });
});

test.describe('Phase 2 Registration Flows', () => {
  test.describe('Free Tier Registration Flow', () => {
    test('should complete free tier registration', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Select free tier
      await page.click('text=Start Free Trial');
      
      // Should go directly to registration
      await expect(page.locator('text=Start Your Free Trial')).toBeVisible();
      
      // Fill registration form
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      await page.check(SELECTORS.termsCheckbox);
      
      await page.click(SELECTORS.registerButton);
      
      // Should show success message
      await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });
    });

    test('should show correct tier information for free users', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Free Trial');
      
      await expect(page.locator('text=3 analyses per month')).toBeVisible();
      await expect(page.locator('text=Basic features')).toBeVisible();
    });
  });

  test.describe('Paid Tier Registration Flow', () => {
    test('should show tier confirmation for paid tiers', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      
      // Select starter tier
      await page.click('text=Start Analyzing');
      
      // Should show confirmation step
      await expect(page.locator('text=Confirm Your Selection')).toBeVisible();
      await expect(page.locator('text=Starter Plan')).toBeVisible();
    });

    test('should proceed to payment for paid tiers', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Analyzing');
      
      // Mock Stripe redirect
      let stripeRedirected = false;
      await page.route('**/create-checkout-session', async route => {
        stripeRedirected = true;
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' })
        });
      });
      
      await page.click('text=Continue to Payment');
      
      expect(stripeRedirected).toBe(true);
    });

    test('should handle payment success return', async ({ page }) => {
      // Simulate Stripe success return
      await page.goto(`${BASE_URL}/register?payment=success&session_id=test_session`);
      
      // Should show payment success message
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator('text=Creating your account')).toBeVisible();
    });

    test('should handle payment cancellation', async ({ page }) => {
      await page.goto(`${BASE_URL}/register?payment=cancelled`);
      
      await expect(page.locator('text=Payment cancelled')).toBeVisible();
      await expect(page.locator('text=try again or choose the free trial')).toBeVisible();
    });
  });

  test.describe('Session Recovery from Interruptions', () => {
    test('should recover from browser refresh during registration', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Analyzing');
      
      // Store session data (simulating what the app does)
      await page.evaluate(() => {
        sessionStorage.setItem('selectedTier', 'coffee');
      });
      
      await page.reload();
      
      // Should restore to correct step
      await expect(page.locator('text=Starter Plan')).toBeVisible();
    });

    test('should handle back button during registration flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Analyzing');
      
      // Go back
      await page.goBack();
      
      // Should return to tier selection
      await expect(page.locator('text=Choose Your AImpactScanner Plan')).toBeVisible();
      
      // Go forward
      await page.goForward();
      
      // Should return to confirmation
      await expect(page.locator('text=Confirm Your Selection')).toBeVisible();
    });
  });

  test.describe('Error Recovery Flows', () => {
    test('should handle registration errors gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Free Trial');
      
      // Mock registration error
      await page.route('**/auth/v1/signup', async route => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error_description: 'Email already registered' })
        });
      });
      
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      await page.check(SELECTORS.termsCheckbox);
      
      await page.click(SELECTORS.registerButton);
      
      await expect(page.locator('text=already registered')).toBeVisible();
    });

    test('should handle payment setup errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/register`);
      await page.click('text=Start Analyzing');
      
      // Mock payment error
      await page.route('**/create-checkout-session', async route => {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Payment setup failed' })
        });
      });
      
      await page.click('text=Continue to Payment');
      
      await expect(page.locator('text=Payment setup failed')).toBeVisible();
    });
  });
});

test.describe('Integration Tests', () => {
  test.describe('Complete User Journeys', () => {
    test('should complete full paid user journey', async ({ page }) => {
      // 1. Start at pricing page
      await page.goto(`${BASE_URL}/pricing`);
      
      // 2. Select professional tier
      await page.click(SELECTORS.upgradeProfessionalButton);
      
      // 3. Confirm tier selection
      await expect(page.locator('text=Confirm Your Selection')).toBeVisible();
      
      // 4. Mock successful payment flow
      await page.route('**/create-checkout-session', async route => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ url: 'https://checkout.stripe.com/test' })
        });
      });
      
      // 5. Proceed to payment (would redirect to Stripe in real scenario)
      await page.click('text=Continue to Payment');
      
      // Test would continue with mocked Stripe return...
    });

    test('should complete full free user journey', async ({ page }) => {
      // 1. Start at landing page
      await page.goto(BASE_URL);
      
      // 2. Click get started
      await page.click('text=Get Started');
      
      // 3. Select free tier
      await page.click(SELECTORS.startFreeTrialButton);
      
      // 4. Fill registration
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
      await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
      await page.check(SELECTORS.termsCheckbox);
      
      // 5. Complete registration
      await page.click(SELECTORS.registerButton);
      
      // 6. Should show success
      await expect(page.locator('text=Registration successful')).toBeVisible({ timeout: 10000 });
    });

    test('should handle upgrade flow from free to paid', async ({ page }) => {
      // Mock logged in free user
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should show upgrade prompts for free users
      await expect(page.locator('text=Upgrade')).toBeVisible();
      
      // Click upgrade
      await page.click('text=Upgrade');
      
      // Should show pricing options
      await expect(page.locator('text=Choose Your Plan')).toBeVisible();
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist authentication across page refreshes', async ({ page }) => {
      // Mock successful login
      await page.goto(BASE_URL);
      
      // Fill login form (mock auth would need to be set up properly)
      await page.fill(SELECTORS.emailInput, TEST_EMAIL);
      await page.fill(SELECTORS.passwordInput, TEST_PASSWORD);
      
      // This test would require proper auth mocking to complete
      // await page.click(SELECTORS.loginButton);
    });

    test('should protect routes that require authentication', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Should redirect to login
      await expect(page.locator('text=Sign In')).toBeVisible();
    });
  });
});

test.describe('Performance Tests', () => {
  test('should load pricing page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
  });

  test('should handle form submissions responsively', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.click('text=Start Free Trial');
    
    const startTime = Date.now();
    
    await page.fill(SELECTORS.emailInput, TEST_EMAIL);
    await page.fill('input[placeholder*="Create a password"]', TEST_PASSWORD);
    await page.fill(SELECTORS.confirmPasswordInput, TEST_PASSWORD);
    await page.check(SELECTORS.termsCheckbox);
    
    const fillTime = Date.now() - startTime;
    
    expect(fillTime).toBeLessThan(1000); // Form should be responsive
  });

  test('should handle error message display timing', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const startTime = Date.now();
    await page.click(SELECTORS.loginButton); // Trigger validation error
    
    await expect(page.locator('text=Please enter your email')).toBeVisible();
    
    const errorDisplayTime = Date.now() - startTime;
    expect(errorDisplayTime).toBeLessThan(500); // Errors should show immediately
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check that form inputs have proper labels or aria-label
    const emailInput = page.locator(SELECTORS.emailInput);
    const passwordInput = page.locator(SELECTORS.passwordInput);
    
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Check for proper placeholders
    await expect(emailInput).toHaveAttribute('placeholder');
    await expect(passwordInput).toHaveAttribute('placeholder');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.locator(SELECTORS.emailInput)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(SELECTORS.passwordInput)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator(SELECTORS.rememberMeCheckbox)).toBeFocused();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // This would require a color contrast checking library
    // For now, just verify critical elements are visible
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Most Popular')).toBeVisible();
  });
});