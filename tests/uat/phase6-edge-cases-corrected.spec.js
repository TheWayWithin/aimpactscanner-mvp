// UAT Phase 6: Edge Cases & Error Handling - Corrected Version
// Comprehensive testing of system resilience with accurate UI selectors

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Phase 6: Edge Cases & Error Handling', () => {
  
  test.beforeEach(async ({ page }) => {
    // Handle GDPR banner if present
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Accept cookies if banner is present
    try {
      await page.click('button:has-text("Accept All")', { timeout: 3000 });
    } catch (error) {
      // Cookie banner may not be present, continue
    }
  });
  
  test('Invalid URL Error Handling', async ({ page }) => {
    console.log('🔄 Testing invalid URL error handling...');
    
    // Find the URL input field
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"], #url-input');
    await urlInput.waitFor({ timeout: 10000 });
    
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
        await urlInput.fill('');
        await urlInput.fill(invalidUrl);
        
        // Find the analyze button - try multiple possible texts
        const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze"), button:has-text("Start Analysis")').first();
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
        const errorMessages = await page.locator('.error-message, .validation-error, text="invalid", text="error", text="Please enter"').count();
        const inputValidation = await page.locator('input:invalid').count();
        
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
  
  test('Rate Limiting and Multiple Analysis Behavior', async ({ page }) => {
    console.log('🔄 Testing rate limiting and multiple analysis behavior...');
    
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"], #url-input');
    await urlInput.waitFor({ timeout: 10000 });
    
    const testUrl = 'example.com';
    let successCount = 0;
    let blockedCount = 0;
    
    // Try 5 rapid requests
    for (let i = 0; i < 5; i++) {
      try {
        await urlInput.fill('');
        await urlInput.fill(testUrl);
        
        const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze"), button[disabled]').first();
        const isDisabled = await analyzeButton.isDisabled();
        
        if (!isDisabled) {
          await analyzeButton.click();
          await page.waitForTimeout(2000);
          
          // Check for rate limiting messages
          const rateLimitMessages = await page.locator('text="rate limit", text="too many", text="please wait", text="limit"').count();
          const errorMessages = await page.locator('.error-message, .warning').count();
          
          if (rateLimitMessages > 0) {
            blockedCount++;
            console.log(`🛑 Rate limit detected on request ${i + 1}`);
          } else if (errorMessages === 0) {
            successCount++;
            console.log(`✅ Request ${i + 1} processing`);
          }
        } else {
          blockedCount++;
          console.log(`🛑 Button disabled on request ${i + 1}`);
        }
        
        await page.waitForTimeout(1000);
        
      } catch (error) {
        console.log(`❌ Error on request ${i + 1}: ${error.message}`);
      }
    }
    
    console.log(`📊 Rate limiting: ${successCount} processed, ${blockedCount} blocked/limited`);
    
    // System should handle rapid requests gracefully
    expect(successCount + blockedCount).toBeGreaterThanOrEqual(4);
  });
  
  test('Mobile Responsive Behavior and Limitations', async ({ page }) => {
    console.log('🔄 Testing mobile responsive behavior...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Handle cookie banner on mobile
    try {
      await page.click('button:has-text("Accept All")', { timeout: 3000 });
    } catch (error) {
      // Continue if no banner
    }
    
    // Test mobile layout elements
    const mobileElements = await page.locator('h1, button, input, textbox').count();
    expect(mobileElements).toBeGreaterThan(0);
    
    // Test mobile input functionality
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await urlInput.waitFor({ timeout: 10000 });
    
    // Test mobile input handling
    await urlInput.fill('example.com');
    
    // Check if mobile keyboard doesn't break layout
    const inputVisible = await urlInput.isVisible();
    expect(inputVisible).toBeTruthy();
    
    // Test mobile analysis button
    const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
    const buttonVisible = await analyzeButton.isVisible();
    
    console.log(`📱 Mobile responsive test: input visible: ${inputVisible}, button visible: ${buttonVisible}`);
    expect(buttonVisible).toBeTruthy();
    
    // Test analysis initiation on mobile
    if (!await analyzeButton.isDisabled()) {
      await analyzeButton.click();
      await page.waitForTimeout(3000);
      
      // Check for mobile-friendly response
      const responseElements = await page.locator('text="analyzing", text="processing", .loading, .error-message').count();
      console.log(`📱 Mobile analysis response: ${responseElements > 0 ? 'Working' : 'No response'}`);
    }
  });
  
  test('Browser Console Error Monitoring', async ({ page, browserName }) => {
    console.log(`🔄 Testing console error handling for ${browserName}...`);
    
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Test page functionality
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await urlInput.waitFor({ timeout: 10000 });
    
    await urlInput.fill('example.com');
    
    const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
    const functionalElements = await page.locator('h1, button, input').count();
    
    console.log(`📊 ${browserName} console monitoring:`);
    console.log(`   Console errors: ${consoleErrors.length}`);
    console.log(`   Console warnings: ${consoleWarnings.length}`);
    console.log(`   Functional elements: ${functionalElements}`);
    
    if (consoleErrors.length > 0) {
      console.log('Notable console errors:', consoleErrors.slice(0, 2));
    }
    
    // App should be functional despite console errors
    expect(functionalElements).toBeGreaterThan(5);
    
    // Button should be interactable
    const buttonInteractable = await analyzeButton.isVisible() && !(await analyzeButton.isDisabled());
    expect(buttonInteractable).toBeTruthy();
  });
  
  test('Network Error Resilience', async ({ page }) => {
    console.log('🔄 Testing network error resilience...');
    
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await urlInput.waitFor({ timeout: 10000 });
    
    await urlInput.fill('example.com');
    
    const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
    
    if (!await analyzeButton.isDisabled()) {
      await analyzeButton.click();
      
      // Wait for analysis to potentially start
      await page.waitForTimeout(2000);
      
      // Simulate network interruption
      await page.route('**/*', route => route.abort());
      
      // Wait and check error handling
      await page.waitForTimeout(5000);
      
      const errorHandling = await page.locator('.error-message, text="error", text="connection", text="network", text="failed"').count();
      const loadingStates = await page.locator('.loading, text="analyzing", text="processing"').count();
      
      console.log(`📊 Network error handling: ${errorHandling} errors, ${loadingStates} loading states`);
      
      // Re-enable network
      await page.unroute('**/*');
      
      // System should show some kind of response to network issues
      expect(errorHandling + loadingStates).toBeGreaterThan(0);
      
      // Test recovery capability
      await page.waitForTimeout(3000);
      const recoveryElements = await page.locator('button:has-text("Try Again"), button:has-text("Retry")').count();
      console.log(`🔄 Recovery options: ${recoveryElements > 0 ? 'Available' : 'None visible'}`);
    } else {
      console.log('⚠️  Analyze button disabled - testing network resilience of static content');
      
      // Test network resilience of static content
      await page.route('**/*.css', route => route.abort());
      await page.route('**/*.js', route => route.abort());
      
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check basic content still loads
      const basicContent = await page.locator('h1, text="AI"').count();
      console.log(`📊 Basic content without resources: ${basicContent > 0 ? 'Loads' : 'Fails'}`);
      
      await page.unroute('**/*');
    }
  });
  
  test('Session Preservation and Error Recovery', async ({ page }) => {
    console.log('🔄 Testing session preservation and error recovery...');
    
    // Establish session by interacting with the page
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await urlInput.waitFor({ timeout: 10000 });
    
    // Fill input to establish some state
    await urlInput.fill('test-session-url.com');
    
    // Trigger potential error condition with invalid input
    await urlInput.fill('javascript:void(0)');
    
    const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
    
    if (!await analyzeButton.isDisabled()) {
      await analyzeButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Navigate away and back to test session preservation
    await page.goto(`${BASE_URL}/#about`);
    await page.waitForTimeout(1000);
    await page.goto(`${BASE_URL}/#landing`);
    await page.waitForLoadState('networkidle');
    
    // Test functionality restoration
    const restoredInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await restoredInput.waitFor({ timeout: 10000 });
    
    await restoredInput.fill('example.com');
    
    const restoredButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
    const functionalityRestored = await restoredButton.isVisible() && !(await restoredButton.isDisabled());
    
    console.log(`✅ Session preserved and functionality restored: ${functionalityRestored}`);
    expect(functionalityRestored).toBeTruthy();
  });
  
  test('Cross-Browser Compatibility Under Stress', async ({ page, browserName }) => {
    console.log(`🔄 Testing cross-browser compatibility under stress for ${browserName}...`);
    
    // Test multiple rapid page loads
    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Handle potential cookie banner
      try {
        await page.click('button:has-text("Accept All")', { timeout: 2000 });
      } catch (error) {
        // Continue if no banner
      }
      
      const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
      await urlInput.waitFor({ timeout: 10000 });
      
      await urlInput.fill(`test${i}.com`);
      
      const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
      const isWorking = await analyzeButton.isVisible() && !(await analyzeButton.isDisabled());
      
      console.log(`${browserName} stress test ${i + 1}: ${isWorking ? 'Working' : 'Issues detected'}`);
      
      expect(isWorking).toBeTruthy();
      
      if (i < 2) {
        await page.waitForTimeout(1000);
      }
    }
    
    console.log(`✅ ${browserName} stress test completed successfully`);
  });
  
  test('Error Message Clarity and User Experience', async ({ page }) => {
    console.log('🔄 Testing error message clarity and user experience...');
    
    const urlInput = page.locator('textbox[placeholder*="Enter a page URL"], input[placeholder*="URL"]');
    await urlInput.waitFor({ timeout: 10000 });
    
    // Test various error scenarios
    const errorScenarios = [
      { input: '', description: 'empty input' },
      { input: 'not-a-url', description: 'invalid format' },
      { input: 'ftp://invalid-protocol.com', description: 'unsupported protocol' }
    ];
    
    let clearErrorsCount = 0;
    let recoveryOptionsCount = 0;
    
    for (const scenario of errorScenarios) {
      try {
        await urlInput.fill('');
        await urlInput.fill(scenario.input);
        
        const analyzeButton = page.locator('button:has-text("Analyze My Site"), button:has-text("Analyze")').first();
        const isDisabled = await analyzeButton.isDisabled();
        
        if (isDisabled) {
          clearErrorsCount++;
          console.log(`✅ Input validation prevented submission for ${scenario.description}`);
        } else {
          await analyzeButton.click();
          await page.waitForTimeout(3000);
          
          // Check for clear error messages
          const errorMessages = await page.locator('.error-message, .validation-error, text="error", text="invalid", text="please"').count();
          
          if (errorMessages > 0) {
            clearErrorsCount++;
            
            const errorText = await page.locator('.error-message, .validation-error').first().textContent().catch(() => '');
            console.log(`✅ Clear error message for ${scenario.description}: "${errorText.substring(0, 50)}..."`);
          }
          
          // Check for recovery options
          const recoveryOptions = await page.locator('button:has-text("Try Again"), button:has-text("Retry"), text="try again"').count();
          
          if (recoveryOptions > 0) {
            recoveryOptionsCount++;
            console.log(`✅ Recovery option available for ${scenario.description}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ Error testing scenario ${scenario.description}: ${error.message}`);
      }
    }
    
    console.log(`📊 Error handling quality:`);
    console.log(`   Clear error handling: ${clearErrorsCount}/${errorScenarios.length}`);
    console.log(`   Recovery options: ${recoveryOptionsCount}/${errorScenarios.length}`);
    
    // Expect good error handling coverage
    expect(clearErrorsCount).toBeGreaterThanOrEqual(Math.ceil(errorScenarios.length * 0.67));
  });
});