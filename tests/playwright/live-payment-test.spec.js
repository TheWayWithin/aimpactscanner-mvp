// Live Payment Flow Test with Playwright
import { test, expect } from '@playwright/test';

test.describe('AImpactScanner Live Payment Flow', () => {
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';

  test('Complete registration and payment flow', async ({ page }) => {
    // Set timeout for this test
    test.setTimeout(120000); // 2 minutes

    console.log('🚀 Starting live payment flow test...');
    
    // Step 1: Navigate to site
    console.log('1️⃣ Navigating to:', siteUrl);
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Start analysis from landing page
    console.log('2️⃣ Starting analysis...');
    const urlInput = page.locator('input[type="text"], input[type="url"]').first();
    await urlInput.fill('example.com');
    
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start")').first();
    await analyzeButton.click();
    
    // Step 3: Wait for analysis to complete
    console.log('3️⃣ Waiting for analysis to complete...');
    await page.waitForTimeout(15000); // Wait for analysis simulation
    
    // Step 4: Handle the "Score Needs Attention" popup
    console.log('4️⃣ Handling score attention popup...');
    
    // Look for and click "Start Recovering Traffic" button
    const startRecoveringButton = page.locator('button:has-text("Start Recovering Traffic")').first();
    
    if (await startRecoveringButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found "Start Recovering Traffic" button, clicking...');
      await startRecoveringButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Look for registration options after clicking
    console.log('   Looking for registration form or auth options...');
    
    // Try to find "Continue with Limited Free" or similar button
    const freeTrialButton = page.locator('button:has-text("Continue with Limited Free"), button:has-text("Free Trial"), button:has-text("Get Started Free"), button:has-text("Sign Up")').first();
    
    if (await freeTrialButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found free trial/sign up button, clicking...');
      await freeTrialButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 5: Complete registration
    console.log('5️⃣ Completing registration...');
    
    // Wait for registration form - it might be in a modal or new page
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    } catch (e) {
      console.log('   ⚠️ Email input not found, checking if we need to navigate to auth page...');
      // Check if there's a login/signup link
      const authLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a:has-text("Login")').first();
      if (await authLink.isVisible({ timeout: 3000 })) {
        console.log('   ✓ Found auth link, clicking...');
        await authLink.click();
        await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      }
    }
    
    // Fill email
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(testEmail);
    console.log('   ✓ Email entered:', testEmail);
    
    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testPassword);
    console.log('   ✓ Password entered');
    
    // Fill confirm password if present
    const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
    if (await confirmPasswordInput.isVisible({ timeout: 2000 })) {
      await confirmPasswordInput.fill(testPassword);
      console.log('   ✓ Confirm password entered');
    }
    
    // Check terms checkbox if present
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 2000 })) {
      await termsCheckbox.check();
      console.log('   ✓ Terms accepted');
    }
    
    // Submit registration
    const submitButton = page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up"), button:has-text("Register")').first();
    await submitButton.click();
    console.log('   ✓ Registration submitted');
    
    // Step 6: Wait for registration to complete
    console.log('6️⃣ Waiting for registration to complete...');
    
    // Look for success messages or dashboard
    await page.waitForTimeout(5000); // Give time for registration to process
    
    // Check if we're logged in by looking for dashboard elements
    const isDashboard = await page.locator('text=/Dashboard|Welcome|Upgrade|Analysis|remaining/i').first().isVisible({ timeout: 10000 });
    
    if (isDashboard) {
      console.log('   ✅ Registration successful! User is logged in.');
    } else {
      console.log('   ⚠️ Registration may have issues. Checking for error messages...');
      
      // Check for any error messages
      const errorMessage = await page.locator('.error, .alert-error, [role="alert"]').first().textContent().catch(() => null);
      if (errorMessage) {
        console.log('   ❌ Error message found:', errorMessage);
      }
    }
    
    // Step 7: Navigate to upgrade/pricing
    console.log('7️⃣ Navigating to pricing...');
    
    // Try multiple selectors for upgrade button
    const upgradeButton = page.locator('button:has-text("Upgrade"), a:has-text("Upgrade"), button:has-text("Pricing"), a:has-text("Pricing")').first();
    
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      await upgradeButton.click();
      console.log('   ✓ Clicked upgrade button');
    }
    
    // Step 8: Select Coffee Tier
    console.log('8️⃣ Looking for Coffee Tier ($5)...');
    await page.waitForTimeout(2000);
    
    // Look for Coffee tier or $5 option
    const coffeeTierButton = page.locator('button:has-text("Coffee"), button:has-text("Starter"), button:has-text("$5"), button:has-text("Subscribe")').first();
    
    if (await coffeeTierButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found Coffee Tier, clicking...');
      await coffeeTierButton.click();
      
      // Wait for Stripe Checkout redirect
      console.log('9️⃣ Waiting for Stripe Checkout...');
      await page.waitForTimeout(5000);
      
      // Check if we're on Stripe Checkout
      const currentUrl = page.url();
      if (currentUrl.includes('checkout.stripe.com')) {
        console.log('   ✅ Successfully redirected to Stripe Checkout!');
        console.log('   📍 Stripe Checkout URL:', currentUrl);
        console.log('\n✅ TEST SUCCESSFUL! Payment flow is working.');
        console.log('   You can now manually complete the payment with a real card.');
      } else {
        console.log('   ⚠️ Not redirected to Stripe. Current URL:', currentUrl);
      }
    } else {
      console.log('   ❌ Could not find Coffee Tier button');
    }
    
    // Step 9: Take screenshot for debugging
    await page.screenshot({ path: 'payment-test-final.png', fullPage: true });
    console.log('📸 Screenshot saved as payment-test-final.png');
    
    // Log console messages for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
  });
});