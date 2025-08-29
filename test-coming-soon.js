import { chromium } from 'playwright';

async function testComingSoon() {
  try {
    console.log('🔍 TESTING COMING SOON FUNCTIONALITY');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('📍 Navigating to localhost:5175...');
    await page.goto('http://localhost:5175');
    await page.waitForTimeout(3000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-1-initial.png' });
    console.log('📸 Initial screenshot saved');
    
    // Look for pricing content or navigation
    let onPricingPage = false;
    try {
      // Check if we're already on a pricing page
      const pricingContent = await page.$('text="Choose Your Plan"');
      if (pricingContent) {
        onPricingPage = true;
        console.log('✅ Already on pricing page');
      } else {
        // Try to navigate to pricing
        const pricingLink = await page.$('text="Pricing"');
        if (pricingLink) {
          await pricingLink.click();
          await page.waitForTimeout(2000);
          onPricingPage = true;
          console.log('✅ Navigated to pricing page');
        }
      }
    } catch (e) {
      console.log('⚠️ Could not find pricing navigation');
    }
    
    // Take screenshot after navigation
    await page.screenshot({ path: 'test-2-pricing.png' });
    console.log('📸 Pricing page screenshot saved');
    
    // Look for tier cards
    console.log('🔍 Looking for tier cards...');
    
    const tierCards = await page.$$('[class*="rounded-lg border-2"]');
    console.log(`Found ${tierCards.length} tier cards`);
    
    const tiers = [];
    for (let i = 0; i < tierCards.length; i++) {
      try {
        const card = tierCards[i];
        const name = await card.$eval('h3', el => el.textContent.trim()).catch(() => 'Unknown');
        const price = await card.$eval('[class*="text-4xl"]', el => el.textContent.trim()).catch(() => 'Unknown');
        const button = await card.$('button');
        const buttonText = button ? await button.textContent() : 'No button';
        const isDisabled = button ? await button.getAttribute('disabled') !== null : false;
        const opacity = await page.evaluate(el => window.getComputedStyle(el).opacity, card);
        
        tiers.push({
          index: i,
          name,
          price,
          buttonText: buttonText.trim(),
          isDisabled,
          opacity
        });
      } catch (e) {
        console.log(`Error reading tier ${i}:`, e.message);
      }
    }
    
    console.log('\n📊 TIER ANALYSIS:');
    tiers.forEach(tier => {
      console.log(`\n${tier.name}:`);
      console.log(`  Price: ${tier.price}`);
      console.log(`  Button: "${tier.buttonText}"`);
      console.log(`  Disabled: ${tier.isDisabled}`);
      console.log(`  Opacity: ${tier.opacity}`);
      
      // Check Coming Soon criteria
      if (tier.name.includes('Growth') || tier.name.includes('Scale')) {
        console.log(`  🧪 COMING SOON CHECK:`);
        console.log(`    ✅ Button text contains "Coming Soon": ${tier.buttonText.includes('Coming Soon')}`);
        console.log(`    ✅ Button is disabled: ${tier.isDisabled}`);
        console.log(`    ✅ Opacity is reduced: ${tier.opacity < 1.0}`);
      }
    });
    
    // Test clicking on Coming Soon buttons
    console.log('\n🧪 TESTING BUTTON CLICKS:');
    
    for (let i = 0; i < tierCards.length; i++) {
      const card = tierCards[i];
      const tier = tiers[i];
      
      if (tier.buttonText.includes('Coming Soon')) {
        console.log(`\n🖱️ Testing click on ${tier.name} (Coming Soon)...`);
        
        try {
          const button = await card.$('button');
          if (button) {
            // Try to click the disabled button
            await button.click({ timeout: 1000 });
            console.log(`   ❌ Button was clickable (should be disabled!)`);
          }
        } catch (e) {
          console.log(`   ✅ Button properly disabled - click blocked`);
        }
      }
    }
    
    await page.screenshot({ path: 'test-3-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    await browser.close();
    console.log('\n✅ TESTING COMPLETE');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testComingSoon();