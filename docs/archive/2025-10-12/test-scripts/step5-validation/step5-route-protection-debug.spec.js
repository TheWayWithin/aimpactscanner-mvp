import { test, expect } from '@playwright/test';

test.describe('Step 5: Route Protection Debug Analysis', () => {
  test('debug route protection system', async ({ page }) => {
    console.log('🔍 DEBUGGING ROUTE PROTECTION SYSTEM...');
    
    // Clear authentication state completely
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
    
    console.log('✅ Authentication state cleared');
    
    // Test 1: Home page should be accessible
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    console.log('Home page URL:', page.url());
    
    // Test 2: Dashboard access (should be protected)
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');
    console.log('Dashboard access URL:', page.url());
    
    // Test 3: Check what's actually rendered on the page
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const pageContent = await page.textContent('body');
    console.log('Page contains "Dashboard":', pageContent.includes('Dashboard'));
    console.log('Page contains "Sign In":', pageContent.includes('Sign In'));
    console.log('Page contains "Authentication":', pageContent.includes('Authentication'));
    console.log('Page contains "Login":', pageContent.includes('Login'));
    
    // Test 4: Check navigation elements
    const navElements = await page.locator('nav, header').textContent();
    console.log('Navigation elements:', navElements);
    
    // Test 5: Check for authentication forms or elements
    const authElements = await page.locator('form, input[type="email"], button:has-text("Sign")').count();
    console.log('Authentication elements found:', authElements);
    
    // Test 6: Check for protected content indicators
    const protectedElements = await page.locator('[data-testid="dashboard"], .dashboard, button:has-text("New Analysis")').count();
    console.log('Protected content elements found:', protectedElements);
    
    // Test 7: Check browser console for errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('Console messages:');
    consoleMessages.forEach(msg => console.log('  -', msg));
    
    // Test 8: Try other protected routes
    const protectedRoutes = ['/profile', '/settings', '/analysis', '/account'];
    
    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:5173${route}`);
      await page.waitForLoadState('networkidle');
      console.log(`Route ${route} redirected to:`, page.url());
    }
    
    // Test 9: Check current authentication status
    const authStatus = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('supabase')),
        sessionStorage: Object.keys(sessionStorage).filter(key => key.includes('auth') || key.includes('supabase')),
        cookies: document.cookie
      };
    });
    
    console.log('Authentication status:', JSON.stringify(authStatus, null, 2));
    
    // Final assessment
    const currentUrl = page.url();
    const isOnLandingPage = currentUrl.includes('#landing') || currentUrl === 'http://localhost:5173/';
    const hasAuthElements = authElements > 0;
    const hasProtectedElements = protectedElements > 0;
    
    console.log('\n🏆 ROUTE PROTECTION ANALYSIS:');
    console.log(`Current URL: ${currentUrl}`);
    console.log(`On landing page: ${isOnLandingPage}`);
    console.log(`Has auth elements: ${hasAuthElements}`);
    console.log(`Has protected elements: ${hasProtectedElements}`);
    
    if (isOnLandingPage && !hasProtectedElements) {
      console.log('❌ CRITICAL: Route protection NOT working - accessing protected routes shows landing page');
    } else if (hasAuthElements && !hasProtectedElements) {
      console.log('✅ Route protection working - redirected to authentication');
    } else {
      console.log('⚠️ UNCLEAR: Route protection status unclear - needs investigation');
    }
  });
});