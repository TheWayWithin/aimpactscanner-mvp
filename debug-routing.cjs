// Debug React Routing Issue
const { chromium } = require('playwright');

async function debugRouting() {
  console.log('🔍 Debugging React Routing Issue...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n1. Test different URL formats');
    
    // Test direct hash navigation
    console.log('Testing: http://localhost:5174/#pricing');
    await page.goto('http://localhost:5174/#pricing', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const hashContent = await page.locator('body').textContent();
    console.log('Hash route - Contains Coffee:', hashContent.includes('Coffee') ? 'YES' : 'NO');
    console.log('Hash route - Contains Choose Your Plan:', hashContent.includes('Choose Your Plan') ? 'YES' : 'NO');
    console.log('Hash route - Contains TierSelection:', hashContent.includes('$4.95') ? 'YES' : 'NO');
    
    // Test current view state via console
    const currentView = await page.evaluate(() => {
      // Try to access React state if possible
      return window.location.hash;
    });
    console.log('Current view hash:', currentView);
    
    // Test clicking pricing button from main site
    console.log('\n2. Test navigation from main page');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const pricingLink = page.locator('text="Pricing"').first();
    const pricingLinkExists = await pricingLink.count() > 0;
    console.log('Pricing link exists:', pricingLinkExists ? 'YES' : 'NO');
    
    if (pricingLinkExists) {
      await pricingLink.click();
      await page.waitForTimeout(3000);
      
      const afterClickContent = await page.locator('body').textContent();
      console.log('After clicking pricing link:');
      console.log('Contains Coffee:', afterClickContent.includes('Coffee') ? 'YES' : 'NO');
      console.log('Contains $4.95:', afterClickContent.includes('$4.95') ? 'YES' : 'NO');
    }
    
    // Check console for any React errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    console.log('\n3. Check for JavaScript errors');
    await page.reload();
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log('JavaScript errors found:');
      logs.forEach(log => console.log('- ' + log));
    } else {
      console.log('No JavaScript errors detected');
    }
    
    // Keep browser open for manual inspection
    console.log('\n4. Manual inspection (30 seconds)');
    console.log('Browser will remain open for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugRouting().catch(console.error);