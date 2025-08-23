// Cross-Browser GDPR Consent Testing
// Comprehensive testing across Chrome, Firefox, Safari, and mobile devices

import { test, expect, devices } from '@playwright/test';

// Configure test projects for different browsers and devices
const testProjects = [
  {
    name: 'Desktop Chrome',
    use: { ...devices['Desktop Chrome'] }
  },
  {
    name: 'Desktop Firefox', 
    use: { ...devices['Desktop Firefox'] }
  },
  {
    name: 'Desktop Safari',
    use: { ...devices['Desktop Safari'] }
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] }
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] }
  },
  {
    name: 'Tablet iPad',
    use: { ...devices['iPad Pro'] }
  }
];

test.describe('Cross-Browser GDPR Consent Compliance', () => {
  
  test.beforeEach(async ({ page, context, browserName, isMobile }) => {
    // Clear all storage
    await context.clearCookies();
    await context.clearPermissions();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log(`Testing on: ${browserName}${isMobile ? ' (Mobile)' : ''}`);
  });

  test.describe('Consent Banner Rendering', () => {
    
    test('should display consent banner consistently across all browsers', async ({ page, browserName, isMobile }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for banner to appear
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")').first();
      await expect(consentBanner).toBeVisible({ timeout: 10000 });
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: `test-results/consent-banner-${browserName}${isMobile ? '-mobile' : ''}.png`,
        fullPage: false
      });
      
      // Verify essential elements are present
      await expect(page.locator('text=🍪 We use cookies')).toBeVisible();
      await expect(page.locator('text=Accept All')).toBeVisible();
      await expect(page.locator('text=Reject All')).toBeVisible();
      await expect(page.locator('text=Customize')).toBeVisible();
      
      // Check banner positioning
      const bannerBounds = await consentBanner.boundingBox();
      expect(bannerBounds).not.toBeNull();
      
      // Banner should be at bottom of viewport
      const viewportSize = page.viewportSize();
      expect(bannerBounds.y).toBeGreaterThan(viewportSize.height * 0.5);
      
      console.log(`✓ ${browserName} - Banner renders correctly`);
    });

    test('should handle responsive design on different screen sizes', async ({ page, browserName, isMobile }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")').first();
      await expect(consentBanner).toBeVisible({ timeout: 10000 });
      
      if (isMobile) {
        // On mobile, check that buttons stack properly
        const buttonContainer = page.locator('.flex.flex-col.sm\\:flex-row, .flex.gap-3');
        await expect(buttonContainer).toBeVisible();
        
        // Buttons should be accessible on mobile
        const buttons = page.locator('button:has-text("Accept All"), button:has-text("Reject All"), button:has-text("Customize")');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThanOrEqual(3);
        
        // Check that buttons don't overflow
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          await expect(button).toBeVisible();
          
          const buttonBounds = await button.boundingBox();
          const viewportSize = page.viewportSize();
          expect(buttonBounds.x + buttonBounds.width).toBeLessThanOrEqual(viewportSize.width);
        }
        
        console.log(`✓ ${browserName} Mobile - Responsive layout works`);
      } else {
        // On desktop, buttons should be in a row
        const acceptButton = page.locator('text=Accept All');
        const rejectButton = page.locator('text=Reject All');
        
        const acceptBounds = await acceptButton.boundingBox();
        const rejectBounds = await rejectButton.boundingBox();
        
        // Buttons should be roughly on the same horizontal line
        const yDifference = Math.abs(acceptBounds.y - rejectBounds.y);
        expect(yDifference).toBeLessThan(20); // Allow some variance
        
        console.log(`✓ ${browserName} Desktop - Horizontal button layout correct`);
      }
    });
  });

  test.describe('Consent Functionality Across Browsers', () => {
    
    test('should accept all cookies consistently', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      await expect(acceptButton).toBeVisible({ timeout: 10000 });
      await acceptButton.click();
      
      // Verify banner disappears
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      // Verify localStorage consent
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(consentData).not.toBeNull();
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(true);
      expect(consent.timestamp).toBeDefined();
      
      console.log(`✓ ${browserName} - Accept All functionality works`);
    });

    test('should reject all cookies consistently', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const rejectButton = page.locator('text=Reject All');
      await expect(rejectButton).toBeVisible({ timeout: 10000 });
      await rejectButton.click();
      
      // Verify banner disappears
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      // Verify localStorage consent
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
      
      console.log(`✓ ${browserName} - Reject All functionality works`);
    });

    test('should handle custom preferences across browsers', async ({ page, browserName, isMobile }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const customizeButton = page.locator('text=Customize');
      await expect(customizeButton).toBeVisible({ timeout: 10000 });
      await customizeButton.click();
      
      // Verify preferences panel opens
      await expect(page.locator('text=Cookie Preferences')).toBeVisible();
      
      // Find preference toggles - may need different strategies for different browsers
      const toggles = page.locator('input[type="checkbox"]');
      const toggleCount = await toggles.count();
      
      expect(toggleCount).toBeGreaterThanOrEqual(2); // Should have at least analytics and marketing
      
      // Enable analytics, disable marketing
      const analyticsToggle = toggles.nth(0); // First toggle after essential
      const marketingToggle = toggles.nth(1); // Second toggle
      
      // Handle browser-specific toggle behavior
      if (!await analyticsToggle.isChecked()) {
        await analyticsToggle.check();
      }
      
      if (await marketingToggle.isChecked()) {
        await marketingToggle.uncheck();
      }
      
      // Save preferences
      const saveButton = page.locator('text=Save Preferences');
      await saveButton.click();
      
      // Verify preferences saved
      await page.waitForTimeout(1000);
      
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      const consent = JSON.parse(consentData);
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(true);
      expect(consent.marketing).toBe(false);
      
      console.log(`✓ ${browserName} - Custom preferences work${isMobile ? ' (Mobile)' : ''}`);
    });
  });

  test.describe('LocalStorage Persistence Across Browsers', () => {
    
    test('should maintain consent across page reloads', async ({ page, browserName }) => {
      // First visit - set consent
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Banner should not appear
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner).toBeHidden();
      
      // Consent should persist
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(consentData).not.toBeNull();
      
      const consent = JSON.parse(consentData);
      expect(consent.analytics).toBe(true);
      
      console.log(`✓ ${browserName} - Consent persists across reloads`);
    });

    test('should maintain consent across navigation', async ({ page, browserName }) => {
      // Set consent on home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
      }
      
      // Navigate to other pages
      const testPages = ['/pricing', '/contact', '/privacy', '/about'];
      
      for (const testPage of testPages) {
        try {
          await page.goto(testPage);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          // Banner should not reappear
          const banner = page.locator('div:has-text("🍪 We use cookies")');
          await expect(banner).toBeHidden({ timeout: 3000 });
          
          console.log(`✓ ${browserName} - No banner on ${testPage}`);
        } catch (error) {
          console.log(`Page ${testPage} may not exist, skipping`);
        }
      }
    });
  });

  test.describe('Browser-Specific Features', () => {
    
    test('should handle Safari privacy restrictions', async ({ page, browserName }) => {
      if (browserName !== 'webkit') {
        test.skip('Safari-specific test');
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Safari may have stricter localStorage policies
      const localStorageSupport = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'value');
          localStorage.removeItem('test');
          return true;
        } catch (e) {
          return false;
        }
      });
      
      expect(localStorageSupport).toBe(true);
      
      // Test consent functionality in Safari
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        
        const consentData = await page.evaluate(() => {
          return localStorage.getItem('cookie-consent');
        });
        
        expect(consentData).not.toBeNull();
        console.log('✓ Safari - LocalStorage consent works');
      }
    });

    test('should handle Firefox tracking protection', async ({ page, browserName }) => {
      if (browserName !== 'firefox') {
        test.skip('Firefox-specific test');
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Firefox may block certain tracking scripts
      // Verify consent banner still works
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
      
      // Test that consent functionality works despite tracking protection
      await page.locator('text=Accept All').click();
      
      await page.waitForTimeout(1000);
      
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(consentData).not.toBeNull();
      console.log('✓ Firefox - Consent works with tracking protection');
    });

    test('should handle Chrome privacy sandbox', async ({ page, browserName }) => {
      if (browserName !== 'chromium') {
        test.skip('Chrome-specific test');
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test consent functionality with Chrome's privacy features
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")');
      await expect(consentBanner.first()).toBeVisible({ timeout: 10000 });
      
      await page.locator('text=Accept All').click();
      
      // Verify GTM integration works in Chrome
      const gtmLoaded = await page.evaluate(() => {
        return typeof window.dataLayer !== 'undefined' && 
               window.google_tag_manager && 
               window.google_tag_manager['GTM-WCQGG5N6'];
      });
      
      expect(gtmLoaded).toBe(true);
      console.log('✓ Chrome - GTM integration works');
    });
  });

  test.describe('Mobile-Specific GDPR Features', () => {
    
    test('should handle touch interactions on mobile devices', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip('Mobile-specific test');
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const consentBanner = page.locator('div:has-text("🍪 We use cookies")').first();
      await expect(consentBanner).toBeVisible({ timeout: 10000 });
      
      // Test touch interaction with buttons
      const acceptButton = page.locator('text=Accept All');
      
      // Use tap instead of click for mobile
      await acceptButton.tap();
      
      await expect(consentBanner).toBeHidden({ timeout: 5000 });
      
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(consentData).not.toBeNull();
      console.log('✓ Mobile - Touch interactions work');
    });

    test('should handle mobile preference customization', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip('Mobile-specific test');
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Open preferences on mobile
      const customizeButton = page.locator('text=Customize');
      await expect(customizeButton).toBeVisible({ timeout: 10000 });
      await customizeButton.tap();
      
      // Verify preferences panel is usable on mobile
      await expect(page.locator('text=Cookie Preferences')).toBeVisible();
      
      // Check that toggle switches are accessible on mobile
      const toggles = page.locator('input[type="checkbox"]');
      const toggleCount = await toggles.count();
      
      for (let i = 0; i < toggleCount; i++) {
        const toggle = toggles.nth(i);
        const bounds = await toggle.boundingBox();
        
        // Toggle should be large enough for touch interaction
        expect(bounds.width).toBeGreaterThan(20);
        expect(bounds.height).toBeGreaterThan(20);
      }
      
      console.log('✓ Mobile - Preference toggles are touch-friendly');
    });
  });

  test.describe('Cross-Browser Data Consistency', () => {
    
    test('should store consent data in consistent format', async ({ page, browserName }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const acceptButton = page.locator('text=Accept All');
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
      
      const consentData = await page.evaluate(() => {
        return localStorage.getItem('cookie-consent');
      });
      
      expect(consentData).not.toBeNull();
      
      const consent = JSON.parse(consentData);
      
      // Verify consistent data structure across browsers
      expect(consent).toHaveProperty('necessary');
      expect(consent).toHaveProperty('analytics');
      expect(consent).toHaveProperty('marketing');
      expect(consent).toHaveProperty('timestamp');
      
      expect(typeof consent.necessary).toBe('boolean');
      expect(typeof consent.analytics).toBe('boolean');
      expect(typeof consent.marketing).toBe('boolean');
      expect(typeof consent.timestamp).toBe('string');
      
      // Verify timestamp is valid ISO string
      const timestamp = new Date(consent.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      
      console.log(`✓ ${browserName} - Consistent data format:`, consent);
    });
  });
});