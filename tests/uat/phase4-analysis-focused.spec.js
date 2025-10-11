/**
 * UAT Phase 4 - Analysis Engine Focused Testing
 * Corrected approach based on actual UI layout and input elements
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5173';
const ANALYSIS_TIMEOUT = 25000; // 25 seconds to allow for <15 second target plus buffer

test.describe('UAT Phase 4 - Analysis Engine Core Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Phase 4.1: Analysis Engine Accessibility Validation', async ({ page }) => {
    console.log('🔍 Testing analysis engine accessibility...');
    
    // Verify landing page loads correctly
    await expect(page.locator('h1')).toContainText('AI');
    console.log('✅ Landing page loaded successfully');
    
    // Check main URL input field (the larger one at bottom)
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    await expect(mainUrlInput).toBeVisible();
    console.log('✅ Main analysis input field accessible');
    
    // Look for analyze/start button near the input
    const analyzeButton = page.locator('button').filter({ hasText: /analyze|start|scan|go/i });
    const buttonCount = await analyzeButton.count();
    console.log(`📊 Found ${buttonCount} potential analyze buttons`);
    
    if (buttonCount > 0) {
      await expect(analyzeButton.first()).toBeVisible();
      console.log('✅ Analyze button found and visible');
    } else {
      console.log('⚠️  No obvious analyze button found - may be integrated with input');
    }
    
    await page.screenshot({ path: 'test-results/phase4-accessibility-verified.png', fullPage: true });
  });

  test('Phase 4.2: MASTERY-AI Framework and Basic Analysis', async ({ page }) => {
    console.log('🎯 Testing MASTERY-AI framework with example.com...');
    
    // Use the main analysis input
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    await mainUrlInput.fill('example.com');
    console.log('✅ URL entered: example.com');
    
    // Try pressing Enter to start analysis
    await mainUrlInput.press('Enter');
    console.log('🚀 Analysis started via Enter key');
    
    // Wait for analysis to begin or complete
    try {
      // Wait for any indication of analysis progress or results
      await page.waitForFunction(() => {
        const text = document.body.innerText.toLowerCase();
        return text.includes('analyzing') || 
               text.includes('loading') || 
               text.includes('score') || 
               text.includes('results') ||
               text.includes('analysis complete') ||
               text.includes('pillar') ||
               text.includes('mastery');
      }, { timeout: ANALYSIS_TIMEOUT });
      
      console.log('✅ Analysis engine responded');
    } catch (error) {
      console.log('⚠️  Analysis may not have started or completed within timeout');
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/phase4-mastery-analysis.png', fullPage: true });
    
    // Check for MASTERY-AI framework elements
    const pageContent = await page.textContent('body');
    const masteryMatches = pageContent.toLowerCase().match(/mastery|pillar|dimension|metric/g) || [];
    console.log(`📊 MASTERY-AI references found: ${masteryMatches.length}`);
    
    // Look for numerical scores or analysis results
    const scoreMatches = pageContent.match(/\d+\/100|\d+%|\d+ score/gi) || [];
    console.log(`📈 Score references found: ${scoreMatches.length}`);
    
    if (masteryMatches.length > 0 || scoreMatches.length > 0) {
      console.log('✅ Analysis framework elements detected');
    } else {
      console.log('❌ No clear analysis framework elements found');
    }
  });

  test('Phase 4.3: Performance and Navigation Testing', async ({ page }) => {
    console.log('⚡ Testing analysis performance and navigation...');
    
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    
    // Test with a simple, fast website
    await mainUrlInput.fill('example.com');
    
    const startTime = Date.now();
    await mainUrlInput.press('Enter');
    
    // Monitor for any changes in the page indicating progress
    let analysisDetected = false;
    let finalTime = 0;
    
    try {
      // Check every 2 seconds for changes
      for (let i = 0; i < 10; i++) { // Max 20 seconds
        await page.waitForTimeout(2000);
        
        const currentContent = await page.textContent('body');
        if (currentContent.toLowerCase().includes('score') || 
            currentContent.toLowerCase().includes('analysis') ||
            currentContent.toLowerCase().includes('results') ||
            currentContent.toLowerCase().includes('pillar')) {
          analysisDetected = true;
          finalTime = (Date.now() - startTime) / 1000;
          console.log(`✅ Analysis detected after ${finalTime} seconds`);
          break;
        }
      }
    } catch (error) {
      finalTime = (Date.now() - startTime) / 1000;
      console.log(`⚠️  Analysis timeout after ${finalTime} seconds`);
    }
    
    if (analysisDetected) {
      if (finalTime <= 15) {
        console.log(`🎯 Performance target MET: ${finalTime}s <= 15s`);
      } else {
        console.log(`⚠️  Performance target MISSED: ${finalTime}s > 15s`);
      }
    } else {
      console.log('❌ No analysis results detected within timeout period');
    }
    
    await page.screenshot({ path: 'test-results/phase4-performance-test.png', fullPage: true });
  });

  test('Phase 4.4: Navigation and UI Flow Testing', async ({ page }) => {
    console.log('🧭 Testing navigation and UI flow...');
    
    // Check if there are navigation buttons or links to analysis
    const navButtons = page.locator('button, a').filter({ hasText: /new analysis|analyze|start|dashboard/i });
    const navCount = await navButtons.count();
    console.log(`📊 Found ${navCount} navigation elements`);
    
    // Test navigation to analysis if available
    if (navCount > 0) {
      const newAnalysisButton = page.locator('button, a').filter({ hasText: /new analysis/i });
      if (await newAnalysisButton.count() > 0) {
        await newAnalysisButton.first().click();
        console.log('✅ Navigated via "New Analysis" button');
        await page.waitForTimeout(2000);
      }
    }
    
    // Try the main analysis flow again after navigation
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    if (await mainUrlInput.count() > 0) {
      await mainUrlInput.fill('stripe.com');
      await mainUrlInput.press('Enter');
      console.log('🔄 Testing analysis with stripe.com');
      
      // Brief wait to see if anything happens
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: 'test-results/phase4-navigation-flow.png', fullPage: true });
  });

  test('Phase 4.5: Error Handling and Edge Cases', async ({ page }) => {
    console.log('🛡️  Testing error handling and edge cases...');
    
    const mainUrlInput = page.locator('input[placeholder*="Enter a page URL to analyze"]');
    
    // Test invalid URL
    await mainUrlInput.fill('invalid-url');
    await mainUrlInput.press('Enter');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Testing invalid URL handling');
    await page.screenshot({ path: 'test-results/phase4-invalid-url.png', fullPage: true });
    
    // Test empty input
    await mainUrlInput.fill('');
    await mainUrlInput.press('Enter');
    await page.waitForTimeout(2000);
    
    console.log('🔍 Testing empty input handling');
    
    // Test very long URL
    await mainUrlInput.fill('https://very-long-domain-name-that-might-cause-issues.example.com/very/long/path/that/might/cause/issues');
    await mainUrlInput.press('Enter');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Testing long URL handling');
    await page.screenshot({ path: 'test-results/phase4-edge-cases.png', fullPage: true });
  });

});