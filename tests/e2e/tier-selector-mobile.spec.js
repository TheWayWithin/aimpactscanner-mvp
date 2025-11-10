/**
 * Test Gate 5: Mobile Responsive Tests for DynamicTierSelector
 *
 * Tests the dropdown tier selector pattern on mobile viewports (428px and smaller)
 * Component: DynamicTierSelector (Phase 6.5 implementation)
 *
 * Coverage:
 * - Stacked vertical layout on mobile
 * - Touch interaction functionality
 * - Touch target accessibility (WCAG 2.1 AA - 48px minimum)
 * - Dropdown selector on mobile
 * - Billing toggle functionality
 * - Dynamic content updates
 * - No horizontal scroll
 * - Smooth scroll behavior
 * - Multiple mobile viewport sizes
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/#signup';

// Mobile viewport configurations
const MOBILE_VIEWPORTS = {
  smallest: { width: 320, height: 568 }, // iPhone SE (1st gen)
  iPhoneSE: { width: 375, height: 667 }, // iPhone SE (2nd/3rd gen)
  iPhone13: { width: 390, height: 844 }, // iPhone 13/14
  iPhone13ProMax: { width: 428, height: 926 } // iPhone 13/14 Pro Max
};

test.describe('DynamicTierSelector - Mobile Responsive', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for tier selector to be visible
    await page.waitForSelector('[data-testid="tier-selector-container"]', { timeout: 5000 });
  });

  test('1. Stacked vertical layout at 375px (iPhone SE)', async ({ page }) => {
    // Set iPhone SE viewport
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhoneSE);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify container uses stacked layout (not grid on mobile)
    const containerStyles = await container.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        gridTemplateColumns: styles.gridTemplateColumns
      };
    });

    // On mobile should be flex column or single column grid, not side-by-side
    const isStacked = containerStyles.display === 'flex' && containerStyles.flexDirection === 'column' ||
                     containerStyles.gridTemplateColumns === 'none' ||
                     !containerStyles.gridTemplateColumns.includes(' ');

    expect(isStacked).toBe(true);

    // Verify sections are stacked vertically
    const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
    const messaging = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdown).toBeVisible();
    await expect(messaging).toBeVisible();

    // Check vertical stacking: dropdown should be above messaging
    const dropdownBox = await dropdown.boundingBox();
    const messagingBox = await messaging.boundingBox();

    expect(dropdownBox.y).toBeLessThan(messagingBox.y); // Dropdown above messaging
    expect(Math.abs(dropdownBox.x - messagingBox.x)).toBeLessThan(20); // Similar x position
  });

  test('2. Stacked vertical layout at 390px (iPhone 13)', async ({ page }) => {
    // Set iPhone 13 viewport
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify stacked layout
    const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
    const messaging = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdown).toBeVisible();
    await expect(messaging).toBeVisible();

    // Verify vertical stacking
    const dropdownBox = await dropdown.boundingBox();
    const messagingBox = await messaging.boundingBox();

    expect(dropdownBox.y).toBeLessThan(messagingBox.y);
    expect(Math.abs(dropdownBox.x - messagingBox.x)).toBeLessThan(20);

    // Verify sections span full width (with padding)
    expect(dropdownBox.width).toBeGreaterThan(350); // Should be ~390px minus padding
    expect(messagingBox.width).toBeGreaterThan(350);
  });

  test('3. Dropdown selector works on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    // Verify dropdown button is visible and functional
    const dropdownButton = page.locator('[data-testid="tier-dropdown-button"]');
    await expect(dropdownButton).toBeVisible();

    // Verify initial tier displayed
    const buttonText = await dropdownButton.textContent();
    expect(buttonText).toMatch(/Free|Solo|Growth|Scale/);

    // Click to open dropdown (mobile touch interaction)
    await dropdownButton.click();

    // Verify dropdown menu appears
    const dropdownMenu = page.locator('[data-testid="tier-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Verify all tier options present
    const tierOptions = page.locator('[data-testid^="tier-option-"]');
    await expect(tierOptions).toHaveCount(4);

    // Select Coffee (Solo) tier via click
    const coffeeOption = page.locator('[data-testid="tier-option-coffee"]');
    await coffeeOption.click();

    // Verify dropdown closes and shows selected tier
    await expect(dropdownMenu).toBeHidden();
    const updatedText = await dropdownButton.textContent();
    expect(updatedText).toContain('Solo');
  });

  test('4. Touch targets meet 48px minimum (WCAG 2.1 AA)', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    // Test dropdown button touch target
    const dropdownButton = page.locator('[data-testid="tier-dropdown-button"]');
    const dropdownBox = await dropdownButton.boundingBox();

    expect(dropdownBox.height).toBeGreaterThanOrEqual(48);
    expect(dropdownBox.width).toBeGreaterThanOrEqual(48);

    // Test billing toggle buttons
    const monthlyButton = page.locator('[data-testid="billing-monthly"]');
    const annualButton = page.locator('[data-testid="billing-annual"]');

    const monthlyBox = await monthlyButton.boundingBox();
    const annualBox = await annualButton.boundingBox();

    expect(monthlyBox.height).toBeGreaterThanOrEqual(48);
    expect(annualBox.height).toBeGreaterThanOrEqual(48);

    // Test tier options in dropdown
    await dropdownButton.click();

    const tierOptions = await page.locator('[data-testid^="tier-option-"]').all();
    for (const option of tierOptions) {
      const optionBox = await option.boundingBox();
      expect(optionBox.height).toBeGreaterThanOrEqual(48);
    }

    // Close dropdown for next tests
    await page.locator('[data-testid="tier-option-growth"]').click();
  });

  test('5. Billing toggle functional on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    // Locate billing toggle
    const billingToggle = page.locator('[data-testid="billing-toggle"]');
    await expect(billingToggle).toBeVisible();

    const monthlyButton = page.locator('[data-testid="billing-monthly"]');
    const annualButton = page.locator('[data-testid="billing-annual"]');

    await expect(monthlyButton).toBeVisible();
    await expect(annualButton).toBeVisible();

    // Verify annual selected by default
    expect(await annualButton.getAttribute('data-selected')).toBe('true');
    expect(await monthlyButton.getAttribute('data-selected')).toBe('false');

    // Click monthly toggle
    await monthlyButton.click();
    await page.waitForTimeout(100); // Brief wait for state update

    // Verify toggle state changed
    expect(await monthlyButton.getAttribute('data-selected')).toBe('true');
    expect(await annualButton.getAttribute('data-selected')).toBe('false');

    // Toggle back to annual
    await annualButton.click();
    await page.waitForTimeout(100);

    expect(await annualButton.getAttribute('data-selected')).toBe('true');
    expect(await monthlyButton.getAttribute('data-selected')).toBe('false');
  });

  test('6. Tier messaging stacked below selector', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    const dropdownSection = page.locator('[data-testid="tier-dropdown-section"]');
    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdownSection).toBeVisible();
    await expect(messagingSection).toBeVisible();

    // Verify messaging is below dropdown selector
    const dropdownBox = await dropdownSection.boundingBox();
    const messagingBox = await messagingSection.boundingBox();

    expect(messagingBox.y).toBeGreaterThan(dropdownBox.y + dropdownBox.height - 10); // Small overlap tolerance

    // Verify messaging updates when tier changes
    const initialHeading = await messagingSection.locator('[data-testid="tier-heading"]').textContent();

    // Change tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-coffee"]').click();
    await page.waitForTimeout(350); // Animation time

    // Verify messaging updated
    const updatedHeading = await messagingSection.locator('[data-testid="tier-heading"]').textContent();
    expect(updatedHeading).not.toBe(initialHeading);
    expect(updatedHeading).toContain('Solo');
  });

  test('7. Savings highlight stacked below messaging', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');
    const savingsSection = page.locator('[data-testid="savings-highlight"]');

    // Switch to annual billing to show savings
    await page.locator('[data-testid="billing-annual"]').click();
    await page.waitForTimeout(350);

    await expect(savingsSection).toBeVisible();

    // Verify savings is below messaging section
    const messagingBox = await messagingSection.boundingBox();
    const savingsBox = await savingsSection.boundingBox();

    expect(savingsBox.y).toBeGreaterThan(messagingBox.y);

    // Verify savings updates with tier changes
    const initialSavings = await savingsSection.textContent();

    // Change tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-scale"]').click();
    await page.waitForTimeout(350);

    const updatedSavings = await savingsSection.textContent();
    expect(updatedSavings).not.toBe(initialSavings);

    // Switch to monthly - savings should hide
    await page.locator('[data-testid="billing-monthly"]').click();
    await page.waitForTimeout(350);
    await expect(savingsSection).toBeHidden();
  });

  test('8. No horizontal scroll on any mobile viewport', async ({ page }) => {
    // Test all mobile viewports
    for (const [name, viewport] of Object.entries(MOBILE_VIEWPORTS)) {
      await page.setViewportSize(viewport);

      // Check for horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      expect(hasHorizontalScroll).toBe(false);

      // Verify container doesn't exceed viewport
      const container = page.locator('[data-testid="tier-selector-container"]');
      const containerBox = await container.boundingBox();

      expect(containerBox.width).toBeLessThanOrEqual(viewport.width);

      // Verify all sections within bounds
      const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
      const messaging = page.locator('[data-testid="tier-messaging-section"]');

      const dropdownBox = await dropdown.boundingBox();
      const messagingBox = await messaging.boundingBox();

      expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(viewport.width);
      expect(messagingBox.x + messagingBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('9. Trial CTAs properly sized for mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    // Select Growth tier to make trial CTAs visible
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-growth"]').click();
    await page.waitForTimeout(300);

    // Locate trial CTA button (should be in messaging section)
    const ctaButton = page.locator('[data-testid="tier-cta-button"]');
    await expect(ctaButton).toBeVisible();

    // Verify CTA meets touch target size
    const ctaBox = await ctaButton.boundingBox();
    expect(ctaBox.height).toBeGreaterThanOrEqual(48);

    // Verify CTA spans most of container width (good mobile UX)
    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');
    const messagingBox = await messagingSection.boundingBox();

    // CTA should be at least 80% of container width on mobile
    const widthRatio = ctaBox.width / messagingBox.width;
    expect(widthRatio).toBeGreaterThan(0.8);

    // Verify CTA is clickable
    await ctaButton.click();

    // Should navigate or show trial flow (verify URL or modal)
    await page.waitForTimeout(500);
    // Note: Actual navigation behavior depends on implementation
  });

  test('10. Smooth scroll behavior', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13);

    // Verify page has smooth scrolling enabled
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });

    // Should be 'smooth' or 'auto' (both acceptable)
    expect(['smooth', 'auto']).toContain(scrollBehavior);

    // Test scroll to bottom of tier selector
    const container = page.locator('[data-testid="tier-selector-container"]');
    const containerBox = await container.boundingBox();

    // Scroll to bottom of container
    await page.evaluate((y) => {
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, containerBox.y + containerBox.height);

    await page.waitForTimeout(500); // Allow scroll animation

    // Verify scroll occurred
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('11. Test at 320px (smallest modern mobile)', async ({ page }) => {
    // Set smallest viewport (iPhone SE 1st gen)
    await page.setViewportSize(MOBILE_VIEWPORTS.smallest);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify stacked layout at smallest size
    const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
    const messaging = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdown).toBeVisible();
    await expect(messaging).toBeVisible();

    // Verify vertical stacking
    const dropdownBox = await dropdown.boundingBox();
    const messagingBox = await messaging.boundingBox();

    expect(dropdownBox.y).toBeLessThan(messagingBox.y);

    // Verify no horizontal scroll at smallest size
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Test dropdown functionality at smallest size
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    const dropdownMenu = page.locator('[data-testid="tier-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Select tier
    await page.locator('[data-testid="tier-option-coffee"]').click();
    const buttonText = await page.locator('[data-testid="tier-dropdown-button"]').textContent();
    expect(buttonText).toContain('Solo');

    // Verify touch targets still meet 48px at smallest size
    const tierOptions = await page.locator('[data-testid^="tier-option-"]').all();
    for (const option of tierOptions) {
      await page.locator('[data-testid="tier-dropdown-button"]').click();
      const optionBox = await option.boundingBox();
      expect(optionBox.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('12. Test at 428px (iPhone 13 Pro Max)', async ({ page }) => {
    // Set largest mobile viewport (iPhone 13 Pro Max)
    await page.setViewportSize(MOBILE_VIEWPORTS.iPhone13ProMax);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify stacked layout (should still be mobile layout, not desktop)
    const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
    const messaging = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdown).toBeVisible();
    await expect(messaging).toBeVisible();

    // Verify vertical stacking maintained
    const dropdownBox = await dropdown.boundingBox();
    const messagingBox = await messaging.boundingBox();

    expect(dropdownBox.y).toBeLessThan(messagingBox.y);

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Test full interaction flow at largest mobile size
    // 1. Change tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-scale"]').click();

    // 2. Switch to annual billing
    await page.locator('[data-testid="billing-annual"]').click();
    await page.waitForTimeout(350);

    // 3. Verify savings display
    const savingsSection = page.locator('[data-testid="savings-highlight"]');
    await expect(savingsSection).toBeVisible();

    // 4. Verify messaging updates
    const heading = await page.locator('[data-testid="tier-heading"]').textContent();
    expect(heading).toContain('Scale');

    // 5. Verify all elements properly sized for larger mobile viewport
    const ctaButton = page.locator('[data-testid="tier-cta-button"]');
    const ctaBox = await ctaButton.boundingBox();
    expect(ctaBox.width).toBeLessThanOrEqual(428); // Should not exceed viewport
    expect(ctaBox.height).toBeGreaterThanOrEqual(48); // Touch target minimum
  });
});
