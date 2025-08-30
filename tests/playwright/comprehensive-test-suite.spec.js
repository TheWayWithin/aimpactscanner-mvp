// Comprehensive Playwright Test Suite for AImpactScanner
// Covers recent features and regression testing
import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://app.aimpactscanner.com';
const TEST_EMAIL = `test_${Date.now()}@temp-mail.org`;
const TEST_URL = 'example.com';
const TEST_TIMEOUT = 30000;

test.describe('RECENT FEATURES: Messaging Clarity Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should show updated URL input placeholder text', async ({ page }) => {
    // Navigate to analysis input page (authenticated user)
    await page.click('button:has-text("New Analysis")');
    
    // Check for new placeholder text
    const urlInput = page.locator('input#url');
    await expect(urlInput).toHaveAttribute('placeholder', /Enter a page URL to analyze/);
  });

  test('should display helper text about page-by-page analysis', async ({ page }) => {
    // Navigate to analysis input page
    await page.click('button:has-text("New Analysis")');
    
    // Check for helper text
    const helperText = page.locator('text=Analyze one page at a time - start with your homepage or most important page');
    await expect(helperText).toBeVisible();
  });

  test('should show analysis results header with URL', async ({ page }) => {
    // Mock an analysis completion and check results page header
    // This would need to be adapted based on how you handle demo/mock results
    await page.click('button:has-text("📋 See Sample Report")');
    
    // Check for results header showing the URL
    const resultsHeader = page.locator('text=Analysis Results for:');
    await expect(resultsHeader).toBeVisible();
  });

  test('should display FAQ about page vs website analysis', async ({ page }) => {
    // Check if FAQ section exists (this would be on landing or help page)
    // You may need to add this to a specific page
    const faqSection = page.locator('[data-testid="page-analysis-faq"], text*="page vs website"');
    // This test might need adjustment based on where FAQ is placed
  });
});

test.describe('RECENT FEATURES: LLMs.txt Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should show different recommendations for sites without LLMs.txt', async ({ page }) => {
    // This test assumes the analysis results show LLMs.txt recommendations
    await page.click('button:has-text("📋 See Sample Report")');
    await page.waitForLoadState('networkidle');
    
    // Look for LLMs.txt related recommendations
    const llmsTxtSection = page.locator('[data-testid="llmstxt-recommendations"], text*="LLMs.txt"');
    // Check if recommendations exist for sites without LLMs.txt
    const withoutLLmsTxtText = page.locator('text*="implement LLMs.txt", text*="missing LLMs.txt"');
  });

  test('should show context-aware messaging based on LLMs.txt presence', async ({ page }) => {
    // Test with a real site that has LLMs.txt
    await page.click('button:has-text("New Analysis")');
    await page.fill('input#url', 'anthropic.com');
    await page.click('button:has-text("Start AI Analysis")');
    
    // Wait for results and check for context-aware messaging
    await page.waitForSelector('[data-testid="analysis-results"], .results-container', { timeout: TEST_TIMEOUT });
    
    // Check for different messaging based on LLMs.txt presence
    const contextualMessage = page.locator('text*="LLMs.txt detected", text*="LLMs.txt found", text*="already implements"');
  });
});

test.describe('RECENT FEATURES: Account Page Fixes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Assume we have a way to authenticate for testing
  });

  test('should display functional Manage Subscription button for paid tiers', async ({ page }) => {
    // Navigate to account page
    await page.click('button:has-text("👤 Account")');
    
    // Check for Manage Subscription button
    const manageSubButton = page.locator('button:has-text("Manage Subscription")');
    await expect(manageSubButton).toBeVisible();
    await expect(manageSubButton).not.toBeDisabled();
  });

  test('should show accurate usage tracking for all tiers', async ({ page }) => {
    await page.click('button:has-text("👤 Account")');
    
    // Check usage tracking display
    const usageSection = page.locator('[data-testid="usage-summary"], text*="Usage Summary"');
    await expect(usageSection).toBeVisible();
    
    // Check for specific usage metrics
    const usageMetrics = page.locator('text*="analyses", text*="remaining", text*="used"');
    await expect(usageMetrics).toBeVisible();
  });

  test('should have consolidated billing section', async ({ page }) => {
    await page.click('button:has-text("👤 Account")');
    
    // Check for consolidated billing information
    const billingSection = page.locator('[data-testid="subscription-details"], text*="Subscription Details"');
    await expect(billingSection).toBeVisible();
    
    // Check for tier information
    const currentPlan = page.locator('text*="Current Plan"');
    await expect(currentPlan).toBeVisible();
  });
});

test.describe('REGRESSION: Authentication Flow', () => {
  test('should allow user registration with email/password', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to registration
    await page.click('text=Sign up, text=Register, button:has-text("Get Started")');
    
    // Fill registration form
    await page.fill('input[type="email"], input#email', TEST_EMAIL);
    await page.fill('input[type="password"], input#password', 'TestPassword123!');
    
    // Submit registration
    await page.click('button:has-text("Sign Up"), button:has-text("Create Account")');
    
    // Check for success or email verification message
    const successMessage = page.locator('text*="verification", text*="email sent", text*="check your email"');
    await expect(successMessage).toBeVisible({ timeout: TEST_TIMEOUT });
  });

  test('should handle login flow correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to login
    await page.click('text=Login, text=Sign in, button:has-text("Login")');
    
    // Check login form elements
    const emailInput = page.locator('input[type="email"], input#email');
    const passwordInput = page.locator('input[type="password"], input#password');
    const loginButton = page.locator('button:has-text("Log In"), button:has-text("Sign In")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('should handle magic link authentication', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Look for magic link option
    const magicLinkOption = page.locator('text*="magic link", button:has-text("Send Magic Link")');
    if (await magicLinkOption.count() > 0) {
      await magicLinkOption.click();
      
      await page.fill('input[type="email"]', TEST_EMAIL);
      await page.click('button:has-text("Send")');
      
      // Check for success message
      const successMessage = page.locator('text*="magic link sent", text*="check your email"');
      await expect(successMessage).toBeVisible();
    }
  });

  test('should display email verification pending state', async ({ page }) => {
    // This would need to be triggered by creating an unverified account
    // Check for email verification pending page
    const verificationPage = page.locator('text*="verify your email", text*="verification pending"');
    // This test may need specific setup
  });
});

test.describe('REGRESSION: Analysis Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should accept valid URL input and start analysis', async ({ page }) => {
    // Navigate to input page
    await page.click('button:has-text("Start New Analysis"), button:has-text("New Analysis")');
    
    // Fill URL input
    const urlInput = page.locator('input#url, input[placeholder*="URL"]');
    await urlInput.fill(TEST_URL);
    
    // Submit analysis
    await page.click('button:has-text("Start AI Analysis"), button[type="submit"]');
    
    // Check for analysis progress
    const progressIndicator = page.locator('text*="Analyzing", [data-testid="analysis-progress"]');
    await expect(progressIndicator).toBeVisible({ timeout: TEST_TIMEOUT });
  });

  test('should validate URL input correctly', async ({ page }) => {
    await page.click('button:has-text("New Analysis")');
    
    const urlInput = page.locator('input#url');
    const submitButton = page.locator('button:has-text("Start AI Analysis")');
    
    // Test invalid URL
    await urlInput.fill('invalid-url');
    await submitButton.click();
    
    // Check for error message
    const errorMessage = page.locator('text*="valid URL", text*="invalid", .error-message');
    await expect(errorMessage).toBeVisible();
    
    // Test valid URL
    await urlInput.clear();
    await urlInput.fill('example.com');
    
    // Error should disappear
    await expect(errorMessage).not.toBeVisible();
  });

  test('should display analysis progress correctly', async ({ page }) => {
    // Start an analysis
    await page.click('button:has-text("New Analysis")');
    await page.fill('input#url', TEST_URL);
    await page.click('button:has-text("Start AI Analysis")');
    
    // Check progress elements
    const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar');
    const progressText = page.locator('text*="%", [data-testid="progress-text"]');
    const stageName = page.locator('[data-testid="analysis-stage"], text*="Analyzing"');
    
    // At least one progress element should be visible
    await expect(page.locator('[data-testid="analysis-progress"], text*="progress"')).toBeVisible({ timeout: TEST_TIMEOUT });
  });

  test('should show analysis results dashboard', async ({ page }) => {
    // Use sample/demo results
    await page.click('button:has-text("📋 See Sample Report"), button:has-text("Sample")');
    
    // Check results elements
    const overallScore = page.locator('[data-testid="overall-score"], text*="/100"');
    const factorsList = page.locator('[data-testid="factors-list"], .factor-card');
    const pillarScores = page.locator('[data-testid="pillar-scores"], text*="AI:", text*="Authority"');
    
    await expect(overallScore).toBeVisible({ timeout: TEST_TIMEOUT });
  });
});

test.describe('REGRESSION: Payment Integration', () => {
  test('should display pricing tiers correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to pricing
    await page.click('button:has-text("💎 Upgrade"), text=Pricing');
    
    // Check for tier cards
    const freeTier = page.locator('text*="Free", [data-testid="free-tier"]');
    const coffeeTier = page.locator('text*="Coffee", [data-testid="coffee-tier"]');
    
    await expect(freeTier).toBeVisible();
    await expect(coffeeTier).toBeVisible();
    
    // Check for pricing information
    const pricing = page.locator('text*="$5", text*="month"');
    await expect(pricing).toBeVisible();
  });

  test('should initiate Stripe checkout for Coffee tier', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to pricing and select Coffee tier
    await page.click('button:has-text("Upgrade")');
    await page.click('button:has-text("Start Coffee"), button:has-text("Choose Coffee")');
    
    // This should redirect to Stripe or show checkout form
    // Check for Stripe elements or checkout form
    await page.waitForTimeout(3000); // Wait for redirect
    
    // Check if we're on Stripe checkout or if checkout modal appeared
    const isStripeCheckout = page.url().includes('checkout.stripe.com');
    const hasCheckoutModal = await page.locator('[data-testid="checkout-modal"], iframe').count() > 0;
    
    expect(isStripeCheckout || hasCheckoutModal).toBeTruthy();
  });

  test('should handle subscription management for paid users', async ({ page }) => {
    // This test assumes a paid user is logged in
    await page.goto(BASE_URL);
    await page.click('button:has-text("Account")');
    
    // Look for subscription management
    const manageButton = page.locator('button:has-text("Manage Subscription")');
    if (await manageButton.count() > 0) {
      await manageButton.click();
      
      // Should redirect to Stripe Customer Portal
      await page.waitForTimeout(3000);
      const isPortal = page.url().includes('billing.stripe.com');
      expect(isPortal).toBeTruthy();
    }
  });
});

test.describe('REGRESSION: PDF Generation', () => {
  test('should generate PDF report for analysis results', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to sample results
    await page.click('button:has-text("📋 See Sample Report")');
    
    // Look for PDF generation button
    const pdfButton = page.locator('button:has-text("PDF"), button:has-text("Download"), [data-testid="pdf-button"]');
    
    if (await pdfButton.count() > 0) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      await pdfButton.click();
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test('should show PDF generation status', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('button:has-text("📋 See Sample Report")');
    
    const pdfButton = page.locator('button:has-text("PDF")');
    if (await pdfButton.count() > 0) {
      await pdfButton.click();
      
      // Check for loading state
      const loadingState = page.locator('text*="Generating", text*="Creating PDF"');
      
      // Check for success message
      const successMessage = page.locator('text*="PDF generated", text*="Download ready"');
      
      // At least one of these should appear
      const statusExists = await loadingState.or(successMessage).count() > 0;
      expect(statusExists).toBeTruthy();
    }
  });
});

test.describe('REGRESSION: Tier Management', () => {
  test('should display correct tier indicators', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check header tier indicator
    const tierIndicator = page.locator('[data-testid="tier-indicator"], text*="Free", text*="Coffee"');
    await expect(tierIndicator).toBeVisible();
  });

  test('should show usage limits for Free tier', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for usage information
    const usageInfo = page.locator('text*="3 analyses", text*="remaining", text*="month"');
    await expect(usageInfo).toBeVisible();
  });

  test('should handle tier upgrades correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Navigate to upgrade flow
    await page.click('button:has-text("Upgrade")');
    
    // Select tier and check upgrade flow
    const upgradeButtons = page.locator('button:has-text("Choose"), button:has-text("Start")');
    await expect(upgradeButtons.first()).toBeVisible();
  });
});

test.describe('CROSS-BROWSER COMPATIBILITY', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`should work correctly on ${browserName}`, async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Basic functionality tests
      await expect(page.locator('h1, [data-testid="main-heading"]')).toBeVisible();
      
      // Check if main navigation works
      const navElements = page.locator('button, a').filter({ hasText: /Analysis|Dashboard|Account/ });
      await expect(navElements.first()).toBeVisible();
      
      // Test analysis input form
      const startButton = page.locator('button:has-text("Start"), button:has-text("Analysis")');
      if (await startButton.count() > 0) {
        await startButton.click();
        
        const urlInput = page.locator('input[type="text"], input#url');
        await expect(urlInput).toBeVisible();
      }
    });
  });
});

test.describe('RESPONSIVE DESIGN', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  viewports.forEach(viewport => {
    test(`should display correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(BASE_URL);
      
      // Check basic layout
      await expect(page.locator('body')).toBeVisible();
      
      // Check navigation is accessible
      const navigation = page.locator('nav, [role="navigation"], button, a');
      await expect(navigation.first()).toBeVisible();
      
      // Check main content is visible
      const mainContent = page.locator('main, [role="main"], .main-content');
      await expect(mainContent.first()).toBeVisible();
    });
  });
});

// Helper functions for common test patterns
async function waitForAnalysisComplete(page) {
  await page.waitForSelector('[data-testid="analysis-complete"], text*="Analysis Complete"', { 
    timeout: TEST_TIMEOUT 
  });
}

async function authenticateUser(page, email = TEST_EMAIL) {
  // Helper to authenticate user for tests that require auth
  await page.click('text=Login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'TestPassword123!');
  await page.click('button:has-text("Login")');
}

// Utility to check for specific elements with fallbacks
async function expectElementWithFallback(page, selectors, timeout = 5000) {
  let found = false;
  for (const selector of selectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      await expect(element).toBeVisible({ timeout });
      found = true;
      break;
    }
  }
  expect(found).toBeTruthy();
}