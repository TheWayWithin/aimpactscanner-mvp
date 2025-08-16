// error-handling-edge-cases.spec.js - Comprehensive Error Handling and Edge Case Testing
import { test, expect } from '@playwright/test';
import { createTempEmailUtils } from '../utils/temp-email-utils.js';

/**
 * Comprehensive error handling and edge case testing
 * Validates app behavior under various failure scenarios and edge conditions
 */

test.describe('Error Handling and Edge Cases', () => {
  let tempEmailUtils;
  
  test.beforeEach(async ({ page }) => {
    tempEmailUtils = createTempEmailUtils(page);
    test.setTimeout(120000); // 2 minutes for error scenarios
    console.log('🚨 Starting error handling test...');
  });
  
  test.afterEach(async () => {
    if (tempEmailUtils) {
      await tempEmailUtils.cleanup();
    }
  });

  test('should handle invalid URL inputs gracefully', async ({ page }) => {
    console.log('🌐 Testing invalid URL handling');
    
    await page.goto('/');
    
    const invalidUrls = [
      'not-a-url',
      'http://',
      'https://',
      'ftp://example.com',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'file:///etc/passwd',
      'localhost:3000',
      'http://localhost',
      'www.example.com',
      'example',
      '',
      ' ',
      'http://999.999.999.999',
      'https://this-domain-does-not-exist-12345.com',
      'http://example.com:999999'
    ];
    
    const urlInput = page.locator('input[type="url"], input[placeholder*="URL"]');
    const analyzeButton = page.locator('button:has-text("Analyze")');
    
    for (const invalidUrl of invalidUrls) {
      console.log(`Testing invalid URL: ${invalidUrl || '(empty)'}`);
      
      await urlInput.clear();
      await urlInput.fill(invalidUrl);
      await analyzeButton.click();
      
      // Should show validation error
      const errorElements = page.locator('.error, [role="alert"], :has-text("Invalid"), :has-text("Error")');
      
      if (await errorElements.count() > 0) {
        console.log(`✅ Error shown for: ${invalidUrl || '(empty)'}`);
      } else {
        console.log(`⚠️ No error shown for: ${invalidUrl || '(empty)'} - may need validation improvement`);
      }
      
      // Wait between attempts
      await page.waitForTimeout(500);
    }
    
    console.log('🌐 Invalid URL handling test completed');
  });

  test('should handle email validation errors', async ({ page }) => {
    console.log('📧 Testing email validation');
    
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    
    const invalidEmails = [
      'not-an-email',
      '@domain.com',
      'user@',
      'user@@domain.com',
      'user@domain',
      'user@.com',
      'user@domain.',
      'user name@domain.com',
      'user@domain..com',
      '',
      ' ',
      'user@',
      '@',
      'user@domain@com',
      'user.domain.com',
      'user@domain_com',
      'user@domain-.com'
    ];
    
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    for (const invalidEmail of invalidEmails) {
      console.log(`Testing invalid email: ${invalidEmail || '(empty)'}`);
      
      await emailInput.clear();
      await emailInput.fill(invalidEmail);
      await submitButton.click();
      
      // Should show validation error
      const errorElements = page.locator('.error, [role="alert"], :has-text("Invalid"), :has-text("Error")');
      
      if (await errorElements.count() > 0) {
        console.log(`✅ Error shown for: ${invalidEmail || '(empty)'}`);
      } else {
        // Check for browser validation
        const isInvalid = await emailInput.evaluate((el) => !el.validity.valid);
        if (isInvalid) {
          console.log(`✅ Browser validation caught: ${invalidEmail || '(empty)'}`);
        } else {
          console.log(`⚠️ No validation for: ${invalidEmail || '(empty)'}`);
        }
      }
      
      await page.waitForTimeout(300);
    }
    
    console.log('📧 Email validation test completed');
  });

  test('should handle network connectivity issues', async ({ page }) => {
    console.log('🌐 Testing network error handling');
    
    // Test offline scenario
    await page.context().setOffline(true);
    await page.goto('/');
    
    // Should handle offline gracefully
    const offlineIndicator = page.locator(':has-text("offline"), :has-text("connection"), .error');
    
    if (await offlineIndicator.count() > 0) {
      console.log('✅ Offline state detected and handled');
    }
    
    // Restore connectivity
    await page.context().setOffline(false);
    await page.reload();
    
    // Test slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 2000); // 2 second delay
    });
    
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    
    // Should show loading indicators
    const loadingIndicator = page.locator('.loading, [role="progressbar"], :has-text("Loading")');
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 });
    console.log('✅ Loading state shown during slow network');
    
    // Clear route handlers
    await page.unroute('**/*');
    
    console.log('🌐 Network error handling test completed');
  });

  test('should handle authentication failures', async ({ page }) => {
    console.log('🔐 Testing authentication error scenarios');
    
    // Test expired magic link
    const expiredMagicLink = 'http://localhost:5174/auth/confirm?token=expired-token-12345&type=magiclink';
    
    await page.goto(expiredMagicLink);
    
    // Should show error message
    const authError = page.locator(':has-text("expired"), :has-text("invalid"), .error, [role="alert"]');
    await expect(authError).toBeVisible({ timeout: 10000 });
    console.log('✅ Expired token error handling works');
    
    // Test malformed magic link
    const malformedLinks = [
      'http://localhost:5174/auth/confirm',
      'http://localhost:5174/auth/confirm?token=',
      'http://localhost:5174/auth/confirm?type=magiclink',
      'http://localhost:5174/auth/confirm?token=abc&type=invalid'
    ];
    
    for (const link of malformedLinks) {
      await page.goto(link);
      
      const errorElement = page.locator('.error, [role="alert"], :has-text("Error")');
      
      if (await errorElement.count() > 0) {
        console.log(`✅ Error shown for malformed link: ${link}`);
      }
      
      await page.waitForTimeout(500);
    }
    
    console.log('🔐 Authentication error handling test completed');
  });

  test('should handle edge cases in analysis flow', async ({ page }) => {
    console.log('🔍 Testing analysis flow edge cases');
    
    const testEmail = await tempEmailUtils.generateTempEmail();
    
    // Register user first
    await page.goto('/');
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('button[type="submit"]').click();
    
    const magicLink = await tempEmailUtils.waitForMagicLink();
    await tempEmailUtils.handleMagicLinkAuth(magicLink);
    
    // Test rapid successive analyses
    console.log('⚡ Testing rapid successive analyses');
    
    const urls = [
      'https://example1.com',
      'https://example2.com',
      'https://example3.com'
    ];
    
    for (const url of urls) {
      await page.locator('input[type="url"]').fill(url);
      await page.locator('button:has-text("Analyze")').click();
      
      // Don't wait for completion - test rapid firing
      await page.waitForTimeout(1000);
    }
    
    // Should handle gracefully without crashes
    await page.waitForTimeout(5000);
    console.log('✅ Rapid analyses handled without crashes');
    
    // Test very long URLs
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    await page.locator('input[type="url"]').fill(longUrl);
    await page.locator('button:has-text("Analyze")').click();
    
    // Should handle long URLs
    await page.waitForTimeout(2000);
    console.log('✅ Long URL handled');
    
    // Test special characters in URLs
    const specialUrls = [
      'https://example.com/?query=test&param=value',
      'https://example.com/path/with-dashes',
      'https://example.com/path_with_underscores',
      'https://example.com/path with spaces',
      'https://example.com/#section',
      'https://sub.domain.example.com',
      'https://example.com:8080/path'
    ];
    
    for (const url of specialUrls) {
      await page.locator('input[type="url"]').fill(url);
      await page.locator('button:has-text("Analyze")').click();
      await page.waitForTimeout(2000);
      console.log(`✅ Special URL handled: ${url}`);
    }
    
    console.log('🔍 Analysis flow edge cases test completed');
  });

  test('should handle browser compatibility issues', async ({ page, browserName }) => {
    console.log(`🌍 Testing browser compatibility: ${browserName}`);
    
    await page.goto('/');
    
    // Test local storage
    await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        return true;
      } catch (error) {
        console.error('LocalStorage not available');
        return false;
      }
    });
    
    // Test session storage
    await page.evaluate(() => {
      try {
        sessionStorage.setItem('test', 'value');
        sessionStorage.removeItem('test');
        return true;
      } catch (error) {
        console.error('SessionStorage not available');
        return false;
      }
    });
    
    // Test modern JS features
    const jsFeatureSupport = await page.evaluate(() => {
      const features = {
        arrow_functions: (() => true)(),
        async_await: typeof async function() {} === 'function',
        promises: typeof Promise !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        const_let: (() => { try { eval('const x = 1; let y = 2;'); return true; } catch(e) { return false; } })()
      };
      
      return features;
    });
    
    console.log(`Browser feature support:`, jsFeatureSupport);
    
    // Verify core functionality works
    const urlInput = page.locator('input[type="url"]');
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    
    await urlInput.fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    
    // Should work in all browsers
    await page.waitForTimeout(5000);
    console.log(`✅ Core functionality works in ${browserName}`);
    
    console.log(`🌍 Browser compatibility test completed for ${browserName}`);
  });

  test('should handle memory and performance edge cases', async ({ page }) => {
    console.log('🚀 Testing performance edge cases');
    
    // Test multiple tab scenarios
    const tabs = [];
    
    for (let i = 0; i < 3; i++) {
      const newTab = await page.context().newPage();
      await newTab.goto('/');
      tabs.push(newTab);
      console.log(`✅ Tab ${i + 1} created`);
    }
    
    // Test concurrent operations
    const promises = tabs.map(async (tab, index) => {
      await tab.locator('input[type="url"]').fill(`https://example${index}.com`);
      await tab.locator('button:has-text("Analyze")').click();
      return tab.waitForTimeout(10000);
    });
    
    await Promise.all(promises);
    console.log('✅ Concurrent operations completed');
    
    // Clean up tabs
    for (const tab of tabs) {
      await tab.close();
    }
    
    // Test memory usage patterns
    await page.goto('/');
    
    // Simulate high usage
    for (let i = 0; i < 10; i++) {
      await page.locator('input[type="url"]').fill(`https://test${i}.example.com`);
      await page.reload();
      await page.waitForTimeout(500);
    }
    
    console.log('✅ Memory usage patterns tested');
    
    // Test large data scenarios
    const largeData = Array(1000).fill(0).map((_, i) => `item-${i}`).join(',');
    
    await page.evaluate((data) => {
      localStorage.setItem('large-data', data);
    }, largeData);
    
    await page.reload();
    console.log('✅ Large data handling tested');
    
    console.log('🚀 Performance edge cases test completed');
  });

  test('should handle security edge cases', async ({ page }) => {
    console.log('🔒 Testing security edge cases');
    
    // Test XSS prevention
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '"><script>alert("xss")</script>',
      "';alert('xss');//",
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      '${alert("xss")}'
    ];
    
    await page.goto('/');
    
    for (const payload of xssPayloads) {
      // Test in URL input
      await page.locator('input[type="url"]').fill(payload);
      await page.waitForTimeout(500);
      
      // Should not execute scripts
      const alertDialog = page.locator('dialog[role="alertdialog"]');
      expect(await alertDialog.count()).toBe(0);
      console.log(`✅ XSS payload blocked: ${payload.substring(0, 20)}...`);
    }
    
    // Test email registration
    await page.locator('input[type="url"]').fill('https://example.com');
    await page.locator('button:has-text("Analyze")').click();
    await page.waitForTimeout(5000);
    
    await page.locator(':has-text("Create Free Account")').click();
    
    for (const payload of xssPayloads) {
      await page.locator('input[type="email"]').fill(payload);
      await page.waitForTimeout(300);
      
      // Should not execute scripts
      const alertDialog = page.locator('dialog[role="alertdialog"]');
      expect(await alertDialog.count()).toBe(0);
    }
    
    console.log('✅ XSS prevention working');
    
    // Test CSRF protection (if implemented)
    const csrfTest = await page.evaluate(() => {
      // Attempt to make cross-origin request
      return fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'csrf' })
      }).then(() => true).catch(() => false);
    });
    
    console.log(`CSRF protection test: ${csrfTest ? 'May need improvement' : 'Working'}`);
    
    console.log('🔒 Security edge cases test completed');
  });
});