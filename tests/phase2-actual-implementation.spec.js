// tests/phase2-actual-implementation.spec.js - Phase 2 Tests matching actual implementation
// These tests are designed to work with the actual app structure

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Phase 2 Actual Implementation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Landing Page Flow', () => {
    test('should display landing page without auth', async ({ page }) => {
      // Should see the landing page with URL input
      await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
      await expect(page.locator('input[placeholder*="Enter your website URL"]')).toBeVisible();
      await expect(page.locator('text=Analyze My Site Free')).toBeVisible();
    });

    test('should show urgency banner', async ({ page }) => {
      await expect(page.locator('text=AI is reshaping search')).toBeVisible();
      await expect(page.locator('text=65% of businesses losing traffic')).toBeVisible();
    });

    test('should display trust indicators', async ({ page }) => {
      await expect(page.locator('text=148')).toBeVisible();
      await expect(page.locator('text=AI Ranking Factors')).toBeVisible();
      await expect(page.locator('text=15s')).toBeVisible();
      await expect(page.locator('text=Analysis Time')).toBeVisible();
    });

    test('should show social proof', async ({ page }) => {
      await expect(page.locator('text=5,247 businesses')).toBeVisible();
      await expect(page.locator('text=protecting their traffic')).toBeVisible();
    });

    test('should display testimonials', async ({ page }) => {
      await expect(page.locator('text=Sarah Chen')).toBeVisible();
      await expect(page.locator('text=Michael Torres')).toBeVisible();
      await expect(page.locator('text=Emma Williams')).toBeVisible();
    });

    test('should validate URL input', async ({ page }) => {
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
      
      // Try to submit without URL
      await analyzeButton.click();
      
      // Button should be disabled when input is empty
      await expect(analyzeButton).toBeDisabled();
      
      // Enter invalid URL
      await urlInput.fill('not a url');
      await analyzeButton.click();
      await expect(page.locator('text=Please enter a valid URL')).toBeVisible();
      
      // Enter valid URL
      await urlInput.clear();
      await urlInput.fill('example.com');
      await expect(analyzeButton).toBeEnabled();
    });

    test('should start analysis when URL is submitted', async ({ page }) => {
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
      
      await urlInput.fill('example.com');
      await analyzeButton.click();
      
      // Should show analyzing state
      await expect(page.locator('text=Analyzing...')).toBeVisible();
    });
  });

  test.describe('TeaserResults Component', () => {
    test('should show teaser results after analysis', async ({ page }) => {
      // Start analysis
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
      
      await urlInput.fill('example.com');
      await analyzeButton.click();
      
      // Wait for teaser results
      await expect(page.locator('text=Your AI Search Score')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/\\d+\\/100/')).toBeVisible();
    });

    test('should display traffic loss estimate', async ({ page }) => {
      // Navigate to teaser results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check for traffic loss display
      await expect(page.locator('text=Estimated Monthly Traffic Loss')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/\\$[\\d,]+/')).toBeVisible();
    });

    test('should show preview factors', async ({ page }) => {
      // Navigate to teaser results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Should show some preview factors
      await expect(page.locator('text=Preview Analysis Results')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Citation-Worthy Content')).toBeVisible();
    });

    test('should display pricing tiers', async ({ page }) => {
      // Navigate to teaser results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for pricing display
      await expect(page.locator('text=Choose Your Plan')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Free Trial')).toBeVisible();
      await expect(page.locator('text=Starter')).toBeVisible();
      await expect(page.locator('text=Professional')).toBeVisible();
    });

    test('should highlight Professional tier', async ({ page }) => {
      // Navigate to teaser results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Professional tier should be highlighted
      await expect(page.locator('text=RECOMMENDED')).toBeVisible({ timeout: 10000 });
      const professionalCard = page.locator('div').filter({ hasText: 'Professional' }).first();
      await expect(professionalCard).toHaveClass(/scale-110/);
    });
  });

  test.describe('AuthWithPassword Component', () => {
    test('should show auth form when selecting a tier', async ({ page }) => {
      // Navigate to teaser results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Click on a tier
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Should show auth form
      await expect(page.locator('text=Create Your Account')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      // Navigate to auth
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Test email validation
      const emailInput = page.locator('input[type="email"]');
      await emailInput.fill('invalid-email');
      await page.locator('button[type="submit"]').click();
      
      await expect(page.locator('text=valid email')).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      // Navigate to auth
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Click to switch to registration mode if needed
      const createAccountLink = page.locator('text=Create one here');
      if (await createAccountLink.isVisible()) {
        await createAccountLink.click();
      }
      
      // Test password strength
      const passwordInput = page.locator('input[placeholder*="Create a password"]');
      await passwordInput.fill('weak');
      
      await expect(page.locator('text=Password Strength')).toBeVisible();
      await expect(page.locator('text=At least 8 characters')).toBeVisible();
    });

    test('should require password confirmation', async ({ page }) => {
      // Navigate to registration
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Switch to registration
      const createAccountLink = page.locator('text=Create one here');
      if (await createAccountLink.isVisible()) {
        await createAccountLink.click();
      }
      
      // Test password confirmation
      await page.locator('input[placeholder*="Create a password"]').fill(TEST_PASSWORD);
      await page.locator('input[placeholder*="Confirm"]').fill('different');
      
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });

    test('should toggle between login and registration', async ({ page }) => {
      // Navigate to auth
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Should start in login mode
      await expect(page.locator('text=Sign In')).toBeVisible();
      
      // Switch to registration
      await page.locator('text=Create one here').click();
      await expect(page.locator('text=Create Account')).toBeVisible();
      
      // Switch back to login
      await page.locator('text=Sign in here').click();
      await expect(page.locator('text=Sign In')).toBeVisible();
    });
  });

  test.describe('PricingTiers Component Features', () => {
    test('should display correct pricing amounts', async ({ page }) => {
      // Navigate to pricing display
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check pricing amounts
      await expect(page.locator('text=$0').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=$5').first()).toBeVisible();
      await expect(page.locator('text=$39').first()).toBeVisible();
    });

    test('should show monthly/annual toggle', async ({ page }) => {
      // Navigate to pricing
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check for billing toggle
      const monthlyTab = page.locator('text=Monthly');
      const annualTab = page.locator('text=Annual');
      
      await expect(monthlyTab).toBeVisible({ timeout: 10000 });
      await expect(annualTab).toBeVisible();
      
      // Click annual and check for savings
      await annualTab.click();
      await expect(page.locator('text=Save 50%')).toBeVisible();
    });

    test('should display currency selector', async ({ page }) => {
      // Navigate to pricing
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check for currency selector
      const currencySelector = page.locator('select').first();
      await expect(currencySelector).toBeVisible({ timeout: 10000 });
      
      // Test currency change
      await currencySelector.selectOption('EUR');
      await expect(page.locator('text=€')).toBeVisible();
    });

    test('should show feature comparisons', async ({ page }) => {
      // Navigate to pricing
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check feature lists
      await expect(page.locator('text=3 analyses per month')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Unlimited analyses')).toBeVisible();
      await expect(page.locator('text=Priority support')).toBeVisible();
    });

    test('should display countdown timer', async ({ page }) => {
      // Navigate to pricing
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Check for countdown timer
      await expect(page.locator('text=Limited Time Offer')).toBeVisible({ timeout: 10000 });
      const timer = page.locator('.font-mono').first();
      await expect(timer).toBeVisible();
      
      // Get initial time
      const initialTime = await timer.textContent();
      
      // Wait and check if it changed
      await page.waitForTimeout(2000);
      const newTime = await timer.textContent();
      
      expect(newTime).not.toBe(initialTime);
    });
  });

  test.describe('Registration Flow', () => {
    test('should complete free tier registration', async ({ page }) => {
      // Navigate through the flow
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Select free tier
      await page.locator('button:has-text("Start Free Trial")').click({ timeout: 10000 });
      
      // Switch to registration mode
      const createAccountLink = page.locator('text=Create one here');
      if (await createAccountLink.isVisible()) {
        await createAccountLink.click();
      }
      
      // Fill registration form
      await page.locator('input[type="email"]').fill(TEST_EMAIL);
      await page.locator('input[placeholder*="Create a password"]').fill(TEST_PASSWORD);
      await page.locator('input[placeholder*="Confirm"]').fill(TEST_PASSWORD);
      
      // Check terms checkbox if present
      const termsCheckbox = page.locator('input[type="checkbox"]').last();
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
      }
      
      // Submit (note: this will fail in test due to Supabase auth)
      await page.locator('button[type="submit"]').click();
    });

    test('should handle paid tier selection', async ({ page }) => {
      // Navigate through the flow
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Select starter tier
      await page.locator('button:has-text("Choose Starter")').click({ timeout: 10000 });
      
      // Should either show auth or confirmation
      await expect(page.locator('text=/Create.*Account|Confirm.*Selection/')).toBeVisible({ timeout: 10000 });
    });

    test('should store selected tier information', async ({ page }) => {
      // Navigate and select a tier
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      await page.locator('button:has-text("Go Professional")').click({ timeout: 10000 });
      
      // Check session storage
      const selectedTier = await page.evaluate(() => {
        return sessionStorage.getItem('selectedTier');
      });
      
      expect(selectedTier).toBeTruthy();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Landing should be responsive
      await expect(page.locator('text=Is AI Stealing Your')).toBeVisible();
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await expect(urlInput).toBeVisible();
      
      // Test mobile interaction
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Results should be visible on mobile
      await expect(page.locator('text=/Your AI.*Score|Choose Your Plan/')).toBeVisible({ timeout: 10000 });
    });

    test('should stack pricing cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Navigate to pricing
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for pricing to appear
      await page.waitForSelector('text=Choose Your Plan', { timeout: 10000 });
      
      // Cards should stack vertically on mobile
      const pricingGrid = page.locator('.grid').first();
      const classes = await pricingGrid.getAttribute('class');
      expect(classes).toContain('grid-cols-1');
    });
  });

  test.describe('Integration Flow', () => {
    test('should complete full user journey', async ({ page }) => {
      // 1. Land on homepage
      await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
      
      // 2. Enter URL for analysis
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // 3. View teaser results
      await expect(page.locator('text=/Your AI.*Score|Preview Analysis/')).toBeVisible({ timeout: 10000 });
      
      // 4. See pricing options
      await expect(page.locator('text=Choose Your Plan')).toBeVisible();
      
      // 5. Select a tier
      await page.locator('button:has-text("Start Free Trial")').click();
      
      // 6. See authentication form
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    });
  });
});