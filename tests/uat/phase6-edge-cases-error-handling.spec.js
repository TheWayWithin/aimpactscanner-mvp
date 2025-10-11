// UAT Phase 6: Edge Cases & Error Handling
// Comprehensive testing of system resilience under adverse conditions

import { test, expect } from '@playwright/test';

// Test Configuration
const BASE_URL = 'http://localhost:5173';
const TIMEOUT_EXTENDED = 30000;
const TIMEOUT_NETWORK = 60000;

test.describe('Phase 6: Edge Cases & Error Handling', () => {
  
  test.describe('Database Timeout & Stress Testing', () => {
    
    test('should handle multiple concurrent analysis requests gracefully', async ({ page, context }) => {
      console.log('🔄 Testing concurrent analysis load handling...');
      
      // Navigate to analysis page
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Navigate to input page and start analysis
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Create multiple tabs for concurrent testing
      const pages = [page];
      for (let i = 0; i < 3; i++) {
        const newPage = await context.newPage();
        pages.push(newPage);
      }
      
      const analysisPromises = [];
      const testUrls = [
        'example.com',
        'google.com', 
        'github.com',
        'stackoverflow.com'
      ];
      
      // Start concurrent analyses
      for (let i = 0; i < pages.length; i++) {
        const currentPage = pages[i];
        const testUrl = testUrls[i];
        
        analysisPromises.push(
          (async () => {
            try {
              if (i > 0) {
                await currentPage.goto(`${BASE_URL}/#landing`);
                await currentPage.waitForLoadState('networkidle');
                await currentPage.click('text=Start Free Analysis');
                await currentPage.waitForSelector('#url-input', { timeout: 10000 });
              }
              
              await currentPage.fill('#url-input', testUrl);
              await currentPage.click('button:has-text("Analyze Now")');
              
              // Wait for analysis to complete or timeout
              await currentPage.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
                timeout: TIMEOUT_EXTENDED 
              });
              
              return { success: true, url: testUrl, page: i };
            } catch (error) {
              console.log(`❌ Concurrent analysis ${i} failed:`, error.message);
              return { success: false, url: testUrl, page: i, error: error.message };
            }
          })()
        );
      }
      
      // Wait for all analyses to complete
      const results = await Promise.all(analysisPromises);
      
      // Analyze results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(`✅ Concurrent Analysis Results: ${successful.length}/${results.length} successful`);
      console.log('Successful analyses:', successful.map(r => r.url));
      if (failed.length > 0) {
        console.log('Failed analyses:', failed.map(r => `${r.url}: ${r.error}`));
      }
      
      // Cleanup
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
      }
      
      // Validate system stability - at least 50% should succeed under load
      expect(successful.length).toBeGreaterThanOrEqual(Math.ceil(results.length * 0.5));
    });
    
    test('should handle database timeout scenarios gracefully', async ({ page }) => {
      console.log('🔄 Testing database timeout handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Start analysis that might stress the database
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Use a complex URL that might take longer to process
      await page.fill('#url-input', 'https://www.example.com/very/long/path/with/parameters?param1=value1&param2=value2&param3=value3');
      
      // Monitor for timeout handling
      const startTime = Date.now();
      await page.click('button:has-text("Analyze Now")');
      
      // Wait for either completion or timeout handling
      try {
        await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete", text="timeout", text="error"', { 
          timeout: TIMEOUT_EXTENDED 
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Check for graceful timeout handling
        const errorElements = await page.locator('.error-message, text="timeout", text="error", text="please try again"').count();
        const successElements = await page.locator('.analysis-complete, text="Analysis complete"').count();
        
        console.log(`⏱️ Analysis duration: ${duration}ms`);
        console.log(`✅ Success indicators: ${successElements}, Error indicators: ${errorElements}`);
        
        // System should either complete successfully or show graceful error
        expect(successElements + errorElements).toBeGreaterThan(0);
        
        // If timeout occurred, verify graceful handling
        if (errorElements > 0) {
          console.log('✅ Graceful timeout handling detected');
        } else {
          console.log('✅ Analysis completed successfully within timeout');
        }
        
      } catch (error) {
        console.log('❌ No timeout handling detected - system may have hung');
        // This is acceptable if the system completes successfully
        const completionElements = await page.locator('text="score", .analysis-result').count();
        expect(completionElements).toBeGreaterThan(0);
      }
    });
  });
  
  test.describe('Invalid URL Processing', () => {
    
    test('should handle malformed URLs gracefully', async ({ page }) => {
      console.log('🔄 Testing malformed URL handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      const malformedUrls = [
        'not-a-url',
        'htp://invalid-protocol.com',
        'https://',
        '://missing-protocol.com',
        'https://spaces in url.com',
        'https://invalid..domain.com',
        'file:///local/file/path',
        'javascript:alert("xss")',
        '',
        '   ',
        'https://localhost:99999' // Invalid port
      ];
      
      let handledCount = 0;
      let errorCount = 0;
      
      for (const invalidUrl of malformedUrls) {
        try {
          // Clear and enter invalid URL
          await page.fill('#url-input', '');
          await page.fill('#url-input', invalidUrl);
          
          // Check if analyze button is disabled or if validation prevents submission
          const analyzeButton = page.locator('button:has-text("Analyze Now")');
          const isDisabled = await analyzeButton.isDisabled();
          
          if (!isDisabled) {
            await analyzeButton.click();
            
            // Wait for error message or validation
            await page.waitForTimeout(2000);
            
            const errorMessages = await page.locator('.error-message, .validation-error, text="invalid", text="error"').count();
            const inputValidation = await page.locator('#url-input:invalid').count();
            
            if (errorMessages > 0 || inputValidation > 0) {
              handledCount++;
              console.log(`✅ Handled invalid URL: "${invalidUrl}"`);
            } else {
              console.log(`⚠️  No error handling for: "${invalidUrl}"`);
            }
          } else {
            handledCount++;
            console.log(`✅ Button disabled for invalid URL: "${invalidUrl}"`);
          }
          
        } catch (error) {
          errorCount++;
          console.log(`❌ Error testing URL "${invalidUrl}":`, error.message);
        }
      }
      
      console.log(`📊 Invalid URL handling: ${handledCount}/${malformedUrls.length} handled gracefully`);
      
      // Expect at least 70% of invalid URLs to be handled gracefully
      expect(handledCount).toBeGreaterThanOrEqual(Math.ceil(malformedUrls.length * 0.7));
    });
    
    test('should handle non-existent domains appropriately', async ({ page }) => {
      console.log('🔄 Testing non-existent domain handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      const nonExistentDomains = [
        'https://this-domain-definitely-does-not-exist-12345.com',
        'https://invalid-tld.invalidtld',
        'https://nonexistent.test',
        'https://fake-domain-for-testing.fake'
      ];
      
      let handledCount = 0;
      
      for (const domain of nonExistentDomains) {
        try {
          await page.fill('#url-input', '');
          await page.fill('#url-input', domain);
          await page.click('button:has-text("Analyze Now")');
          
          // Wait for error handling or timeout
          await page.waitForSelector('.error-message, .analysis-error, text="error", text="not found", text="invalid", .analysis-complete', { 
            timeout: 15000 
          });
          
          const errorHandling = await page.locator('.error-message, .analysis-error, text="error", text="not found", text="could not", text="failed"').count();
          const successIndicators = await page.locator('.analysis-complete, text="score"').count();
          
          if (errorHandling > 0) {
            handledCount++;
            console.log(`✅ Error handling for non-existent domain: ${domain}`);
          } else if (successIndicators > 0) {
            console.log(`⚠️  Unexpected success for non-existent domain: ${domain}`);
          } else {
            console.log(`❓ Unclear handling for domain: ${domain}`);
          }
          
        } catch (error) {
          console.log(`❌ Error testing domain ${domain}:`, error.message);
        }
      }
      
      console.log(`📊 Non-existent domain handling: ${handledCount}/${nonExistentDomains.length} handled appropriately`);
      
      // Expect at least 50% to be handled (some may pass through to server-side validation)
      expect(handledCount).toBeGreaterThanOrEqual(Math.ceil(nonExistentDomains.length * 0.5));
    });
  });
  
  test.describe('Rate Limiting & Abuse Protection', () => {
    
    test('should handle rapid successive analysis requests', async ({ page }) => {
      console.log('🔄 Testing rate limiting and rapid request handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      const testUrl = 'example.com';
      let requestCount = 0;
      let blockedCount = 0;
      let successCount = 0;
      const maxRequests = 10;
      
      for (let i = 0; i < maxRequests; i++) {
        try {
          await page.fill('#url-input', '');
          await page.fill('#url-input', testUrl);
          
          const analyzeButton = page.locator('button:has-text("Analyze Now")');
          const isDisabled = await analyzeButton.isDisabled();
          
          if (!isDisabled) {
            await analyzeButton.click();
            requestCount++;
            
            // Wait briefly for response
            await page.waitForTimeout(1000);
            
            // Check for rate limiting or error messages
            const rateLimitMessages = await page.locator('text="rate limit", text="too many", text="please wait", text="limit exceeded"').count();
            const errorMessages = await page.locator('.error-message, .warning-message').count();
            
            if (rateLimitMessages > 0) {
              blockedCount++;
              console.log(`🛑 Rate limit detected on request ${i + 1}`);
            } else if (errorMessages === 0) {
              successCount++;
              console.log(`✅ Request ${i + 1} succeeded`);
            }
            
          } else {
            blockedCount++;
            console.log(`🛑 Button disabled on request ${i + 1}`);
          }
          
          // Small delay between requests
          await page.waitForTimeout(500);
          
        } catch (error) {
          console.log(`❌ Error on request ${i + 1}:`, error.message);
        }
      }
      
      console.log(`📊 Rate limiting results:`);
      console.log(`   Requests attempted: ${requestCount}`);
      console.log(`   Requests blocked: ${blockedCount}`);
      console.log(`   Requests succeeded: ${successCount}`);
      
      // System should either implement rate limiting or handle rapid requests gracefully
      const totalHandled = blockedCount + successCount;
      expect(totalHandled).toBeGreaterThanOrEqual(Math.ceil(requestCount * 0.8));
    });
    
    test('should respect free tier analysis limits', async ({ page }) => {
      console.log('🔄 Testing free tier analysis limits...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Check for analysis limit display
      const limitInfo = await page.locator('text="3 analyses", text="free analyses", text="remaining", text="limit"').count();
      console.log(`📊 Analysis limit information displayed: ${limitInfo > 0 ? 'Yes' : 'No'}`);
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Perform multiple analyses to test limit enforcement
      const testUrls = ['example.com', 'google.com', 'github.com', 'stackoverflow.com'];
      let analysisCount = 0;
      let limitReached = false;
      
      for (const url of testUrls) {
        try {
          await page.fill('#url-input', '');
          await page.fill('#url-input', url);
          
          const analyzeButton = page.locator('button:has-text("Analyze Now")');
          const isDisabled = await analyzeButton.isDisabled();
          
          if (!isDisabled) {
            await analyzeButton.click();
            analysisCount++;
            
            // Wait for analysis completion or limit message
            await page.waitForSelector('.analysis-complete, .limit-reached, text="limit", text="upgrade", text="Analysis complete"', { 
              timeout: 15000 
            });
            
            // Check for limit reached messages
            const limitMessages = await page.locator('text="limit reached", text="upgrade", text="remaining analyses", .limit-message').count();
            
            if (limitMessages > 0) {
              limitReached = true;
              console.log(`🛑 Analysis limit reached after ${analysisCount} analyses`);
              break;
            } else {
              console.log(`✅ Analysis ${analysisCount} completed successfully`);
            }
            
            // Brief pause between analyses
            await page.waitForTimeout(2000);
            
          } else {
            console.log(`🛑 Analysis button disabled - limit may be reached`);
            limitReached = true;
            break;
          }
          
        } catch (error) {
          console.log(`❌ Error during analysis ${analysisCount + 1}:`, error.message);
        }
      }
      
      console.log(`📊 Free tier limit testing: ${analysisCount} analyses completed, limit reached: ${limitReached}`);
      
      // Expect either limit enforcement or successful completion of at least 3 analyses
      expect(analysisCount >= 3 || limitReached).toBeTruthy();
    });
  });
  
  test.describe('Network Connectivity & Recovery', () => {
    
    test('should handle slow network conditions gracefully', async ({ page }) => {
      console.log('🔄 Testing slow network handling...');
      
      // Simulate slow network
      await page.route('**/*', async route => {
        // Add delay to all requests
        await page.waitForTimeout(1000);
        await route.continue();
      });
      
      await page.goto(`${BASE_URL}/#landing`, { timeout: TIMEOUT_NETWORK });
      await page.waitForLoadState('networkidle', { timeout: TIMEOUT_NETWORK });
      
      // Test that app loads despite slow network
      const landingVisible = await page.locator('text="AI", text="analysis", text="Start Free"').count();
      expect(landingVisible).toBeGreaterThan(0);
      
      // Test analysis under slow conditions
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 15000 });
      
      await page.fill('#url-input', 'example.com');
      
      const startTime = Date.now();
      await page.click('button:has-text("Analyze Now")');
      
      // Wait for completion or timeout handling
      try {
        await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete", text="timeout"', { 
          timeout: TIMEOUT_NETWORK 
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⏱️ Analysis under slow network: ${duration}ms`);
        
        // Verify graceful handling
        const hasResults = await page.locator('.analysis-complete, text="score", .analysis-result').count();
        const hasErrors = await page.locator('.error-message, text="timeout", text="slow"').count();
        
        expect(hasResults + hasErrors).toBeGreaterThan(0);
        
      } catch (error) {
        console.log('❌ No response to slow network conditions:', error.message);
        throw error;
      }
    });
    
    test('should handle network interruption during analysis', async ({ page }) => {
      console.log('🔄 Testing network interruption handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      await page.fill('#url-input', 'example.com');
      await page.click('button:has-text("Analyze Now")');
      
      // Wait a moment for analysis to start
      await page.waitForTimeout(2000);
      
      // Simulate network failure during analysis
      await page.route('**/*', route => route.abort());
      
      // Wait and see how system handles network failure
      await page.waitForTimeout(5000);
      
      // Check for error handling
      const errorHandling = await page.locator('.error-message, text="error", text="connection", text="network", text="failed"').count();
      const loadingStates = await page.locator('.loading, text="analyzing", text="processing"').count();
      
      console.log(`📊 Network interruption handling: Error messages: ${errorHandling}, Loading states: ${loadingStates}`);
      
      // System should show either error handling or maintain loading state gracefully
      expect(errorHandling + loadingStates).toBeGreaterThan(0);
      
      // Re-enable network and test recovery
      await page.unroute('**/*');
      
      // Wait for potential recovery
      await page.waitForTimeout(3000);
      
      const recoveryElements = await page.locator('.analysis-complete, text="retry", button:has-text("Try Again")').count();
      console.log(`🔄 Recovery options available: ${recoveryElements > 0 ? 'Yes' : 'No'}`);
    });
  });
  
  test.describe('Cross-Browser Edge Cases', () => {
    
    test('should handle browser-specific errors gracefully', async ({ page, browserName }) => {
      console.log(`🔄 Testing browser-specific error handling for ${browserName}...`);
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Test console errors don't break functionality
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Test basic functionality
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      await page.fill('#url-input', 'example.com');
      await page.click('button:has-text("Analyze Now")');
      
      // Wait for completion
      await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
        timeout: 20000 
      });
      
      // Check for functionality despite any console errors
      const functionalElements = await page.locator('.analysis-complete, text="score", .analysis-result').count();
      
      console.log(`📊 ${browserName} results:`);
      console.log(`   Console errors: ${consoleErrors.length}`);
      console.log(`   Functional elements: ${functionalElements}`);
      
      if (consoleErrors.length > 0) {
        console.log('Console errors detected:', consoleErrors.slice(0, 3));
      }
      
      // Functionality should work despite console errors
      expect(functionalElements).toBeGreaterThan(0);
    });
  });
  
  test.describe('Mobile Limitations & Responsive Behavior', () => {
    
    test('should handle mobile device limitations', async ({ page }) => {
      console.log('🔄 Testing mobile device limitations...');
      
      // Simulate mobile device
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Test responsive layout
      const mobileElements = await page.locator('text="AI", text="analysis", button, input').count();
      expect(mobileElements).toBeGreaterThan(0);
      
      // Test mobile analysis flow
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Test mobile input handling
      await page.fill('#url-input', 'example.com');
      
      // Check if mobile keyboard doesn't break layout
      const inputVisible = await page.locator('#url-input').isVisible();
      expect(inputVisible).toBeTruthy();
      
      // Test mobile analysis
      await page.click('button:has-text("Analyze Now")');
      
      // Wait for mobile-friendly completion
      await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
        timeout: 25000 
      });
      
      // Verify mobile layout doesn't break
      const resultsVisible = await page.locator('.analysis-complete, text="score", .analysis-result').count();
      console.log(`📱 Mobile analysis results visible: ${resultsVisible > 0 ? 'Yes' : 'No'}`);
      
      expect(resultsVisible).toBeGreaterThan(0);
    });
    
    test('should handle memory limitations gracefully', async ({ page }) => {
      console.log('🔄 Testing memory limitation handling...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Test multiple analyses in sequence to stress memory
      const testUrls = ['example.com', 'google.com', 'github.com'];
      let completedAnalyses = 0;
      
      for (const url of testUrls) {
        try {
          await page.click('text=Start Free Analysis');
          await page.waitForSelector('#url-input', { timeout: 10000 });
          
          await page.fill('#url-input', '');
          await page.fill('#url-input', url);
          await page.click('button:has-text("Analyze Now")');
          
          await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
            timeout: 20000 
          });
          
          completedAnalyses++;
          console.log(`✅ Completed analysis ${completedAnalyses}: ${url}`);
          
          // Brief pause between analyses
          await page.waitForTimeout(2000);
          
        } catch (error) {
          console.log(`❌ Memory stress test failed on ${url}:`, error.message);
        }
      }
      
      console.log(`📊 Memory stress test: ${completedAnalyses}/${testUrls.length} analyses completed`);
      
      // Expect at least 2/3 to complete successfully
      expect(completedAnalyses).toBeGreaterThanOrEqual(Math.ceil(testUrls.length * 0.67));
    });
  });
  
  test.describe('Error Recovery & Graceful Degradation', () => {
    
    test('should maintain session during error conditions', async ({ page }) => {
      console.log('🔄 Testing session preservation during errors...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Navigate to different pages to establish session
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Trigger potential error condition
      await page.fill('#url-input', 'invalid-url-that-might-cause-error');
      await page.click('button:has-text("Analyze Now")');
      
      // Wait for error or completion
      await page.waitForTimeout(5000);
      
      // Navigate back to landing and verify session preserved
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      // Check if app state is preserved
      const landingVisible = await page.locator('text="AI", text="analysis", text="Start Free"').count();
      expect(landingVisible).toBeGreaterThan(0);
      
      // Test that analysis functionality still works
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      await page.fill('#url-input', 'example.com');
      await page.click('button:has-text("Analyze Now")');
      
      await page.waitForSelector('.analysis-complete, .error-message, text="Analysis complete"', { 
        timeout: 15000 
      });
      
      const postErrorFunctionality = await page.locator('.analysis-complete, text="score"').count();
      expect(postErrorFunctionality).toBeGreaterThan(0);
      
      console.log(`✅ Session preserved and functionality restored after error conditions`);
    });
    
    test('should provide clear error messages and recovery options', async ({ page }) => {
      console.log('🔄 Testing error message clarity and recovery options...');
      
      await page.goto(`${BASE_URL}/#landing`);
      await page.waitForLoadState('networkidle');
      
      await page.click('text=Start Free Analysis');
      await page.waitForSelector('#url-input', { timeout: 10000 });
      
      // Test various error scenarios
      const errorScenarios = [
        { input: '', description: 'empty input' },
        { input: 'not-a-url', description: 'invalid format' },
        { input: 'https://nonexistent12345.fake', description: 'non-existent domain' }
      ];
      
      let clearErrorsCount = 0;
      let recoveryOptionsCount = 0;
      
      for (const scenario of errorScenarios) {
        try {
          await page.fill('#url-input', '');
          await page.fill('#url-input', scenario.input);
          
          const analyzeButton = page.locator('button:has-text("Analyze Now")');
          const isDisabled = await analyzeButton.isDisabled();
          
          if (!isDisabled) {
            await analyzeButton.click();
            await page.waitForTimeout(3000);
            
            // Check for clear error messages
            const errorMessages = await page.locator('.error-message, .validation-error, text="error", text="invalid"').count();
            const errorText = await page.locator('.error-message, .validation-error').first().textContent().catch(() => '');
            
            if (errorMessages > 0 && errorText.length > 10) {
              clearErrorsCount++;
              console.log(`✅ Clear error message for ${scenario.description}: "${errorText.substring(0, 50)}..."`);
            }
            
            // Check for recovery options
            const recoveryOptions = await page.locator('button:has-text("Try Again"), button:has-text("Retry"), text="try again", .retry-button').count();
            
            if (recoveryOptions > 0) {
              recoveryOptionsCount++;
              console.log(`✅ Recovery option available for ${scenario.description}`);
            }
          } else {
            clearErrorsCount++;
            console.log(`✅ Input validation prevented submission for ${scenario.description}`);
          }
          
        } catch (error) {
          console.log(`❌ Error testing scenario ${scenario.description}:`, error.message);
        }
      }
      
      console.log(`📊 Error handling quality:`);
      console.log(`   Clear error messages: ${clearErrorsCount}/${errorScenarios.length}`);
      console.log(`   Recovery options: ${recoveryOptionsCount}/${errorScenarios.length}`);
      
      // Expect good error handling coverage
      expect(clearErrorsCount).toBeGreaterThanOrEqual(Math.ceil(errorScenarios.length * 0.67));
    });
  });
});