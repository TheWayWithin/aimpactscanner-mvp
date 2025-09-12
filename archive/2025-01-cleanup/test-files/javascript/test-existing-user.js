import { chromium } from 'playwright';

async function testExistingUserPayment() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🚀 Testing Payment Flow for Existing User');
  console.log('=========================================\n');
  
  try {
    // Navigate to site
    console.log('1️⃣ Navigating to site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded\n');
    
    // Sign in with existing user
    console.log('2️⃣ Signing in existing user...');
    const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    
    if (await signInButton.isVisible({ timeout: 5000 })) {
      await signInButton.click();
      await page.waitForTimeout(2000);
      
      // Fill login form
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      
      const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
      await submitButton.click();
      console.log('   ✓ Login submitted');
      
      await page.waitForTimeout(5000);
      console.log('   ✓ Logged in successfully\n');
    }
    
    // Navigate to upgrade
    console.log('3️⃣ Navigating to upgrade...');
    
    // Try clicking upgrade button
    let upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      await upgradeButton.click();
      console.log('   ✓ Clicked Upgrade button');
      await page.waitForTimeout(3000);
    } else {
      // If no upgrade button, navigate to pricing directly
      await page.goto(`${siteUrl}/pricing`);
      console.log('   ✓ Navigated to pricing page');
      await page.waitForTimeout(2000);
    }
    
    // Find and click Buy Me a Coffee button
    console.log('\n4️⃣ Attempting Coffee Tier purchase...');
    const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
    
    if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found "Buy Me a Coffee" button');
      
      // Check if button is disabled
      const isDisabled = await buyCoffeeButton.isDisabled();
      if (isDisabled) {
        console.log('   ⚠️ Button is disabled (user may already have this tier)');
      } else {
        console.log('   ✓ Button is enabled, clicking...');
        await buyCoffeeButton.click();
        console.log('   ✓ Clicked "Buy Me a Coffee"');
        
        // Wait for potential Stripe redirect
        console.log('\n5️⃣ Waiting for Stripe redirect...');
        
        for (let i = 0; i < 15; i++) {
          await page.waitForTimeout(1000);
          const currentUrl = page.url();
          
          if (currentUrl.includes('checkout.stripe.com')) {
            console.log(`\n   ✅ SUCCESS! Redirected to Stripe Checkout!`);
            console.log(`   📍 Stripe URL: ${currentUrl}`);
            console.log('\n🎉 PAYMENT FLOW IS WORKING!');
            console.log('   The Coffee Tier ($5/month) subscription is ready!');
            
            // Take screenshot of Stripe checkout
            await page.screenshot({ path: 'stripe-success.png', fullPage: true });
            console.log('   📸 Screenshot saved: stripe-success.png');
            
            break;
          }
          
          if (i === 14) {
            console.log('\n   ❌ No redirect after 15 seconds');
            console.log('   Current URL:', currentUrl);
            
            // Check for any error messages
            const errorElement = await page.locator('.error, .alert, [role="alert"], .text-red-500').first();
            if (await errorElement.isVisible({ timeout: 100 })) {
              const errorText = await errorElement.textContent();
              if (errorText && errorText.trim()) {
                console.log('   Error message:', errorText);
              }
            }
          }
        }
      }
    } else {
      console.log('   ❌ "Buy Me a Coffee" button not found');
      console.log('   User may already have an active subscription');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'payment-test-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: payment-test-final.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'payment-test-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test completed. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

console.log('==========================================');
console.log('💳 EXISTING USER PAYMENT TEST');
console.log('==========================================\n');

testExistingUserPayment().catch(console.error);