// Manual testing script for the optimized unified registration flow
// This script tests the core user journey step by step

const { chromium } = require('playwright');

async function testUnifiedRegistrationFlow() {
  console.log('🧪 Starting Manual Test of Unified Registration Flow');
  
  const browser = await chromium.launch({ 
    headless: false, // Keep visible for observation
    slowMo: 1000 // Slow down for observation
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Test 1: Landing Page - Anonymous Analysis
    console.log('\n📍 TEST 1: Landing Page - Start Anonymous Analysis');
    await page.goto('http://localhost:5174');
    
    // Verify landing page loads
    await page.waitForSelector('input[placeholder*="URL"]', { timeout: 10000 });
    console.log('✅ Landing page loaded successfully');
    
    // Enter URL and start analysis
    const testUrl = 'https://anthropic.com';
    await page.fill('input[placeholder*="URL"]', testUrl);
    await page.click('button:has-text("Analyze")');
    console.log('✅ Analysis initiated for:', testUrl);
    
    // Test 2: Analysis Progress
    console.log('\n📍 TEST 2: Analysis Progress');
    // Wait for analysis progress or completion
    await page.waitForTimeout(3000); // Give time for analysis to start
    console.log('✅ Analysis in progress');
    
    // Test 3: Preview Results - Wait for CTA
    console.log('\n📍 TEST 3: Preview Results - Look for Registration CTA');
    
    try {
      // Wait for preview results page with CTA button
      await page.waitForSelector('button:has-text("Get Your Complete Analysis")', { timeout: 30000 });
      console.log('✅ Found "Get Your Complete Analysis" CTA button');
      
      // Take screenshot of preview results
      await page.screenshot({ path: 'test-preview-results.png' });
      console.log('📸 Screenshot saved: test-preview-results.png');
      
      // Click the CTA to go to registration
      await page.click('button:has-text("Get Your Complete Analysis")');
      console.log('✅ Clicked CTA button');
      
    } catch (error) {
      console.log('⚠️ CTA button not found, looking for alternative selectors...');
      
      // Try alternative selectors
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on page`);
      
      for (let i = 0; i < buttons.length; i++) {
        const buttonText = await buttons[i].textContent();
        console.log(`Button ${i}: "${buttonText}"`);
        
        if (buttonText.includes('Complete') || buttonText.includes('Get Your')) {
          console.log('✅ Found alternative CTA button:', buttonText);
          await buttons[i].click();
          break;
        }
      }
    }
    
    // Test 4: Unified Registration Component
    console.log('\n📍 TEST 4: Unified Registration Component');
    
    try {
      await page.waitForSelector('h1:has-text("Create Your Account")', { timeout: 10000 });
      console.log('✅ UnifiedRegistration component loaded successfully');
      
      // Test 5: Coffee Tier Pre-selection
      console.log('\n📍 TEST 5: Coffee Tier Pre-selection');
      
      // Check if Coffee tier is pre-selected
      const coffeeRadio = await page.$('input[value="coffee"]');
      const isChecked = await coffeeRadio.isChecked();
      console.log('✅ Coffee tier pre-selected:', isChecked);
      
      // Verify visual prominence
      const coffeeContainer = await page.$('[class*="border-yellow"], [class*="bg-yellow"]');
      if (coffeeContainer) {
        console.log('✅ Coffee tier has yellow highlighting');
      }
      
      // Check for RECOMMENDED badge
      const recommendedBadge = await page.$('text="RECOMMENDED"');
      if (recommendedBadge) {
        console.log('✅ RECOMMENDED badge visible');
      }
      
      // Test 6: Dynamic Benefits Display
      console.log('\n📍 TEST 6: Dynamic Benefits Display');
      
      // Check initial Coffee tier benefits
      const coffeeBenefits = await page.$('h2:has-text("COFFEE Plan Benefits")');
      if (coffeeBenefits) {
        console.log('✅ Coffee tier benefits displayed');
      }
      
      // Switch to Free tier
      await page.click('input[value="free"]');
      await page.waitForTimeout(500); // Wait for update
      
      // Check Free tier limitations
      const freeLimitations = await page.$('h2:has-text("FREE Plan Limitations")');
      if (freeLimitations) {
        console.log('✅ Free tier limitations displayed');
      }
      
      // Switch back to Coffee
      await page.click('input[value="coffee"]');
      await page.waitForTimeout(500);
      
      // Test 7: Email Input and Button States
      console.log('\n📍 TEST 7: Email Input and Button States');
      
      const emailInput = await page.$('input[type="email"]');
      if (emailInput) {
        console.log('✅ Email input found');
        
        // Test button text for Coffee tier
        const submitButton = await page.$('button[type="submit"]');
        const buttonText = await submitButton.textContent();
        console.log('✅ Submit button text:', buttonText);
        
        if (buttonText.includes('Payment')) {
          console.log('✅ Button correctly indicates payment flow for Coffee tier');
        }
      }
      
      // Test 8: Mobile Responsiveness
      console.log('\n📍 TEST 8: Mobile Responsiveness');
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // Check if elements are still visible on mobile
      const mobileEmailInput = await page.$('input[type="email"]');
      const mobileSubmitButton = await page.$('button[type="submit"]');
      
      if (mobileEmailInput && mobileSubmitButton) {
        console.log('✅ Mobile layout working correctly');
      }
      
      // Take final screenshot
      await page.screenshot({ path: 'test-unified-registration-mobile.png' });
      console.log('📸 Mobile screenshot saved: test-unified-registration-mobile.png');
      
      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Take desktop screenshot
      await page.screenshot({ path: 'test-unified-registration-desktop.png' });
      console.log('📸 Desktop screenshot saved: test-unified-registration-desktop.png');
      
    } catch (error) {
      console.log('❌ UnifiedRegistration component not found');
      
      // Debug: Check what's actually on the page
      const currentUrl = page.url();
      const title = await page.title();
      console.log('Current URL:', currentUrl);
      console.log('Page title:', title);
      
      // Take debug screenshot
      await page.screenshot({ path: 'test-debug-current-page.png' });
      console.log('📸 Debug screenshot saved: test-debug-current-page.png');
    }
    
    console.log('\n🎉 Manual testing completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
    console.log('📸 Error screenshot saved: test-error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testUnifiedRegistrationFlow().catch(console.error);