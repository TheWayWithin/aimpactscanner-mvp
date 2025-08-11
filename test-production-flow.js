import { chromium } from 'playwright';

async function testProductionFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🚀 Testing production site:', siteUrl);
  
  try {
    // Step 1: Navigate to production site
    console.log('\n1️⃣ Navigating to production site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded');
    
    // Step 2: Start analysis
    console.log('\n2️⃣ Starting analysis...');
    const urlInput = await page.locator('input[type="text"], input[type="url"]').first();
    await urlInput.fill('example.com');
    console.log('   ✓ URL entered: example.com');
    
    const analyzeButton = await page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();
    console.log('   ✓ Analysis started');
    
    // Step 3: Wait for analysis to complete
    console.log('\n3️⃣ Waiting for analysis to complete (15 seconds)...');
    await page.waitForTimeout(16000);
    
    // Take screenshot of results page
    await page.screenshot({ path: 'production-results.png' });
    console.log('   ✓ Results page screenshot saved');
    
    // Step 4: Look for any interactive elements
    console.log('\n4️⃣ Looking for interactive elements...');
    
    // Check for popup
    const popup = await page.locator('text="Your Score Needs Immediate Attention"').isVisible();
    console.log('   Popup visible:', popup);
    
    if (popup) {
      // Click "Start Recovering Traffic" if visible
      const startButton = await page.locator('button:has-text("Start Recovering Traffic")').first();
      if (await startButton.isVisible()) {
        console.log('   ✓ Clicking "Start Recovering Traffic"...');
        await startButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Check for tier selection modal
    const tierModal = await page.locator('text="Confirm Your Selection"').isVisible();
    console.log('   Tier selection modal visible:', tierModal);
    
    if (tierModal) {
      // Look for free trial link
      const freeTrialLink = await page.locator('a:has-text("free trial")').first();
      if (await freeTrialLink.isVisible()) {
        console.log('   ✓ Clicking free trial link...');
        await freeTrialLink.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Step 5: Check for auth form
    console.log('\n5️⃣ Checking for authentication form...');
    const emailInput = await page.locator('input[type="email"]').isVisible();
    
    if (emailInput) {
      console.log('   ✅ Auth form found! Filling registration...');
      
      // Fill email
      await page.fill('input[type="email"]', testEmail);
      console.log('   ✓ Email:', testEmail);
      
      // Fill password
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
      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
        console.log('   ✓ Terms accepted');
      }
      
      // Submit form
      console.log('\n6️⃣ Submitting registration...');
      const submitButton = await page.locator('button[type="submit"], button:has-text("Create Account")').first();
      await submitButton.click();
      
      // Wait for registration to complete
      console.log('   ⏳ Waiting for registration to complete...');
      await page.waitForTimeout(10000);
      
      // Check final state
      console.log('\n7️⃣ Checking registration result...');
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);
      
      // Check for success indicators
      const dashboard = await page.locator('text=/Dashboard|Welcome|Account|Coffee Tier|remaining/i').first().isVisible();
      if (dashboard) {
        console.log('   ✅ Registration successful!');
        
        // Look for upgrade options
        console.log('\n8️⃣ Looking for upgrade to paid tier...');
        const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
        if (await upgradeButton.isVisible()) {
          console.log('   ✓ Upgrade button found, clicking...');
          await upgradeButton.click();
          await page.waitForTimeout(3000);
          
          // Look for Coffee Tier
          const coffeeTier = await page.locator('button:has-text("Coffee"), button:has-text("$5")').first();
          if (await coffeeTier.isVisible()) {
            console.log('   ✓ Coffee Tier found, clicking...');
            await coffeeTier.click();
            await page.waitForTimeout(5000);
            
            // Check if redirected to Stripe
            if (page.url().includes('checkout.stripe.com')) {
              console.log('   ✅ Successfully redirected to Stripe Checkout!');
              console.log('   📍 URL:', page.url());
            }
          }
        }
      } else {
        // Check for errors
        const errorMsg = await page.locator('.error, .alert-error, [role="alert"]').first();
        if (await errorMsg.isVisible()) {
          const errorText = await errorMsg.textContent();
          console.log('   ❌ Error:', errorText);
        }
      }
    } else {
      console.log('   ❌ No auth form found');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'production-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved as production-final.png');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'production-error.png', fullPage: true });
  }
  
  console.log('\n✅ Test completed. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testProductionFlow().catch(console.error);