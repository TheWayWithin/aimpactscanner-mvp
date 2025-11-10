// phase4-tier-selector-basic.spec.js - E2E tests for Phase 4 Basic Tier Selector
import { test, expect } from '@playwright/test';

test.describe('Phase 4: Basic Tier Selector with Billing Toggle', () => {
  test('Default state: Growth + Annual selected', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Verify Growth tier is selected by default
    const growthRadio = page.locator('input[value="growth"]');
    await expect(growthRadio).toBeChecked();

    // Verify Annual billing is selected by default
    const annualToggle = page.locator('[data-billing="annual"]');
    await expect(annualToggle).toHaveAttribute('aria-pressed', 'true');

    // Verify pricing displays annual equivalent ($12.46/mo)
    await expect(page.locator('text=/\\$12\\.46\\/mo/i')).toBeVisible();

    // Verify "billed annually" text visible
    await expect(page.locator('text=/billed.*annually/i')).toBeVisible();

    // Verify savings message visible
    await expect(page.locator('text=/save.*\\$65\\.90/i')).toBeVisible();
  });

  test('Toggle billing: Annual → Monthly', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Verify annual selected initially
    await expect(page.locator('[data-billing="annual"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('text=/\\$12\\.46\\/mo/i')).toBeVisible();

    // Click monthly toggle
    await page.click('[data-billing="monthly"]');

    // Wait for transition (500ms spec'd, we'll wait 600ms to be safe)
    await page.waitForTimeout(600);

    // Verify monthly selected
    await expect(page.locator('[data-billing="monthly"]')).toHaveAttribute('aria-pressed', 'true');

    // Verify price updated to monthly rate
    await expect(page.locator('text=/\\$17\\.95\\/mo/i')).toBeVisible();

    // Verify "billed monthly" text visible
    await expect(page.locator('text=/billed monthly/i')).toBeVisible();
  });

  test('Toggle billing: Monthly → Annual', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Switch to monthly first
    await page.click('[data-billing="monthly"]');
    await page.waitForTimeout(600);

    // Verify monthly pricing
    await expect(page.locator('text=/\\$17\\.95\\/mo/i')).toBeVisible();

    // Click annual toggle
    await page.click('[data-billing="annual"]');
    await page.waitForTimeout(600);

    // Verify annual pricing restored
    await expect(page.locator('text=/\\$12\\.46\\/mo/i')).toBeVisible();
    await expect(page.locator('text=/save.*\\$65\\.90/i')).toBeVisible();
  });

  test('Select Solo tier: Display mapping works', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Click Solo tier radio button
    await page.click('input[value="coffee"]');

    // Wait for transition
    await page.waitForTimeout(300);

    // Verify Solo tier is selected (radio button checked)
    const coffeeRadio = page.locator('input[value="coffee"]');
    await expect(coffeeRadio).toBeChecked();

    // Verify display shows "Solo" (not "coffee")
    await expect(page.locator('text=/💼 Solo/i')).toBeVisible();

    // Verify pricing displays for Solo tier (annual: $4.13/mo)
    await expect(page.locator('text=/\\$4\\.13\\/mo/i')).toBeVisible();

    // Verify authContext stores 'coffee' as internal ID
    const authContext = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('authContext') || '{}');
    });

    // Note: authContext is only saved after clicking "Continue"
    // So we'll click Continue button and check
    await page.click('button:has-text("Continue to Sign Up")');

    const updatedAuthContext = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('authContext') || '{}');
    });

    expect(updatedAuthContext.selectedTier).toBe('coffee');
    expect(updatedAuthContext.billingFrequency).toBe('annual');
  });

  test('Select Free tier: Pricing displays correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Click Free tier
    await page.click('input[value="free"]');
    await page.waitForTimeout(300);

    // Verify Free tier selected
    await expect(page.locator('input[value="free"]')).toBeChecked();

    // Verify $0/mo displayed
    await expect(page.locator('text=/\\$0\\/mo/i')).toBeVisible();

    // Verify Free tier display name visible
    await expect(page.locator('text=/⚠️ FREE \\(Limited\\)/i')).toBeVisible();
  });

  test('Select Scale tier: Pricing displays correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Click Scale tier
    await page.click('input[value="scale"]');
    await page.waitForTimeout(300);

    // Verify Scale tier selected
    await expect(page.locator('input[value="scale"]')).toBeChecked();

    // Verify annual pricing displayed ($24.96/mo)
    await expect(page.locator('text=/\\$24\\.96\\/mo/i')).toBeVisible();
    await expect(page.locator('text=/save.*\\$119\\.90/i')).toBeVisible();
  });

  test('State persistence: authContext includes billingFrequency', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Select Solo tier
    await page.click('input[value="coffee"]');
    await page.waitForTimeout(300);

    // Switch to monthly billing
    await page.click('[data-billing="monthly"]');
    await page.waitForTimeout(600);

    // Click Continue button
    await page.click('button:has-text("Continue to Sign Up")');

    // Verify authContext saved to localStorage
    const authContext = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('authContext') || '{}');
    });

    expect(authContext.selectedTier).toBe('coffee');
    expect(authContext.billingFrequency).toBe('monthly');
    expect(authContext.mode).toBe('signup');
    expect(authContext.timestamp).toBeGreaterThan(0);
  });

  test('Visual state: Selected tier has correct border color', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Growth tier should have yellow border by default
    const growthCard = page.locator('input[value="growth"]').locator('..');
    await expect(growthCard).toHaveClass(/border-yellow-400/);

    // Select Solo tier
    await page.click('input[value="coffee"]');
    await page.waitForTimeout(300);

    // Solo tier should have blue border
    const soloCard = page.locator('input[value="coffee"]').locator('..');
    await expect(soloCard).toHaveClass(/border-blue-400/);
  });

  test('Transition animation: No janky content jumps', async ({ page }) => {
    await page.goto('http://localhost:5173/#signup');

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Toggle billing frequency
    await page.click('[data-billing="monthly"]');
    await page.waitForTimeout(600);

    // Verify scroll position didn't change (no layout shift)
    const finalScrollY = await page.evaluate(() => window.scrollY);
    expect(finalScrollY).toBe(initialScrollY);

    // Change tier
    await page.click('input[value="coffee"]');
    await page.waitForTimeout(300);

    // Verify scroll position still stable
    const afterTierChange = await page.evaluate(() => window.scrollY);
    expect(afterTierChange).toBe(initialScrollY);
  });
});
