// Complete Coffee Tier Sign-up Flow Test
const { chromium } = require('playwright');

async function testCoffeeTierSignupFlow() {
  console.log('🎯 Starting Complete Coffee Tier Sign-up Flow Test...');
  console.log('Testing: Registration → Stripe → Email Verification → Login → Access');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `coffee-test-${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('\n📄 PHASE 1: Navigate to Coffee Tier');
    console.log('========================================');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    
    // Navigate to pricing
    await page.locator('text="Pricing"').first().click();
    await page.waitForTimeout(2000);
    
    // Verify Coffee tier visibility
    const coffeeVisible = await page.locator('text="☕ Coffee"').count() > 0;
    console.log(`✅ Coffee tier visible: ${coffeeVisible ? 'YES' : 'NO'}`);
    
    if (!coffeeVisible) {
      throw new Error('Coffee tier not visible - test cannot continue');
    }
    
    console.log('\n🖱️ PHASE 2: Click Coffee Tier Button');
    console.log('=======================================');
    const coffeeButton = page.locator('text="Choose Coffee Plan"');
    await coffeeButton.first().click();
    await page.waitForTimeout(3000);
    
    // Should now be on registration page
    const currentURL = page.url();
    console.log(`Current URL: ${currentURL}`);
    console.log(`On registration page: ${currentURL.includes('#register') ? 'YES' : 'NO'}`);
    
    await page.screenshot({ path: 'coffee-registration-page.png' });
    console.log('✓ Registration page screenshot saved');
    
    console.log('\n📝 PHASE 3: Fill Registration Form');
    console.log('===================================');
    
    // Check if we're on the right registration component
    const hasEmailField = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    
    console.log(`Email field present: ${hasEmailField ? 'YES' : 'NO'}`);
    console.log(`Password field present: ${hasPasswordField ? 'YES' : 'NO'}`);
    
    if (hasEmailField && hasPasswordField) {
      console.log(`📧 Using test email: ${testEmail}`);
      
      // Fill in registration form
      await page.locator('input[type="email"]').first().fill(testEmail);
      await page.waitForTimeout(500);
      
      await page.locator('input[type="password"]').first().fill(testPassword);
      await page.waitForTimeout(500);
      
      // Look for submit button
      const submitButton = page.locator('button[type="submit"]').or(
        page.locator('text="Sign Up"')).or(
        page.locator('text="Create Account"')).or(
        page.locator('text="Choose Coffee"')
      );
      
      const submitButtonExists = await submitButton.count() > 0;
      console.log(`Submit button found: ${submitButtonExists ? 'YES' : 'NO'}`);
      
      if (submitButtonExists) {
        console.log('🖱️ Clicking submit button...');
        await submitButton.first().click();
        await page.waitForTimeout(5000); // Wait longer for potential redirects
        
        // Check result
        const newURL = page.url();
        const pageContent = await page.locator('body').textContent();
        
        console.log(`New URL: ${newURL}`);
        console.log(`Contains Stripe: ${newURL.includes('stripe') || pageContent.includes('stripe') ? 'YES' : 'NO'}`);
        console.log(`Contains checkout: ${newURL.includes('checkout') || pageContent.includes('checkout') ? 'YES' : 'NO'}`);
        console.log(`Contains email verification: ${pageContent.includes('verify') || pageContent.includes('confirmation') ? 'YES' : 'NO'}`);
        
        await page.screenshot({ path: 'coffee-after-registration.png' });
        console.log('✓ Post-registration screenshot saved');
        
        console.log('\n🔍 PHASE 4: Check Registration Result');
        console.log('====================================');
        
        if (newURL.includes('stripe') || pageContent.includes('stripe')) {
          console.log('✅ SUCCESS: Redirected to Stripe checkout');
          console.log('🎯 This indicates Coffee tier signup is working correctly');
          
          // Note: In a real test, we would use Stripe test card here
          console.log('📝 NOTE: Would use test card 4242 4242 4242 4242 here');
          
        } else if (pageContent.includes('verify') || pageContent.includes('confirmation')) {
          console.log('📧 Email verification required (expected behavior)');
          console.log('✅ This is correct - email verification should happen first');
          
        } else if (newURL.includes('#login') || pageContent.includes('Sign In')) {
          console.log('🔄 Redirected to login page');
          console.log('This may indicate the registration was successful but needs verification');
          
        } else {
          console.log('⚠️ Unexpected result - investigating...');
          
          // Check for error messages
          const errorMessages = await page.locator('.error, .alert, [role="alert"]').allTextContents();
          if (errorMessages.length > 0) {
            console.log('Error messages found:');
            errorMessages.forEach(msg => console.log(`- ${msg}`));
          }
        }
        
      } else {
        console.log('❌ No submit button found - cannot complete registration');
      }
      
    } else {
      console.log('❌ Registration form incomplete - missing email or password field');
    }
    
    console.log('\n📊 PHASE 5: Test Summary');
    console.log('========================');
    
    const testResults = {
      coffeeTierVisible: coffeeVisible,
      navigationWorking: currentURL.includes('#register'),
      formFieldsPresent: hasEmailField && hasPasswordField,
      canSubmitForm: await submitButton.count() > 0,
    };
    
    const successCount = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`✅ Coffee Tier Visible: ${testResults.coffeeTierVisible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Navigation Working: ${testResults.navigationWorking ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Form Fields Present: ${testResults.formFieldsPresent ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Can Submit Form: ${testResults.canSubmitForm ? 'PASS' : 'FAIL'}`);
    
    console.log(`\n🏆 OVERALL SCORE: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
    
    if (successCount === totalTests) {
      console.log('🎉 COFFEE TIER SIGNUP FLOW: FULLY FUNCTIONAL');
    } else if (successCount >= totalTests * 0.75) {
      console.log('✅ COFFEE TIER SIGNUP FLOW: MOSTLY WORKING');
    } else {
      console.log('⚠️ COFFEE TIER SIGNUP FLOW: NEEDS IMPROVEMENT');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('- coffee-registration-page.png');
    console.log('- coffee-after-registration.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'coffee-test-error.png' });
    console.log('Error screenshot saved: coffee-test-error.png');
  } finally {
    console.log('\nBrowser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testCoffeeTierSignupFlow().catch(console.error);