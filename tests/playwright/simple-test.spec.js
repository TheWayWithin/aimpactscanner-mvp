import { test, expect } from '@playwright/test';

test.describe('Simple AImpactScanner Tests', () => {
  test('should load the page without errors', async ({ page }) => {
    // Go to your app on the correct port
    await page.goto('http://localhost:5173');
    
    // Just check that we can load the page (very basic test)
    await expect(page).toHaveURL('http://localhost:5173/');
    
    // Check that the page has some content (any content)
    const bodyText = await page.textContent('body');
    expect(bodyText.length).toBeGreaterThan(0);
    
    console.log('Page loaded successfully!');
    console.log('Page title:', await page.title());
    console.log('First 100 characters of page:', bodyText.substring(0, 100));
  });
  
  test('should have a title', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check that the page has some kind of title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    console.log('Page title is:', title);
  });
});