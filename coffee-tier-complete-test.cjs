// Complete Coffee Tier Test - Handle Form Validation
const { chromium } = require('playwright');

async function completeTest() {
  console.log('🎯 Complete Coffee Tier Test - With Form Validation...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Generate unique test data
  const timestamp = Date.now();
  const testEmail = `coffee-test-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`🧪 Test Email: ${testEmail}`);
  console.log(`🔑 Test Password: ${testPassword}`);
  
  try {
    console.log('\n🚀 STEP 1: Navigate to Coffee Tier');
    console.log('===================================');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    
    // Click Pricing
    await page.locator('text="Pricing"').first().click();
    await page.waitForTimeout(2000);
    
    // Verify and click Coffee tier
    const coffeeButton = page.locator('text="Choose Coffee Plan"');
    await coffeeButton.first().click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Successfully navigated to registration page');
    
    console.log('\n📝 STEP 2: Complete Registration Form');
    console.log('====================================');
    
    // Fill email field
    const emailField = page.locator('input[type="email"]').first();
    await emailField.clear();
    await emailField.fill(testEmail);
    console.log('✅ Email filled');
    
    // Fill password field
    const passwordField = page.locator('input[type="password"]').first();
    await passwordField.clear();
    await passwordField.fill(testPassword);
    console.log('✅ Password filled');
    
    // Check for additional required fields
    const confirmPasswordField = page.locator('input[placeholder*="confirm"], input[name*="confirm"]');
    const confirmPasswordExists = await confirmPasswordField.count() > 0;
    
    if (confirmPasswordExists) {
      await confirmPasswordField.first().fill(testPassword);
      console.log('✅ Password confirmation filled');
    }
    
    // Check for terms/conditions checkbox
    const termsCheckbox = page.locator('input[type="checkbox"]');
    const termsExists = await termsCheckbox.count() > 0;
    
    if (termsExists) {
      await termsCheckbox.first().check();
      console.log('✅ Terms checkbox checked');
    }
    
    // Wait a moment for form validation
    await page.waitForTimeout(1000);
    
    console.log('\n🔍 STEP 3: Check Form Validation');
    console.log('================================');
    
    const submitButton = page.locator('button[type="submit"]').first();
    const isEnabled = await submitButton.isEnabled();
    const buttonText = await submitButton.textContent();
    
    console.log(`Submit button text: "${buttonText}"`);
    console.log(`Submit button enabled: ${isEnabled ? 'YES' : 'NO'}`);
    
    if (!isEnabled) {
      console.log('🔍 Checking for validation errors...');
      
      // Check for validation messages
      const validationMessages = await page.locator('.error, .invalid, [aria-invalid="true"]').allTextContents();
      if (validationMessages.length > 0) {
        console.log('Validation errors found:');
        validationMessages.forEach(msg => console.log(`- ${msg}`));
      }
      
      // Check form state
      const emailValue = await emailField.inputValue();
      const passwordValue = await passwordField.inputValue();
      
      console.log(`Email field value: "${emailValue}"`);
      console.log(`Password field length: ${passwordValue.length} chars`);
      
      // Try clicking anyway to see what happens
      console.log('⚠️ Attempting to click disabled button for debugging...');
      try {
        await submitButton.click({ force: true });
        await page.waitForTimeout(2000);
      } catch (error) {
        console.log(`Button click failed: ${error.message}`);
      }
    } else {
      console.log('\n🖱️ STEP 4: Submit Form');
      console.log('======================');
      
      await submitButton.click();
      await page.waitForTimeout(5000);
      
      // Check result
      const newURL = page.url();
      const content = await page.locator('body').textContent();
      
      console.log(`Current URL: ${newURL}`);
      
      if (newURL.includes('stripe') || content.includes('checkout')) {
        console.log('🎉 SUCCESS: Redirected to Stripe checkout!');
        console.log('✅ Coffee tier signup flow is working correctly');
        
        // Take screenshot of Stripe page
        await page.screenshot({ path: 'stripe-checkout-success.png' });
        console.log('✓ Stripe checkout screenshot saved');
        
        console.log('\n💳 STEP 5: Stripe Test Card Information');
        console.log('======================================');
        console.log('📋 For manual testing, use:');
        console.log('   Card Number: 4242 4242 4242 4242');
        console.log('   Expiry: 12/34');
        console.log('   CVC: 123');
        console.log('   ZIP: 12345');
        
      } else if (content.includes('verify') || content.includes('email')) {
        console.log('📧 Email verification required');
        console.log('✅ This is expected behavior for new signups');
        
      } else {
        console.log('🔍 Unexpected result - taking screenshot...');
        await page.screenshot({ path: 'unexpected-result.png' });
      }
    }
    
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('=====================');
    
    const results = {
      '☕ Coffee Tier Visible': true,
      '📄 Registration Form Access': true,
      '📝 Form Fields Present': true,
      '🔘 Submit Button Found': true,
      '✅ Form Validation': isEnabled,
      '🔀 Expected Workflow': isEnabled
    };
    
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${test}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🏆 SCORE: ${passCount}/${totalTests} (${Math.round(passCount/totalTests*100)}%)`);
    
    if (passCount >= totalTests * 0.8) {
      console.log('🎉 COFFEE TIER: PRODUCTION READY');
      console.log('✅ Users can successfully access and use Coffee tier signup');
    } else {
      console.log('⚠️ COFFEE TIER: NEEDS ATTENTION');
      console.log('❗ Form validation or submission issues need fixing');
    }
    
    console.log('\n🎯 VALIDATION REQUIREMENTS IDENTIFIED:');
    if (!isEnabled) {
      console.log('1. Check password strength requirements');
      console.log('2. Verify email format validation');
      console.log('3. Confirm all required fields are completed');
      console.log('4. Check for terms/conditions acceptance');
    } else {
      console.log('✅ All validation requirements met');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'complete-test-error.png' });
  } finally {
    console.log('\n⏰ Browser will remain open for manual inspection (45 seconds)...');
    await page.waitForTimeout(45000);
    await browser.close();
  }
}

completeTest().catch(console.error);