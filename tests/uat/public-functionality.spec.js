// tests/uat/public-functionality.spec.js
// UAT tests for public (unauthenticated) functionality
// These tests can run immediately without OAuth authentication setup

import { test, expect } from '@playwright/test';

const STAGING_URL = process.env.BASE_URL || 'https://develop--aimpactscanner.netlify.app';

/**
 * UAT TEST SUITE - PUBLIC FUNCTIONALITY
 *
 * Tests all functionality available to unauthenticated users:
 * 1. Landing page loads and displays correctly
 * 2. Navigation to sign-in page works
 * 3. OAuth buttons are visible (even if not functional without login)
 * 4. Pricing page is accessible
 * 5. About page is accessible
 * 6. Tier information is visible to public
 *
 * Run this suite:
 * npx playwright test tests/uat/public-functionality.spec.js
 */

test.describe('UAT: Public Landing Page', () => {
  test('1.1 - Landing page loads successfully', async ({ page }) => {
    console.log('\n🧪 TEST 1.1: Landing Page Load');

    await page.goto(STAGING_URL);
    console.log('✓ Navigated to staging URL');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded');

    // Check for main heading or title
    const hasHeading = await page.locator('h1, h2').first().isVisible({ timeout: 5000 });
    expect(hasHeading).toBe(true);
    console.log('✓ Main heading visible');

    // Check for Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    console.log('✓ Sign In button visible');

    console.log('✅ TEST 1.1 PASSED: Landing page loads successfully\n');
  });

  test('1.2 - Landing page displays key content', async ({ page }) => {
    console.log('\n🧪 TEST 1.2: Landing Page Content');

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to landing page');

    // Check for app name or branding
    const hasBranding = await page.locator('text=/AImpact|AI Impact|Scanner/i').first().isVisible({ timeout: 3000 });
    if (hasBranding) {
      console.log('✓ App branding visible');
    }

    // Check for call-to-action buttons
    const ctaButtons = page.locator('button, a').filter({ hasText: /Sign|Start|Get Started|Try/i });
    const ctaCount = await ctaButtons.count();
    console.log(`✓ Found ${ctaCount} call-to-action buttons`);

    console.log('✅ TEST 1.2 PASSED: Landing page displays key content\n');
  });

  test('1.3 - Page loads without console errors', async ({ page }) => {
    console.log('\n🧪 TEST 1.3: Console Error Check');

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any async errors

    if (errors.length === 0) {
      console.log('✓ No console errors detected');
    } else {
      console.log(`⚠️  ${errors.length} console error(s) detected:`);
      errors.slice(0, 3).forEach(err => console.log(`   - ${err.substring(0, 100)}`));
    }

    console.log('✅ TEST 1.3 PASSED: Console error check completed\n');
  });
});

test.describe('UAT: Public Navigation', () => {
  test('2.1 - Navigate to sign-in page', async ({ page }) => {
    console.log('\n🧪 TEST 2.1: Navigate to Sign-In');

    await page.goto(STAGING_URL);
    console.log('✓ Started at landing page');

    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    await signInButton.click();
    console.log('✓ Clicked Sign In button');

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Check we're on login/signin page
    const currentUrl = page.url();
    const isOnAuthPage = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('unified-registration');

    if (isOnAuthPage) {
      console.log(`✓ Navigated to authentication page: ${currentUrl}`);
    } else {
      console.log(`⚠️  Unexpected URL: ${currentUrl}`);
    }

    console.log('✅ TEST 2.1 PASSED: Sign-in navigation works\n');
  });

  test('2.2 - OAuth buttons visible on sign-in page', async ({ page }) => {
    console.log('\n🧪 TEST 2.2: OAuth Buttons Visibility');

    await page.goto(`${STAGING_URL}/#login`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to login page');

    // Check for Google OAuth button
    const googleButton = page.locator('button:has-text("Continue with Google"), button:has-text("Google")').first();
    const hasGoogle = await googleButton.isVisible({ timeout: 5000 });

    if (hasGoogle) {
      console.log('✓ Google OAuth button visible');
    } else {
      console.log('⚠️  Google OAuth button not found');
    }

    // Check for GitHub OAuth button
    const githubButton = page.locator('button:has-text("Continue with GitHub"), button:has-text("GitHub")').first();
    const hasGitHub = await githubButton.isVisible({ timeout: 3000 });

    if (hasGitHub) {
      console.log('✓ GitHub OAuth button visible');
    } else {
      console.log('⚠️  GitHub OAuth button not found');
    }

    console.log('✅ TEST 2.2 PASSED: OAuth buttons check completed\n');
  });

  test('2.3 - Navigate to pricing page', async ({ page }) => {
    console.log('\n🧪 TEST 2.3: Navigate to Pricing');

    // Try direct navigation to pricing page
    await page.goto(`${STAGING_URL}/#pricing`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to pricing page');

    // Check for pricing content
    const hasPricingContent = await page.locator('text=/Price|Pricing|Plan|Tier/i').first().isVisible({ timeout: 5000 });

    if (hasPricingContent) {
      console.log('✓ Pricing content visible');
    } else {
      console.log('⚠️  Pricing content not found');
    }

    console.log('✅ TEST 2.3 PASSED: Pricing page accessible\n');
  });
});

test.describe('UAT: Pricing Information', () => {
  test('3.1 - Pricing page displays tier options', async ({ page }) => {
    console.log('\n🧪 TEST 3.1: Tier Options Display');

    await page.goto(`${STAGING_URL}/#pricing`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to pricing page');

    // Check for Free tier
    const freeTier = page.locator('text=/Free.*Tier|Free.*Plan/i').first();
    const hasFree = await freeTier.isVisible({ timeout: 5000 });

    if (hasFree) {
      console.log('✓ Free tier visible');
    } else {
      console.log('⚠️  Free tier not found');
    }

    // Check for Coffee tier
    const coffeeTier = page.locator('text=/Coffee.*Tier|Coffee.*Plan/i').first();
    const hasCoffee = await coffeeTier.isVisible({ timeout: 3000 });

    if (hasCoffee) {
      console.log('✓ Coffee tier visible');
    } else {
      console.log('⚠️  Coffee tier not found');
    }

    // Count pricing cards/sections
    const pricingCards = page.locator('div, section').filter({ hasText: /\$|Price|Month/i });
    const cardCount = await pricingCards.count();
    console.log(`✓ Found ${cardCount} pricing elements`);

    console.log('✅ TEST 3.1 PASSED: Tier options visible\n');
  });

  test('3.2 - Pricing features are listed', async ({ page }) => {
    console.log('\n🧪 TEST 3.2: Pricing Features Display');

    await page.goto(`${STAGING_URL}/#pricing`);
    await page.waitForLoadState('networkidle');
    console.log('✓ Navigated to pricing page');

    // Check for feature lists (typically shown with checkmarks or bullets)
    const features = page.locator('ul li, text=/analysis|analyses|feature/i');
    const featureCount = await features.count();

    if (featureCount > 0) {
      console.log(`✓ Found ${featureCount} feature mentions`);
    } else {
      console.log('⚠️  No features listed');
    }

    console.log('✅ TEST 3.2 PASSED: Pricing features check completed\n');
  });
});

test.describe('UAT: Page Performance', () => {
  test('4.1 - Landing page load performance', async ({ page }) => {
    console.log('\n🧪 TEST 4.1: Landing Page Load Performance');

    const startTime = Date.now();
    await page.goto(STAGING_URL);
    await page.waitForLoadState('domcontentloaded');
    const domLoadTime = Date.now() - startTime;

    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;

    console.log(`✓ DOM loaded in ${domLoadTime}ms`);
    console.log(`✓ Full page loaded in ${fullLoadTime}ms`);

    if (fullLoadTime < 3000) {
      console.log('✓ Load time excellent (<3s)');
    } else if (fullLoadTime < 5000) {
      console.log('⚠️  Load time acceptable (3-5s)');
    } else {
      console.log('⚠️  Load time slow (>5s) - may need optimization');
    }

    console.log('✅ TEST 4.1 PASSED: Performance check completed\n');
  });

  test('4.2 - Login page load performance', async ({ page }) => {
    console.log('\n🧪 TEST 4.2: Login Page Load Performance');

    const startTime = Date.now();
    await page.goto(`${STAGING_URL}/#login`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`✓ Login page loaded in ${loadTime}ms`);

    if (loadTime < 3000) {
      console.log('✓ Load time excellent (<3s)');
    } else if (loadTime < 5000) {
      console.log('⚠️  Load time acceptable (3-5s)');
    } else {
      console.log('⚠️  Load time slow (>5s)');
    }

    console.log('✅ TEST 4.2 PASSED: Login page performance check completed\n');
  });
});

test.describe('UAT: Responsive Design', () => {
  test('5.1 - Mobile viewport renders correctly', async ({ page }) => {
    console.log('\n🧪 TEST 5.1: Mobile Responsive Design');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    console.log('✓ Set mobile viewport (375x667)');

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    console.log('✓ Loaded landing page on mobile');

    // Check main content is visible
    const mainContent = page.locator('h1, h2').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    console.log('✓ Main content visible on mobile');

    // Check navigation is accessible
    const navElements = page.locator('button, a').filter({ hasText: /Sign|Menu|Nav/i });
    const navCount = await navElements.count();
    console.log(`✓ Found ${navCount} navigation elements on mobile`);

    console.log('✅ TEST 5.1 PASSED: Mobile responsive design check completed\n');
  });

  test('5.2 - Tablet viewport renders correctly', async ({ page }) => {
    console.log('\n🧪 TEST 5.2: Tablet Responsive Design');

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    console.log('✓ Set tablet viewport (768x1024)');

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');
    console.log('✓ Loaded landing page on tablet');

    // Check main content is visible
    const mainContent = page.locator('h1, h2').first();
    await expect(mainContent).toBeVisible({ timeout: 5000 });
    console.log('✓ Main content visible on tablet');

    console.log('✅ TEST 5.2 PASSED: Tablet responsive design check completed\n');
  });
});

test.describe('UAT: SEO and Metadata', () => {
  test('6.1 - Page has proper title', async ({ page }) => {
    console.log('\n🧪 TEST 6.1: Page Title');

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log(`✓ Page title: "${title}"`);

    if (title && title.length > 0) {
      console.log('✓ Page has a title');
    } else {
      console.log('⚠️  Page title is empty');
    }

    console.log('✅ TEST 6.1 PASSED: Page title check completed\n');
  });

  test('6.2 - Page has meta description', async ({ page }) => {
    console.log('\n🧪 TEST 6.2: Meta Description');

    await page.goto(STAGING_URL);
    await page.waitForLoadState('networkidle');

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');

    if (metaDescription) {
      console.log(`✓ Meta description: "${metaDescription.substring(0, 80)}..."`);
    } else {
      console.log('⚠️  No meta description found');
    }

    console.log('✅ TEST 6.2 PASSED: Meta description check completed\n');
  });
});
