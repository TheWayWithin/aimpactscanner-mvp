import { chromium } from 'playwright';

async function testDirectAuth() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  
  console.log('1. Going directly to auth page...');
  await page.goto('http://localhost:5173');
  
  // First, try to find any login/signup link in the header
  console.log('2. Looking for login/signup link...');
  await page.waitForTimeout(2000);
  
  // Check if there's a login link in the header
  const loginLink = await page.locator('a:has-text("Login"), a:has-text("Sign In"), a:has-text("Sign Up"), button:has-text("Login"), button:has-text("Sign Up")').first();
  
  if (await loginLink.isVisible()) {
    console.log('   Found login/signup link, clicking...');
    await loginLink.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('   No login link found in header');
    
    // Try to navigate to pricing page
    console.log('3. Looking for pricing link...');
    const pricingLink = await page.locator('a:has-text("Pricing"), button:has-text("Pricing"), a:has-text("Plans")').first();
    
    if (await pricingLink.isVisible()) {
      console.log('   Found pricing link, clicking...');
      await pricingLink.click();
      await page.waitForTimeout(2000);
    }
  }
  
  // Now check if we have an auth form
  console.log('4. Checking for auth form...');
  const emailInput = await page.locator('input[type="email"]').isVisible();
  
  if (emailInput) {
    console.log('   ✅ Auth form found!');
    console.log('5. Filling registration form...');
    
    await page.fill('input[type="email"]', testEmail);
    console.log('   Email entered:', testEmail);
    
    await page.fill('input[type="password"]', testPassword);
    console.log('   Password entered');
    
    // Check for confirm password field
    const passwordFields = await page.locator('input[type="password"]').count();
    if (passwordFields > 1) {
      console.log('   Confirm password field detected');
      await page.locator('input[type="password"]').nth(1).fill(testPassword);
      console.log('   Confirm password entered');
    }
    
    // Check for terms checkbox
    const termsCheckbox = await page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
      console.log('   Terms accepted');
    }
    
    // Find and click submit button
    console.log('6. Submitting form...');
    const submitButton = await page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Sign Up")').first();
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      console.log('   Form submitted');
      
      // Wait for response
      console.log('7. Waiting for registration to complete...');
      await page.waitForTimeout(10000);
      
      // Check final state
      console.log('8. Final URL:', page.url());
      
      // Check for success indicators
      const dashboard = await page.locator('text=/Dashboard|Welcome|Account|remaining/i').first().isVisible();
      if (dashboard) {
        console.log('   ✅ Registration successful! User logged in.');
      }
      
      // Check for error messages
      const errorMsg = await page.locator('.error, .alert-error, [role="alert"], text=/error|failed/i').first();
      if (await errorMsg.isVisible()) {
        const errorText = await errorMsg.textContent();
        console.log('   ❌ Error message:', errorText);
      }
    }
  } else {
    console.log('   ❌ No auth form found');
    console.log('   Current URL:', page.url());
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'auth-test-result.png', fullPage: true });
  console.log('Screenshot saved as auth-test-result.png');
  
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('Test completed.');
}

testDirectAuth().catch(console.error);