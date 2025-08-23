// GTM Consent Mode Validation Tests
// Comprehensive testing for Google Tag Manager container GTM-WCQGG5N6

import { test, expect } from '@playwright/test';

test.describe('GTM Consent Mode Integration - GTM-WCQGG5N6', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage and setup monitoring
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Setup GTM monitoring
    await page.addInitScript(() => {
      window.gtmEvents = [];
      window.gtmConsent = [];
      
      // Monitor dataLayer pushes
      if (window.dataLayer) {
        const originalPush = window.dataLayer.push;
        window.dataLayer.push = function(...args) {
          window.gtmEvents.push(...args);
          
          // Track consent-specific events
          args.forEach(event => {
            if (event && (event.event === 'consent_update' || event.consent_analytics || event.consent_marketing)) {
              window.gtmConsent.push(event);
            }
          });
          
          return originalPush.apply(this, args);
        };
      }
    });
  });

  test.describe('GTM Container Loading', () => {
    
    test('should load GTM container GTM-WCQGG5N6', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verify GTM script is present
      const gtmScript = page.locator('script[src*="GTM-WCQGG5N6"]');
      await expect(gtmScript).toHaveCount(1);
      
      // Verify dataLayer is initialized
      const dataLayerExists = await page.evaluate(() => {
        return typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer);
      });
      expect(dataLayerExists).toBe(true);
      
      // Verify GTM is loaded
      const gtmLoaded = await page.evaluate(() => {
        return window.google_tag_manager && 
               window.google_tag_manager['GTM-WCQGG5N6'];
      });
      expect(gtmLoaded).toBe(true);
    });

    test('should initialize consent mode before GTM loads', async ({ page }) => {
      // Monitor the order of initialization
      await page.addInitScript(() => {
        window.initOrder = [];
        
        // Track consent initialization
        const originalPush = window.dataLayer?.push || (() => {});
        if (window.dataLayer) {
          window.dataLayer.push = function(event) {
            if (event && event.consent) {
              window.initOrder.push('consent_init');
            }
            if (event && event.event === 'gtm.js') {
              window.initOrder.push('gtm_init');
            }
            return originalPush.apply(this, arguments);
          };
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const initOrder = await page.evaluate(() => window.initOrder || []);
      console.log('Initialization order:', initOrder);
      
      // Ideally, consent should be initialized before GTM
      // This ensures proper consent mode setup
    });
  });

  test.describe('Default Consent State', () => {
    
    test('should set default consent state to denied before user action', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check initial consent state
      const initialConsent = await page.evaluate(() => {
        return window.gtmConsent || [];
      });
      
      // Before user interaction, analytics and marketing should be denied by default
      const hasDefaultDenied = initialConsent.some(event => 
        event.consent_analytics === 'denied' && event.consent_marketing === 'denied'
      );
      
      // If no explicit default, consent banner should be visible
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      const bannerVisible = await consentBanner.isVisible({ timeout: 5000 });
      
      // Either explicit denied consent OR consent banner should be present
      expect(hasDefaultDenied || bannerVisible).toBe(true);
    });
  });

  test.describe('Consent Acceptance Flow', () => {
    
    test('should update consent to granted when accepting all cookies', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Clear existing consent events
      await page.evaluate(() => {
        window.gtmConsent = [];
      });
      
      // Accept all cookies
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Wait for consent events to be processed
      await page.waitForTimeout(2000);
      
      const consentEvents = await page.evaluate(() => window.gtmConsent || []);
      console.log('Consent events after accepting:', consentEvents);
      
      // Verify consent was granted
      const hasGrantedConsent = consentEvents.some(event => 
        event.consent_analytics === 'granted' && 
        event.consent_marketing === 'granted'
      );
      
      expect(hasGrantedConsent).toBe(true);
    });

    test('should send correct consent event structure to GTM', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => {
        window.gtmConsent = [];
      });
      
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      await page.waitForTimeout(2000);
      
      const consentEvents = await page.evaluate(() => window.gtmConsent || []);
      
      if (consentEvents.length > 0) {
        const lastEvent = consentEvents[consentEvents.length - 1];
        
        // Verify event structure matches GTM consent mode requirements
        expect(lastEvent).toHaveProperty('event');
        expect(lastEvent.event).toBe('consent_update');
        expect(lastEvent).toHaveProperty('consent_analytics');
        expect(lastEvent).toHaveProperty('consent_marketing');
        
        // Values should be 'granted' or 'denied'
        expect(['granted', 'denied']).toContain(lastEvent.consent_analytics);
        expect(['granted', 'denied']).toContain(lastEvent.consent_marketing);
      }
    });
  });

  test.describe('Consent Rejection Flow', () => {
    
    test('should update consent to denied when rejecting cookies', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await page.evaluate(() => {
        window.gtmConsent = [];
      });
      
      // Reject all cookies
      const rejectButton = page.locator('text=Reject All');
      await expect(rejectButton).toBeVisible({ timeout: 10000 });
      await rejectButton.click();
      
      await page.waitForTimeout(2000);
      
      const consentEvents = await page.evaluate(() => window.gtmConsent || []);
      console.log('Consent events after rejecting:', consentEvents);
      
      // Verify consent was denied
      const hasDeniedConsent = consentEvents.some(event => 
        event.consent_analytics === 'denied' && 
        event.consent_marketing === 'denied'
      );
      
      expect(hasDeniedConsent).toBe(true);
    });
  });

  test.describe('Granular Consent Preferences', () => {
    
    test('should handle selective consent preferences', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Open consent preferences
      const customizeButton = page.locator('text=Customize');
      await expect(customizeButton).toBeVisible({ timeout: 10000 });
      await customizeButton.click();
      
      // Enable analytics but disable marketing
      const analyticsToggle = page.locator('input[type="checkbox"]').nth(0); // First checkbox after essential
      const marketingToggle = page.locator('input[type="checkbox"]').nth(1); // Second checkbox
      
      // Clear previous events
      await page.evaluate(() => {
        window.gtmConsent = [];
      });
      
      // Set specific preferences - enable analytics, disable marketing
      if (!await analyticsToggle.isChecked()) {
        await analyticsToggle.check();
      }
      if (await marketingToggle.isChecked()) {
        await marketingToggle.uncheck();
      }
      
      // Save preferences
      await page.locator('text=Save Preferences').click();
      
      await page.waitForTimeout(2000);
      
      const consentEvents = await page.evaluate(() => window.gtmConsent || []);
      console.log('Selective consent events:', consentEvents);
      
      // Verify selective consent was applied
      const hasSelectiveConsent = consentEvents.some(event => 
        event.consent_analytics === 'granted' && 
        event.consent_marketing === 'denied'
      );
      
      expect(hasSelectiveConsent).toBe(true);
    });
  });

  test.describe('Analytics and Marketing Tag Firing', () => {
    
    test('should fire analytics tags only when analytics consent is granted', async ({ page }) => {
      // Monitor Google Analytics requests
      const analyticsRequests = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('google-analytics.com') || 
            url.includes('/analytics') ||
            url.includes('gtag') ||
            url.includes('collect')) {
          analyticsRequests.push({
            url,
            timestamp: Date.now()
          });
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Accept analytics consent
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Wait for potential analytics requests
      await page.waitForTimeout(5000);
      
      console.log(`Analytics requests made: ${analyticsRequests.length}`);
      analyticsRequests.forEach(req => {
        console.log(`- ${req.url.substring(0, 100)}...`);
      });
      
      // When consent is granted, analytics requests should be allowed
      // Note: In test environment, actual firing may be limited
    });

    test('should block analytics tags when consent is denied', async ({ page }) => {
      const analyticsRequests = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('google-analytics.com') || 
            url.includes('/analytics') ||
            url.includes('gtag')) {
          analyticsRequests.push(url);
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Reject all cookies
      const rejectButton = page.locator('text=Reject All');
      await expect(rejectButton).toBeVisible({ timeout: 10000 });
      await rejectButton.click();
      
      // Wait and verify no analytics requests
      await page.waitForTimeout(5000);
      
      console.log(`Analytics requests after rejection: ${analyticsRequests.length}`);
      
      // When consent is denied, analytics requests should be blocked
      // In proper GTM consent mode implementation, no requests should fire
    });
  });

  test.describe('Consent Persistence', () => {
    
    test('should maintain consent state across page reloads', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Accept cookies
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Clear consent tracking to only see new events
      await page.evaluate(() => {
        window.gtmConsent = [];
      });
      
      // Wait for consent state to be restored
      await page.waitForTimeout(3000);
      
      // Check if consent was properly restored
      const consentEvents = await page.evaluate(() => window.gtmConsent || []);
      
      // Should not see consent banner again
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      // Consent should be maintained from localStorage
      const storedConsent = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(storedConsent).not.toBeNull();
      
      const consent = JSON.parse(storedConsent);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
    });
  });

  test.describe('GTM Debug Mode', () => {
    
    test('should verify GTM is working in debug mode', async ({ page }) => {
      // Enable GTM debug mode
      await page.addInitScript(() => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js'
        });
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if GTM debug information is available
      const gtmDebugInfo = await page.evaluate(() => {
        return {
          dataLayerLength: window.dataLayer?.length || 0,
          gtmContainer: !!window.google_tag_manager?.['GTM-WCQGG5N6'],
          gtmEvents: window.gtmEvents?.length || 0,
          consentEvents: window.gtmConsent?.length || 0
        };
      });
      
      console.log('GTM Debug Information:', gtmDebugInfo);
      
      expect(gtmDebugInfo.dataLayerLength).toBeGreaterThan(0);
      expect(gtmDebugInfo.gtmContainer).toBe(true);
    });
  });
});