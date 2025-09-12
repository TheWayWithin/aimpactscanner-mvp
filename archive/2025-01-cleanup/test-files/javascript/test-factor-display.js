// Test script to verify factor display is working
import { chromium } from 'playwright';

async function testFactorDisplay() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('🚀 Starting factor display test...');
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    console.log('✅ Navigated to app');
    
    // Wait for page to load
    await page.waitForSelector('input[placeholder="Enter your website URL..."]', { timeout: 5000 });
    console.log('✅ Landing page loaded');
    
    // Enter a test URL
    const testUrl = 'https://anthropic.com';
    await page.fill('input[placeholder="Enter your website URL..."]', testUrl);
    console.log(`✅ Entered test URL: ${testUrl}`);
    
    // Click analyze button
    await page.click('button:has-text("Analyze My Site Free")');
    console.log('✅ Clicked analyze button');
    
    // Wait for analysis to complete (should take about 15 seconds)
    console.log('⏳ Waiting for analysis to complete...');
    
    // Wait for results dashboard to appear
    const resultsAppeared = await page.waitForSelector('[data-testid="results-dashboard"]', { 
      timeout: 30000 
    }).then(() => true).catch(() => false);
    
    if (resultsAppeared) {
      console.log('✅ Results dashboard appeared');
      
      // Check for overall score
      const overallScore = await page.textContent('[data-testid="overall-score"]');
      console.log(`📊 Overall Score: ${overallScore}`);
      
      // Check for pillar scores
      const pillarCards = await page.$$('[data-testid="pillar-card"]');
      console.log(`📊 Pillar cards found: ${pillarCards.length}`);
      
      // Check for factor cards
      const factorCards = await page.$$('[data-testid="factor-card"]');
      console.log(`📊 Factor cards found: ${factorCards.length}`);
      
      if (factorCards.length > 0) {
        console.log('✅ FACTORS ARE DISPLAYING! Issue is fixed.');
        
        // Get details of first factor
        const firstFactor = factorCards[0];
        const factorName = await firstFactor.$eval('h4', el => el.textContent);
        console.log(`   First factor: ${factorName}`);
        
        // Check if factors are grouped by pillar
        const pillarHeaders = await page.$$('.text-lg.font-bold.text-gray-900');
        console.log(`📊 Pillar grouping headers found: ${pillarHeaders.length}`);
        
      } else {
        console.log('❌ No factor cards found - issue persists');
        
        // Take a screenshot for debugging
        await page.screenshot({ path: 'no-factors-debug.png', fullPage: true });
        console.log('📸 Screenshot saved as no-factors-debug.png');
      }
      
      // Check console for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('❌ Console error:', msg.text());
        }
      });
      
    } else {
      console.log('❌ Results dashboard did not appear within 30 seconds');
      
      // Check if we're stuck on progress
      const progressElement = await page.$('.progress-container');
      if (progressElement) {
        console.log('⚠️ Stuck on progress screen');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    
    // Take a screenshot on error
    await page.screenshot({ path: 'test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-error.png');
  }
  
  // Keep browser open for 10 seconds to observe
  console.log('🔍 Keeping browser open for observation...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('✅ Test complete');
}

// Run the test
testFactorDisplay().catch(console.error);