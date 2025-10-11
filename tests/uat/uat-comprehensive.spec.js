// UAT Comprehensive Test Suite - AImpactScanner MVP
import { test, expect } from '@playwright/test';
import { TempEmailUtils } from '../utils/temp-email-utils.js';

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes per test
const ANALYSIS_TIMEOUT = 30000; // 30 seconds for analysis
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Test URLs for analysis
const TEST_SITES = {
  simple: 'https://example.com',
  medium: 'https://github.com',
  complex: 'https://stripe.com'
};

// Tier configurations
const TIERS = {
  free: {
    name: 'Free',
    price: 0,
    analysisLimit: 1,
    features: ['basic']
  },
  starter: {
    name: 'Starter',
    price: 9,
    analysisLimit: 10,
    priceId: 'price_starter_monthly',
    features: ['basic', 'pdf']
  },
  growth: {
    name: 'Growth',
    price: 49,
    analysisLimit: 100,
    priceId: 'price_growth_monthly',
    features: ['basic', 'pdf', 'api', 'priority']
  },
  business: {
    name: 'Business',
    price: 199,
    analysisLimit: 'unlimited',
    priceId: 'price_business_monthly',
    features: ['basic', 'pdf', 'api', 'priority', 'whitelabel', 'support']
  }
};

test.describe('UAT: Anonymous User Journey', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should navigate landing page and understand value proposition', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify hero section
    await expect(page.locator('h1')).toContainText(/AI.*Impact/i);
    
    // Check main CTA
    const mainCTA = page.locator('button:has-text("Analyze"), a:has-text("Analyze")').first();
    await expect(mainCTA).toBeVisible();
    
    // Verify feature sections
    const features = page.locator('[data-testid="feature-card"], .feature-card');
    await expect(features).toHaveCount(3); // Assuming 3 main features
    
    // Check pricing link
    const pricingLink = page.locator('a[href*="pricing"], button:has-text("Pricing")').first();
    await expect(pricingLink).toBeVisible();
  });

  test('should explore pricing page and compare tiers', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Verify all tiers are displayed
    for (const tier of Object.values(TIERS)) {
      const tierCard = page.locator(`text=${tier.name}`).first();
      await expect(tierCard).toBeVisible();
      
      if (tier.price > 0) {
        await expect(page.locator(`text=$${tier.price}`).first()).toBeVisible();
      }
    }
    
    // Check tier comparison
    const comparisonFeatures = [
      'AI Analysis',
      'Reports',
      'Support'
    ];
    
    for (const feature of comparisonFeatures) {
      await expect(page.locator(`text=${feature}`).first()).toBeVisible();
    }
    
    // Verify CTAs
    const signUpButtons = page.locator('button:has-text("Sign Up"), button:has-text("Get Started")');
    await expect(signUpButtons).toHaveCount(4); // One for each tier
  });

  test('should handle sign-up decision points correctly', async ({ page, isMobile }) => {
    await page.goto(BASE_URL);
    
    // Click main CTA
    await page.locator('button:has-text("Analyze"), a:has-text("Start Free")').first().click();
    
    // Should redirect to auth or show auth modal
    await expect(page).toHaveURL(/\/(auth|login|signup)/);
    
    // Verify auth options
    await expect(page.locator('text=/Sign.*Google/i')).toBeVisible();
    await expect(page.locator('text=/Email/i')).toBeVisible();
    
    // Mobile responsive check
    if (isMobile) {
      const viewport = page.viewportSize();
      expect(viewport.width).toBeLessThan(768);
      
      // Verify mobile menu works
      const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await expect(page.locator('nav')).toBeVisible();
      }
    }
  });
});

test.describe('UAT: Free Tier User Journey', () => {
  test.setTimeout(TEST_TIMEOUT);
  let tempEmailUtils;

  test.beforeEach(async ({ page }) => {
    tempEmailUtils = new TempEmailUtils(page);
  });

  test.afterEach(async () => {
    if (tempEmailUtils) {
      await tempEmailUtils.cleanup();
    }
  });

  test('should complete free tier registration with temp email', async ({ page }) => {
    // Generate temporary email
    const tempEmail = await tempEmailUtils.generateTempEmail();
    expect(tempEmail).toContain('@');
    
    // Navigate to signup
    await page.goto(`${BASE_URL}/auth/signup`);
    
    // Fill registration form
    await page.fill('input[type="email"]', tempEmail);
    await page.click('button:has-text("Continue"), button:has-text("Sign Up")');
    
    // Wait for magic link
    console.log('Waiting for magic link email...');
    const magicLink = await tempEmailUtils.waitForMagicLink(60000);
    
    if (magicLink) {
      // Follow magic link
      await page.goto(magicLink);
      
      // Verify authentication
      await page.waitForURL(/\/(dashboard|account|app)/, { timeout: 15000 });
      
      // Check user is logged in
      const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="account"]');
      await expect(userMenu).toBeVisible({ timeout: 10000 });
    }
  });

  test('should execute single free analysis', async ({ page }) => {
    // Assume user is logged in (use existing test user or create one)
    await loginAsTestUser(page, 'free');
    
    // Navigate to analysis
    await page.goto(`${BASE_URL}/app/analyze`);
    
    // Enter URL
    await page.fill('input[placeholder*="Enter URL"], input[name="url"]', TEST_SITES.simple);
    
    // Start analysis
    await page.click('button:has-text("Analyze")');
    
    // Wait for analysis to complete
    await expect(page.locator('text=/Analyzing/i')).toBeVisible();
    await expect(page.locator('text=/Complete/i')).toBeVisible({ timeout: ANALYSIS_TIMEOUT });
    
    // Verify results
    const scoreElement = page.locator('[data-testid="impact-score"], .score');
    await expect(scoreElement).toBeVisible();
    
    // Check all 10 factors are displayed
    const factors = [
      'Personalization',
      'Content Depth',
      'User Engagement', 
      'Conversion',
      'Accessibility',
      'Data Ethics',
      'Value Creation',
      'Technical Excellence',
      'Credibility',
      'Innovation'
    ];
    
    for (const factor of factors) {
      await expect(page.locator(`text=${factor}`)).toBeVisible();
    }
  });

  test('should show upgrade prompts after limit', async ({ page }) => {
    await loginAsTestUser(page, 'free');
    
    // Navigate to analyze (assuming one analysis already done)
    await page.goto(`${BASE_URL}/app/analyze`);
    
    // Try to analyze another site
    await page.fill('input[placeholder*="Enter URL"], input[name="url"]', TEST_SITES.medium);
    await page.click('button:has-text("Analyze")');
    
    // Should show upgrade prompt
    await expect(page.locator('text=/Upgrade/i')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/limit/i')).toBeVisible();
    
    // Verify upgrade CTA works
    await page.click('button:has-text("Upgrade"), a:has-text("Upgrade")');
    await expect(page).toHaveURL(/pricing/);
  });
});

test.describe('UAT: Paid Tier User Journeys', () => {
  test.setTimeout(TEST_TIMEOUT);

  ['starter', 'growth', 'business'].forEach(tierName => {
    test(`should complete ${tierName} tier checkout and access features`, async ({ page }) => {
      const tier = TIERS[tierName];
      
      // Navigate to pricing
      await page.goto(`${BASE_URL}/pricing`);
      
      // Click tier CTA
      await page.locator(`[data-tier="${tierName}"]`).locator('button').click();
      
      // Handle auth if needed
      if (!await isAuthenticated(page)) {
        await loginAsTestUser(page, 'test');
      }
      
      // Should redirect to Stripe checkout
      await page.waitForURL(/checkout\.stripe\.com|stripe\.com/, { timeout: 10000 });
      
      // Fill Stripe test card
      await fillStripeTestCard(page);
      
      // Complete purchase
      await page.click('button:has-text("Subscribe"), button[type="submit"]');
      
      // Wait for success redirect
      await page.waitForURL(/success|account|dashboard/, { timeout: 15000 });
      
      // Verify tier access
      await expect(page.locator(`text=${tier.name}`)).toBeVisible();
      
      // Test tier-specific features
      if (tier.features.includes('pdf')) {
        await page.goto(`${BASE_URL}/app/reports`);
        const exportButton = page.locator('button:has-text("Export PDF")');
        await expect(exportButton).toBeEnabled();
      }
      
      if (tier.features.includes('api')) {
        await page.goto(`${BASE_URL}/account/api`);
        await expect(page.locator('text=/API Key/i')).toBeVisible();
      }
    });
  });

  test('should enforce usage limits per tier', async ({ page }) => {
    // Test starter tier limit (10 analyses)
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/account`);
    
    // Check usage display
    const usageElement = page.locator('[data-testid="usage-count"], .usage');
    await expect(usageElement).toBeVisible();
    
    // Verify limit is displayed
    await expect(page.locator('text=/10.*analyses/i')).toBeVisible();
  });
});

test.describe('UAT: Authentication Flows', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should authenticate via Google OAuth', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`);
    
    // Click Google sign in
    await page.click('button:has-text("Google"), button:has-text("Continue with Google")');
    
    // Handle OAuth flow (in test mode, might be mocked)
    if (await page.url().includes('accounts.google.com')) {
      // Real OAuth flow - skip in test environment
      test.skip();
    } else {
      // Mocked OAuth
      await page.waitForURL(/\/(dashboard|account|app)/, { timeout: 10000 });
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    }
  });

  test('should handle magic link authentication', async ({ page }) => {
    const tempEmailUtils = new TempEmailUtils(page);
    const tempEmail = await tempEmailUtils.generateTempEmail();
    
    await page.goto(`${BASE_URL}/auth`);
    
    // Enter email
    await page.fill('input[type="email"]', tempEmail);
    await page.click('button:has-text("Send Magic Link"), button:has-text("Continue")');
    
    // Wait for email
    const magicLink = await tempEmailUtils.waitForMagicLink(60000);
    expect(magicLink).toBeTruthy();
    
    // Follow link
    await page.goto(magicLink);
    
    // Verify authentication
    await page.waitForURL(/\/(dashboard|account|app)/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    await tempEmailUtils.cleanup();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    await loginAsTestUser(page, 'test');
    
    // Verify logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Navigate to different page
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});

test.describe('UAT: Analysis Engine', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should complete analysis within performance benchmark', async ({ page }) => {
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/app/analyze`);
    
    // Enter URL
    await page.fill('input[placeholder*="URL"]', TEST_SITES.simple);
    
    // Start timer
    const startTime = Date.now();
    
    // Start analysis
    await page.click('button:has-text("Analyze")');
    
    // Wait for completion
    await expect(page.locator('text=/Complete/i')).toBeVisible({ timeout: 15000 });
    
    // Check time
    const analysisTime = Date.now() - startTime;
    expect(analysisTime).toBeLessThan(15000); // Must be under 15 seconds
    
    console.log(`Analysis completed in ${analysisTime}ms`);
  });

  test('should generate accurate MASTERY-AI scores', async ({ page }) => {
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/app/analyze`);
    await page.fill('input[placeholder*="URL"]', TEST_SITES.complex);
    await page.click('button:has-text("Analyze")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: ANALYSIS_TIMEOUT });
    
    // Verify all 10 factors have scores
    const factors = [
      'Personalization',
      'Content Depth',
      'User Engagement',
      'Conversion',
      'Accessibility',
      'Data Ethics',
      'Value Creation',
      'Technical Excellence',
      'Credibility',
      'Innovation'
    ];
    
    for (const factor of factors) {
      const factorScore = page.locator(`[data-factor="${factor}"] .score, text=${factor} >> .. >> .score`);
      await expect(factorScore).toBeVisible();
      
      // Verify score is between 0-100
      const scoreText = await factorScore.textContent();
      const score = parseInt(scoreText);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  test('should export PDF report', async ({ page }) => {
    await loginAsTestUser(page, 'growth');
    
    // Navigate to existing analysis
    await page.goto(`${BASE_URL}/app/reports`);
    
    // Click on a report
    await page.locator('.report-item, [data-testid="report"]').first().click();
    
    // Export PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF"), button:has-text("Download PDF")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
    
    // Verify PDF was created
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

test.describe('UAT: Payment & Subscription Management', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should handle subscription upgrade flow', async ({ page }) => {
    // Start as starter tier
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/account/subscription`);
    
    // Click upgrade
    await page.click('button:has-text("Upgrade")');
    
    // Select growth tier
    await page.click('[data-tier="growth"] button');
    
    // Handle Stripe
    await page.waitForURL(/stripe\.com/, { timeout: 10000 });
    await fillStripeTestCard(page);
    await page.click('button[type="submit"]');
    
    // Verify upgrade
    await page.waitForURL(/account/);
    await expect(page.locator('text=Growth')).toBeVisible();
  });

  test('should handle subscription downgrade flow', async ({ page }) => {
    await loginAsTestUser(page, 'growth');
    
    await page.goto(`${BASE_URL}/account/subscription`);
    
    // Click manage/downgrade
    await page.click('button:has-text("Manage"), button:has-text("Change Plan")');
    
    // Select starter tier
    await page.click('[data-tier="starter"] button');
    
    // Confirm downgrade
    await page.click('button:has-text("Confirm Downgrade")');
    
    // Verify downgrade scheduled
    await expect(page.locator('text=/downgrade.*scheduled/i')).toBeVisible();
  });

  test('should handle payment failure gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/pricing`);
    
    // Select a tier
    await page.click('[data-tier="starter"] button');
    
    // Auth if needed
    if (!await isAuthenticated(page)) {
      await loginAsTestUser(page, 'test');
    }
    
    // Use failing test card
    await page.waitForURL(/stripe\.com/);
    await page.fill('[placeholder*="Card number"]', '4000000000000002'); // Decline card
    await page.fill('[placeholder*="MM"]', '12');
    await page.fill('[placeholder*="YY"]', '30');
    await page.fill('[placeholder*="CVC"]', '123');
    
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.locator('text=/declined/i')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UAT: Edge Cases & Error Handling', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should handle database timeout gracefully', async ({ page }) => {
    await loginAsTestUser(page, 'starter');
    
    // Analyze a problematic URL that might cause timeout
    await page.goto(`${BASE_URL}/app/analyze`);
    await page.fill('input[placeholder*="URL"]', 'https://very-slow-loading-site.example.com');
    await page.click('button:has-text("Analyze")');
    
    // Should show timeout message or fallback
    const errorMessage = page.locator('text=/timeout|error|unable/i');
    const fallbackUI = page.locator('[data-testid="simplified-analysis"]');
    
    // Either error message or fallback UI should appear
    await expect(errorMessage.or(fallbackUI)).toBeVisible({ timeout: 20000 });
  });

  test('should validate and reject invalid URLs', async ({ page }) => {
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/app/analyze`);
    
    // Try invalid URLs
    const invalidURLs = [
      'not-a-url',
      'ftp://invalid-protocol.com',
      'javascript:alert(1)',
      '../../../etc/passwd'
    ];
    
    for (const url of invalidURLs) {
      await page.fill('input[placeholder*="URL"]', url);
      await page.click('button:has-text("Analyze")');
      
      // Should show validation error
      await expect(page.locator('text=/invalid|enter.*valid.*url/i')).toBeVisible();
      
      // Should not start analysis
      await expect(page.locator('text=/Analyzing/i')).not.toBeVisible();
    }
  });

  test('should enforce rate limiting', async ({ page }) => {
    await loginAsTestUser(page, 'free');
    
    await page.goto(`${BASE_URL}/app/analyze`);
    
    // Attempt rapid requests
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder*="URL"]', `https://example.com?test=${i}`);
      await page.click('button:has-text("Analyze")');
      
      // Don't wait for completion, immediately try next
      if (i < 4) {
        await page.waitForTimeout(100);
      }
    }
    
    // Should show rate limit message
    await expect(page.locator('text=/rate.*limit|slow.*down|too.*many/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network interruption', async ({ page, context }) => {
    await loginAsTestUser(page, 'starter');
    
    await page.goto(`${BASE_URL}/app/analyze`);
    await page.fill('input[placeholder*="URL"]', TEST_SITES.simple);
    
    // Start analysis
    await page.click('button:has-text("Analyze")');
    
    // Simulate offline
    await context.setOffline(true);
    
    // Should show connection error
    await expect(page.locator('text=/offline|connection|network/i')).toBeVisible({ timeout: 10000 });
    
    // Restore connection
    await context.setOffline(false);
    
    // Should allow retry
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await expect(page.locator('text=/Analyzing/i')).toBeVisible();
    }
  });
});

test.describe('UAT: Cross-Browser Compatibility', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('should work consistently across browsers', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);
    
    await page.goto(BASE_URL);
    
    // Basic functionality check
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigation
    await page.click('a[href*="pricing"], text=Pricing');
    await expect(page).toHaveURL(/pricing/);
    
    // Forms
    await page.goto(`${BASE_URL}/auth`);
    await page.fill('input[type="email"]', 'test@example.com');
    
    // Buttons
    const button = page.locator('button').first();
    await expect(button).toBeEnabled();
    
    console.log(`${browserName} compatibility: PASS`);
  });
});

test.describe('UAT: Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('should be fully functional on mobile devices', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('nav')).toBeVisible();
    }
    
    // Navigate to pricing
    await page.goto(`${BASE_URL}/pricing`);
    
    // Verify cards stack vertically
    const pricingCards = page.locator('[data-testid="pricing-card"], .pricing-card');
    const firstCard = await pricingCards.first().boundingBox();
    const secondCard = await pricingCards.nth(1).boundingBox();
    
    // Second card should be below first on mobile
    expect(secondCard.y).toBeGreaterThan(firstCard.y + firstCard.height);
    
    // Test touch interactions
    await page.tap('button:has-text("Get Started")');
    await expect(page).toHaveURL(/auth|signup/);
  });
});

// Helper Functions

async function loginAsTestUser(page, tier = 'free') {
  const testUsers = {
    free: { email: 'free@test.com', password: 'testpass123' },
    starter: { email: 'starter@test.com', password: 'testpass123' },
    growth: { email: 'growth@test.com', password: 'testpass123' },
    business: { email: 'business@test.com', password: 'testpass123' },
    test: { email: 'test@example.com', password: 'testpass123' }
  };

  const user = testUsers[tier];
  
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button:has-text("Sign In"), button:has-text("Login")');
  
  await page.waitForURL(/\/(dashboard|account|app)/, { timeout: 10000 });
}

async function isAuthenticated(page) {
  return await page.locator('[data-testid="user-menu"], [data-auth="true"]').isVisible({ timeout: 1000 }).catch(() => false);
}

async function fillStripeTestCard(page) {
  // Wait for Stripe iframe
  await page.waitForSelector('iframe[src*="stripe"]', { timeout: 10000 });
  
  // Fill test card details
  await page.fill('[placeholder*="Card number"]', '4242424242424242');
  await page.fill('[placeholder*="MM"]', '12');
  await page.fill('[placeholder*="YY"]', '30');
  await page.fill('[placeholder*="CVC"]', '123');
  await page.fill('[placeholder*="ZIP"], [placeholder*="Postal"]', '12345');
}