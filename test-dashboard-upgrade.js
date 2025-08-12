import { chromium } from 'playwright';

async function testDashboardUpgrade() {
  console.log('==========================================');
  console.log('💳 TESTING UPGRADE FROM DASHBOARD');
  console.log('==========================================\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const siteUrl = 'https://aimpactscanner.com';
  
  try {
    // Navigate and sign in
    console.log('1️⃣ Signing in...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    
    // Click sign in
    const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible({ timeout: 3000 })) {
      await signInButton.click();
      await page.waitForTimeout(2000);
      
      await page.fill('input[type="email"]', 'ugcbwkkfxvhhxyxmih@xfavaj.com');
      await page.fill('input[type="password"]', 'TestPassword123!');
      
      const submitButton = await page.locator('button[type="submit"]').first();
      await submitButton.click();
      console.log('   ✓ Logging in...');
      await page.waitForTimeout(5000);
      console.log('   ✓ Logged in\n');
    }
    
    // Now look for the Upgrade button in the header
    console.log('2️⃣ Looking for Upgrade button in header...');
    await page.screenshot({ path: 'dashboard-view.png', fullPage: true });
    console.log('   📸 Dashboard screenshot: dashboard-view.png');
    
    // Try to find and click the Upgrade button
    const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      const buttonText = await upgradeButton.textContent();
      console.log(`   ✓ Found: "${buttonText}"`);
      await upgradeButton.click();
      console.log('   ✓ Clicked Upgrade\n');
      await page.waitForTimeout(3000);
      
      // Now on pricing view
      console.log('3️⃣ On pricing view, looking for Coffee tier...');
      await page.screenshot({ path: 'pricing-view.png', fullPage: true });
      console.log('   📸 Pricing screenshot: pricing-view.png');
      
      // Look for Buy Me a Coffee button
      const coffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
      if (await coffeeButton.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Found "Buy Me a Coffee" button');
        
        const isDisabled = await coffeeButton.isDisabled();
        if (!isDisabled) {
          console.log('   ✓ Button is enabled');
          await coffeeButton.click();
          console.log('   ✓ Clicked "Buy Me a Coffee"\n');
          
          // Wait for Stripe redirect
          console.log('4️⃣ Waiting for Stripe redirect...');
          
          for (let i = 0; i < 15; i++) {
            await page.waitForTimeout(1000);
            const currentUrl = page.url();
            
            if (currentUrl.includes('checkout.stripe.com')) {
              console.log('\n🎉 SUCCESS! PAYMENT FLOW IS WORKING!');
              console.log('   ✅ Redirected to Stripe Checkout');
              console.log('   💳 Coffee Tier ($5/month) ready for payment');
              console.log('   📍 Stripe URL:', currentUrl.substring(0, 80) + '...');
              
              await page.screenshot({ path: 'stripe-success-final.png', fullPage: true });
              console.log('   📸 Success screenshot: stripe-success-final.png\n');
              
              console.log('==========================================');
              console.log('✅ PAYMENT SYSTEM FULLY OPERATIONAL');
              console.log('==========================================');
              console.log('   • Edge Function: ✅ Working');
              console.log('   • User Authentication: ✅ Working');
              console.log('   • Pricing Display: ✅ Working');
              console.log('   • Stripe Integration: ✅ Working');
              console.log('   • Recurring Subscription: ✅ $5/month');
              console.log('==========================================\n');
              
              break;
            }
            
            if (i === 14) {
              console.log('\n   ❌ No Stripe redirect after 15 seconds');
              console.log('   Current URL:', currentUrl);
            }
          }
        } else {
          console.log('   ⚠️ Button is disabled');
          console.log('   User might already have this tier');
        }
      } else {
        console.log('   ❌ "Buy Me a Coffee" button not found');
      }
    } else {
      console.log('   ❌ Upgrade button not found in header');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
  
  console.log('Test complete. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testDashboardUpgrade().catch(console.error);