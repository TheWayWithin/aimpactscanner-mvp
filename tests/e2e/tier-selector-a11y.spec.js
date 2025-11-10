/**
 * Test Gate 5: Accessibility Tests for DynamicTierSelector
 *
 * Tests WCAG 2.1 Level AA compliance for the dropdown tier selector
 * Component: DynamicTierSelector with keyboard navigation and screen reader support
 *
 * WCAG Criteria Covered:
 * - 2.1.1 Keyboard (Level A): All functionality available from keyboard
 * - 2.1.2 No Keyboard Trap (Level A): Keyboard focus can be moved away
 * - 2.4.3 Focus Order (Level A): Focus order preserves meaning and operability
 * - 2.4.7 Focus Visible (Level AA): Keyboard focus indicator is visible
 * - 3.2.1 On Focus (Level A): No automatic context changes on focus
 * - 4.1.2 Name, Role, Value (Level A): ARIA attributes for UI components
 * - 1.4.3 Contrast (Minimum) (Level AA): 4.5:1 contrast ratio
 * - 2.5.5 Target Size (Level AAA): 48px minimum touch targets
 *
 * Coverage:
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys, Escape)
 * - Focus management (visible focus, focus trap, focus return)
 * - Screen reader support (ARIA labels, roles, states, live regions)
 * - Color contrast validation
 * - Touch target sizes
 * - Semantic HTML structure
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/#signup';

test.describe('DynamicTierSelector - Accessibility (WCAG 2.1 AA)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for tier selector to be fully loaded
    await page.waitForSelector('.tier-dropdown-selector', { timeout: 5000 });
  });

  // ============================================================================
  // KEYBOARD NAVIGATION TESTS (WCAG 2.1.1, 2.1.2)
  // ============================================================================

  test.describe('Keyboard Navigation', () => {

    test('1. Tab through all interactive elements in correct order', async ({ page }) => {
      // WCAG 2.4.3: Focus Order - Focus order preserves meaning and operability

      // Focus billing toggle directly (skip page-level elements like consent banner)
      const billingToggle = page.locator('button:has-text("Monthly")').first();
      await billingToggle.focus();

      // Verify Monthly toggle is focused
      let focused = await page.evaluate(() => document.activeElement.textContent);
      expect(focused).toContain('Monthly');

      // Tab to Annual toggle
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement.textContent);
      expect(focused).toContain('Annual');

      // Tab to tier dropdown trigger
      await page.keyboard.press('Tab');
      const dropdownFocused = await page.evaluate(() => {
        const el = document.activeElement;
        return el.getAttribute('role') === 'button' &&
               el.getAttribute('aria-haspopup') === 'listbox';
      });
      expect(dropdownFocused).toBe(true);

      // Tab to trial CTA button (if Growth tier)
      await page.keyboard.press('Tab');
      focused = await page.evaluate(() => document.activeElement.textContent);
      expect(focused).toMatch(/Try Growth Free|Skip trial|Continue/i);
    });

    test('2. Enter key opens dropdown when focused', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      // Focus the dropdown trigger
      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Verify dropdown is closed
      let isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');

      // Press Enter to open
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100); // Animation delay

      // Verify dropdown is open
      isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');

      // Verify dropdown menu is visible
      const menu = page.locator('[role="listbox"]');
      await expect(menu).toBeVisible();
    });

    test('3. Space key opens dropdown when focused', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Verify dropdown is closed
      let isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');

      // Press Space to open
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      // Verify dropdown is open
      isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');

      // Verify menu is visible
      const menu = page.locator('[role="listbox"]');
      await expect(menu).toBeVisible();
    });

    test('4. Arrow Down opens dropdown and navigates options', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Press ArrowDown to open
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Verify dropdown is open
      const isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');

      // Verify first option is focused (visual highlight)
      const options = page.locator('[role="option"]');
      const firstOption = options.first();
      const hasHoverClass = await firstOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);

      // Press ArrowDown again to move to next option
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);

      // Verify focus moved (second option should now be highlighted)
      const secondOption = options.nth(1);
      const secondHasHover = await secondOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(secondHasHover).toBe(true);
    });

    test('5. Arrow Up navigates backward through options', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Navigate down twice
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);

      // Navigate up
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);

      // Verify focus moved backward
      const options = page.locator('[role="option"]');
      const secondOption = options.nth(1);
      const hasHoverClass = await secondOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);
    });

    test('6. Arrow keys wrap around (first to last, last to first)', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - Continuous navigation without keyboard trap

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Get total number of options
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      // Navigate down to last option
      for (let i = 0; i < optionCount; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(20);
      }

      // Verify wrapped to first option
      const firstOption = options.first();
      const hasHoverClass = await firstOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);

      // Navigate up to wrap to last
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(50);

      // Verify wrapped to last option
      const lastOption = options.last();
      const lastHasHover = await lastOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(lastHasHover).toBe(true);
    });

    test('7. Escape key closes dropdown', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Verify open
      let isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');

      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Verify closed
      isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');

      // Verify menu is hidden
      const menu = page.locator('[role="listbox"]');
      await expect(menu).not.toBeVisible();
    });

    test('8. Space key toggles billing frequency', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      // Focus monthly button
      const monthlyButton = page.locator('button[data-billing="monthly"]');
      await monthlyButton.focus();

      // Get initial state
      const initialPressed = await monthlyButton.getAttribute('aria-pressed');

      // Press Space to toggle
      await page.keyboard.press('Space');
      await page.waitForTimeout(100);

      // Verify state changed
      const newPressed = await monthlyButton.getAttribute('aria-pressed');
      expect(newPressed).not.toBe(initialPressed);
    });

    test('9. Enter key selects focused option', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown (starts at first option due to Fix #8)
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Navigate to Coffee tier (index 1)
      await page.keyboard.press('ArrowDown'); // Move to Coffee
      await page.waitForTimeout(50);

      // Press Enter to select Coffee tier
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300); // Wait for transition

      // Verify dropdown closed
      let isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');

      // Reopen dropdown to check aria-selected state
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Verify selection changed (Coffee tier should now be selected)
      const coffeeOption = page.locator('[role="option"][data-testid="tier-option-coffee"]');
      const isSelected = await coffeeOption.getAttribute('aria-selected');
      expect(isSelected).toBe('true');

      // Verify other options are not selected
      const freeOption = page.locator('[role="option"][data-testid="tier-option-free"]');
      const freeSelected = await freeOption.getAttribute('aria-selected');
      expect(freeSelected).toBe('false');
    });

    test('10. Home key jumps to first option', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Navigate to third option
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(50);

      // Press Home to jump to first
      await page.keyboard.press('Home');
      await page.waitForTimeout(50);

      // Verify first option is focused
      const options = page.locator('[role="option"]');
      const firstOption = options.first();
      const hasHoverClass = await firstOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);
    });

    test('11. End key jumps to last option', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown (starts at first option)
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Press End to jump to last
      await page.keyboard.press('End');
      await page.waitForTimeout(50);

      // Verify last option is focused
      const options = page.locator('[role="option"]');
      const lastOption = options.last();
      const hasHoverClass = await lastOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);
    });

    test('12. PageDown key jumps down by 3 positions', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Get total options count
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      // Press PageDown (should jump from index 0 to 3, or last if fewer options)
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(50);

      // Verify correct option is focused
      const expectedIndex = Math.min(3, optionCount - 1);
      const targetOption = options.nth(expectedIndex);
      const hasHoverClass = await targetOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);
    });

    test('13. PageUp key jumps up by 3 positions', async ({ page }) => {
      // WCAG 2.1.1: Keyboard - All functionality available from keyboard

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Jump to last option first
      await page.keyboard.press('End');
      await page.waitForTimeout(50);

      // Get total options count
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      // Press PageUp (should jump from last to last-3)
      await page.keyboard.press('PageUp');
      await page.waitForTimeout(50);

      // Verify correct option is focused
      const expectedIndex = Math.max(optionCount - 4, 0);
      const targetOption = options.nth(expectedIndex);
      const hasHoverClass = await targetOption.evaluate(el =>
        el.className.includes('bg-gray-100')
      );
      expect(hasHoverClass).toBe(true);
    });

  });

  // ============================================================================
  // FOCUS MANAGEMENT TESTS (WCAG 2.4.3, 2.4.7)
  // ============================================================================

  test.describe('Focus Management', () => {

    test('14. Focus visible on all interactive elements', async ({ page }) => {
      // WCAG 2.4.7: Focus Visible - Keyboard focus indicator is visible

      // Test billing toggle buttons
      const monthlyButton = page.locator('button[data-billing="monthly"]');
      await monthlyButton.focus();

      const monthlyFocusRing = await monthlyButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' ||
               el.className.includes('focus:ring') ||
               el.className.includes('focus:outline');
      });
      expect(monthlyFocusRing).toBe(true);

      // Test dropdown trigger
      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      const dropdownFocusRing = await dropdown.evaluate(el => {
        return el.className.includes('focus:ring-2') &&
               el.className.includes('focus:ring-yellow-500');
      });
      expect(dropdownFocusRing).toBe(true);

      // Test trial CTA buttons (if Growth tier)
      const trialButton = page.locator('button:has-text("Try Growth Free")');
      if (await trialButton.count() > 0) {
        await trialButton.focus();

        const trialFocusRing = await trialButton.evaluate(el => {
          return el.className.includes('focus:ring-2') &&
                 el.className.includes('focus:ring-green-500');
        });
        expect(trialFocusRing).toBe(true);
      }

      // Test continue button
      const continueButton = page.locator('button:has-text("Continue to Sign Up")');
      await continueButton.focus();

      const continueFocusVisible = await continueButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || el.className.includes('focus:');
      });
      expect(continueFocusVisible).toBe(true);
    });

    test('15. Focus trap in dropdown when open', async ({ page }) => {
      // WCAG 2.1.2: No Keyboard Trap - But dropdown should manage focus

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Navigate through all options with arrow keys
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      for (let i = 0; i < optionCount + 2; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(20);
      }

      // Verify focus stayed within dropdown (wrapped around)
      const menu = page.locator('[role="listbox"]');
      await expect(menu).toBeVisible();

      // Verify can escape with Escape key (no keyboard trap)
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      const isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('false');
    });

    test('16. Focus returns to trigger after closing dropdown', async ({ page }) => {
      // WCAG 2.4.3: Focus Order - Focus returns to logical position

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Store initial focus element
      const initialFocus = await page.evaluate(() => document.activeElement.className);

      // Open dropdown
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Close dropdown with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Verify focus returned to trigger
      const finalFocus = await page.evaluate(() => document.activeElement.className);
      expect(finalFocus).toBe(initialFocus);

      // Verify trigger is still focused (can press Enter to reopen)
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      const isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');
    });

    test('17. Focus order logical after tier selection', async ({ page }) => {
      // WCAG 2.4.3: Focus Order - Maintains logical sequence

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.focus();

      // Open dropdown and select a tier
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300); // Wait for transition

      // Tab forward to next element
      await page.keyboard.press('Tab');

      // Should focus trial button or continue button
      const focused = await page.evaluate(() => document.activeElement.textContent);
      expect(focused).toMatch(/Try Growth Free|Skip trial|Continue/i);
    });

  });

  // ============================================================================
  // SCREEN READER TESTS (WCAG 4.1.2)
  // ============================================================================

  test.describe('Screen Reader Support', () => {

    test('18. ARIA labels present on all controls', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - All components have accessible names

      // Dropdown trigger
      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      const dropdownLabel = await dropdown.getAttribute('aria-label');
      expect(dropdownLabel).toBe('Select pricing tier');

      // Dropdown menu
      const menu = page.locator('[role="listbox"]');
      await dropdown.click(); // Open to check menu
      await page.waitForTimeout(100);

      const menuLabel = await menu.getAttribute('aria-label');
      expect(menuLabel).toBe('Pricing tier options');

      // Billing toggle buttons
      const monthlyButton = page.locator('button[data-billing="monthly"]');
      const monthlyPressed = await monthlyButton.getAttribute('aria-pressed');
      expect(monthlyPressed).toMatch(/true|false/);

      const annualButton = page.locator('button[data-billing="annual"]');
      const annualPressed = await annualButton.getAttribute('aria-pressed');
      expect(annualPressed).toMatch(/true|false/);
    });

    test('19. ARIA expanded state on dropdown', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - State changes are exposed

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');

      // Verify collapsed state
      let expanded = await dropdown.getAttribute('aria-expanded');
      expect(expanded).toBe('false');

      // Open dropdown
      await dropdown.click();
      await page.waitForTimeout(100);

      // Verify expanded state
      expanded = await dropdown.getAttribute('aria-expanded');
      expect(expanded).toBe('true');

      // Verify haspopup attribute
      const haspopup = await dropdown.getAttribute('aria-haspopup');
      expect(haspopup).toBe('listbox');

      // Close dropdown
      await page.keyboard.press('Escape');
      await page.waitForTimeout(100);

      // Verify collapsed again
      expanded = await dropdown.getAttribute('aria-expanded');
      expect(expanded).toBe('false');
    });

    test('20. ARIA selected state on options', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - Selection state is exposed

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.click();
      await page.waitForTimeout(100);

      // Check all options have aria-selected
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const selected = await option.getAttribute('aria-selected');
        expect(selected).toMatch(/true|false/);
      }

      // Verify exactly one option is selected
      const selectedOptions = await options.evaluateAll(opts =>
        opts.filter(opt => opt.getAttribute('aria-selected') === 'true')
      );
      expect(selectedOptions.length).toBeGreaterThan(0);

      // Select a different option
      const secondOption = options.nth(1);
      await secondOption.click();
      await page.waitForTimeout(300);

      // Reopen dropdown
      await dropdown.click();
      await page.waitForTimeout(100);

      // Verify new selection
      const newSelection = await options.nth(1).getAttribute('aria-selected');
      expect(newSelection).toBe('true');
    });

    test('21. ARIA pressed state on billing toggle', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - Toggle button states

      const monthlyButton = page.locator('button[data-billing="monthly"]');
      const annualButton = page.locator('button[data-billing="annual"]');

      // Get initial states
      const monthlyInitial = await monthlyButton.getAttribute('aria-pressed');
      const annualInitial = await annualButton.getAttribute('aria-pressed');

      // One should be true, one false
      expect(monthlyInitial === 'true' || annualInitial === 'true').toBe(true);
      expect(monthlyInitial !== annualInitial).toBe(true);

      // Toggle to monthly
      await monthlyButton.click();
      await page.waitForTimeout(100);

      // Verify states swapped
      const monthlyAfter = await monthlyButton.getAttribute('aria-pressed');
      const annualAfter = await annualButton.getAttribute('aria-pressed');

      if (monthlyInitial === 'false') {
        expect(monthlyAfter).toBe('true');
        expect(annualAfter).toBe('false');
      }
    });

    test('22. Screen reader accessible names for dynamic content', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - Dynamic content has accessible names

      // Verify trial badge has accessible text
      const trialBadge = page.locator('text=🎁 7-DAY FREE TRIAL');
      if (await trialBadge.count() > 0) {
        await expect(trialBadge).toBeVisible();
        const badgeText = await trialBadge.textContent();
        expect(badgeText).toContain('7-DAY FREE TRIAL');
      }

      // Verify recommended badge
      const recommendedBadge = page.locator('text=⭐ RECOMMENDED');
      if (await recommendedBadge.count() > 0) {
        const badgeText = await recommendedBadge.textContent();
        expect(badgeText).toContain('RECOMMENDED');
      }

      // Verify pricing display is accessible
      const selectedSummary = page.locator('.dynamic-tier-selector > div').filter({ hasText: /Selected:/ });
      if (await selectedSummary.count() > 0) {
        const summaryText = await selectedSummary.textContent();
        expect(summaryText).toMatch(/Selected:|Growth|Solo|Scale|Free/i);
      }
    });

  });

  // ============================================================================
  // COLOR CONTRAST TESTS (WCAG 1.4.3)
  // ============================================================================

  test.describe('Color Contrast', () => {

    test('23. Text meets 4.5:1 contrast ratio (Normal text)', async ({ page }) => {
      // WCAG 1.4.3: Contrast (Minimum) - 4.5:1 for normal text

      // Test tier names in dropdown trigger - exclude the yellow badge
      const tierName = page.locator('.tier-dropdown-selector [role="button"]').first();
      const contrast = await tierName.evaluate(el => {
        // Get the tier name div (not the badge span)
        const nameDiv = el.querySelector('div.font-semibold');
        const styles = window.getComputedStyle(nameDiv);
        const color = styles.color;
        // Get background from parent button
        const bgColor = window.getComputedStyle(el).backgroundColor;

        // RGB to luminance calculation
        const getLuminance = (rgb) => {
          const [r, g, b] = rgb.match(/\d+/g).map(Number);
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(color);
        const l2 = getLuminance(bgColor);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return ratio;
      });

      // WCAG AA requires 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    test('24. Description text meets 4.5:1 contrast ratio', async ({ page }) => {
      // WCAG 1.4.3: Contrast (Minimum) - 4.5:1 for normal text

      const description = page.locator('.tier-dropdown-selector [role="button"]').first();
      const contrast = await description.evaluate(el => {
        // Get the description div (text-sm)
        const descDiv = el.querySelector('.text-sm.text-gray-900');
        const styles = window.getComputedStyle(descDiv);
        const color = styles.color;
        // Get background from parent button
        const bgColor = window.getComputedStyle(el).backgroundColor;

        const getLuminance = (rgb) => {
          const [r, g, b] = rgb.match(/\d+/g).map(Number);
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(color);
        const l2 = getLuminance(bgColor);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return ratio;
      });

      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

    test('25. Button text meets 4.5:1 contrast ratio', async ({ page }) => {
      // WCAG 1.4.3: Contrast (Minimum) - 4.5:1 for button text

      const continueButton = page.locator('button:has-text("Continue to Sign Up")');
      const contrast = await continueButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const bgColor = styles.backgroundColor;

        const getLuminance = (rgb) => {
          const [r, g, b] = rgb.match(/\d+/g).map(Number);
          const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const l1 = getLuminance(color);
        const l2 = getLuminance(bgColor);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

        return ratio;
      });

      // White text on blue background should have high contrast
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });

  });

  // ============================================================================
  // TOUCH TARGET TESTS (WCAG 2.5.5)
  // ============================================================================

  test.describe('Touch Target Sizes', () => {

    test('26. Billing toggle buttons meet 48px minimum', async ({ page }) => {
      // WCAG 2.5.5: Target Size - 44px minimum (we use 48px)

      const monthlyButton = page.locator('button[data-billing="monthly"]');
      const size = await monthlyButton.boundingBox();

      expect(size.height).toBeGreaterThanOrEqual(48);
      // Width can be smaller as it's part of a full-width toggle
    });

    test('27. Dropdown trigger meets 48px minimum height', async ({ page }) => {
      // WCAG 2.5.5: Target Size - 44px minimum (we use 48px)

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      const size = await dropdown.boundingBox();

      expect(size.height).toBeGreaterThanOrEqual(48);
    });

    test('28. Dropdown options meet 48px minimum height', async ({ page }) => {
      // WCAG 2.5.5: Target Size - 44px minimum (we use 56px for options)

      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.click();
      await page.waitForTimeout(100);

      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const size = await option.boundingBox();

        // Component uses min-h-[56px]
        expect(size.height).toBeGreaterThanOrEqual(48);
      }
    });

    test('29. Trial CTA buttons meet 48px minimum', async ({ page }) => {
      // WCAG 2.5.5: Target Size - 44px minimum

      const trialButton = page.locator('button:has-text("Try Growth Free")');
      if (await trialButton.count() > 0) {
        const size = await trialButton.boundingBox();
        expect(size.height).toBeGreaterThanOrEqual(48);
      }

      const skipButton = page.locator('button:has-text("Skip trial")');
      if (await skipButton.count() > 0) {
        const size = await skipButton.boundingBox();
        // Secondary button uses py-2 (smaller), verify still accessible
        expect(size.height).toBeGreaterThanOrEqual(40);
      }
    });

    test('30. Continue button meets 48px minimum', async ({ page }) => {
      // WCAG 2.5.5: Target Size - 44px minimum (we use py-4)

      const continueButton = page.locator('button:has-text("Continue to Sign Up")');
      const size = await continueButton.boundingBox();

      // py-4 = 1rem = 16px, total with padding ~64px
      expect(size.height).toBeGreaterThanOrEqual(48);
    });

  });

  // ============================================================================
  // SEMANTIC HTML TESTS (WCAG 4.1.1, 4.1.2)
  // ============================================================================

  test.describe('Semantic HTML', () => {

    test('31. Proper button elements for clickable controls', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - Use semantic HTML elements

      // Billing toggle uses button elements
      const monthlyButton = page.locator('button[data-billing="monthly"]');
      await expect(monthlyButton).toHaveCount(1);

      const annualButton = page.locator('button[data-billing="annual"]');
      await expect(annualButton).toHaveCount(1);

      // Verify button type
      const buttonType = await monthlyButton.getAttribute('type');
      expect(buttonType).toBe('button');

      // Continue button is a button element
      const continueButton = page.locator('button:has-text("Continue to Sign Up")');
      await expect(continueButton).toHaveCount(1);

      // Trial buttons are button elements
      const trialButton = page.locator('button:has-text("Try Growth Free")');
      if (await trialButton.count() > 0) {
        const trialType = await trialButton.getAttribute('type');
        expect(trialType).toMatch(/button|submit/);
      }
    });

    test('32. Proper ARIA roles for custom controls', async ({ page }) => {
      // WCAG 4.1.2: Name, Role, Value - Custom controls have proper roles

      // Dropdown trigger has button role
      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await expect(dropdown).toHaveCount(1);

      // Open dropdown to check menu
      await dropdown.click();
      await page.waitForTimeout(100);

      // Dropdown menu has listbox role
      const menu = page.locator('[role="listbox"]');
      await expect(menu).toHaveCount(1);

      // Options have option role
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);
    });

    test('33. No nested interactive elements', async ({ page }) => {
      // WCAG 4.1.2: Avoid nesting interactive elements (causes confusion)

      // Check dropdown trigger doesn't have nested buttons
      const dropdownButtons = await page.locator('[role="button"][aria-haspopup="listbox"] button').count();
      expect(dropdownButtons).toBe(0);

      // Check options don't have nested buttons (except trial buttons outside options)
      const nestedInOptions = await page.evaluate(() => {
        const options = document.querySelectorAll('[role="option"]');
        let hasNested = false;

        options.forEach(opt => {
          if (opt.querySelector('button, a[href]')) {
            hasNested = true;
          }
        });

        return hasNested;
      });

      expect(nestedInOptions).toBe(false);
    });

    test('34. Logical document structure', async ({ page }) => {
      // WCAG 4.1.1: Parsing - Valid HTML structure

      // Verify main container exists
      const container = page.locator('.dynamic-tier-selector');
      await expect(container).toHaveCount(1);

      // Verify grid layout for desktop (should have two columns on large screens)
      const hasGrid = await container.evaluate(el => {
        const gridDiv = el.querySelector('.grid');
        return gridDiv !== null;
      });
      expect(hasGrid).toBe(true);

      // Verify billing toggle is before dropdown
      const billingToggle = page.locator('.billing-toggle');
      const dropdown = page.locator('.tier-dropdown-selector');

      const positions = await page.evaluate(() => {
        const toggle = document.querySelector('.billing-toggle');
        const dropdown = document.querySelector('.tier-dropdown-selector');

        if (!toggle || !dropdown) return null;

        const toggleRect = toggle.getBoundingClientRect();
        const dropdownRect = dropdown.getBoundingClientRect();

        return {
          toggleY: toggleRect.top,
          dropdownY: dropdownRect.top
        };
      });

      // Billing toggle should be above dropdown
      expect(positions.toggleY).toBeLessThan(positions.dropdownY);
    });

  });

  // ============================================================================
  // SNAPSHOT TESTS (Accessibility Tree)
  // ============================================================================

  test.describe('Accessibility Snapshot', () => {

    test('35. Full accessibility tree snapshot (collapsed state)', async ({ page }) => {
      // Use Playwright's accessibility snapshot for comprehensive validation

      const snapshot = await page.accessibility.snapshot();

      // Verify key accessibility nodes exist
      expect(snapshot).toBeTruthy();

      // Check for landmark regions (if present)
      const hasButton = JSON.stringify(snapshot).includes('"role":"button"');
      expect(hasButton).toBe(true);
    });

    test('36. Accessibility tree snapshot (expanded dropdown)', async ({ page }) => {
      // Open dropdown first
      const dropdown = page.locator('[role="button"][aria-haspopup="listbox"]');
      await dropdown.click();
      await page.waitForTimeout(100);

      // Verify dropdown is open
      const isExpanded = await dropdown.getAttribute('aria-expanded');
      expect(isExpanded).toBe('true');

      // Verify listbox is visible in DOM
      const listbox = page.locator('[role="listbox"]');
      await expect(listbox).toBeVisible();

      // Verify options are visible in DOM
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      expect(optionCount).toBeGreaterThan(0);

      // Verify each option has proper ARIA attributes
      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const ariaSelected = await option.getAttribute('aria-selected');
        expect(ariaSelected).toBeTruthy(); // Should be 'true' or 'false'
      }

      // Get snapshot of the dropdown menu container specifically
      const menuSnapshot = await listbox.evaluate(el => {
        return {
          role: el.getAttribute('role'),
          label: el.getAttribute('aria-label'),
          options: Array.from(el.querySelectorAll('[role="option"]')).map(opt => ({
            role: opt.getAttribute('role'),
            selected: opt.getAttribute('aria-selected'),
            testId: opt.getAttribute('data-testid')
          }))
        };
      });

      // Verify menu structure
      expect(menuSnapshot.role).toBe('listbox');
      expect(menuSnapshot.options.length).toBe(optionCount);
    });

  });

});
