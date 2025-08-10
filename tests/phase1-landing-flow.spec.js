// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Phase 1: Landing Page and Value-First Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start from the landing page
    await page.goto('http://localhost:5173');
  });

  test('should display landing page without requiring authentication', async ({ page }) => {
    // Check main headline is visible
    await expect(page.locator('h1')).toContainText('Is AI Stealing Your');
    await expect(page.locator('h1')).toContainText('Traffic?');
    
    // Check key elements are present
    await expect(page.locator('text=ChatGPT, Claude, and Perplexity')).toBeVisible();
    await expect(page.locator('text=5,247 businesses')).toBeVisible();
    
    // Check URL input is present
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await expect(urlInput).toBeVisible();
    
    // Check analyze button is present
    const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
    await expect(analyzeButton).toBeVisible();
    
    // Verify no authentication is required
    await expect(page.locator('text=Sign In')).not.toBeVisible();
    await expect(page.locator('text=Send magic link')).not.toBeVisible();
  });

  test('should show trust indicators and social proof', async ({ page }) => {
    // Check statistics
    await expect(page.locator('text=148')).toBeVisible();
    await expect(page.locator('text=AI Ranking Factors')).toBeVisible();
    await expect(page.locator('text=15s')).toBeVisible();
    await expect(page.locator('text=Analysis Time')).toBeVisible();
    
    // Check testimonials section
    await expect(page.locator('text=Trusted by Smart Businesses')).toBeVisible();
    await expect(page.locator('text=Sarah Chen')).toBeVisible();
    await expect(page.locator('text=Michael Torres')).toBeVisible();
  });

  test('should analyze URL without requiring email', async ({ page }) => {
    // Enter a test URL
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await urlInput.fill('example.com');
    
    // Click analyze button
    const analyzeButton = page.locator('button:has-text("Analyze My Site Free")');
    await analyzeButton.click();
    
    // Should show progress without asking for email
    await expect(page.locator('text=Analyzing Your AI Search Visibility')).toBeVisible({ timeout: 10000 });
    
    // Should show progress messages - use first match
    await expect(page.locator('text=/Fetching|Analyzing|Checking|Calculating/').first()).toBeVisible();
    
    // Progress bar should be visible - use first match
    await expect(page.locator('.bg-blue-600').first()).toBeVisible();
  });

  test('should show teaser results with strategic pricing', async ({ page }) => {
    // Quick analysis
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await urlInput.fill('example.com');
    await page.locator('button:has-text("Analyze My Site Free")').click();
    
    // Wait for results (progress takes about 14 seconds)
    await page.waitForTimeout(15000);
    
    // Check critical alert is shown
    await expect(page.locator('text=Critical: You\'re Losing Traffic to AI')).toBeVisible();
    
    // Check AI visibility score is shown
    await expect(page.locator('text=AI VISIBILITY SCORE')).toBeVisible();
    await expect(page.locator('text=/\\/100/')).toBeVisible();
    
    // Check top 3 issues are visible
    await expect(page.locator('text=Top 3 Critical Issues Found:')).toBeVisible();
    await expect(page.locator('text=No AI-Optimized Content Structure')).toBeVisible();
    
    // Check three-tier pricing is displayed - use more specific selectors
    await expect(page.locator('h3:has-text("Professional")')).toBeVisible();
    await expect(page.locator('text=$29').first()).toBeVisible();
    await expect(page.locator('text=RECOMMENDED')).toBeVisible();
    
    await expect(page.locator('h3:has-text("Starter")')).toBeVisible();
    await expect(page.locator('text=$5').first()).toBeVisible();
    
    await expect(page.locator('text=Free Trial')).toBeVisible();
    await expect(page.locator('text=$0')).toBeVisible();
    
    // Check upgrade buttons
    await expect(page.locator('button:has-text("Start Professional")')).toBeVisible();
    await expect(page.locator('button:has-text("Start Starter")')).toBeVisible();
    await expect(page.locator('button:has-text("Continue with Limited Free")')).toBeVisible();
  });

  test('should handle invalid URLs gracefully', async ({ page }) => {
    // Try invalid URL
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await urlInput.fill('not a valid url!@#$');
    
    await page.locator('button:has-text("Analyze My Site Free")').click();
    
    // Should show error
    await expect(page.locator('text=Please enter a valid URL')).toBeVisible();
  });

  test('should show urgency and FOMO elements', async ({ page }) => {
    // Check urgency banner
    await expect(page.locator('text=Warning:')).toBeVisible();
    await expect(page.locator('text=65% of businesses losing traffic')).toBeVisible();
    
    // Scroll to pricing after analysis
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await urlInput.fill('test.com');
    await page.locator('button:has-text("Analyze My Site Free")').click();
    
    // Wait for results
    await page.waitForTimeout(15000);
    
    // Check limited time offer - use first match
    await expect(page.locator('text=/Limited Time:/').first()).toBeVisible();
    await expect(page.locator('text=/48 hours/').first()).toBeVisible();
    await expect(page.locator('text=50% off first month')).toBeVisible();
  });

  test('should maintain professional tier as featured/recommended', async ({ page }) => {
    // Run quick analysis to get to pricing
    await page.locator('input[placeholder="Enter your website URL..."]').fill('test.com');
    await page.locator('button:has-text("Analyze My Site Free")').click();
    await page.waitForTimeout(15000);
    
    // Professional should be highlighted - use more specific selector
    const professionalCard = page.locator('.border-blue-500').filter({ hasText: 'Professional' });
    await expect(professionalCard).toBeVisible();
    await expect(professionalCard.locator('text=RECOMMENDED')).toBeVisible();
    
    // Professional button should be primary color
    const professionalButton = professionalCard.locator('button');
    await expect(professionalButton).toHaveClass(/bg-blue-600/);
    
    // Starter button should be secondary - use more specific selector
    const starterButton = page.locator('button:has-text("Start Starter")');
    await expect(starterButton).toHaveClass(/bg-gray-600/);
    
    // Free trial should be de-emphasized - use more specific selector
    const freeCard = page.locator('.opacity-75').filter({ hasText: 'Free Trial' });
    await expect(freeCard).toBeVisible();
  });
});

test.describe('Phase 1: Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:5173');
    
    // Check mobile layout works
    await expect(page.locator('h1')).toContainText('Is AI Stealing Your');
    
    // Check form is stacked on mobile
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Input and button should be full width
    const urlInput = page.locator('input[placeholder="Enter your website URL..."]');
    await expect(urlInput).toBeVisible();
    
    const button = page.locator('button:has-text("Analyze My Site Free")');
    await expect(button).toBeVisible();
  });
});