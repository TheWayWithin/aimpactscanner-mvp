// Manual Coffee Tier Testing Script
// Tests the Coffee tier signup flow step by step

const { chromium } = require('playwright');

async function runCoffeeTierTest() {
  console.log('🎯 Starting Coffee Tier Manual Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  
  try {
    console.log('\n📄 Step 1: Navigate to Pricing Page');
    await page.goto('http://localhost:5173/pricing');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of pricing page
    await page.screenshot({ path: 'pricing-page-test.png', fullPage: true });
    console.log('✓ Screenshot saved: pricing-page-test.png');
    
    console.log('\n☕ Step 2: Check Coffee Tier Visibility');
    
    // Check if Coffee tier card exists
    const coffeeCard = await page.locator('[data-testid="coffee-tier"]').count();
    if (coffeeCard === 0) {
      // Try alternative selectors
      const coffeeByText = await page.locator('text="☕ Coffee"').count();
      const coffeeByPrice = await page.locator('text="$4.95"').count();
      const popularBadge = await page.locator('text="Popular"').count();
      
      console.log(`Coffee card by data-testid: ${coffeeCard}`);
      console.log(`Coffee by text "☕ Coffee": ${coffeeByText}`);
      console.log(`Coffee by price "$4.95": ${coffeeByPrice}`);
      console.log(`Popular badge: ${popularBadge}`);
      
      if (coffeeByText > 0) {
        console.log('✓ Coffee tier found by text');
        await page.locator('text="☕ Coffee"').first().highlight();
        await page.waitForTimeout(2000);
      } else {
        console.log('❌ Coffee tier not found on pricing page');
        
        // Check what tiers ARE visible
        const allTierNames = await page.locator('h3').allTextContents();
        console.log('Visible tiers:', allTierNames);
      }
    }
    
    console.log('\n💰 Step 3: Test Coffee Tier Selection');
    
    // Try to find and click Coffee tier button
    const coffeeButton = page.locator('text="Buy Me a Coffee"').or(page.locator('text="Choose Coffee Plan"'));
    const coffeeButtonExists = await coffeeButton.count() > 0;
    
    if (coffeeButtonExists) {
      console.log('✓ Coffee tier button found');
      
      // Highlight the button
      await coffeeButton.first().highlight();
      await page.waitForTimeout(2000);
      
      // Click the button
      console.log('🖱️ Clicking Coffee tier button...');
      await coffeeButton.first().click();
      
      // Wait for navigation or modal
      await page.waitForTimeout(3000);
      
      // Check if we're redirected to signup or Stripe
      const currentURL = page.url();
      console.log(`Current URL after click: ${currentURL}`);
      
      if (currentURL.includes('stripe') || currentURL.includes('checkout')) {
        console.log('✅ SUCCESS: Redirected to Stripe checkout');
        await page.screenshot({ path: 'stripe-checkout-test.png' });
        console.log('✓ Stripe checkout screenshot saved');
      } else if (currentURL.includes('signup') || currentURL.includes('auth')) {
        console.log('✓ Redirected to signup page (expected for new users)');
        await page.screenshot({ path: 'signup-redirect-test.png' });
        console.log('✓ Signup redirect screenshot saved');
      } else {
        console.log('⚠️ Unexpected redirect or no redirect occurred');
        await page.screenshot({ path: 'unexpected-state-test.png' });
      }
      
    } else {
      console.log('❌ Coffee tier button not found');
      
      // Check what buttons ARE visible
      const allButtons = await page.locator('button').allTextContents();
      console.log('Visible buttons:', allButtons);
    }
    
    console.log('\n📱 Step 4: Test Mobile Responsiveness');
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'mobile-pricing-test.png', fullPage: true });
    console.log('✓ Mobile screenshot saved: mobile-pricing-test.png');
    
    // Check Coffee tier on mobile
    const mobileCoffee = await page.locator('text="☕ Coffee"').count();
    console.log(`Coffee tier visible on mobile: ${mobileCoffee > 0 ? 'YES' : 'NO'}`);
    
    console.log('\n🎯 Test Summary');
    console.log('=====================================');
    console.log('Screenshots saved for manual review:');
    console.log('- pricing-page-test.png (Desktop pricing page)');
    console.log('- mobile-pricing-test.png (Mobile pricing page)');
    
    if (coffeeButtonExists) {
      console.log('- stripe-checkout-test.png OR signup-redirect-test.png (Flow result)');
    }
    
    console.log('\n✅ Manual test completed. Please review screenshots.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-state-test.png' });
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for review
    await browser.close();
  }
}

// Run the test
runCoffeeTierTest().catch(console.error);