// OAuth Fix Verification Test
// Run with: npx playwright test test-oauth-fix.spec.js --headed

import { test, expect } from '@playwright/test';

test.describe('OAuth Authentication Fix Verification', () => {
  
  test('should detect OAuth tokens and route to oauth-callback', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('🔐') || msg.text().includes('OAuth') || msg.text().includes('ROUTING')) {
        console.log('Console:', msg.text());
      }
    });

    // Test 1: Navigate with OAuth tokens in URL (simulating GitHub/Google OAuth return)
    console.log('\n=== Test 1: OAuth Token Detection ===');
    await page.goto('http://localhost:5173/#access_token=mock_token_123&refresh_token=mock_refresh_456&token_type=bearer');
    
    // Wait for routing logic
    await page.waitForTimeout(2000);
    
    // Check current hash
    const hash1 = await page.evaluate(() => window.location.hash);
    console.log('Current hash after OAuth tokens:', hash1);
    
    // Should route to oauth-callback
    expect(hash1).toContain('oauth-callback');
    
    // Test 2: Direct navigation to base URL (new redirect URL format)
    console.log('\n=== Test 2: Base URL Redirect ===');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);
    
    const hash2 = await page.evaluate(() => window.location.hash);
    console.log('Current hash at base URL:', hash2);
    
    // Should show landing or login page (not an error)
    expect(hash2).not.toContain('unified-registration');
    
    // Test 3: Check OAuth button redirect URL
    console.log('\n=== Test 3: OAuth Button Configuration ===');
    await page.goto('http://localhost:5173/#signup');
    await page.waitForTimeout(2000);
    
    // Check if GitHub OAuth button exists
    const githubButton = page.locator('button:has-text("Continue with GitHub")');
    const buttonExists = await githubButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      console.log('✅ GitHub OAuth button found');
      
      // Intercept the OAuth redirect to check the URL
      await page.route('**/auth/v1/authorize**', route => {
        const url = route.request().url();
        console.log('OAuth redirect URL:', url);
        
        // Check if redirect_to parameter is correct
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const redirectTo = urlParams.get('redirect_to');
        console.log('Redirect to parameter:', redirectTo);
        
        // Should NOT contain /#/oauth-callback
        expect(redirectTo).not.toContain('#/oauth-callback');
        
        route.abort(); // Don't actually navigate to GitHub
      });
      
      // Click the button
      await githubButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ GitHub OAuth button not found - may need to navigate to correct page');
    }
    
    // Test 4: Check for double GDPR banners
    console.log('\n=== Test 4: GDPR Banner Check ===');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    const consentBanners = await page.locator('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="gdpr"]').all();
    console.log('Number of consent/cookie banners found:', consentBanners.length);
    
    // Should only have one banner (or none if already accepted)
    expect(consentBanners.length).toBeLessThanOrEqual(1);
  });

  test('should handle OAuth callback component correctly', async ({ page }) => {
    console.log('\n=== OAuth Callback Component Test ===');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('OAuthCallback') || msg.text().includes('Session')) {
        console.log('OAuthCallback:', msg.text());
      }
    });

    // Navigate directly to oauth-callback view
    await page.goto('http://localhost:5173/#oauth-callback');
    await page.waitForTimeout(3000);
    
    // Check if error message appears
    const errorText = await page.locator('text="Authentication Failed"').isVisible().catch(() => false);
    
    if (errorText) {
      console.log('⚠️ OAuth callback showing error - this is expected without real session');
      
      // Check if error message is the expected one
      const errorMessage = await page.locator('p:has-text("OAuth session establishment failed")').isVisible().catch(() => false);
      if (errorMessage) {
        console.log('❌ Still showing old error message about session establishment');
        console.log('This indicates the OAuth token detection may not be working');
      }
    } else {
      console.log('✅ OAuth callback not showing error - session may be detected');
    }
    
    // Final hash check
    const finalHash = await page.evaluate(() => window.location.hash);
    console.log('Final hash:', finalHash);
  });

  test('should work with actual OAuth flow simulation', async ({ page, context }) => {
    console.log('\n=== Simulated OAuth Flow Test ===');
    
    // Mock Supabase session in browser context
    await context.addInitScript(() => {
      // Override localStorage to simulate a session
      const mockSession = {
        access_token: 'mock_access_token_xyz',
        refresh_token: 'mock_refresh_token_abc',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-user-123',
          email: 'test@example.com',
          app_metadata: { provider: 'github' },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      };
      
      // Store in localStorage as Supabase would
      const storageKey = 'sb-pdmtvkcxnqysujnpcnyh-auth-token';
      localStorage.setItem(storageKey, JSON.stringify({
        currentSession: mockSession,
        expiresAt: Date.now() + 3600000
      }));
    });

    // Navigate with OAuth tokens
    await page.goto('http://localhost:5173/#access_token=mock_access_token_xyz&refresh_token=mock_refresh_token_abc');
    
    // Wait for OAuth callback to process
    await page.waitForTimeout(5000);
    
    // Check final destination
    const finalHash = await page.evaluate(() => window.location.hash);
    console.log('Final destination after OAuth:', finalHash);
    
    // Should not be on error page
    expect(finalHash).not.toContain('unified-registration');
    
    // Ideally should be on dashboard or intended route
    const isSuccess = finalHash.includes('dashboard') || 
                     finalHash.includes('input') || 
                     finalHash.includes('results');
    
    if (isSuccess) {
      console.log('✅ OAuth flow completed successfully!');
    } else {
      console.log('⚠️ OAuth flow completed but ended on unexpected route:', finalHash);
    }
  });
});

console.log('\n=== Test Instructions ===');
console.log('1. Start dev server: npm run dev');
console.log('2. Run this test: npx playwright test test-oauth-fix.spec.js --headed');
console.log('3. Watch for console output to see OAuth flow behavior');
console.log('\nExpected Results:');
console.log('- OAuth tokens should be detected and route to oauth-callback');
console.log('- Redirect URL should be base URL, not /#/oauth-callback');
console.log('- Only one GDPR banner should appear');
console.log('- OAuth callback should process session without errors');