import { chromium } from 'playwright';

async function checkEnvironmentVariables() {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('VITE_') || text.includes('price_') || text.includes('pk_')) {
      console.log('🔍 Environment Variable Log:', text);
    }
  });
  
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🔍 Checking Environment Variables in Production');
  console.log('==============================================\n');
  
  try {
    // Navigate to site
    console.log('1️⃣ Navigating to site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    
    // Execute script to check environment variables
    console.log('2️⃣ Checking if environment variables are accessible...\n');
    
    const envCheck = await page.evaluate(() => {
      // Try to access window or global objects that might contain env vars
      const results = {};
      
      // Check if any Vite env vars are exposed
      if (typeof import !== 'undefined' && import.meta && import.meta.env) {
        results.importMetaEnv = {
          hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
          hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
          hasStripePublishableKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
          hasStripeCoffeePriceId: !!import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID,
          // Get partial values for debugging (first 10 chars)
          supabaseUrlPrefix: import.meta.env.VITE_SUPABASE_URL ? 
            import.meta.env.VITE_SUPABASE_URL.substring(0, 30) : 'NOT SET',
          stripeKeyPrefix: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 
            import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.substring(0, 10) : 'NOT SET',
          coffeePricePrefix: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID ? 
            import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID.substring(0, 15) : 'NOT SET'
        };
      }
      
      // Check window object
      if (typeof window !== 'undefined') {
        results.windowEnv = {
          hasEnv: !!window.env,
          hasConfig: !!window.config,
          hasStripe: !!window.Stripe
        };
      }
      
      return results;
    }).catch(err => {
      console.log('   ❌ Could not evaluate in page context:', err.message);
      return null;
    });
    
    if (envCheck) {
      console.log('📊 Environment Variable Check Results:');
      console.log('=====================================\n');
      
      if (envCheck.importMetaEnv) {
        console.log('✅ import.meta.env variables:');
        console.log('   Supabase URL:', envCheck.importMetaEnv.hasSupabaseUrl ? '✓ SET' : '❌ NOT SET');
        console.log('   Supabase Key:', envCheck.importMetaEnv.hasSupabaseKey ? '✓ SET' : '❌ NOT SET');
        console.log('   Stripe Publishable Key:', envCheck.importMetaEnv.hasStripePublishableKey ? '✓ SET' : '❌ NOT SET');
        console.log('   Stripe Coffee Price ID:', envCheck.importMetaEnv.hasStripeCoffeePriceId ? '✓ SET' : '❌ NOT SET');
        console.log('\n   Partial values (for debugging):');
        console.log('   Supabase URL prefix:', envCheck.importMetaEnv.supabaseUrlPrefix);
        console.log('   Stripe key prefix:', envCheck.importMetaEnv.stripeKeyPrefix);
        console.log('   Coffee price prefix:', envCheck.importMetaEnv.coffeePricePrefix);
      }
      
      if (envCheck.windowEnv) {
        console.log('\n📦 Window object checks:');
        console.log('   window.env:', envCheck.windowEnv.hasEnv ? '✓ EXISTS' : '❌ NOT FOUND');
        console.log('   window.config:', envCheck.windowEnv.hasConfig ? '✓ EXISTS' : '❌ NOT FOUND');
        console.log('   window.Stripe:', envCheck.windowEnv.hasStripe ? '✓ LOADED' : '❌ NOT LOADED');
      }
    }
    
    // Now test the actual upgrade flow
    console.log('\n3️⃣ Testing upgrade button behavior...');
    
    // Sign in first
    const signInButton = await page.locator('button:has-text("Sign In"), a:has-text("Sign In")').first();
    if (await signInButton.isVisible({ timeout: 3000 })) {
      await signInButton.click();
      console.log('   Signing in with test user...');
      
      const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
      const testPassword = 'TestPassword123!';
      
      await page.waitForTimeout(2000);
      
      const emailInput = await page.locator('input[type="email"]').first();
      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        const submitButton = await page.locator('button[type="submit"], button:has-text("Sign In")').first();
        await submitButton.click();
        console.log('   ✓ Login submitted');
        
        await page.waitForTimeout(5000);
      }
    }
    
    // Try upgrade
    const upgradeButton = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').first();
    if (await upgradeButton.isVisible({ timeout: 5000 })) {
      await upgradeButton.click();
      console.log('   ✓ Clicked Upgrade');
      
      await page.waitForTimeout(3000);
      
      const buyCoffeeButton = await page.locator('button:has-text("Buy Me a Coffee")').first();
      if (await buyCoffeeButton.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Found Buy Me a Coffee button');
        
        // Check what happens when we click
        await buyCoffeeButton.click();
        console.log('   ✓ Clicked Buy Me a Coffee');
        
        // Monitor for console errors
        await page.waitForTimeout(3000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('checkout.stripe.com')) {
          console.log('   ✅ Successfully redirected to Stripe!');
        } else {
          console.log('   ❌ No redirect occurred');
          console.log('   Current URL:', currentUrl);
        }
      }
    }
    
    await page.screenshot({ path: 'env-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved: env-check.png');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
  
  console.log('\n✅ Check complete. Browser will remain open for inspection...');
  console.log('Press Ctrl+C to exit when done.');
  
  await page.waitForTimeout(300000);
}

console.log('==========================================');
console.log('🔍 PRODUCTION ENVIRONMENT VARIABLE CHECK');
console.log('==========================================\n');

checkEnvironmentVariables().catch(console.error);