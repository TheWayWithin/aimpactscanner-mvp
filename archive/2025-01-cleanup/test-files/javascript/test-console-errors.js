import { chromium } from 'playwright';

async function captureConsoleErrors() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();
  
  const errors = [];
  const logs = [];
  
  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log('❌ ERROR:', text);
      errors.push(text);
    } else if (type === 'warning') {
      console.log('⚠️  WARNING:', text);
    } else {
      logs.push(text);
      // Look for specific logs
      if (text.includes('upgrade') || text.includes('Upgrade') || 
          text.includes('stripe') || text.includes('Stripe') ||
          text.includes('checkout') || text.includes('price') ||
          text.includes('error') || text.includes('Error')) {
        console.log('📝 LOG:', text);
      }
    }
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    console.log('❌ REQUEST FAILED:', request.url());
    console.log('   Reason:', request.failure().errorText);
  });
  
  // Capture error responses
  page.on('response', response => {
    if (response.status() >= 400) {
      response.text().then(body => {
        console.log(`❌ HTTP ${response.status()} from:`, response.url());
        if (body && body.length < 500) {
          console.log('   Response:', body);
        }
      }).catch(() => {});
    }
  });
  
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🔍 Capturing Console Errors During Checkout');
  console.log('==========================================\n');
  
  try {
    // Navigate to site
    console.log('1️⃣ Navigating to site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded\n');
    
    // Sign in
    console.log('2️⃣ Signing in...');
    const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible({ timeout: 3000 })) {
      await signInButton.click();
      
      const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
      const testPassword = 'TestPassword123!';
      
      await page.waitForTimeout(2000);
      
      const emailInput = await page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
        await submitButton.click();
        console.log('   ✓ Logged in\n');
        
        await page.waitForTimeout(5000);
      }
    }
    
    // Get user info from localStorage
    console.log('3️⃣ Checking user session...');
    const sessionInfo = await page.evaluate(() => {
      const session = localStorage.getItem('sb-pdmtvkcxnqysujnpcnyh-auth-token');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          return {
            hasUser: !!parsed.user,
            userId: parsed.user?.id,
            email: parsed.user?.email
          };
        } catch (e) {
          return { error: 'Could not parse session' };
        }
      }
      return { error: 'No session found' };
    });
    
    console.log('   Session info:', sessionInfo);
    console.log('');
    
    // Navigate to upgrade
    console.log('4️⃣ Attempting upgrade...');
    const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      await upgradeButton.click();
      console.log('   ✓ Clicked Upgrade');
      
      await page.waitForTimeout(3000);
      
      // Find and click Buy Me a Coffee
      const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
      if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Found Buy Me a Coffee button');
        
        // Clear console to see only the checkout errors
        console.log('\n========== MONITORING CHECKOUT ATTEMPT ==========\n');
        
        await buyCoffeeButton.click();
        console.log('   ✓ Clicked Buy Me a Coffee\n');
        
        // Wait and watch for errors
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(1000);
          
          const currentUrl = page.url();
          if (currentUrl.includes('checkout.stripe.com')) {
            console.log('\n   ✅ SUCCESSFULLY REDIRECTED TO STRIPE!');
            console.log('   📍 URL:', currentUrl);
            break;
          }
          
          if (i === 9) {
            console.log('\n   ❌ No redirect after 10 seconds');
            console.log('   Current URL:', currentUrl);
            
            // Check for visible error messages
            const errorElement = await page.locator('.error, .alert, [role="alert"], .text-red-500').first();
            if (await errorElement.isVisible({ timeout: 100 })) {
              const errorText = await errorElement.textContent();
              if (errorText && errorText.trim()) {
                console.log('   UI Error:', errorText);
              }
            }
          }
        }
        
        console.log('\n========== CONSOLE ERRORS SUMMARY ==========');
        if (errors.length > 0) {
          errors.forEach((err, i) => {
            console.log(`${i + 1}. ${err}`);
          });
        } else {
          console.log('No console errors detected');
        }
      }
    }
    
    await page.screenshot({ path: 'console-errors.png', fullPage: true });
    console.log('\n📸 Screenshot saved: console-errors.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  }
  
  console.log('\n✅ Monitoring complete. Check the output above for errors.');
  console.log('Browser will remain open for manual inspection...');
  console.log('Press Ctrl+C to exit when done.\n');
  
  await page.waitForTimeout(300000);
}

console.log('==========================================');
console.log('🔍 CONSOLE ERROR CAPTURE TEST');
console.log('==========================================\n');

captureConsoleErrors().catch(console.error);