import { chromium } from 'playwright';

async function debugStripeRedirect() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // Open DevTools
  });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ Console Error:', text);
    } else if (type === 'warning') {
      console.log('⚠️ Console Warning:', text);
    } else if (text.includes('stripe') || text.includes('Stripe') || text.includes('checkout')) {
      console.log('💳 Stripe Log:', text);
    }
  });
  
  // Capture network failures
  page.on('requestfailed', request => {
    console.log('❌ Request Failed:', request.url(), '-', request.failure().errorText);
  });
  
  // Capture responses
  page.on('response', response => {
    if (response.url().includes('checkout') || response.url().includes('stripe')) {
      console.log('📡 Stripe Response:', response.status(), response.url());
    }
    if (response.status() >= 400) {
      console.log('❌ Error Response:', response.status(), response.url());
    }
  });
  
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🔍 Debugging Stripe Redirect Issue');
  console.log('===================================\n');
  
  try {
    // Navigate to site
    console.log('1️⃣ Navigating to site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    
    // Check if user is logged in
    const dashboardLink = await page.locator('a:has-text("Dashboard")').first();
    const isLoggedIn = await dashboardLink.isVisible({ timeout: 3000 });
    
    if (!isLoggedIn) {
      console.log('   User not logged in. Please log in first.\n');
      
      // Click Sign In
      const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
      if (await signInButton.isVisible({ timeout: 3000 })) {
        await signInButton.click();
        console.log('   ✓ Clicked Sign In\n');
        
        // Use the existing test user
        const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
        const testPassword = 'TestPassword123!';
        
        await page.waitForTimeout(2000);
        
        // Fill login form
        const emailInput = await page.locator('input[type="email"]').first();
        if (await emailInput.isVisible({ timeout: 5000 })) {
          await emailInput.fill(testEmail);
          console.log('   ✓ Email entered');
          
          await page.fill('input[type="password"]', testPassword);
          console.log('   ✓ Password entered');
          
          const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
          await submitButton.click();
          console.log('   ✓ Login submitted\n');
          
          await page.waitForTimeout(5000);
        }
      }
    } else {
      console.log('   ✓ User already logged in\n');
    }
    
    // Now try to upgrade
    console.log('2️⃣ Attempting upgrade to Coffee Tier...');
    
    // Click Upgrade button
    const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found Upgrade button');
      await upgradeButton.click();
      console.log('   ✓ Clicked Upgrade\n');
      
      await page.waitForTimeout(3000);
    }
    
    // Look for Buy Me a Coffee button
    console.log('3️⃣ Looking for Buy Me a Coffee button...');
    const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
    
    if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found "Buy Me a Coffee" button');
      
      // Check if button is disabled
      const isDisabled = await buyCoffeeButton.isDisabled();
      if (isDisabled) {
        console.log('   ⚠️ Button is DISABLED');
      } else {
        console.log('   ✓ Button is ENABLED');
      }
      
      // Get button attributes
      const buttonHtml = await buyCoffeeButton.evaluate(el => el.outerHTML);
      console.log('   Button HTML:', buttonHtml);
      
      // Check for onClick handler
      const hasOnClick = await buyCoffeeButton.evaluate(el => {
        return typeof el.onclick === 'function' || el.hasAttribute('onclick');
      });
      console.log('   Has onClick:', hasOnClick);
      
      console.log('\n4️⃣ Clicking Buy Me a Coffee...');
      await buyCoffeeButton.click();
      console.log('   ✓ Click executed\n');
      
      console.log('5️⃣ Waiting for Stripe redirect...');
      
      // Wait and monitor for redirect
      let redirected = false;
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        const currentUrl = page.url();
        console.log(`   ${i+1}s - Current URL:`, currentUrl);
        
        if (currentUrl.includes('checkout.stripe.com')) {
          redirected = true;
          console.log('\n   ✅ Successfully redirected to Stripe!');
          console.log('   📍 Stripe URL:', currentUrl);
          break;
        }
        
        // Check for any visible errors
        const errorElement = await page.locator('.error, .alert, [role="alert"], .text-red-500').first();
        if (await errorElement.isVisible({ timeout: 100 })) {
          const errorText = await errorElement.textContent();
          if (errorText && errorText.trim()) {
            console.log('   ❌ Error displayed:', errorText);
          }
        }
      }
      
      if (!redirected) {
        console.log('\n   ❌ No redirect to Stripe occurred');
        
        // Check current page state
        const pageTitle = await page.title();
        console.log('   Page title:', pageTitle);
        
        // Look for any loading indicators
        const loadingElement = await page.locator('.loading, .spinner, [aria-busy="true"]').first();
        if (await loadingElement.isVisible({ timeout: 100 })) {
          console.log('   ⚠️ Loading indicator visible');
        }
      }
    } else {
      console.log('   ❌ Buy Me a Coffee button not found');
      
      // Check what's on the page
      const pageContent = await page.locator('body').textContent();
      if (pageContent.includes('Active Plan')) {
        console.log('   ℹ️ User already has an active plan');
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'stripe-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved: stripe-debug.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n✅ Debug session complete. Browser will remain open for inspection...');
  console.log('Press Ctrl+C to exit when done.');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // 5 minutes
}

console.log('==========================================');
console.log('🔍 STRIPE REDIRECT DEBUG SESSION');
console.log('==========================================\n');

debugStripeRedirect().catch(console.error);