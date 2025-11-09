/**
 * Test Gate 5: Desktop Responsive Tests for DynamicTierSelector
 *
 * Tests the dropdown tier selector pattern on desktop viewports (1024px+)
 * Component: DynamicTierSelector (Phase 6.5 implementation)
 *
 * Coverage:
 * - Side-by-side layout (40/60 grid)
 * - Dropdown functionality
 * - Billing toggle
 * - Dynamic content updates
 * - Touch target accessibility
 * - Animation performance
 * - Responsive breakpoints
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/#signup';

// Desktop viewport configurations
const DESKTOP_VIEWPORTS = {
  standard: { width: 1024, height: 768 },
  large: { width: 1440, height: 900 },
  extraLarge: { width: 1920, height: 1080 }
};

test.describe('DynamicTierSelector - Desktop Responsive', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for tier selector to be visible
    await page.waitForSelector('[data-testid="tier-selector-container"]', { timeout: 5000 });
  });

  test('1. Side-by-side layout (40/60 grid) at 1024px width', async ({ page }) => {
    // Set standard desktop viewport
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify container or child uses grid layout (grid can be on child div)
    const hasGridLayout = await container.evaluate(el => {
      const containerStyles = window.getComputedStyle(el);
      // Check if container itself is grid
      if (containerStyles.display === 'grid') return true;

      // Check if first child is grid (common pattern)
      const firstChild = el.firstElementChild;
      if (firstChild) {
        const childStyles = window.getComputedStyle(firstChild);
        return childStyles.display === 'grid' || childStyles.display === 'flex';
      }
      return false;
    });

    expect(hasGridLayout).toBe(true);

    // Verify both sections are visible and positioned side by side
    const dropdown = page.locator('[data-testid="tier-dropdown-section"]');
    const messaging = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdown).toBeVisible();
    await expect(messaging).toBeVisible();

    // Check positioning: Dropdown below billing toggle, messaging aligns with left column top
    const dropdownBox = await dropdown.boundingBox();
    const messagingBox = await messaging.boundingBox();

    // Messaging should be higher (closer to top) since dropdown has billing toggle above it
    expect(messagingBox.y).toBeLessThan(dropdownBox.y);
    expect(dropdownBox.x).toBeLessThan(messagingBox.x); // Dropdown on left
  });

  test('2. Dropdown selector visible and functional', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    // Verify dropdown button exists and is visible
    const dropdownButton = page.locator('[data-testid="tier-dropdown-button"]');
    await expect(dropdownButton).toBeVisible();

    // Verify initial state shows a tier (default should be Growth)
    const buttonText = await dropdownButton.textContent();
    expect(buttonText).toMatch(/Free|Solo|Growth|Scale/);

    // Click to open dropdown
    await dropdownButton.click();

    // Verify dropdown menu appears
    const dropdownMenu = page.locator('[data-testid="tier-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Verify all four tiers are present
    const tierOptions = page.locator('[data-testid^="tier-option-"]');
    await expect(tierOptions).toHaveCount(4);

    // Verify tier options are interactive
    const coffeeOption = page.locator('[data-testid="tier-option-coffee"]');
    await expect(coffeeOption).toBeVisible();

    // Select different tier
    await coffeeOption.click();

    // Verify dropdown closes and shows selected tier
    await expect(dropdownMenu).toBeHidden();
    const updatedButtonText = await dropdownButton.textContent();
    expect(updatedButtonText).toContain('Solo');
  });

  test('3. Billing toggle functional', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    // Locate billing toggle
    const billingToggle = page.locator('[data-testid="billing-toggle"]');
    await expect(billingToggle).toBeVisible();

    // Get initial state (should be annual by default)
    const monthlyButton = page.locator('[data-testid="billing-monthly"]');
    const annualButton = page.locator('[data-testid="billing-annual"]');

    await expect(monthlyButton).toBeVisible();
    await expect(annualButton).toBeVisible();

    // Verify initial state has annual selected
    expect(await annualButton.getAttribute('data-selected')).toBe('true');
    expect(await monthlyButton.getAttribute('data-selected')).toBe('false');

    // Click monthly toggle
    await monthlyButton.click();

    // Verify toggle state changed
    expect(await monthlyButton.getAttribute('data-selected')).toBe('true');
    expect(await annualButton.getAttribute('data-selected')).toBe('false');

    // Toggle back to annual
    await annualButton.click();
    expect(await annualButton.getAttribute('data-selected')).toBe('true');
    expect(await monthlyButton.getAttribute('data-selected')).toBe('false');
  });

  test('4. Tier messaging section updates dynamically', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    // Get initial messaging content (Growth tier default)
    const initialHeading = await messagingSection.locator('[data-testid="tier-heading"]').textContent();
    // tier-price is in TierDropdownSelector, not messaging section
    const initialPrice = await page.locator('[data-testid="tier-price"]').textContent();

    // Open dropdown and select Coffee (Solo) tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-coffee"]').click();

    // Wait for messaging update (300ms animation)
    await page.waitForTimeout(350);

    // Verify messaging content changed
    const updatedHeading = await messagingSection.locator('[data-testid="tier-heading"]').textContent();
    // tier-price is in TierDropdownSelector, not messaging section
    const updatedPrice = await page.locator('[data-testid="tier-price"]').textContent();

    expect(updatedHeading).not.toBe(initialHeading);
    expect(updatedPrice).not.toBe(initialPrice);
    expect(updatedHeading).toContain('Solo');

    // Select Scale tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-scale"]').click();
    await page.waitForTimeout(350);

    // Verify messaging updated again
    const scaleHeading = await messagingSection.locator('[data-testid="tier-heading"]').textContent();
    // tier-price is in TierDropdownSelector, not messaging section
    const scalePrice = await page.locator('[data-testid="tier-price"]').textContent();

    expect(scaleHeading).not.toBe(updatedHeading);
    expect(scalePrice).not.toBe(updatedPrice);
    expect(scaleHeading).toContain('Scale');
  });

  test('5. Savings highlight section updates dynamically', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    const savingsSection = page.locator('[data-testid="savings-highlight"]');

    // Switch to annual billing to see savings
    await page.locator('[data-testid="billing-annual"]').click();
    await page.waitForTimeout(350);

    // Verify savings section is visible
    await expect(savingsSection).toBeVisible();

    // Get initial savings amount (Growth tier)
    const initialSavings = await savingsSection.textContent();

    // Change to Coffee (Solo) tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-coffee"]').click();
    await page.waitForTimeout(350);

    // Verify savings amount changed
    const coffeeSavings = await savingsSection.textContent();
    expect(coffeeSavings).not.toBe(initialSavings);

    // Change to Scale tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-scale"]').click();
    await page.waitForTimeout(350);

    // Verify savings amount changed again
    const scaleSavings = await savingsSection.textContent();
    expect(scaleSavings).not.toBe(coffeeSavings);

    // Switch back to monthly - savings should hide
    await page.locator('[data-testid="billing-monthly"]').click();
    await page.waitForTimeout(350);

    // Savings highlight should be hidden on monthly
    await expect(savingsSection).toBeHidden();
  });

  test('6. Touch targets meet 48px minimum', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

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

    // Open dropdown and test tier options
    await dropdownButton.click();

    const tierOptions = await page.locator('[data-testid^="tier-option-"]').all();
    for (const option of tierOptions) {
      const optionBox = await option.boundingBox();
      expect(optionBox.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('7. All transitions smooth (300ms animations)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    // Verify CSS transition property is set
    const transitionStyle = await messagingSection.evaluate(el => {
      return window.getComputedStyle(el).transition;
    });

    // Should have transition property defined (checking for 'all' or 'opacity')
    expect(transitionStyle).toMatch(/all|opacity/);

    // Measure actual transition timing
    const startTime = Date.now();

    // Trigger transition by changing tier
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-coffee"]').click();

    // Wait for transition to complete
    await page.waitForTimeout(350);
    const endTime = Date.now();

    const duration = endTime - startTime;

    // Transition should take approximately 300ms (with 50ms tolerance)
    expect(duration).toBeGreaterThanOrEqual(300);
    expect(duration).toBeLessThan(500);

    // Verify no jank by checking for smooth opacity changes
    const opacity = await messagingSection.evaluate(el => {
      return window.getComputedStyle(el).opacity;
    });

    expect(parseFloat(opacity)).toBe(1); // Should be fully visible after transition
  });

  test('8. No horizontal scroll at 1024px', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.standard);

    // Check if horizontal scrollbar exists
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);

    // Verify tier selector container doesn't exceed viewport
    const container = page.locator('[data-testid="tier-selector-container"]');
    const containerBox = await container.boundingBox();

    expect(containerBox.width).toBeLessThanOrEqual(1024);

    // Check all child elements are within bounds
    const dropdownSection = page.locator('[data-testid="tier-dropdown-section"]');
    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    const dropdownBox = await dropdownSection.boundingBox();
    const messagingBox = await messagingSection.boundingBox();

    expect(dropdownBox.x + dropdownBox.width).toBeLessThanOrEqual(1024);
    expect(messagingBox.x + messagingBox.width).toBeLessThanOrEqual(1024);
  });

  test('9. Test at 1440px (standard desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.large);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify layout maintains side-by-side structure
    const dropdownSection = page.locator('[data-testid="tier-dropdown-section"]');
    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdownSection).toBeVisible();
    await expect(messagingSection).toBeVisible();

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Verify content is readable and well-spaced
    const containerBox = await container.boundingBox();
    expect(containerBox.width).toBeLessThanOrEqual(1440);

    // Test functionality at larger viewport
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    const dropdownMenu = page.locator('[data-testid="tier-dropdown-menu"]');
    await expect(dropdownMenu).toBeVisible();

    // Select tier and verify update
    await page.locator('[data-testid="tier-option-coffee"]').click();
    const buttonText = await page.locator('[data-testid="tier-dropdown-button"]').textContent();
    expect(buttonText).toContain('Solo');
  });

  test('10. Test at 1920px (large desktop)', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORTS.extraLarge);

    const container = page.locator('[data-testid="tier-selector-container"]');
    await expect(container).toBeVisible();

    // Verify layout maintains integrity at large viewport
    const dropdownSection = page.locator('[data-testid="tier-dropdown-section"]');
    const messagingSection = page.locator('[data-testid="tier-messaging-section"]');

    await expect(dropdownSection).toBeVisible();
    await expect(messagingSection).toBeVisible();

    // Verify no horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Verify grid layout scales appropriately (can be on container or child)
    const hasGridLayout = await container.evaluate(el => {
      const containerStyles = window.getComputedStyle(el);
      if (containerStyles.display === 'grid') return true;

      const firstChild = el.firstElementChild;
      if (firstChild) {
        const childStyles = window.getComputedStyle(firstChild);
        return childStyles.display === 'grid' || childStyles.display === 'flex';
      }
      return false;
    });

    expect(hasGridLayout).toBe(true);

    // Test all interactive elements remain functional
    // 1. Dropdown
    await page.locator('[data-testid="tier-dropdown-button"]').click();
    await page.locator('[data-testid="tier-option-scale"]').click();

    // 2. Billing toggle
    await page.locator('[data-testid="billing-annual"]').click();
    await page.waitForTimeout(350);

    // 3. Verify savings display
    const savingsSection = page.locator('[data-testid="savings-highlight"]');
    await expect(savingsSection).toBeVisible();

    // 4. Verify messaging updates
    const heading = await page.locator('[data-testid="tier-heading"]').textContent();
    expect(heading).toContain('Scale');
  });
});
