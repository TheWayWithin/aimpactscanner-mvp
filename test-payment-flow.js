import { chromium } from 'playwright';

async function testPaymentFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🚀 Testing Complete Payment Flow');
  console.log('================================\n');
  
  try {
    // Step 1: Navigate to site
    console.log('1️⃣ Navigating to production site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded\n');
    
    // Step 2: Start analysis
    console.log('2️⃣ Starting analysis...');
    await page.fill('input[type="text"]', 'example.com');
    await page.click('button:has-text("Analyze")');
    console.log('   ✓ Analysis started\n');
    
    // Step 3: Wait for results
    console.log('3️⃣ Waiting for analysis to complete...');
    await page.waitForTimeout(16000);
    console.log('   ✓ Analysis complete\n');
    
    // Step 4: Click on urgency popup
    console.log('4️⃣ Looking for upgrade prompt...');
    
    // First, close the popup if it's blocking
    const maybeLaterButton = await page.locator('button:has-text("Maybe Later")').first();
    if (await maybeLaterButton.isVisible({ timeout: 3000 })) {
      console.log('   Closing initial popup...');
      await maybeLaterButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Now click on the pricing section at the bottom
    console.log('   Scrolling to pricing section...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Click "Continue with Limited Free"
    const freeTrialButton = await page.locator('text="Continue with Limited Free"').first();
    if (await freeTrialButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found "Continue with Limited Free" button');
      await freeTrialButton.click();
      console.log('   ✓ Clicked free trial option\n');
    } else {
      console.log('   ❌ Free trial button not found\n');
    }
    
    // Step 5: Registration
    console.log('5️⃣ Registration process...');
    
    // Wait for auth form
    await page.waitForTimeout(3000);
    
    // Check if email input is visible
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Registration form found');
      
      // Fill registration
      await emailInput.fill(testEmail);
      console.log('   ✓ Email entered:', testEmail);
      
      await page.fill('input[type="password"]', testPassword);
      console.log('   ✓ Password entered');
      
      // Check for confirm password
      const passwordFields = await page.locator('input[type="password"]').count();
      if (passwordFields > 1) {
        await page.locator('input[type="password"]').nth(1).fill(testPassword);
        console.log('   ✓ Confirm password entered');
      }
      
      // Accept terms if present
      const termsCheckbox = await page.locator('input[type="checkbox"]').first();
      if (await termsCheckbox.isVisible({ timeout: 2000 })) {
        await termsCheckbox.check();
        console.log('   ✓ Terms accepted');
      }
      
      // Submit
      const submitButton = await page.locator('button[type="submit"], button:has-text("Create Account")').first();
      await submitButton.click();
      console.log('   ✓ Registration submitted\n');
      
      // Wait for registration to complete
      console.log('6️⃣ Waiting for registration to process...');
      await page.waitForTimeout(10000);
      
      // Check if logged in
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);
      
      // Look for dashboard or account elements
      const accountElements = await page.locator('text=/Dashboard|Account|Upgrade|Coffee Tier|remaining/i').first();
      if (await accountElements.isVisible({ timeout: 5000 })) {
        console.log('   ✅ Registration successful! User logged in.\n');
        
        // Step 7: Try to upgrade to paid tier
        console.log('7️⃣ Testing upgrade to Coffee Tier...');
        
        const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
        if (await upgradeButton.isVisible({ timeout: 5000 })) {
          await upgradeButton.click();
          console.log('   ✓ Clicked upgrade button');
          
          await page.waitForTimeout(3000);
          
          // Look for Buy Me a Coffee button
          const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
          if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
            console.log('   ✓ Found "Buy Me a Coffee" button');
            await buyCoffeeButton.click();
            console.log('   ✓ Clicked Coffee Tier purchase button');
            
            await page.waitForTimeout(5000);
            
            // Check if redirected to Stripe
            if (page.url().includes('checkout.stripe.com')) {
              console.log('   ✅ Successfully redirected to Stripe Checkout!');
              console.log('   📍 Stripe URL:', page.url());
              console.log('\n✅ PAYMENT FLOW WORKING!');
              console.log('   Ready for real payment processing.');
            } else {
              console.log('   ⚠️ Not redirected to Stripe');
              console.log('   Current URL:', page.url());
            }
          } else {
            console.log('   ❌ Buy Me a Coffee button not found');
          }
        }
      } else {
        console.log('   ⚠️ Registration may have issues');
        
        // Check for errors
        const errorMsg = await page.locator('.error, .alert-error, [role="alert"]').first();
        if (await errorMsg.isVisible()) {
          const errorText = await errorMsg.textContent();
          console.log('   ❌ Error:', errorText);
        }
      }
    } else {
      console.log('   ❌ Registration form not found');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'payment-flow-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: payment-flow-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'payment-flow-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test completed. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

console.log('=====================================');
console.log('💳 AIMPACTSCANNER PAYMENT FLOW TEST');
console.log('=====================================\n');

testPaymentFlow().catch(console.error);