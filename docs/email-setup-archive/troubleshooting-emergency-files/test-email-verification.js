// Playwright test to verify email auto-confirmation issue
const { chromium } = require('playwright');

async function testEmailVerification() {
  console.log('🚀 Starting email verification test...\n');
  
  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@tempmail.org`;
  const testPassword = 'TestPass123!@#';
  
  console.log(`📧 Test email: ${testEmail}`);
  console.log(`🔑 Test password: ${testPassword}\n`);
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('DEBUG')) {
      console.log('🔍 Page Console:', msg.text());
    }
  });
  
  try {
    // Step 1: Navigate to the app
    console.log('📍 Step 1: Navigating to AImpactScanner...');
    await page.goto('https://aimpactscanner.com');
    await page.waitForTimeout(2000);
    
    // Step 2: Click "Get Started" or sign up button
    console.log('📍 Step 2: Looking for signup option...');
    
    // Try to find and click signup button
    const signupButton = await page.locator('button:has-text("Get Started"), button:has-text("Sign Up"), a:has-text("Get Started")').first();
    if (await signupButton.isVisible()) {
      await signupButton.click();
      console.log('✅ Clicked signup button');
    }
    
    await page.waitForTimeout(2000);
    
    // Step 3: Fill registration form
    console.log('📍 Step 3: Filling registration form...');
    
    // Fill email field
    await page.fill('input[type="email"]', testEmail);
    console.log('✅ Entered email');
    
    // Fill password fields
    const passwordFields = await page.locator('input[type="password"]').all();
    for (const field of passwordFields) {
      await field.fill(testPassword);
    }
    console.log('✅ Entered password');
    
    // Select free tier if there's an option
    const freeTierButton = await page.locator('text=/free/i').first();
    if (await freeTierButton.isVisible()) {
      await freeTierButton.click();
      console.log('✅ Selected free tier');
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: 'before-signup.png' });
    console.log('📸 Screenshot saved: before-signup.png\n');
    
    // Step 4: Submit registration
    console.log('📍 Step 4: Submitting registration...');
    const submitTime = new Date();
    
    // Click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")').first();
    await submitButton.click();
    console.log(`⏱️ Submitted at: ${submitTime.toISOString()}`);
    
    // Step 5: Wait and observe what happens
    console.log('\n📍 Step 5: Monitoring post-signup behavior...');
    
    // Wait for navigation or message
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'after-signup.png' });
    console.log('📸 Screenshot saved: after-signup.png\n');
    
    // Step 6: Check database for confirmation status
    console.log('📍 Step 6: Checking user confirmation status...');
    console.log('⏳ Waiting 5 seconds before checking database...');
    await page.waitForTimeout(5000);
    
    // Step 7: Try to login immediately (should fail if email verification is required)
    console.log('\n📍 Step 7: Testing immediate login (should fail if email verification works)...');
    
    // Navigate to login if not already there
    if (!currentUrl.includes('login')) {
      await page.goto('https://aimpactscanner.com/login');
      await page.waitForTimeout(2000);
    }
    
    // Try to login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    const loginButton = await page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      console.log('✅ Attempted login');
      
      await page.waitForTimeout(3000);
      
      // Check if login succeeded
      const afterLoginUrl = page.url();
      if (afterLoginUrl.includes('dashboard') || afterLoginUrl.includes('account')) {
        console.log('🚨 LOGIN SUCCEEDED WITHOUT EMAIL VERIFICATION!');
        console.log('❌ This confirms email auto-confirmation is enabled');
      } else {
        console.log('✅ Login blocked - email verification appears to be working');
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final-state.png' });
    console.log('📸 Screenshot saved: final-state.png\n');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'error-state.png' });
  }
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Email tested: ${testEmail}`);
  console.log('Check the screenshots to see the actual behavior');
  console.log('\nTo verify in database, run this SQL query:');
  console.log(`SELECT email, created_at, email_confirmed_at, 
    EXTRACT(EPOCH FROM (email_confirmed_at - created_at)) as seconds_to_confirm
FROM auth.users 
WHERE email = '${testEmail}';`);
  
  console.log('\n🔄 Keeping browser open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);
  
  await browser.close();
  console.log('✅ Test complete');
}

// Run the test
testEmailVerification().catch(console.error);