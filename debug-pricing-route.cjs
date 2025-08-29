// Debug Pricing Route Issue
const { chromium } = require('playwright');

async function debugPricingRoute() {
  console.log('🔍 Debugging Pricing Route Issue...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n1. Navigate to main site');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    
    // Check the current view state
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if the React app is loaded
    const reactRoot = await page.locator('#root').count();
    console.log('React root found:', reactRoot > 0 ? 'YES' : 'NO');
    
    // Check what's actually rendered in the DOM
    const bodyContent = await page.locator('body').textContent();
    console.log('Page contains "Coffee":', bodyContent.includes('Coffee') ? 'YES' : 'NO');
    console.log('Page contains "Pricing":', bodyContent.includes('Pricing') ? 'YES' : 'NO');
    console.log('Page contains "$4.95":', bodyContent.includes('$4.95') ? 'YES' : 'NO');
    
    console.log('\n2. Try navigating to pricing via hash');
    await page.goto('http://localhost:5173/#pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const hashBodyContent = await page.locator('body').textContent();
    console.log('After hash navigation:');
    console.log('Page contains "Coffee":', hashBodyContent.includes('Coffee') ? 'YES' : 'NO');
    console.log('Page contains "$4.95":', hashBodyContent.includes('$4.95') ? 'YES' : 'NO');
    
    console.log('\n3. Check for React state');
    const currentView = await page.evaluate(() => {
      // Try to access React dev tools or component state
      return window.location.hash;
    });
    console.log('Current URL hash:', currentView);
    
    console.log('\n4. Look for navigation buttons');
    const navButtons = await page.locator('button').allTextContents();
    console.log('Available buttons:', navButtons);
    
    // Try clicking Upgrade/Pricing button if it exists
    const pricingButton = page.locator('text="💎 Upgrade"').or(page.locator('text="Upgrade"'));
    const pricingButtonExists = await pricingButton.count() > 0;
    
    if (pricingButtonExists) {
      console.log('\n5. Click pricing button');
      await pricingButton.first().click();
      await page.waitForTimeout(2000);
      
      const afterClickContent = await page.locator('body').textContent();
      console.log('After clicking Upgrade:');
      console.log('Page contains "Coffee":', afterClickContent.includes('Coffee') ? 'YES' : 'NO');
      console.log('Page contains "$4.95":', afterClickContent.includes('$4.95') ? 'YES' : 'NO');
    }
    
    console.log('\n6. Manual inspection pause');
    console.log('Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugPricingRoute().catch(console.error);