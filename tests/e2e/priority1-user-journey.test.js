// Priority 1 User Journey Tests
// Tests the complete conversion-optimized flow: Landing → Analysis → Preview Results → Registration → Full Results

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_URL = 'https://anthropic.com'; // Known good URL for testing
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Priority 1 User Journey - Conversion Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('Complete Landing → Analysis → Preview → Registration → Full Results Flow', async ({ page }) => {
    // 1. Landing Page - Start Analysis
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toContainText('Optimize Your Site for');
    
    // Fill URL and start analysis
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // 2. PreviewAnalysis Component - Real-time Progress
    await expect(page.locator('h1')).toContainText('Analyzing Your Website', { timeout: 10000 });
    await expect(page.locator('text=Running real AI optimization analysis')).toBeVisible();
    await expect(page.locator(`text=${TEST_URL}`)).toBeVisible();
    
    // Verify progress elements
    await expect(page.locator('.bg-gray-200')).toBeVisible(); // Progress bar container
    await expect(page.locator('text=MASTERY-AI Framework v3.1.1')).toBeVisible();
    
    // Wait for progress to start (should see > 10%)
    await page.waitForFunction(() => {
      const progressText = document.querySelector('span:has-text("%")');
      if (progressText) {
        const percentage = parseInt(progressText.textContent);
        return percentage > 10;
      }
      return false;
    }, { timeout: 30000 });
    
    // Wait for analysis completion (progress = 100% or auto-navigation)
    await page.waitForFunction(() => {
      return window.location.pathname === '/preview-results' || 
             document.querySelector('text=Analysis Complete!') !== null;
    }, { timeout: 30000 });
    
    // 3. PreviewResults Component - Progressive Disclosure
    await expect(page.locator('h1')).toContainText('Your AI Optimization Analysis', { timeout: 5000 });
    
    // Verify real analysis data display
    await expect(page.locator('text=Real Analysis Complete!')).toBeVisible();
    await expect(page.locator(`text=${TEST_URL}`)).toBeVisible();
    
    // Check overall score is displayed
    const scoreElement = page.locator('.text-5xl.font-bold.text-blue-600');
    await expect(scoreElement).toBeVisible();
    const score = await scoreElement.textContent();
    expect(parseInt(score)).toBeGreaterThanOrEqual(30);
    expect(parseInt(score)).toBeLessThanOrEqual(95);
    
    // Verify 3 unlocked factors are shown
    const unlockedFactors = page.locator('.border.border-gray-200.rounded-lg.p-6');
    await expect(unlockedFactors).toHaveCount(3);
    
    // Verify locked content section
    await expect(page.locator('text=More Factors Available')).toBeVisible();
    await expect(page.locator('text=Get Free Account & See All Results')).toBeVisible();
    
    // 4. Registration Flow - Click Free Trial
    const freeTrialButton = page.locator('button', { hasText: 'Get Free Account & See All Results' });
    await freeTrialButton.click();
    
    // Should navigate to registration flow
    await expect(page.url()).toContain('registration-flow');
    
    // 5. Complete Registration (simulated - would need actual auth in real test)
    // For testing purposes, verify state persistence by checking sessionStorage
    const pendingUrl = await page.evaluate(() => sessionStorage.getItem('pendingAnalysisUrl'));
    const pendingId = await page.evaluate(() => sessionStorage.getItem('pendingAnalysisId'));
    const landingData = await page.evaluate(() => sessionStorage.getItem('landingAnalysisData'));
    
    expect(pendingUrl).toBe(TEST_URL);
    expect(pendingId).toBeTruthy();
    expect(landingData).toBeTruthy();
    
    // Verify analysis data integrity
    const analysisData = JSON.parse(landingData);
    expect(analysisData.results).toBeTruthy();
    expect(analysisData.results.overall_score).toBeGreaterThanOrEqual(30);
    expect(analysisData.results.factors).toBeTruthy();
    expect(Array.isArray(analysisData.results.factors)).toBe(true);
  });

  test('URL Validation and Error Handling', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    
    // Test empty URL
    await analyzeButton.click();
    await expect(page.locator('text=Please enter a valid URL')).toBeVisible();
    
    // Test invalid URL
    await urlInput.fill('invalid-url');
    await analyzeButton.click();
    await expect(page.locator('text=Please enter a valid URL')).toBeVisible();
    
    // Test URL without protocol (should auto-fix)
    await urlInput.fill('anthropic.com');
    await analyzeButton.click();
    
    // Should proceed to analysis with https:// added
    await expect(page.locator('text=Running real AI optimization analysis')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=https://anthropic.com')).toBeVisible();
  });

  test('Progress Tracking Reliability', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Monitor progress updates
    let progressValues = [];
    let messageChanges = [];
    
    // Collect progress data for 20 seconds or until completion
    const startTime = Date.now();
    while (Date.now() - startTime < 20000) {
      try {
        const progressElement = page.locator('span:has-text("%")');
        const messageElement = page.locator('.flex.items-center.gap-2 span:not(:has-text("%"))');
        
        if (await progressElement.isVisible()) {
          const progressText = await progressElement.textContent();
          const progress = parseInt(progressText);
          if (progress && !progressValues.includes(progress)) {
            progressValues.push(progress);
          }
        }
        
        if (await messageElement.isVisible()) {
          const message = await messageElement.textContent();
          if (message && !messageChanges.includes(message)) {
            messageChanges.push(message);
          }
        }
        
        // Check if analysis is complete
        if (await page.locator('text=Analysis Complete!').isVisible()) {
          break;
        }
        
        await page.waitForTimeout(1000);
      } catch (error) {
        // Continue if elements not found
        await page.waitForTimeout(1000);
      }
    }
    
    // Validate progress tracking
    expect(progressValues.length).toBeGreaterThan(3); // Should have multiple progress updates
    expect(progressValues[0]).toBeGreaterThanOrEqual(10); // Should start above 10%
    expect(progressValues[progressValues.length - 1]).toBeGreaterThanOrEqual(90); // Should reach near completion
    
    // Validate message changes
    expect(messageChanges.length).toBeGreaterThan(1); // Should have multiple status messages
    expect(messageChanges[0]).toContain('Initializing'); // Should start with initialization
  });

  test('Mobile Responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BASE_URL);
    
    // Test landing page on mobile
    await expect(page.locator('h1')).toBeVisible();
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await expect(urlInput).toBeVisible();
    
    // Test form interaction on mobile
    await urlInput.fill(TEST_URL);
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Verify analysis page is mobile-responsive
    await expect(page.locator('h1')).toContainText('Analyzing Your Website', { timeout: 10000 });
    
    // Check that progress elements are visible on mobile
    await expect(page.locator('.bg-gray-200')).toBeVisible(); // Progress bar
    await expect(page.locator('text=MASTERY-AI Framework')).toBeVisible();
    
    // Wait for results page
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Verify results page mobile layout
    await expect(page.locator('text=Real Analysis Complete!')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Get Free Account' })).toBeVisible();
  });

  test('State Persistence Through Browser Refresh', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Start analysis
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Wait for analysis to start
    await expect(page.locator('text=Running real AI optimization analysis')).toBeVisible({ timeout: 10000 });
    
    // Refresh browser during analysis
    await page.reload();
    
    // Should return to landing page (analysis state not persistent without auth)
    await expect(page.locator('h1')).toContainText('Optimize Your Site for');
    
    // Start analysis again and wait for completion
    await urlInput.fill(TEST_URL);
    await analyzeButton.click();
    
    // Wait for results
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Refresh browser on results page
    await page.reload();
    
    // State should be preserved through sessionStorage
    await expect(page.locator('h1')).toContainText('Your AI Optimization Analysis');
    await expect(page.locator('text=Real Analysis Complete!')).toBeVisible();
  });

  test('Conversion Flow CTAs and Upgrade Paths', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Complete analysis to reach preview results
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Wait for preview results
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 30000 });
    
    // Test upgrade CTA buttons
    const upgradeButtons = page.locator('button:has-text("Get Unlimited for $5/mo")');
    await expect(upgradeButtons.first()).toBeVisible();
    
    const freeAccountButtons = page.locator('button:has-text("Create Free Account")');
    await expect(freeAccountButtons.first()).toBeVisible();
    
    // Test unlock section visibility
    await expect(page.locator('text=More Factors Available')).toBeVisible();
    await expect(page.locator('.absolute.inset-0.bg-gray-900.bg-opacity-10')).toBeVisible(); // Lock overlay
    
    // Verify blurred preview content
    await expect(page.locator('.filter.blur-sm')).toBeVisible();
    await expect(page.locator('text=Complete Factor Analysis')).toBeVisible();
    
    // Test CTA button functionality
    await freeAccountButtons.first().click();
    
    // Should navigate to registration flow
    await page.waitForURL('**/registration-flow', { timeout: 5000 });
  });
});

test.describe('Performance Tests', () => {
  
  test('Analysis Completion Under 15 Seconds', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill('example.com'); // Fast, simple site for performance testing
    
    const startTime = Date.now();
    
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Wait for analysis completion
    await page.waitForFunction(() => {
      return document.querySelector('h1') && 
             document.querySelector('h1').textContent.includes('Your AI Optimization Analysis');
    }, { timeout: 18000 }); // Allow 18s timeout for 15s target + buffer
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Analysis completed in ${duration} seconds`);
    expect(duration).toBeLessThan(15); // Should complete within 15 seconds
  });

  test('UI Responsiveness During Analysis', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Monitor UI responsiveness during analysis
    const startTime = Date.now();
    let responsiveTimes = [];
    
    while (Date.now() - startTime < 20000) {
      const checkStart = Date.now();
      
      // Perform UI interactions to test responsiveness
      await page.hover('body');
      await page.mouse.move(100, 100);
      
      const checkEnd = Date.now();
      responsiveTimes.push(checkEnd - checkStart);
      
      // Check if analysis is complete
      if (await page.locator('text=Your AI Optimization Analysis').isVisible()) {
        break;
      }
      
      await page.waitForTimeout(1000);
    }
    
    // Verify UI stayed responsive (interactions under 100ms)
    const averageResponseTime = responsiveTimes.reduce((a, b) => a + b, 0) / responsiveTimes.length;
    expect(averageResponseTime).toBeLessThan(100);
  });
});

test.describe('Error Handling and Edge Cases', () => {
  
  test('Handle Analysis Timeout Gracefully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Test with a potentially slow URL
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill('httpbin.org/delay/10'); // Simulates slow response
    
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Wait longer than normal for timeout handling
    await page.waitForTimeout(65000); // Wait for Edge Function timeout
    
    // Should either complete or show appropriate error handling
    const hasResults = await page.locator('text=Your AI Optimization Analysis').isVisible();
    const hasError = await page.locator('text=error').isVisible();
    const hasTimeout = await page.locator('text=timeout').isVisible();
    
    expect(hasResults || hasError || hasTimeout).toBe(true);
  });

  test('Network Failure Recovery', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Start analysis
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    await urlInput.fill(TEST_URL);
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    await analyzeButton.click();
    
    // Simulate network disconnection during analysis
    await page.context().setOffline(true);
    await page.waitForTimeout(5000);
    
    // Reconnect network
    await page.context().setOffline(false);
    
    // Should recover and continue or restart gracefully
    await page.waitForTimeout(10000);
    
    // Verify some kind of reasonable state (not broken)
    const hasContent = await page.locator('h1').isVisible();
    expect(hasContent).toBe(true);
  });

  test('Invalid URL Edge Cases', async ({ page }) => {
    await page.goto(BASE_URL);
    
    const urlInput = page.locator('input[placeholder*="Enter your website URL"]');
    const analyzeButton = page.locator('button', { hasText: 'Analyze My Site' });
    
    const invalidUrls = [
      'javascript:alert(1)',
      'ftp://example.com',
      'http://localhost:9999',
      'https://nonexistent-domain-12345.com',
      'data:text/html,<script>alert(1)</script>'
    ];
    
    for (const invalidUrl of invalidUrls) {
      await urlInput.fill(invalidUrl);
      await analyzeButton.click();
      
      // Should either reject the URL or handle gracefully
      const hasError = await page.locator('text=valid URL').isVisible({ timeout: 5000 });
      const proceedsAnyway = await page.locator('text=Analyzing Your Website').isVisible({ timeout: 5000 });
      
      if (proceedsAnyway) {
        // If it proceeds, wait for completion or error
        await page.waitForTimeout(20000);
        // Navigate back to try next URL
        await page.goto(BASE_URL);
      } else {
        // Should show validation error
        expect(hasError).toBe(true);
      }
    }
  });
});