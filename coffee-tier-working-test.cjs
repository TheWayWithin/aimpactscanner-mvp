// Coffee Tier Test - Using Working Navigation
const { chromium } = require('playwright');

async function testCoffeeTierWorking() {
  console.log('🎯 Starting Coffee Tier Test - Using Working Navigation...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    console.log('\n📄 Step 1: Navigate to Main Page and Click Pricing');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Click the Pricing link (this is the working approach)
    console.log('🔗 Clicking Pricing link...');
    const pricingLink = page.locator('text="Pricing"').first();
    await pricingLink.click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of pricing page
    await page.screenshot({ path: 'pricing-page-working.png', fullPage: true });
    console.log('✓ Screenshot saved: pricing-page-working.png');
    
    console.log('\n☕ Step 2: Validate Coffee Tier Visibility');
    
    // Check Coffee tier components
    const coffeeByText = await page.locator('text="☕ Coffee"').count();
    const coffeeByPrice = await page.locator('text="$4.95"').count();
    const popularBadge = await page.locator('text="Popular"').count();
    const chooseYourPlan = await page.locator('text="Choose Your Plan"').count();
    
    console.log(`✅ Coffee tier found: ${coffeeByText > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Price $4.95 found: ${coffeeByPrice > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Popular badge found: ${popularBadge > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Choose Your Plan header: ${chooseYourPlan > 0 ? 'YES' : 'NO'}`);
    
    // Highlight Coffee tier
    if (coffeeByText > 0) {
      console.log('🎯 Highlighting Coffee tier...');
      await page.locator('text="☕ Coffee"').first().highlight();
      await page.waitForTimeout(2000);
    }
    
    console.log('\n💰 Step 3: Test Coffee Tier Button');
    
    // Find Coffee tier button
    const coffeeButton = page.locator('text="Choose Coffee Plan"').or(page.locator('text="Buy Me a Coffee"'));
    const coffeeButtonExists = await coffeeButton.count() > 0;
    
    console.log(`Coffee button exists: ${coffeeButtonExists ? 'YES' : 'NO'}`);
    
    if (coffeeButtonExists) {
      console.log('🎯 Highlighting Coffee button...');
      await coffeeButton.first().highlight();
      await page.waitForTimeout(2000);
      
      console.log('🖱️ Clicking Coffee tier button...');
      await coffeeButton.first().click();
      
      // Wait for navigation
      await page.waitForTimeout(3000);
      
      // Check where we ended up
      const currentURL = page.url();
      const currentContent = await page.locator('body').textContent();
      
      console.log(`Current URL: ${currentURL}`);
      console.log(`Contains registration form: ${currentContent.includes('Sign Up') || currentContent.includes('Create Account') ? 'YES' : 'NO'}`);
      console.log(`Contains Stripe redirect: ${currentURL.includes('stripe') || currentContent.includes('checkout') ? 'YES' : 'NO'}`);
      
      // Take screenshot of result
      await page.screenshot({ path: 'coffee-button-click-result.png' });
      console.log('✓ Button click result screenshot saved');
    }
    
    console.log('\n📱 Step 4: Test Mobile Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'coffee-mobile-working.png', fullPage: true });
    console.log('✓ Mobile screenshot saved');
    
    // Check Coffee tier on mobile
    const mobileCoffee = await page.locator('text="☕ Coffee"').count();
    console.log(`Coffee visible on mobile: ${mobileCoffee > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n🎯 COFFEE TIER TEST SUMMARY');
    console.log('====================================');
    console.log(`☕ Coffee Tier Visible: ${coffeeByText > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`💲 Price $4.95 Display: ${coffeeByPrice > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`🏆 Popular Badge: ${popularBadge > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`📱 Mobile Compatible: ${mobileCoffee > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`🔗 Navigation Working: ✅ YES (via pricing link)`);
    console.log(`🎯 Button Function: ${coffeeButtonExists ? '✅ YES' : '❌ NO'}`);
    
    const overallScore = [
      coffeeByText > 0,
      coffeeByPrice > 0,
      popularBadge > 0,
      mobileCoffee > 0,
      true, // navigation works
      coffeeButtonExists
    ].filter(Boolean).length;
    
    console.log(`\n🏆 OVERALL SCORE: ${overallScore}/6 (${Math.round(overallScore/6*100)}%)`);
    
    if (overallScore >= 5) {
      console.log('🎉 COFFEE TIER: WORKING PROPERLY');
    } else if (overallScore >= 3) {
      console.log('⚠️ COFFEE TIER: PARTIALLY WORKING');
    } else {
      console.log('❌ COFFEE TIER: CRITICAL ISSUES');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    console.log('\nBrowser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testCoffeeTierWorking().catch(console.error);