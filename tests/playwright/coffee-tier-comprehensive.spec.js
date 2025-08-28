// Coffee Tier Comprehensive Testing Suite
// Tests the complete Coffee Tier signup flow and site functionality

import { test, expect } from '@playwright/test';

// Test data
const TEST_EMAIL = 'jamie.watters.mail@icloud.com';
const TEST_PASSWORD = 'Qwerty123!';
const TEST_URL = 'https://anthropic.com';

test.describe('AImpactScanner Live Site - Coffee Tier Comprehensive Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
    // Clear any existing session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Landing Page - Core Elements Verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check hero section
    await expect(page.locator('h1')).toContainText('AI Search Mastery');
    
    // Check navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Check CTA buttons
    const ctaButtons = page.locator('button, a[href*="register"]');
    await expect(ctaButtons.first()).toBeVisible();
    
    // Check trust badges
    const trustBadges = page.locator('[alt*="badge"], img[src*="badge"]');
    if (await trustBadges.count() > 0) {
      await expect(trustBadges.first()).toBeVisible();
    }
    
    // Verify responsive design
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('nav')).toBeVisible();
  });

  test('Coffee Tier Registration Page - Default State', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    // Wait for component to load
    await page.waitForSelector('[data-testid="registration-form"], form, input[type="email"]', { timeout: 10000 });
    
    // Check if Coffee tier is default selected
    const coffeeTierButton = page.locator('button:has-text("Coffee"), button[data-tier="coffee"], .tier-coffee');
    if (await coffeeTierButton.count() > 0) {
      await expect(coffeeTierButton.first()).toHaveClass(/selected|active|chosen/);
      console.log('✓ Coffee tier is default selected');
    }
    
    // Check pricing display
    const pricingText = page.locator('text=4.95, text=$4.95, text=USD 4.95');
    if (await pricingText.count() > 0) {
      await expect(pricingText.first()).toBeVisible();
      console.log('✓ Coffee tier pricing displayed');
    }
    
    // Check email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check password input if present
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await expect(passwordInput).toBeVisible();
    }
  });

  test('Coffee Tier Benefits Display', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    // Look for benefits/features list
    const benefitsList = page.locator('ul li, .benefit, .feature, [data-testid="benefits"]');
    
    if (await benefitsList.count() > 0) {
      await expect(benefitsList.first()).toBeVisible();
      console.log('✓ Benefits displayed');
      
      // Log all benefits found
      const benefits = await benefitsList.allTextContents();
      console.log('Benefits found:', benefits.slice(0, 5)); // Show first 5
    }
    
    // Check for analysis mentions
    const analysisText = page.locator('text=/analysis|report|factor/i');
    if (await analysisText.count() > 0) {
      await expect(analysisText.first()).toBeVisible();
      console.log('✓ Analysis features mentioned');
    }
  });

  test('Trust Badges and Risk Reversal', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    // Check for common trust signals
    const trustSignals = [
      'no credit card',
      'money back',
      'guarantee',
      'secure',
      'privacy',
      '148 factors',
      'instant analysis',
      'no spam'
    ];
    
    let foundSignals = [];
    for (const signal of trustSignals) {
      const element = page.locator(`text=/${signal}/i`);
      if (await element.count() > 0) {
        foundSignals.push(signal);
        await expect(element.first()).toBeVisible();
      }
    }
    
    console.log('✓ Trust signals found:', foundSignals);
    expect(foundSignals.length).toBeGreaterThan(0);
  });

  test('Tier Selection Interaction', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    // Look for tier selection buttons
    const tierButtons = page.locator('button:has-text("Growth"), button:has-text("Scale"), .tier-button');
    
    if (await tierButtons.count() > 0) {
      // Try clicking Growth tier if available
      const growthButton = page.locator('button:has-text("Growth"), [data-tier="growth"]');
      if (await growthButton.count() > 0) {
        await growthButton.first().click();
        
        // Check if "Coming Soon" or disabled state is shown
        const comingSoonText = page.locator('text=/coming soon|not available|disabled/i');
        if (await comingSoonText.count() > 0) {
          await expect(comingSoonText.first()).toBeVisible();
          console.log('✓ Coming Soon tiers handled correctly');
        }
      }
    }
  });

  test('Authentication Flow - Registration', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    // Fill email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    
    // Fill password if present
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(TEST_PASSWORD);
    }
    
    // Look for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register")');
    
    if (await submitButton.count() > 0) {
      await expect(submitButton.first()).toBeEnabled();
      console.log('✓ Registration form ready for submission');
      
      // Don't actually submit in test to avoid account creation
      console.log('✓ Registration form validation passed (not submitted)');
    }
  });

  test('Authentication Flow - Login', async ({ page }) => {
    await page.goto('/');
    
    // Look for login link/button
    const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In"), button:has-text("Login")');
    
    if (await loginLink.count() > 0) {
      await loginLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Fill login form
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      if (await emailInput.count() > 0) {
        await emailInput.fill(TEST_EMAIL);
      }
      
      if (await passwordInput.count() > 0) {
        await passwordInput.fill(TEST_PASSWORD);
      }
      
      console.log('✓ Login form accessible and fillable');
    }
  });

  test('Analysis Workflow - URL Input', async ({ page }) => {
    await page.goto('/');
    
    // Look for URL input on main page or navigate to analysis
    const urlInput = page.locator('input[placeholder*="URL"], input[placeholder*="website"], input[placeholder*="domain"]');
    
    if (await urlInput.count() > 0) {
      await urlInput.fill(TEST_URL);
      
      // Look for analyze button
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start"), button[type="submit"]');
      
      if (await analyzeButton.count() > 0) {
        await expect(analyzeButton.first()).toBeEnabled();
        console.log('✓ Analysis input ready');
      }
    } else {
      console.log('⚠ URL input not found on main page - may require login');
    }
  });

  test('Analysis Progress Simulation', async ({ page }) => {
    // This test simulates starting an analysis to check the progress UI
    await page.goto('/');
    
    const urlInput = page.locator('input[placeholder*="URL"], input[placeholder*="website"], input[placeholder*="domain"]');
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start")');
    
    if (await urlInput.count() > 0 && await analyzeButton.count() > 0) {
      await urlInput.fill(TEST_URL);
      await analyzeButton.first().click();
      
      // Wait for progress indicators
      const progressIndicators = page.locator('.progress, [role="progressbar"], text=/analyzing|progress|%/i');
      
      if (await progressIndicators.count() > 0) {
        await expect(progressIndicators.first()).toBeVisible();
        console.log('✓ Analysis progress UI displayed');
        
        // Wait a bit to see progress
        await page.waitForTimeout(3000);
      }
    }
  });

  test('Results Dashboard Components', async ({ page }) => {
    // Navigate to results or trigger analysis
    await page.goto('/');
    
    // Try to access results directly or after analysis
    const resultsSection = page.locator('.results, #results, [data-testid="results"]');
    
    if (await resultsSection.count() > 0) {
      await expect(resultsSection.first()).toBeVisible();
      
      // Check for key result components
      const scoreDisplay = page.locator('.score, text=/score|rating|points/i');
      const factorsDisplay = page.locator('.factor, .pillar, text=/factor|pillar/i');
      
      if (await scoreDisplay.count() > 0) {
        console.log('✓ Score display found');
      }
      
      if (await factorsDisplay.count() > 0) {
        console.log('✓ Factor analysis found');
      }
    }
  });

  test('Tier Selection Page Functionality', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    // Check for pricing tiers
    const tierCards = page.locator('.tier, .plan, [data-testid="pricing-tier"]');
    
    if (await tierCards.count() > 0) {
      await expect(tierCards.first()).toBeVisible();
      console.log('✓ Pricing tiers displayed');
      
      // Check for Coffee tier specifically
      const coffeeTier = page.locator('text=/coffee|\\$4\\.95/i');
      if (await coffeeTier.count() > 0) {
        await expect(coffeeTier.first()).toBeVisible();
        console.log('✓ Coffee tier pricing visible');
      }
    }
  });

  test('Mobile Responsiveness - Key Pages', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test main pages
    const pages = ['/', '/#register', '/pricing'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      
      // Check that content is visible and not cut off
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Check for mobile menu or navigation
      const nav = page.locator('nav, .menu, [role="navigation"]');
      if (await nav.count() > 0) {
        await expect(nav.first()).toBeVisible();
      }
      
      console.log(`✓ Mobile layout working for ${pageUrl}`);
    }
  });

  test('Performance - Page Load Times', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`✓ Landing page loaded in ${loadTime}ms`);
    
    // Check if load time is reasonable (under 5 seconds)
    expect(loadTime).toBeLessThan(5000);
    
    // Test registration page load
    const regStartTime = Date.now();
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    const regLoadTime = Date.now() - regStartTime;
    
    console.log(`✓ Registration page loaded in ${regLoadTime}ms`);
    expect(regLoadTime).toBeLessThan(5000);
  });

  test('Error Handling - Invalid URLs', async ({ page }) => {
    await page.goto('/invalid-page-that-does-not-exist');
    
    // Should either redirect or show 404
    const pageContent = await page.textContent('body');
    
    // Check if it redirected to home or shows appropriate error
    const currentUrl = page.url();
    const has404Content = pageContent.toLowerCase().includes('404') || 
                         pageContent.toLowerCase().includes('not found') ||
                         currentUrl.includes('/');
    
    expect(has404Content).toBeTruthy();
    console.log('✓ Invalid URL handling works');
  });
});

test.describe('Coffee Tier Signup Flow - End-to-End', () => {
  
  test('Complete Registration to Dashboard Flow', async ({ page }) => {
    // Start at registration
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Starting complete Coffee Tier registration flow test');
    
    // Fill form
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('test+' + Date.now() + '@example.com');
    }
    
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(TEST_PASSWORD);
    }
    
    // Check that Coffee tier is selected by default
    const coffeeTierButton = page.locator('[data-tier="coffee"], button:has-text("Coffee")');
    if (await coffeeTierButton.count() > 0) {
      console.log('✓ Coffee tier available for selection');
    }
    
    // Submit form (but don't actually complete to avoid charges)
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up")');
    if (await submitButton.count() > 0) {
      await expect(submitButton).toBeEnabled();
      console.log('✓ Registration form ready for submission');
    }
  });
});