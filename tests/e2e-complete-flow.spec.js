// tests/e2e-complete-flow.spec.js - Comprehensive End-to-End Test Suite
// Tests the complete conversion-optimized user journey

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Complete E2E User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Landing Page Experience', () => {
    test('should display value proposition clearly', async ({ page }) => {
      // Check main headline
      await expect(page.locator('text=Is AI Stealing Your')).toBeVisible();
      
      // Check urgency banner
      await expect(page.locator('text=AI is reshaping search')).toBeVisible();
      
      // Check social proof
      await expect(page.locator('text=Trusted by 7 pioneering sites')).toBeVisible();
      
      // Check trust indicators
      await expect(page.locator('text=148')).toBeVisible();
      await expect(page.locator('text=AI Ranking Factors')).toBeVisible();
    });

    test('should display client showcase', async ({ page }) => {
      await expect(page.locator('text=FreeCalcHub')).toBeVisible();
      await expect(page.locator('text=Agent-11')).toBeVisible();
      await expect(page.locator('text=AI Search Mastery')).toBeVisible();
    });

    test('should have working URL input', async ({ page }) => {
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
      
      // Button should be disabled without URL
      await expect(analyzeButton).toBeDisabled();
      
      // Enter URL
      await urlInput.fill('example.com');
      await expect(analyzeButton).toBeEnabled();
    });
  });

  test.describe('Analysis Flow', () => {
    test('should show progress during analysis', async ({ page }) => {
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
      
      await urlInput.fill('example.com');
      await analyzeButton.click();
      
      // Should show progress messages
      await expect(page.locator('text=Analyzing Your AI Search Visibility')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=/Fetching|Analyzing|Checking/')).toBeVisible();
      
      // Progress bar should be visible
      await expect(page.locator('.bg-blue-600').first()).toBeVisible();
    });
  });

  test.describe('Teaser Results - Value Presentation', () => {
    test('should display analysis score and insights', async ({ page }) => {
      // Start analysis
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results
      await page.waitForSelector('text=Your AI Search Optimization Analysis', { timeout: 20000 });
      
      // Check score display
      await expect(page.locator('text=/\\d+\\/100/')).toBeVisible();
      
      // Check value proposition bar
      await expect(page.locator('text=Based on the MASTERY-AI Framework')).toBeVisible();
    });

    test('should show interactive factor tabs', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results
      await page.waitForSelector('text=Critical Issues', { timeout: 20000 });
      
      // Check tabs exist
      await expect(page.locator('text=🚨 Critical Issues')).toBeVisible();
      await expect(page.locator('text=⚡ Quick Wins')).toBeVisible();
      await expect(page.locator('text=✅ Strengths')).toBeVisible();
      
      // Test tab switching
      await page.locator('text=⚡ Quick Wins').click();
      await expect(page.locator('text=Transparency Standards')).toBeVisible();
      
      await page.locator('text=✅ Strengths').click();
      await expect(page.locator('text=HTTPS Security')).toBeVisible();
    });

    test('should show expandable factor details', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results and click a factor
      await page.waitForSelector('text=Citation-Worthy Content Structure', { timeout: 20000 });
      await page.locator('text=Citation-Worthy Content Structure').click();
      
      // Should show expanded details
      await expect(page.locator('text=How to Fix:')).toBeVisible();
      await expect(page.locator('text=Potential Impact:')).toBeVisible();
      await expect(page.locator('button:has-text("Get Detailed Fix")')).toBeVisible();
    });

    test('should display educational tooltips', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results
      await page.waitForSelector('text=MASTERY-AI Framework', { timeout: 20000 });
      
      // Hover over tooltip trigger
      await page.locator('text=MASTERY-AI Framework').hover();
      
      // Tooltip should appear
      await expect(page.locator('text=/industry standard|AI search optimization/')).toBeVisible();
    });
  });

  test.describe('Competitor Comparison', () => {
    test('should show competitor analysis', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for competitor section
      await page.waitForSelector('text=Competitor Analysis', { timeout: 20000 });
      
      // Check competitor scores
      await expect(page.locator('text=Industry Leader')).toBeVisible();
      await expect(page.locator('text=Top Competitor')).toBeVisible();
      await expect(page.locator('text=Your Website')).toBeVisible();
      
      // Check position summary
      await expect(page.locator('text=/ranked #\\d+ of \\d+/')).toBeVisible();
      
      // Check what leaders do better
      await expect(page.locator('text=What Industry Leaders Do Better')).toBeVisible();
    });

    test('should show traffic impact', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results
      await page.waitForSelector('text=traffic', { timeout: 20000 });
      
      // Check traffic loss indicators
      await expect(page.locator('text=/\\+\\d+% traffic/')).toBeVisible();
    });
  });

  test.describe('ROI Calculator', () => {
    test('should display ROI calculator', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for ROI calculator
      await page.waitForSelector('text=ROI Calculator', { timeout: 20000 });
      
      // Check input fields
      await expect(page.locator('text=Average Order Value')).toBeVisible();
      await expect(page.locator('text=Current Conversion Rate')).toBeVisible();
    });

    test('should calculate ROI dynamically', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for ROI calculator
      await page.waitForSelector('text=ROI Calculator', { timeout: 20000 });
      
      // Change average order value
      const aovInput = page.locator('input[type="number"]').first();
      await aovInput.clear();
      await aovInput.fill('200');
      
      // Should show updated calculations
      await expect(page.locator('text=Additional Revenue')).toBeVisible();
      await expect(page.locator('text=Return on Investment')).toBeVisible();
      await expect(page.locator('text=/\\+\\d+%/')).toBeVisible();
    });
  });

  test.describe('Smart Upgrade Prompts', () => {
    test('should show low-score prompt for poor scores', async ({ page }) => {
      // Navigate to results (score is 42, which is < 50)
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for smart prompt
      await page.waitForSelector('text=Your Score Needs Immediate Attention', { timeout: 20000 });
      
      // Check prompt content
      await expect(page.locator('text=/losing significant traffic/')).toBeVisible();
      await expect(page.locator('button:has-text("Start Recovering Traffic")')).toBeVisible();
    });

    test('should show engagement prompt after interactions', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for results
      await page.waitForSelector('text=Citation-Worthy Content', { timeout: 20000 });
      
      // Interact with multiple factors
      await page.locator('text=Citation-Worthy Content').click();
      await page.waitForTimeout(500);
      await page.locator('text=Title Tag Optimization').click();
      await page.waitForTimeout(500);
      await page.locator('text=Citation-Worthy Content').click();
      
      // Should show engagement prompt
      await expect(page.locator('text=/Discovering Important Issues|Get Full Access/')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Pricing Options', () => {
    test('should display three-tier pricing', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for pricing section
      await page.waitForSelector('text=Get Your Complete AI Optimization Roadmap', { timeout: 20000 });
      
      // Check all tiers
      await expect(page.locator('text=Professional').first()).toBeVisible();
      await expect(page.locator('text=Starter').first()).toBeVisible();
      await expect(page.locator('text=Free Trial').first()).toBeVisible();
      
      // Check recommended badge
      await expect(page.locator('text=RECOMMENDED')).toBeVisible();
      
      // Check pricing
      await expect(page.locator('text=$29')).toBeVisible();
      await expect(page.locator('text=$5')).toBeVisible();
      await expect(page.locator('text=$0')).toBeVisible();
    });

    test('should have CTA buttons for each tier', async ({ page }) => {
      // Navigate to results
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Wait for pricing section
      await page.waitForSelector('text=Go Professional', { timeout: 20000 });
      
      // Check CTAs
      await expect(page.locator('button:has-text("Go Professional")')).toBeVisible();
      await expect(page.locator('button:has-text("Choose Starter")')).toBeVisible();
      await expect(page.locator('button:has-text("Continue with Limited Free")')).toBeVisible();
    });
  });

  test.describe('Complete User Journey', () => {
    test('should complete full conversion flow', async ({ page }) => {
      // 1. Start on landing page
      await expect(page.locator('text=Is AI Stealing Your')).toBeVisible();
      
      // 2. Enter URL and analyze
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('mywebsite.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // 3. See analysis progress
      await expect(page.locator('text=Analyzing Your AI Search')).toBeVisible({ timeout: 5000 });
      
      // 4. View results
      await expect(page.locator('text=Your AI Search Optimization Analysis')).toBeVisible({ timeout: 20000 });
      
      // 5. Explore factors
      await page.locator('text=Citation-Worthy Content').click();
      await expect(page.locator('text=How to Fix')).toBeVisible();
      
      // 6. View competitor comparison
      await expect(page.locator('text=Competitor Analysis')).toBeVisible();
      
      // 7. Check ROI
      await expect(page.locator('text=ROI Calculator')).toBeVisible();
      
      // 8. See pricing options
      await expect(page.locator('text=Get Your Complete AI Optimization Roadmap')).toBeVisible();
      
      // 9. Click upgrade
      await page.locator('button:has-text("Go Professional")').click();
      
      // 10. Should trigger registration/auth flow
      // This would lead to AuthWithPassword component
      await expect(page.locator('text=/Sign In|Create Account|Create Your Account/')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check landing page
      await expect(page.locator('text=Is AI Stealing Your')).toBeVisible();
      
      // Enter URL
      const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
      await urlInput.fill('example.com');
      await page.locator('button:has-text("Analyze My Site Free")').click();
      
      // Should show results on mobile
      await expect(page.locator('text=/Your AI.*Analysis|Score/')).toBeVisible({ timeout: 20000 });
      
      // Tabs should be accessible
      await expect(page.locator('text=Critical Issues')).toBeVisible();
    });
  });
});

test.describe('Performance Tests', () => {
  test('should load landing page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds
  });

  test('should complete analysis within 15 seconds', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill('example.com');
    
    const startTime = Date.now();
    await page.locator('button:has-text("Analyze My Site Free")').click();
    
    // Wait for results to appear
    await page.waitForSelector('text=Your AI Search Optimization Analysis', { timeout: 20000 });
    
    const analysisTime = Date.now() - startTime;
    expect(analysisTime).toBeLessThan(15000); // Should complete in under 15 seconds
  });
});