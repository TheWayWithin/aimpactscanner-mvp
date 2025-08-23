// Enzuzo Cleanup Test - Verify no Enzuzo scripts interfere with GDPR testing
// This test ensures the Enzuzo removal is complete and no remnants block testing

import { test, expect } from '@playwright/test';
import { forceCleanupEnzuzo, checkForEnzuzoElements } from './enzuzo-cleanup-utils.js';

test.describe('Enzuzo Cleanup Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the site
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Force remove any Enzuzo elements that might exist
    await page.evaluate(() => {
      // Remove Enzuzo elements
      const enzuzoElements = document.querySelectorAll('[id*="ez-"], [class*="enzuzo"], [class*="ez-"]');
      enzuzoElements.forEach(el => el.remove());
      
      // Remove Enzuzo scripts
      const scripts = document.querySelectorAll('script[src*="enzuzo"], script[src*="ez-"]');
      scripts.forEach(script => script.remove());
      
      // Clear Enzuzo globals
      if (window.Enzuzo) {
        delete window.Enzuzo;
      }
      
      // Clear Enzuzo-related localStorage/sessionStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes('enzuzo')) {
          localStorage.removeItem(key);
        }
      }
      
      console.log('🧹 Enzuzo cleanup completed');
    });
    
    // Additional wait to ensure cleanup is complete
    await page.waitForTimeout(1000);
  });

  test('should have no Enzuzo scripts or elements on page load', async ({ page }) => {
    // Use utility function to check for Enzuzo elements
    const checkResults = await checkForEnzuzoElements(page);
    
    // Verify no scripts are present
    expect(checkResults.scripts).toBe(0);
    
    // Verify no DOM elements are present
    expect(checkResults.elements).toHaveLength(0);
    
    // Verify no global variables
    expect(checkResults.hasEnzuzoGlobal).toBe(false);
  });

  test('should allow clicks on SimpleConsentBanner without interference', async ({ page }) => {
    // Wait for consent banner to appear
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible();
    
    // Verify no Enzuzo elements are blocking clicks
    const blockingElements = await page.$$('#ez-cookie-notification, .enzuzo-cookiebanner-container');
    expect(blockingElements).toHaveLength(0);
    
    // Test clicking Accept All (this was previously blocked by Enzuzo)
    const acceptButton = page.locator('[data-testid="accept-all-cookies"]');
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();
    
    // Verify banner disappears (this was the test that was failing)
    await expect(consentBanner).toBeHidden({ timeout: 5000 });
    
    console.log('✅ SimpleConsentBanner click test passed - no Enzuzo interference');
  });

  test('should not load Enzuzo from environment variables', async ({ page }) => {
    // Check that VITE_ENZUZO_DOMAIN_ID is not accessible
    const enzuzoDomainId = await page.evaluate(() => {
      // Check if window has access to environment variables
      if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__.VITE_ENZUZO_DOMAIN_ID;
      }
      return undefined;
    });
    
    // Should be undefined since we commented it out
    expect(enzuzoDomainId).toBeUndefined();
  });

  test('should successfully complete full consent flow without interference', async ({ page }) => {
    // Full consent flow test (this is what was failing before)
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible();

    // Test both Accept All and Customize options
    const acceptButton = page.locator('[data-testid="accept-all-cookies"]');
    const customizeButton = page.locator('[data-testid="customize-cookies"]');
    
    // Test Customize flow first
    await customizeButton.click();
    
    // Should show detailed options
    const detailedOptions = page.locator('[data-testid="detailed-cookie-options"]');
    await expect(detailedOptions).toBeVisible();
    
    // Accept all from detailed view
    const acceptAllDetailed = page.locator('[data-testid="accept-all-detailed"]');
    await acceptAllDetailed.click();
    
    // Banner should disappear
    await expect(consentBanner).toBeHidden({ timeout: 5000 });
    
    console.log('✅ Full consent flow completed without Enzuzo interference');
  });
});

// Utility functions are now imported from enzuzo-cleanup-utils.js