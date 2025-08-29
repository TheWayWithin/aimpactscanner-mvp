import { chromium } from 'playwright';

async function testPricingPage() {
  try {
    console.log('🔍 TESTING PRICING PAGE COMING SOON FUNCTIONALITY');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Navigate to the app
    console.log('📍 Navigating to localhost:5176...');
    await page.goto('http://localhost:5176');
    await page.waitForTimeout(3000);
    
    // Look for the main navigation or sign in to get to proper pricing page
    console.log('🔍 Looking for authentication...');
    
    // First try to sign in with a test account to get past registration flow
    try {
      const signInButton = await page.$('text="Sign In"');
      if (signInButton) {
        console.log('📍 Found Sign In button, clicking...');
        await signInButton.click();
        await page.waitForTimeout(1000);
        
        // Look for email input
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
          await emailInput.fill('test@example.com');
          const signInBtn = await page.$('button:has-text("Send Magic Link")');
          if (signInBtn) {
            console.log('📧 Would send magic link (skipping actual send)');
          }
        }
      }
    } catch (e) {
      console.log('⚠️ Could not find sign in flow, continuing...');
    }
    
    // Try to navigate directly to pricing
    console.log('📍 Navigating directly to pricing...');
    await page.goto('http://localhost:5176/#pricing');
    await page.waitForTimeout(2000);
    
    // Alternative: Try to find pricing navigation
    try {
      const pricingNav = await page.$('text="Pricing"');
      if (pricingNav) {
        await pricingNav.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('⚠️ No pricing nav found');
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: 'pricing-test-current.png', fullPage: true });
    console.log('📸 Current state screenshot saved');
    
    // Look for tier cards
    console.log('🔍 Looking for tier cards...');
    
    const tierCards = await page.$$('[class*="rounded-lg border-2"]');
    console.log(`Found ${tierCards.length} tier cards`);
    
    if (tierCards.length === 0) {
      // Try different selectors
      const altCards = await page.$$('div:has(h3)');
      console.log(`Found ${altCards.length} potential tier cards with alternative selector`);
    }
    
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
        
        // Check if this is in registration flow
        const isRegistrationFlow = buttonText.includes('Choose') && !buttonText.includes('Coming Soon');
        
        tiers.push({
          index: i,
          name,
          price,
          buttonText: buttonText.trim(),
          isDisabled,
          opacity,
          isRegistrationFlow
        });
      } catch (e) {
        console.log(`Error reading tier ${i}:`, e.message);
      }
    }
    
    console.log('\n📊 TIER ANALYSIS:');
    let inRegistrationFlow = false;
    
    tiers.forEach(tier => {
      console.log(`\n${tier.name}:`);
      console.log(`  Price: ${tier.price}`);
      console.log(`  Button: "${tier.buttonText}"`);
      console.log(`  Disabled: ${tier.isDisabled}`);
      console.log(`  Opacity: ${tier.opacity}`);
      console.log(`  Registration Flow: ${tier.isRegistrationFlow}`);
      
      if (tier.isRegistrationFlow) {
        inRegistrationFlow = true;
      }
      
      // Check Coming Soon criteria
      if (tier.name.includes('Growth') || tier.name.includes('Scale')) {
        console.log(`  🧪 COMING SOON CHECK:`);
        const isComingSoon = tier.buttonText.includes('Coming Soon');
        const isProperlyDisabled = tier.isDisabled && isComingSoon;
        const hasReducedOpacity = tier.opacity < 1.0;
        
        console.log(`    Button shows "Coming Soon": ${isComingSoon ? '✅' : '❌'}`);
        console.log(`    Button is disabled: ${tier.isDisabled ? '✅' : '❌'}`);
        console.log(`    Opacity is reduced: ${hasReducedOpacity ? '✅' : '❌'}`);
        console.log(`    Overall Coming Soon Status: ${isProperlyDisabled && hasReducedOpacity ? '✅ CORRECT' : '❌ BROKEN'}`);
      }
    });
    
    // Overall assessment
    console.log('\n📋 OVERALL ASSESSMENT:');
    if (inRegistrationFlow) {
      console.log('❌ ISSUE: App is showing REGISTRATION FLOW instead of PRICING PAGE');
      console.log('   This means showRegistrationFlow=true is being passed to TierSelection');
      console.log('   Coming Soon tiers will show "Choose X" instead of being disabled');
      console.log('   This is a critical bug - users can select Coming Soon tiers!');
    } else {
      console.log('✅ App is showing proper PRICING PAGE');
      console.log('   Coming Soon tiers should be properly disabled');
    }
    
    // Test clicking on Coming Soon buttons
    console.log('\n🧪 TESTING BUTTON CLICKS:');
    
    for (let i = 0; i < tierCards.length; i++) {
      const card = tierCards[i];
      const tier = tiers[i];
      
      if (tier.name.includes('Growth') || tier.name.includes('Scale')) {
        console.log(`\n🖱️ Testing click on ${tier.name}...`);
        
        try {
          const button = await card.$('button');
          if (button) {
            // Check if button should be clickable
            if (tier.buttonText.includes('Coming Soon')) {
              // Should be disabled
              try {
                await button.click({ timeout: 500 });
                console.log(`   ❌ CRITICAL: Button was clickable but should be disabled!`);
              } catch (e) {
                console.log(`   ✅ Button properly disabled - click blocked`);
              }
            } else if (tier.isRegistrationFlow) {
              console.log(`   ⚠️  Button is clickable (registration flow) - this needs fixing`);
              // Don't actually click to avoid triggering payment flow
            }
          }
        } catch (e) {
          console.log(`   ℹ️  Could not test button click: ${e.message}`);
        }
      }
    }
    
    await page.screenshot({ path: 'pricing-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    await browser.close();
    console.log('\n✅ PRICING PAGE TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPricingPage();