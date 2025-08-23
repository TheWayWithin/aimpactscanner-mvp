// Simple GDPR Validation Test
// Test basic consent banner functionality without localStorage security restrictions

import { test, expect } from '@playwright/test';
import { forceCleanupEnzuzo } from './enzuzo-cleanup-utils.js';

test.describe('Simple GDPR Validation', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies but avoid localStorage to prevent security errors
    await context.clearCookies();
    
    // Navigate to the site
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Force cleanup any Enzuzo interference
    await forceCleanupEnzuzo(page);
    
    // Additional wait to ensure cleanup is complete
    await page.waitForTimeout(1000);
  });

  test('consent banner should be visible on first visit', async ({ page }) => {
    // Page already loaded in beforeEach
    
    // Check if consent banner appears
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Verify required buttons are present
    await expect(page.locator('[data-testid="accept-all-cookies"]')).toBeVisible();
    await expect(page.locator('[data-testid="reject-all-cookies"]')).toBeVisible(); 
    await expect(page.locator('[data-testid="manage-preferences"]')).toBeVisible();
  });

  test('accept all cookies should hide banner', async ({ page }) => {
    // Page already loaded and cleaned in beforeEach
    
    // Wait for banner to appear
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Click Accept All
    await page.locator('[data-testid="accept-all-cookies"]').click();
    
    // Verify banner disappears
    await expect(consentBanner).toBeHidden({ timeout: 5000 });
  });

  test('reject all cookies should hide banner', async ({ page }) => {
    // Page already loaded and cleaned in beforeEach
    
    // Wait for banner to appear
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Click Reject All
    await page.locator('[data-testid="reject-all-cookies"]').click();
    
    // Verify banner disappears
    await expect(consentBanner).toBeHidden({ timeout: 5000 });
  });

  test('customize preferences should show options', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for banner to appear
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Click Customize
    await page.locator('[data-testid="manage-preferences"]').click();
    
    // Verify preference options appear
    await expect(page.locator('text=Cookie Preferences')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Essential')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Marketing')).toBeVisible();
    
    // Verify toggle controls
    await expect(page.locator('[data-testid="analytics-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="marketing-toggle"]')).toBeVisible();
    
    // Verify save button
    await expect(page.locator('[data-testid="save-preferences"]')).toBeVisible();
  });

  test('GTM container should be loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if GTM script is present
    const gtmScript = page.locator('script[src*="GTM-WCQGG5N6"]');
    await expect(gtmScript).toHaveCount(1);
    
    // Check if dataLayer exists
    const dataLayerExists = await page.evaluate(() => {
      return typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer);
    });
    expect(dataLayerExists).toBe(true);
  });

  test('privacy policy link should be present and clickable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for banner to appear
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Check privacy policy link
    const privacyLink = page.locator('[data-testid="privacy-policy-link"]');
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveText('Privacy Policy');
    
    // Link should be clickable
    await expect(privacyLink).toBeEnabled();
  });

  test('mobile responsive design', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // All buttons should be visible regardless of screen size
    await expect(page.locator('[data-testid="accept-all-cookies"]')).toBeVisible();
    await expect(page.locator('[data-testid="reject-all-cookies"]')).toBeVisible();
    await expect(page.locator('[data-testid="manage-preferences"]')).toBeVisible();
  });

  test('consent banner should have proper GDPR content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    // Check required GDPR content
    await expect(page.locator('text=We use cookies')).toBeVisible();
    await expect(page.locator('text=analytics')).toBeVisible();
    await expect(page.locator('text=marketing')).toBeVisible();
    await expect(page.locator('text=Privacy Policy')).toBeVisible();
  });

  test('GTM consent events should be sent on interaction', async ({ page }) => {
    // Monitor dataLayer events
    await page.addInitScript(() => {
      window.consentEvents = [];
      const originalDataLayer = window.dataLayer || [];
      
      Object.defineProperty(window, 'dataLayer', {
        get: () => originalDataLayer,
        set: () => {}, // Prevent overwrites
        configurable: false
      });
      
      // Override push method to capture events
      const originalPush = originalDataLayer.push || (() => {});
      originalDataLayer.push = function(event) {
        if (event && event.event === 'consent_update') {
          window.consentEvents.push(event);
        }
        return originalPush.apply(this, arguments);
      };
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for banner and accept all cookies
    const consentBanner = page.locator('[data-testid="consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 15000 });
    
    await page.locator('[data-testid="accept-all-cookies"]').click();
    
    // Wait for events to be processed
    await page.waitForTimeout(2000);
    
    // Check consent events were fired
    const consentEvents = await page.evaluate(() => window.consentEvents || []);
    expect(consentEvents.length).toBeGreaterThan(0);
    
    // Verify event structure for accept all
    const acceptEvent = consentEvents.find(e => e.consent_method === 'accept_all');
    if (acceptEvent) {
      expect(acceptEvent.consent_analytics).toBe('granted');
      expect(acceptEvent.consent_marketing).toBe('granted');
    }
  });
});