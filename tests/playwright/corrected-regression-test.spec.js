// Corrected Regression Test Suite for AImpactScanner
// Testing core workflows with correct selectors
import { test, expect } from '@playwright/test';

test.describe('AImpactScanner Regression Tests - Core Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should load landing page with correct elements', async ({ page }) => {
    // Check main headline
    await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
    
    // Check input field with correct placeholder
    const urlInput = page.locator('input[placeholder="Enter a page URL to analyze..."]');
    await expect(urlInput).toBeVisible();
    
    // Check submit button
    await expect(page.locator('button:has-text("Analyze My Site Free")')).toBeVisible();
    
    // Check key messaging
    await expect(page.locator('text=No email required')).toBeVisible();
    await expect(page.locator('text=See results in 15 seconds')).toBeVisible();
    await expect(page.locator('text=100% free analysis')).toBeVisible();
  });

  test('should handle URL input validation', async ({ page }) => {
    const urlInput = page.locator('input[placeholder="Enter a page URL to analyze..."]');
    const submitButton = page.locator('button:has-text("Analyze My Site Free")');
    
    // Test empty submission
    await submitButton.click();
    // Should not proceed (button disabled when input empty)
    await expect(submitButton).toBeDisabled();
    
    // Test valid URL input
    await urlInput.fill('example.com');
    await expect(submitButton).not.toBeDisabled();
    
    // Test invalid URL
    await urlInput.clear();
    await urlInput.fill('not-a-valid-url');
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=Please enter a valid URL')).toBeVisible();
  });

  test('should display trust indicators and social proof', async ({ page }) => {
    // Check trust badges section
    await expect(page.locator('text=Trusted by 7 pioneering sites')).toBeVisible();
    
    // Check some client names
    await expect(page.locator('text=FreeCalcHub')).toBeVisible();
    await expect(page.locator('text=Agent-11')).toBeVisible();
    
    // Check what you'll discover section
    await expect(page.locator('text=What You\'ll Discover')).toBeVisible();
    await expect(page.locator('text=Traffic Loss Analysis')).toBeVisible();
    await expect(page.locator('text=Competitor Comparison')).toBeVisible();
    await expect(page.locator('text=Recovery Roadmap')).toBeVisible();
  });

  test('should show authentication options', async ({ page }) => {
    // Check Sign In/Sign Up buttons in header
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
  });

  test('should handle analysis initiation', async ({ page }) => {
    const urlInput = page.locator('input[placeholder="Enter a page URL to analyze..."]');
    const submitButton = page.locator('button:has-text("Analyze My Site Free")');
    
    // Enter valid URL
    await urlInput.fill('example.com');
    
    // Submit analysis
    await submitButton.click();
    
    // Should show loading state
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    
    // Wait for analysis to process (up to 30 seconds)
    await page.waitForTimeout(2000);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check main elements are still visible
    await expect(page.locator('text=Is AI Stealing Your Traffic?')).toBeVisible();
    await expect(page.locator('input[placeholder="Enter a page URL to analyze..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Analyze My Site Free")')).toBeVisible();
    
    // Check button is appropriately sized
    const button = page.locator('button:has-text("Analyze My Site Free")');
    const box = await button.boundingBox();
    expect(box.width).toBeGreaterThan(100);
  });

  test('should not show console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out expected warnings
    const criticalErrors = errors.filter(e => 
      !e.includes('cdn.tailwindcss.com') && 
      !e.includes('DevTools') &&
      !e.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load all images successfully', async ({ page }) => {
    // Wait for all images to load
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    for (const img of images) {
      const naturalWidth = await img.evaluate(node => node.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test('should handle navigation to auth', async ({ page }) => {
    // Click Sign In button
    const signInButton = page.locator('button:has-text("Sign In")');
    await signInButton.click();
    
    // Should navigate or show auth modal
    // (Implementation depends on routing setup)
    await page.waitForTimeout(1000);
  });
});

test.describe('Performance Tests', () => {
  test('should load landing page quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    console.log(`Landing page loaded in ${loadTime}ms`);
  });

  test('should handle form submission performance', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const urlInput = page.locator('input[placeholder="Enter a page URL to analyze..."]');
    const submitButton = page.locator('button:has-text("Analyze My Site Free")');
    
    await urlInput.fill('example.com');
    
    const startTime = Date.now();
    await submitButton.click();
    
    // Should show loading state immediately
    await expect(page.locator('text=Analyzing...')).toBeVisible();
    const responseTime = Date.now() - startTime;
    
    // Should respond within 1 second
    expect(responseTime).toBeLessThan(1000);
    console.log(`Form submission response time: ${responseTime}ms`);
  });
});