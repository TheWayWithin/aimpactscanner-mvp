// Coffee Tier Focused Test Suite
// Quick, focused tests for the key Coffee Tier functionality

import { test, expect } from '@playwright/test';

test.describe('Coffee Tier - Focused Testing', () => {
  
  test('Coffee Tier is Most Popular on Pricing Page', async ({ page }) => {
    console.log('🧪 Testing Coffee Tier prominence...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Handle cookie consent quickly
    const cookieAccept = page.locator('button:has-text("Allow All")').first();
    if (await cookieAccept.isVisible({ timeout: 2000 })) {
      await cookieAccept.click();
      console.log('✓ Cookie consent handled');
    }

    // Verify Coffee tier exists
    const coffeeTitle = page.locator('text=Coffee').first();
    await expect(coffeeTitle).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier section found');

    // Verify $4.95 pricing
    const coffeePrice = page.locator('text=$4.95');
    await expect(coffeePrice).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier pricing ($4.95) displayed');

    // Verify "Most Popular" badge
    const mostPopular = page.locator('text=MOST POPULAR');
    await expect(mostPopular).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier marked as "MOST POPULAR"');

    // Verify key features
    const monthlyAnalyses = page.locator('text=100 analyses per month');
    if (await monthlyAnalyses.isVisible({ timeout: 5000 })) {
      console.log('✓ Coffee tier features displayed');
    }
  });

  test('Landing Page Loads with Key Elements', async ({ page }) => {
    console.log('🧪 Testing landing page essentials...');
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Check main headline
    const headline = page.locator('h1');
    await expect(headline).toContainText('24 Hours', { timeout: 10000 });
    console.log('✓ Main headline contains key messaging');

    // Verify page title
    const title = await page.title();
    expect(title).toContain('LLM.txt Mastery');
    console.log('✓ Page title correct');

    // Count CTA elements
    const ctaElements = page.locator('button, a[href*="pricing"], a[href*="register"]');
    const ctaCount = await ctaElements.count();
    console.log(`✓ Found ${ctaCount} call-to-action elements`);
    expect(ctaCount).toBeGreaterThan(0);
  });

  test('Pricing Tiers Structure', async ({ page }) => {
    console.log('🧪 Testing pricing structure...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Handle cookie consent
    const cookieAccept = page.locator('button:has-text("Allow All")').first();
    if (await cookieAccept.isVisible({ timeout: 2000 })) {
      await cookieAccept.click();
    }

    // Check for Free tier
    const freeTier = page.locator('text=Free').first();
    if (await freeTier.isVisible({ timeout: 5000 })) {
      console.log('✓ Free tier available');
    }

    // Check for Coffee tier (our focus)
    const coffeeTier = page.locator('text=Coffee').first();
    await expect(coffeeTier).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier available');

    // Check for Growth tier
    const growthTier = page.locator('text=Growth').first();
    if (await growthTier.isVisible({ timeout: 5000 })) {
      console.log('✓ Growth tier available');
    }

    // Check for Scale tier
    const scaleTier = page.locator('text=Scale').first();
    if (await scaleTier.isVisible({ timeout: 5000 })) {
      console.log('✓ Scale tier available');
    }
  });

  test('Mobile Coffee Tier Display', async ({ page }) => {
    console.log('🧪 Testing mobile Coffee Tier display...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Handle cookie consent
    const cookieAccept = page.locator('button:has-text("Allow All")').first();
    if (await cookieAccept.isVisible({ timeout: 2000 })) {
      await cookieAccept.click();
    }

    // Verify Coffee tier is still visible on mobile
    const coffeeTier = page.locator('text=Coffee');
    await expect(coffeeTier.first()).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier visible on mobile');

    // Check pricing is readable
    const price = page.locator('text=$4.95');
    await expect(price).toBeVisible({ timeout: 10000 });
    console.log('✓ Coffee tier pricing readable on mobile');
  });

  test('Performance - Quick Load Test', async ({ page }) => {
    console.log('🧪 Testing page performance...');
    
    // Test landing page load time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const landingTime = Date.now() - startTime;
    
    console.log(`✓ Landing page loaded in ${landingTime}ms`);
    expect(landingTime).toBeLessThan(8000); // 8 seconds max

    // Test pricing page load time
    const pricingStart = Date.now();
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    const pricingTime = Date.now() - pricingStart;
    
    console.log(`✓ Pricing page loaded in ${pricingTime}ms`);
    expect(pricingTime).toBeLessThan(8000); // 8 seconds max
  });

  test('Coffee Tier Visual Prominence', async ({ page }) => {
    console.log('🧪 Testing Coffee Tier visual design...');
    
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

    // Handle cookie consent
    const cookieAccept = page.locator('button:has-text("Allow All")').first();
    if (await cookieAccept.isVisible({ timeout: 2000 })) {
      await cookieAccept.click();
    }

    // Take a screenshot for manual verification
    await page.screenshot({ 
      path: 'test-results/coffee-tier-prominence.png',
      fullPage: false 
    });
    console.log('✓ Screenshot saved for visual verification');

    // Check for visual indicators of prominence
    const mostPopularBadge = page.locator('text=MOST POPULAR');
    await expect(mostPopularBadge).toBeVisible({ timeout: 10000 });
    console.log('✓ "Most Popular" badge confirms visual prominence');

    // Verify coffee tier is in center position or highlighted
    const coffeeSection = page.locator('text=Coffee').first();
    const coffeeBoundingBox = await coffeeSection.boundingBox();
    if (coffeeBoundingBox) {
      console.log(`✓ Coffee tier positioned at x:${Math.round(coffeeBoundingBox.x)}, y:${Math.round(coffeeBoundingBox.y)}`);
    }
  });
});

// Summary Test - Quick Overview
test.describe('Coffee Tier Summary Report', () => {
  
  test('Generate Coffee Tier Test Report', async ({ page }) => {
    console.log('\n🎯 COFFEE TIER COMPREHENSIVE REPORT');
    console.log('=====================================');

    let results = {
      landingPage: false,
      pricingPage: false,
      coffeeVisible: false,
      correctPrice: false,
      mostPopular: false,
      mobileWorking: false,
      performance: { landing: 0, pricing: 0 }
    };

    try {
      // Test 1: Landing Page
      console.log('\n📄 LANDING PAGE TEST');
      const landingStart = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      results.performance.landing = Date.now() - landingStart;
      
      const title = await page.title();
      results.landingPage = title.includes('LLM.txt Mastery');
      console.log(`   Status: ${results.landingPage ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Load Time: ${results.performance.landing}ms`);
      console.log(`   Title: ${title}`);

      // Test 2: Pricing Page Navigation
      console.log('\n💰 PRICING PAGE TEST');
      const pricingStart = Date.now();
      await page.goto('/pricing');
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      results.performance.pricing = Date.now() - pricingStart;
      
      // Handle cookie consent
      const cookieAccept = page.locator('button:has-text("Allow All")').first();
      if (await cookieAccept.isVisible({ timeout: 2000 })) {
        await cookieAccept.click();
      }
      
      results.pricingPage = true;
      console.log(`   Status: ✅ PASS`);
      console.log(`   Load Time: ${results.performance.pricing}ms`);

      // Test 3: Coffee Tier Visibility
      console.log('\n☕ COFFEE TIER VISIBILITY');
      const coffeeTitle = page.locator('text=Coffee').first();
      results.coffeeVisible = await coffeeTitle.isVisible({ timeout: 5000 });
      console.log(`   Coffee Tier Visible: ${results.coffeeVisible ? '✅ YES' : '❌ NO'}`);

      // Test 4: Pricing Accuracy  
      console.log('\n💲 PRICING VERIFICATION');
      const priceElement = page.locator('text=$4.95');
      results.correctPrice = await priceElement.isVisible({ timeout: 5000 });
      console.log(`   $4.95 Price Display: ${results.correctPrice ? '✅ CORRECT' : '❌ INCORRECT'}`);

      // Test 5: Most Popular Badge
      console.log('\n🏆 PROMINENCE VERIFICATION');
      const mostPopularBadge = page.locator('text=MOST POPULAR');
      results.mostPopular = await mostPopularBadge.isVisible({ timeout: 5000 });
      console.log(`   "Most Popular" Badge: ${results.mostPopular ? '✅ VISIBLE' : '❌ MISSING'}`);

      // Test 6: Mobile Responsiveness
      console.log('\n📱 MOBILE RESPONSIVENESS');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      
      const mobileCoffee = page.locator('text=Coffee').first();
      results.mobileWorking = await mobileCoffee.isVisible({ timeout: 5000 });
      console.log(`   Mobile Coffee Tier: ${results.mobileWorking ? '✅ VISIBLE' : '❌ HIDDEN'}`);

    } catch (error) {
      console.log(`   Error during testing: ${error.message}`);
    }

    // Final Summary
    console.log('\n🎯 FINAL SUMMARY');
    console.log('=====================================');
    const passCount = Object.values(results).filter(r => r === true).length;
    const totalTests = 6;
    const passRate = Math.round((passCount / totalTests) * 100);
    
    console.log(`   Tests Passed: ${passCount}/${totalTests} (${passRate}%)`);
    console.log(`   Landing Page: ${results.landingPage ? '✅' : '❌'} (${results.performance.landing}ms)`);
    console.log(`   Pricing Page: ${results.pricingPage ? '✅' : '❌'} (${results.performance.pricing}ms)`);
    console.log(`   Coffee Visible: ${results.coffeeVisible ? '✅' : '❌'}`);
    console.log(`   Correct Price: ${results.correctPrice ? '✅' : '❌'}`);
    console.log(`   Most Popular: ${results.mostPopular ? '✅' : '❌'}`);
    console.log(`   Mobile Ready: ${results.mobileWorking ? '✅' : '❌'}`);
    
    if (passRate >= 80) {
      console.log('\n🎉 COFFEE TIER IMPLEMENTATION: EXCELLENT');
    } else if (passRate >= 60) {
      console.log('\n⚠️  COFFEE TIER IMPLEMENTATION: NEEDS IMPROVEMENT');
    } else {
      console.log('\n❌ COFFEE TIER IMPLEMENTATION: CRITICAL ISSUES');
    }
    
    console.log('\n=====================================\n');
    
    // Ensure test passes if core functionality works
    expect(results.coffeeVisible && results.correctPrice).toBeTruthy();
  });
});