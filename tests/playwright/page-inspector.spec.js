// Page Structure Inspector
// Quick test to understand the actual DOM structure

import { test, expect } from '@playwright/test';

test.describe('Page Structure Inspector', () => {
  
  test('Inspect Landing Page Structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    console.log('=== LANDING PAGE INSPECTION ===');
    console.log('URL:', page.url());
    console.log('Title:', await page.title());
    
    // Get page structure
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body HTML length:', bodyContent.length);
    
    // Check for main navigation
    const navElements = await page.locator('nav, header, [role="navigation"]').count();
    console.log('Navigation elements found:', navElements);
    
    // Check for main headings
    const headings = await page.locator('h1, h2').allTextContents();
    console.log('Main headings:', headings.slice(0, 3));
    
    // Check for buttons
    const buttons = await page.locator('button, [role="button"]').count();
    console.log('Buttons found:', buttons);
    
    // Check for links
    const links = await page.locator('a[href]').count();
    console.log('Links found:', links);
  });
  
  test('Inspect Registration Page Structure', async ({ page }) => {
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    
    console.log('=== REGISTRATION PAGE INSPECTION ===');
    console.log('URL:', page.url());
    
    // Check for forms
    const forms = await page.locator('form').count();
    console.log('Forms found:', forms);
    
    // Check for input fields
    const emailInputs = await page.locator('input[type="email"]').count();
    const passwordInputs = await page.locator('input[type="password"]').count();
    const allInputs = await page.locator('input').count();
    
    console.log('Email inputs:', emailInputs);
    console.log('Password inputs:', passwordInputs);
    console.log('Total inputs:', allInputs);
    
    // Check for pricing/tier elements
    const priceElements = await page.locator('text=/\\$|price|tier|coffee/i').count();
    console.log('Pricing elements found:', priceElements);
    
    // Check for buttons
    const buttonTexts = await page.locator('button').allTextContents();
    console.log('Button texts:', buttonTexts.slice(0, 5));
    
    // Get sample of visible text
    const visibleText = await page.textContent('body');
    console.log('Page contains Coffee:', visibleText.toLowerCase().includes('coffee'));
    console.log('Page contains $4.95:', visibleText.includes('4.95'));
    console.log('Page contains register/signup:', /register|sign.?up/i.test(visibleText));
  });
  
  test('Inspect Pricing Page Structure', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    console.log('=== PRICING PAGE INSPECTION ===');
    console.log('URL:', page.url());
    
    // Check for pricing elements
    const priceElements = await page.locator('text=/\\$/').count();
    console.log('Price elements found:', priceElements);
    
    // Check for tier names
    const tierTexts = await page.locator('text=/coffee|growth|scale|free|pro/i').allTextContents();
    console.log('Tier references:', tierTexts.slice(0, 5));
  });
  
  test('Take Screenshots for Manual Inspection', async ({ page }) => {
    // Landing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/landing-page-screenshot.png', fullPage: true });
    
    // Registration page
    await page.goto('/#register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/registration-page-screenshot.png', fullPage: true });
    
    // Pricing page
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/pricing-page-screenshot.png', fullPage: true });
    
    console.log('✓ Screenshots saved to test-results/');
  });
});