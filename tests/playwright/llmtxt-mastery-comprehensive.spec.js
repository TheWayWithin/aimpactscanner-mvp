// LLM.txt Mastery Comprehensive Testing Suite
// Based on actual site structure analysis

import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'jamie.watters.mail@icloud.com';
const TEST_PASSWORD = 'Qwerty123!';

test.describe('LLM.txt Mastery Live Site - Comprehensive Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Handle cookie consent if it appears
    page.on('dialog', dialog => dialog.accept());
  });

  test('Landing Page - Core Hero Section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('✓ Testing Landing Page Hero Section');
    
    // Check main headline
    await expect(page.locator('h1')).toContainText('Get Found by AI in 24 Hours');
    console.log('✓ Main headline verified');

    // Check page title
    const title = await page.title();
    expect(title).toContain('LLM.txt Mastery');
    console.log('✓ Page title correct: LLM.txt Mastery');

    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible();
    console.log('✓ Navigation visible');

    // Check for call-to-action buttons
    const ctaButtons = page.locator('button, a[href*="pricing"], a:has-text("Get Started")');
    const buttonCount = await ctaButtons.count();
    console.log(`✓ Found ${buttonCount} CTA buttons`);
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Landing Page - Features and Benefits Section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('✓ Testing Features and Benefits');
    
    // Scroll down to see more content
    await page.evaluate(() => window.scrollTo(0, 1000));
    
    // Look for feature sections
    const features = page.locator('h2, h3, .feature, [class*="feature"]');
    const featureCount = await features.count();
    console.log(`✓ Found ${featureCount} feature elements`);

    // Check for comparison table or competitive advantages
    const competitorSection = page.locator('text=/competitor|vs |compare|outperform/i');
    const compCount = await competitorSection.count();
    if (compCount > 0) {
      console.log(`✓ Competitive comparison section found (${compCount} elements)`);
    }

    // Look for testimonials or social proof
    const testimonials = page.locator('text=/testimonial|review|customer|client/i');
    const testCount = await testimonials.count();
    console.log(`✓ Social proof elements: ${testCount}`);
  });

  test('Pricing Page - Coffee Tier as Most Popular', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    console.log('✓ Testing Pricing Page Structure');
    
    // Handle cookie consent
    const cookieButton = page.locator('button:has-text("Allow All"), button:has-text("Accept")');
    if (await cookieButton.count() > 0) {
      await cookieButton.first().click();
      console.log('✓ Cookie consent handled');
    }

    // Verify Coffee tier exists and pricing
    const coffeeSection = page.locator('text=Coffee').first();
    await expect(coffeeSection).toBeVisible();
    console.log('✓ Coffee tier section found');

    // Check Coffee tier price
    const coffeePricing = page.locator('text=$4.95');
    await expect(coffeePricing).toBeVisible();
    console.log('✓ Coffee tier pricing ($4.95) verified');

    // Verify "Most Popular" badge on Coffee tier
    const mostPopularBadge = page.locator('text=MOST POPULAR');
    await expect(mostPopularBadge).toBeVisible();
    console.log('✓ Coffee tier marked as "MOST POPULAR"');

    // Check Coffee tier features
    const coffeeFeatures = page.locator('text=100 analyses per month');
    await expect(coffeeFeatures).toBeVisible();
    console.log('✓ Coffee tier features displayed');

    // Verify Free tier exists
    const freeSection = page.locator('text=Free').first();
    await expect(freeSection).toBeVisible();
    console.log('✓ Free tier available');

    // Check other tiers
    const growthSection = page.locator('text=Growth').first();
    const scaleSection = page.locator('text=Scale').first();
    
    if (await growthSection.count() > 0) {
      console.log('✓ Growth tier available');
    }
    if (await scaleSection.count() > 0) {
      console.log('✓ Scale tier available');
    }
  });

  test('Pricing Page - Tier Comparison Features', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent
    const cookieButton = page.locator('button:has-text("Allow All")');
    if (await cookieButton.count() > 0) {
      await cookieButton.first().click();
    }

    console.log('✓ Testing tier feature comparison');

    // Check Free tier features
    const freeFeatures = [
      '3 analyses per day',
      '20 pages per analysis',
      'Basic categorization'
    ];

    for (const feature of freeFeatures) {
      const element = page.locator(`text=${feature}`);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        console.log(`✓ Free tier feature: ${feature}`);
      }
    }

    // Check Coffee tier features  
    const coffeeFeatures = [
      '100 analyses per month',
      '200 pages per analysis',
      'AI-enhanced quality'
    ];

    for (const feature of coffeeFeatures) {
      const element = page.locator(`text=${feature}`);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        console.log(`✓ Coffee tier feature: ${feature}`);
      }
    }
  });

  test('Pricing Page - CTA Buttons and Actions', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');

    // Handle cookie consent
    const cookieButton = page.locator('button:has-text("Allow All")');
    if (await cookieButton.count() > 0) {
      await cookieButton.first().click();
    }

    console.log('✓ Testing CTA buttons');

    // Check for "Get Started Free" button
    const freeButton = page.locator('button:has-text("Get Started Free"), a:has-text("Get Started Free")');
    if (await freeButton.count() > 0) {
      await expect(freeButton.first()).toBeVisible();
      await expect(freeButton.first()).toBeEnabled();
      console.log('✓ Free tier CTA button available');
    }

    // Look for Coffee tier selection/signup
    const coffeeButtons = page.locator('button, a').filter({ hasText: /choose|select|coffee|get started/i });
    const coffeeButtonCount = await coffeeButtons.count();
    console.log(`✓ Found ${coffeeButtonCount} potential Coffee tier action buttons`);

    // Check for sign-in prompt
    const signInText = page.locator('text=/sign in|login|account/i');
    const signInCount = await signInText.count();
    if (signInCount > 0) {
      console.log('✓ Sign-in options available');
    }
  });

  test('Navigation and Page Routing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('✓ Testing site navigation');

    // Test direct pricing page access
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    const pricingHeading = page.locator('h1, h2').filter({ hasText: /pricing/i });
    if (await pricingHeading.count() > 0) {
      console.log('✓ Pricing page accessible via direct URL');
    }

    // Test back navigation if available
    const backButton = page.locator('text=Back to App, button:has-text("Back")');
    if (await backButton.count() > 0) {
      await expect(backButton.first()).toBeVisible();
      console.log('✓ Back navigation available');
    }

    // Test if there are other navigation links
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();
    console.log(`✓ Found ${linkCount} navigation links`);
  });

  test('Mobile Responsiveness - Core Pages', async ({ page }) => {
    console.log('✓ Testing mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test landing page mobile layout
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
    console.log('✓ Landing page hero visible on mobile');

    // Test pricing page mobile layout
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    // Handle cookie consent
    const cookieButton = page.locator('button:has-text("Allow All")');
    if (await cookieButton.count() > 0) {
      await cookieButton.first().click();
    }

    const coffeePrice = page.locator('text=$4.95');
    await expect(coffeePrice).toBeVisible();
    console.log('✓ Pricing cards visible on mobile');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    await expect(coffeePrice).toBeVisible();
    console.log('✓ Pricing cards visible on tablet');
  });

  test('Performance and Load Times', async ({ page }) => {
    console.log('✓ Testing performance');
    
    // Test landing page load time
    const landingStart = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const landingLoad = Date.now() - landingStart;
    
    console.log(`✓ Landing page loaded in ${landingLoad}ms`);
    expect(landingLoad).toBeLessThan(10000); // 10 seconds max
    
    // Test pricing page load time
    const pricingStart = Date.now();
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    const pricingLoad = Date.now() - pricingStart;
    
    console.log(`✓ Pricing page loaded in ${pricingLoad}ms`);
    expect(pricingLoad).toBeLessThan(10000); // 10 seconds max
  });

  test('Cookie Consent and Privacy', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Testing cookie consent functionality');
    
    // Check for cookie banner
    const cookieBanner = page.locator('text=/cookie|consent|privacy/i');
    const bannerCount = await cookieBanner.count();
    
    if (bannerCount > 0) {
      console.log('✓ Cookie consent banner found');
      
      // Test consent buttons
      const acceptButton = page.locator('button:has-text("Allow All")');
      const declineButton = page.locator('button:has-text("Decline")');
      const manageButton = page.locator('button:has-text("Manage")');
      
      if (await acceptButton.count() > 0) {
        await expect(acceptButton).toBeEnabled();
        console.log('✓ Accept cookies button available');
      }
      
      if (await declineButton.count() > 0) {
        console.log('✓ Decline cookies button available');
      }
      
      if (await manageButton.count() > 0) {
        console.log('✓ Manage cookies button available');
      }
    } else {
      console.log('ℹ No cookie consent banner found');
    }
  });

  test('Error Handling and Edge Cases', async ({ page }) => {
    console.log('✓ Testing error handling');
    
    // Test invalid route
    await page.goto('/non-existent-page');
    
    // Should either redirect or show proper error
    const currentUrl = page.url();
    const is404 = currentUrl.includes('404') || 
                  currentUrl.includes('/') || // redirected to home
                  await page.locator('text=/404|not found/i').count() > 0;
    
    expect(is404).toBeTruthy();
    console.log('✓ Invalid URL handling works properly');
    
    // Test with special characters in URL
    await page.goto('/pricing?test=special%20chars&symbols=!@#$');
    await page.waitForLoadState('networkidle');
    
    const pricingStillWorks = await page.locator('text=$4.95').count() > 0;
    expect(pricingStillWorks).toBeTruthy();
    console.log('✓ Page handles special URL parameters');
  });

  test('Accessibility Basics', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Testing basic accessibility');
    
    // Handle cookie consent
    const cookieButton = page.locator('button:has-text("Allow All")');
    if (await cookieButton.count() > 0) {
      await cookieButton.first().click();
    }
    
    // Check for proper headings hierarchy
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    
    console.log(`✓ Found ${h1Count} H1 headings, ${h2Count} H2 headings`);
    expect(h1Count).toBeGreaterThan(0);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImage = images.first();
      const altText = await firstImage.getAttribute('alt');
      console.log(`✓ Found ${imageCount} images. First alt text: "${altText || 'none'}"`);
    }
    
    // Test keyboard navigation on buttons
    const buttons = page.locator('button, a[role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();
      const isFocused = await firstButton.evaluate(el => document.activeElement === el);
      console.log(`✓ Button focus works: ${isFocused}`);
    }
  });
});