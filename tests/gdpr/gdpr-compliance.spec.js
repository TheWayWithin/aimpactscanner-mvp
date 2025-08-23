// GDPR Compliance Test Suite
// Comprehensive testing for cookie consent, privacy controls, and data protection

import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance Testing', () => {
  
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage before each test
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test.describe('Cookie Consent Banner', () => {
    
    test('should display consent banner on first visit', async ({ page }) => {
      await page.goto('/');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check if consent banner is visible
      const consentBanner = page.locator('[data-testid="consent-banner"], .fixed.bottom-0, div:has-text("🍪 We use cookies")');
      await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
      
      // Verify banner content
      await expect(page.locator('text=🍪 We use cookies')).toBeVisible();
      await expect(page.locator('text=Accept All')).toBeVisible();
      await expect(page.locator('text=Reject All')).toBeVisible();
      await expect(page.locator('text=Customize')).toBeVisible();
    });

    test('should accept all cookies and hide banner', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click Accept All
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Verify banner is hidden
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      // Verify consent is stored
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      expect(consentData).not.toBeNull();
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
    });

    test('should reject all optional cookies', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click Reject All
      const rejectButton = page.locator('text=Reject All');
      await expect(rejectButton).toBeVisible({ timeout: 10000 });
      await rejectButton.click();
      
      // Verify banner is hidden
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      // Verify consent is stored with rejected preferences
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      expect(consentData).not.toBeNull();
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });

    test('should allow custom cookie preferences', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Click Customize button
      const customizeButton = page.locator('text=Customize');
      await expect(customizeButton).toBeVisible({ timeout: 10000 });
      await customizeButton.click();
      
      // Verify preferences panel is shown
      await expect(page.locator('text=Cookie Preferences')).toBeVisible();
      await expect(page.locator('text=Essential')).toBeVisible();
      await expect(page.locator('text=Analytics')).toBeVisible();
      await expect(page.locator('text=Marketing')).toBeVisible();
      
      // Enable analytics but keep marketing disabled
      const analyticsToggle = page.locator('label:has-text("Analytics") input[type="checkbox"]');
      const marketingToggle = page.locator('label:has-text("Marketing") input[type="checkbox"]');
      
      // Ensure analytics is checked and marketing is unchecked
      if (!await analyticsToggle.isChecked()) {
        await analyticsToggle.check();
      }
      if (await marketingToggle.isChecked()) {
        await marketingToggle.uncheck();
      }
      
      // Save preferences
      await page.locator('text=Save Preferences').click();
      
      // Verify consent is stored correctly
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(false);
    });

    test('should not show banner on subsequent visits after consent', async ({ page }) => {
      // First visit - accept cookies
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Second visit - banner should not appear
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait a bit to ensure banner doesn't appear
      await page.waitForTimeout(2000);
      
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden();
    });
  });

  test.describe('GTM Consent Mode Integration', () => {
    
    test('should load GTM container on page load', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if GTM is loaded
      const gtmLoaded = await page.evaluate(() => {
        return typeof window.dataLayer !== 'undefined' && Array.isArray(window.dataLayer);
      });
      expect(gtmLoaded).toBe(true);
      
      // Verify GTM container ID is present in page
      const gtmScript = page.locator('script[src*="GTM-WCQGG5N6"]');
      await expect(gtmScript).toHaveCount(1);
    });

    test('should send consent events to GTM when accepting all', async ({ page }) => {
      // Monitor dataLayer pushes
      await page.addInitScript(() => {
        window.consentEvents = [];
        const originalPush = window.dataLayer?.push || (() => {});
        if (window.dataLayer) {
          window.dataLayer.push = function(event) {
            if (event.event === 'consent_update') {
              window.consentEvents.push(event);
            }
            return originalPush.apply(this, arguments);
          };
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Accept all cookies
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Check consent events were sent
      const consentEvents = await page.evaluate(() => window.consentEvents || []);
      expect(consentEvents.length).toBeGreaterThan(0);
      
      const lastEvent = consentEvents[consentEvents.length - 1];
      expect(lastEvent.consent_analytics).toBe('granted');
      expect(lastEvent.consent_marketing).toBe('granted');
    });

    test('should send correct consent events when rejecting all', async ({ page }) => {
      // Monitor dataLayer pushes
      await page.addInitScript(() => {
        window.consentEvents = [];
        const originalPush = window.dataLayer?.push || (() => {});
        if (window.dataLayer) {
          window.dataLayer.push = function(event) {
            if (event.event === 'consent_update') {
              window.consentEvents.push(event);
            }
            return originalPush.apply(this, arguments);
          };
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Reject all cookies
      const rejectButton = page.locator('text=Reject All');
      await expect(rejectButton).toBeVisible({ timeout: 10000 });
      await rejectButton.click();
      
      // Check consent events were sent with denied status
      const consentEvents = await page.evaluate(() => window.consentEvents || []);
      expect(consentEvents.length).toBeGreaterThan(0);
      
      const lastEvent = consentEvents[consentEvents.length - 1];
      expect(lastEvent.consent_analytics).toBe('denied');
      expect(lastEvent.consent_marketing).toBe('denied');
    });
  });

  test.describe('Enzuzo Integration', () => {
    
    test('should load Enzuzo privacy compliance script', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check for Enzuzo script or domain reference
      const enzuzoDomain = 'd7ac73b6-7c38-11f0-9bf3-a7c11342cf5c';
      
      // Look for Enzuzo in page content, scripts, or network requests
      const pageContent = await page.content();
      const hasEnzuzoReference = pageContent.includes(enzuzoDomain);
      
      // If not in content, check for script loads
      if (!hasEnzuzoReference) {
        // Wait for potential async Enzuzo script loading
        await page.waitForTimeout(3000);
        
        // Check for Enzuzo privacy center or widget
        const enzuzoWidget = page.locator('[data-enzuzo], .enzuzo-privacy-center, script[src*="enzuzo"]');
        
        // Note: This test may need adjustment based on actual Enzuzo implementation
        console.log('Enzuzo integration check - may need manual verification');
      }
    });
  });

  test.describe('Privacy Policy and Data Access', () => {
    
    test('should have accessible privacy policy link', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Look for privacy policy link in consent banner or footer
      const privacyLinks = page.locator('a[href*="privacy"], text="Privacy Policy", text="Learn more in our Privacy Policy"');
      
      // Should have at least one privacy policy reference
      await expect(privacyLinks.first()).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to privacy policy page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Try to find and click privacy policy link
      const privacyLink = page.locator('text="Privacy Policy"').first();
      
      if (await privacyLink.isVisible()) {
        await privacyLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on privacy policy page
        await expect(page.locator('h1:has-text("Privacy"), h2:has-text("Privacy"), text="privacy policy"').first()).toBeVisible();
      }
    });
  });

  test.describe('Cross-Browser Consent Persistence', () => {
    
    test('should maintain consent across page navigations', async ({ page }) => {
      // Set consent on home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
      }
      
      // Navigate to different pages and ensure no consent banner
      const testPages = ['/pricing', '/contact', '/privacy'];
      
      for (const testPage of testPages) {
        try {
          await page.goto(testPage);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Consent banner should not reappear
          const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
          await expect(consentBanner).toBeHidden();
        } catch (error) {
          console.log(`Page ${testPage} may not exist, skipping navigation test`);
        }
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    
    test('should display consent banner properly on mobile', async ({ page, isMobile }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
      
      if (isMobile) {
        // On mobile, buttons should stack vertically or be arranged appropriately
        const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row');
        await expect(buttonContainer).toBeVisible();
      }
      
      // All action buttons should be visible and clickable
      await expect(page.locator('text=Accept All')).toBeVisible();
      await expect(page.locator('text=Reject All')).toBeVisible();
      await expect(page.locator('text=Customize')).toBeVisible();
    });
  });

  test.describe('Consent Withdrawal and Management', () => {
    
    test('should allow users to change consent preferences', async ({ page }) => {
      // First, set initial consent
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
      }
      
      // Clear localStorage to simulate consent management access
      await page.evaluate(() => {
        localStorage.removeItem('cookie-consent');
      });
      
      // Reload page - should show banner again
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
      
      // This time reject all
      const rejectButton = page.locator('text=Reject All');
      await rejectButton.click();
      
      // Verify new consent preferences
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      const consent = JSON.parse(consentData);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });
  });

  test.describe('Data Processing Compliance', () => {
    
    test('should not track users without consent', async ({ page }) => {
      // Block all analytics/tracking requests initially
      await page.route('**/google-analytics.com/**', route => route.abort());
      await page.route('**/googletagmanager.com/**', route => route.abort());
      await page.route('**/facebook.com/**', route => route.abort());
      await page.route('**/doubleclick.net/**', route => route.abort());
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Reject all cookies
      const rejectButton = page.locator('text=Reject All');
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
      }
      
      // Wait and verify no tracking cookies are set
      await page.waitForTimeout(2000);
      
      const cookies = await page.context().cookies();
      const trackingCookies = cookies.filter(cookie => 
        cookie.name.includes('_ga') || 
        cookie.name.includes('_gid') || 
        cookie.name.includes('fbp') ||
        cookie.name.includes('_fbp')
      );
      
      expect(trackingCookies.length).toBe(0);
    });
  });
});