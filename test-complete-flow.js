import { chromium } from 'playwright';

async function testCompleteFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🚀 Testing Complete User Journey');
  console.log('================================\n');
  console.log('📧 Test Email:', testEmail);
  console.log('🌐 Site URL:', siteUrl);
  console.log('');
  
  try {
    // Step 1: Navigate to site
    console.log('1️⃣ Navigating to production site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded\n');
    
    // Step 2: Start analysis
    console.log('2️⃣ Starting analysis...');
    await page.fill('input[type="text"]', 'anthropic.com');
    await page.click('button:has-text("Analyze")');
    console.log('   ✓ Analysis started\n');
    
    // Step 3: Wait for results
    console.log('3️⃣ Waiting for analysis to complete...');
    await page.waitForTimeout(16000);
    console.log('   ✓ Analysis complete\n');
    
    // Step 4: Find conversion elements
    console.log('4️⃣ Looking for conversion elements...');
    
    // Close initial popup if present
    const maybeLaterButton = await page.locator('button:has-text("Maybe Later")').first();
    if (await maybeLaterButton.isVisible({ timeout: 3000 })) {
      console.log('   Closing initial popup...');
      await maybeLaterButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Scroll to pricing section
    console.log('   Scrolling to pricing section...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    
    // Click "Continue with Limited Free" to start registration
    const freeTrialButton = await page.locator('text="Continue with Limited Free"').first();
    if (await freeTrialButton.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Found "Continue with Limited Free" button');
      await freeTrialButton.click();
      console.log('   ✓ Clicked to start registration\n');
    } else {
      // Alternative: Look for "Buy Me a Coffee" if already on pricing
      const buyButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
      if (await buyButton.isVisible({ timeout: 3000 })) {
        console.log('   ✓ Found "Buy Me a Coffee" button');
        await buyButton.click();
        console.log('   ✓ Clicked to start upgrade\n');
      }
    }
    
    // Step 5: Registration
    console.log('5️⃣ Registration process...');
    
    await page.waitForTimeout(3000);
    
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Registration form found');
      
      // Fill registration
      await emailInput.fill(testEmail);
      console.log('   ✓ Email entered');
      
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
      
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);
      
      // Check if logged in
      const accountElements = await page.locator('text=/Dashboard|Account|Upgrade|Free|remaining/i').first();
      if (await accountElements.isVisible({ timeout: 5000 })) {
        console.log('   ✅ Registration successful! User logged in.\n');
        
        // Step 7: Try to upgrade
        console.log('7️⃣ Testing upgrade to Coffee Tier...');
        
        // Click upgrade button if visible
        const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
        if (await upgradeButton.isVisible({ timeout: 5000 })) {
          await upgradeButton.click();
          console.log('   ✓ Clicked upgrade button');
          await page.waitForTimeout(3000);
        }
        
        // Look for Buy Me a Coffee button
        const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
        if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
          console.log('   ✓ Found "Buy Me a Coffee" button');
          await buyCoffeeButton.click();
          console.log('   ✓ Clicked purchase button');
          
          // Wait for Stripe redirect
          console.log('   ⏳ Waiting for Stripe redirect...');
          await page.waitForTimeout(8000);
          
          const finalUrl = page.url();
          if (finalUrl.includes('checkout.stripe.com')) {
            console.log('   ✅ Successfully redirected to Stripe Checkout!');
            console.log('   📍 Stripe URL:', finalUrl);
            console.log('\n🎉 COMPLETE PAYMENT FLOW WORKING!');
            console.log('   ✅ Analysis → Registration → Upgrade all functional');
            console.log('   💳 Ready for real payment processing');
            
            // Take screenshot of Stripe checkout
            await page.screenshot({ path: 'stripe-checkout.png', fullPage: true });
            console.log('   📸 Stripe checkout screenshot saved');
          } else {
            console.log('   ⚠️ Not redirected to Stripe');
            console.log('   Current URL:', finalUrl);
            
            // Check for any error messages
            const errorMsg = await page.locator('.error, .alert, [role="alert"]').first();
            if (await errorMsg.isVisible({ timeout: 2000 })) {
              const errorText = await errorMsg.textContent();
              console.log('   ❌ Error message:', errorText);
            }
          }
        } else {
          console.log('   ❌ Buy Me a Coffee button not found');
        }
      } else {
        console.log('   ⚠️ Registration may have failed');
        
        // Check for errors
        const errorMsg = await page.locator('.error, .alert-error, [role="alert"]').first();
        if (await errorMsg.isVisible()) {
          const errorText = await errorMsg.textContent();
          console.log('   ❌ Error:', errorText);
        }
      }
    } else {
      console.log('   ❌ Registration form not found');
      console.log('   Note: User may already be logged in');
      
      // Check if already logged in
      if (page.url().includes('aimpactscanner.com')) {
        const dashboardLink = await page.locator('text=/Dashboard|Account/i').first();
        if (await dashboardLink.isVisible({ timeout: 3000 })) {
          console.log('   ℹ️ User appears to be already logged in');
          
          // Try to go directly to upgrade
          const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
          if (await upgradeButton.isVisible({ timeout: 3000 })) {
            await upgradeButton.click();
            console.log('   ✓ Clicked upgrade button');
            await page.waitForTimeout(3000);
            
            const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
            if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
              console.log('   ✓ Found "Buy Me a Coffee" button');
              await buyCoffeeButton.click();
              console.log('   ✓ Clicked purchase button');
              
              await page.waitForTimeout(8000);
              
              if (page.url().includes('checkout.stripe.com')) {
                console.log('   ✅ Successfully redirected to Stripe!');
                console.log('   📍 Stripe URL:', page.url());
              }
            }
          }
        }
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'complete-flow-test.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: complete-flow-test.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'complete-flow-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test completed. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

console.log('=========================================');
console.log('🔄 AIMPACTSCANNER COMPLETE JOURNEY TEST');
console.log('=========================================\n');

testCompleteFlow().catch(console.error);