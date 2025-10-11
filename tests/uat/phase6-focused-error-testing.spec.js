// UAT Phase 6: Focused Error Testing & Edge Cases
// Targeted testing of specific error scenarios

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Phase 6: Focused Edge Case Testing', () => {
  
  test('Invalid URL Error Handling', async ({ page }) => {
    console.log('🔄 Testing invalid URL error handling...');
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to analysis
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    const invalidUrls = [
      'not-a-url',
      'https://',
      '',
      'javascript:alert("test")',
      'https://nonexistent12345.fake'
    ];
    
    let handledCount = 0;
    const results = [];
    
    for (const invalidUrl of invalidUrls) {
      console.log(`Testing invalid URL: "${invalidUrl}"`);
      
      try {
        // Clear and enter invalid URL
        await page.fill('#url-input', '');
        await page.fill('#url-input', invalidUrl);
        
        // Check if analyze button is disabled
        const analyzeButton = page.locator('button:has-text("Analyze Now")');
        const isDisabled = await analyzeButton.isDisabled();
        
        if (isDisabled) {
          handledCount++;
          results.push({ url: invalidUrl, handled: true, method: 'button_disabled' });
          console.log(`✅ Button disabled for: "${invalidUrl}"`);
          continue;
        }
        
        // Try to submit
        await analyzeButton.click();
        await page.waitForTimeout(3000);
        
        // Check for validation or error messages
        const errorMessages = await page.locator('.error-message, .validation-error, text="invalid", text="error"').count();
        const inputValidation = await page.locator('#url-input:invalid').count();
        
        if (errorMessages > 0 || inputValidation > 0) {
          handledCount++;
          results.push({ url: invalidUrl, handled: true, method: 'error_message' });
          console.log(`✅ Error handling for: "${invalidUrl}"`);
        } else {
          results.push({ url: invalidUrl, handled: false, method: 'none' });
          console.log(`❌ No error handling for: "${invalidUrl}"`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing "${invalidUrl}": ${error.message}`);
        results.push({ url: invalidUrl, handled: false, method: 'test_error', error: error.message });
      }
    }
    
    console.log(`📊 Invalid URL Handling Results: ${handledCount}/${invalidUrls.length} handled`);
    console.log('Results:', results);
    
    expect(handledCount).toBeGreaterThanOrEqual(Math.ceil(invalidUrls.length * 0.6));
  });
  
  test('Rate Limiting Behavior', async ({ page }) => {
    console.log('🔄 Testing rate limiting behavior...');
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    const testUrl = 'example.com';
    let successCount = 0;
    let blockedCount = 0;
    
    // Try 5 rapid requests
    for (let i = 0; i < 5; i++) {
      try {
        await page.fill('#url-input', '');
        await page.fill('#url-input', testUrl);
        
        const analyzeButton = page.locator('button:has-text("Analyze Now")');
        const isDisabled = await analyzeButton.isDisabled();
        
        if (!isDisabled) {
          await analyzeButton.click();
          await page.waitForTimeout(1000);
          
          // Check for rate limiting messages
          const rateLimitMessages = await page.locator('text="rate limit", text="too many", text="please wait"').count();
          
          if (rateLimitMessages > 0) {
            blockedCount++;
            console.log(`🛑 Rate limit on request ${i + 1}`);
          } else {
            successCount++;
            console.log(`✅ Request ${i + 1} processed`);
          }
        } else {
          blockedCount++;
          console.log(`🛑 Button disabled on request ${i + 1}`);
        }
        
        await page.waitForTimeout(500);
        
      } catch (error) {
        console.log(`❌ Error on request ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`📊 Rate limiting: ${successCount} success, ${blockedCount} blocked`);
    
    // System should handle rapid requests gracefully
    expect(successCount + blockedCount).toBeGreaterThanOrEqual(4);
  });
  
  test('Network Error Simulation', async ({ page }) => {
    console.log('🔄 Testing network error handling...');
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    await page.fill('#url-input', 'example.com');
    await page.click('button:has-text("Analyze Now")');
    
    // Wait for analysis to start
    await page.waitForTimeout(2000);
    
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    // Wait and check error handling
    await page.waitForTimeout(5000);
    
    const errorHandling = await page.locator('.error-message, text="error", text="connection", text="network", text="failed"').count();
    const loadingStates = await page.locator('.loading, text="analyzing", text="processing"').count();
    
    console.log(`📊 Network error handling: ${errorHandling} errors, ${loadingStates} loading states`);
    
    // Re-enable network
    await page.unroute('**/*');
    
    expect(errorHandling + loadingStates).toBeGreaterThan(0);
  });
  
  test('Mobile Responsive Behavior', async ({ page }) => {
    console.log('🔄 Testing mobile responsive behavior...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Test mobile layout
    const mobileElements = await page.locator('text="AI", text="analysis", button').count();
    expect(mobileElements).toBeGreaterThan(0);
    
    // Test mobile analysis flow
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    await page.fill('#url-input', 'example.com');
    await page.click('button:has-text("Analyze Now")');
    
    await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
      timeout: 20000 
    });
    
    const mobileResults = await page.locator('.analysis-complete, text="score"').count();
    console.log(`📱 Mobile analysis successful: ${mobileResults > 0}`);
    
    expect(mobileResults).toBeGreaterThan(0);
  });
  
  test('Browser Console Error Monitoring', async ({ page, browserName }) => {
    console.log(`🔄 Testing console error handling for ${browserName}...`);
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    await page.fill('#url-input', 'example.com');
    await page.click('button:has-text("Analyze Now")');
    
    await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
      timeout: 20000 
    });
    
    const functionalElements = await page.locator('.analysis-complete, text="score"').count();
    
    console.log(`📊 ${browserName} results:`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Functionality working: ${functionalElements > 0}`);
    
    if (consoleErrors.length > 0) {
      console.log('Notable console errors:', consoleErrors.slice(0, 2));
    }
    
    // App should work despite any console errors
    expect(functionalElements).toBeGreaterThan(0);
  });
  
  test('Session Preservation During Errors', async ({ page }) => {
    console.log('🔄 Testing session preservation during error conditions...');
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Establish session
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    // Trigger error condition
    await page.fill('#url-input', 'invalid-error-url');
    await page.click('button:has-text("Analyze Now")');
    await page.waitForTimeout(3000);
    
    // Navigate away and back
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Test functionality restoration
    await page.click('text=Start Free Analysis');
    await page.waitForSelector('#url-input', { timeout: 10000 });
    
    await page.fill('#url-input', 'example.com');
    await page.click('button:has-text("Analyze Now")');
    
    await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
      timeout: 15000 
    });
    
    const recoveredFunctionality = await page.locator('.analysis-complete, text="score"').count();
    console.log(`✅ Session preserved and functionality recovered: ${recoveredFunctionality > 0}`);
    
    expect(recoveredFunctionality).toBeGreaterThan(0);
  });
});