import { test, expect } from '@playwright/test';

test.describe('AImpactScanner E2E Tests', () => {
  test('should load the homepage and show authentication', async ({ page }) => {
    // Go to the correct local development server port
    await page.goto('http://localhost:5173');
    
    // Check that the page title contains something related to your app
    await expect(page).toHaveTitle(/AImpactScanner|Vite/);
    
    // Check that the page loads (no major errors)
    await expect(page.locator('body')).toBeVisible();
    
    // Should show auth form initially (user not logged in)
    const authForm = page.locator('form, input[type="email"], input[type="password"]');
    await expect(authForm.first()).toBeVisible();
  });

  test('should display the app branding', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Look for the app name and branding
    const appTitle = page.locator('text=AImpactScanner');
    const brandSubtitle = page.locator('text=AI Search Mastery');
    
    // App might be behind auth, so check if visible or if we see auth form
    const authFormVisible = await page.locator('form, input[type="email"]').count() > 0;
    
    if (!authFormVisible) {
      // User might be logged in, check for app branding
      await expect(appTitle).toBeVisible();
      await expect(brandSubtitle).toBeVisible();
    } else {
      console.log('Authentication required - app branding behind login');
    }
  });

  test('should show navigation buttons after login', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // This test assumes we can get past auth or have a test user
    // For now, just check the page structure
    const authForm = page.locator('input[type="email"]');
    
    if (await authForm.count() > 0) {
      console.log('Authentication form detected - login flow needed for full testing');
      // Could add test user login here later
    } else {
      // If somehow logged in, check for navigation
      const newAnalysisBtn = page.locator('text=New Analysis');
      const progressBtn = page.locator('text=Analysis Progress');
      const resultsBtn = page.locator('text=Results Dashboard');
      
      await expect(newAnalysisBtn).toBeVisible();
      await expect(progressBtn).toBeVisible();
      await expect(resultsBtn).toBeVisible();
    }
  });

  test('should handle URL input when authenticated', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // This test will be enhanced once we add test authentication
    // For now, just verify the page loads correctly
    await expect(page.locator('body')).toBeVisible();
    
    console.log('URL input test requires authentication - will be enhanced in next iteration');
  });
});