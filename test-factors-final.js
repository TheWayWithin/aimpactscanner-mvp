// Final test to verify factors are displaying correctly
import { chromium } from 'playwright';

async function testFactorDisplay() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('factors') || text.includes('Loaded analysis')) {
      console.log(`[CONSOLE]:`, text);
    }
  });
  
  console.log('🚀 Testing factor display after fixes...');
  
  try {
    // Navigate to app
    await page.goto('http://localhost:5173');
    
    // Perform analysis
    await page.fill('input[placeholder="Enter your website URL..."]', 'https://anthropic.com');
    await page.click('button:has-text("Analyze My Site Free")');
    console.log('✅ Started analysis');
    
    // Wait for preview-analysis to complete
    console.log('⏳ Waiting for analysis to complete...');
    await page.waitForTimeout(20000); // Wait for simulation to complete
    
    // Check if we're on preview results
    const hasPreviewResults = await page.$('text="Your AI Impact Analysis"');
    const hasUnlockedFactors = await page.$$('.bg-white.p-6.rounded-lg.shadow-lg.mb-6');
    
    console.log('Preview results visible:', !!hasPreviewResults);
    console.log('Factor cards found:', hasUnlockedFactors.length);
    
    // Look for factor details
    const factorElements = await page.$$('h3.font-semibold.text-lg.mb-2');
    console.log(`\n📊 FACTORS FOUND: ${factorElements.length}`);
    
    for (let i = 0; i < factorElements.length && i < 3; i++) {
      const factorName = await factorElements[i].textContent();
      console.log(`  Factor ${i + 1}: ${factorName}`);
    }
    
    // Check for pillar scores
    const pillarScores = await page.$$('.text-3xl.font-bold');
    console.log(`\n📊 PILLAR SCORES FOUND: ${pillarScores.length}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'factors-test-final.png', fullPage: true });
    console.log('\n📸 Screenshot saved as factors-test-final.png');
    
    if (factorElements.length > 0) {
      console.log('\n✅ SUCCESS! Factors are now displaying correctly!');
    } else {
      console.log('\n⚠️ No factors found - checking localStorage data...');
      const storageData = await page.evaluate(() => {
        const data = localStorage.getItem('landingAnalysisData');
        return data ? JSON.parse(data) : null;
      });
      console.log('localStorage data:', JSON.stringify(storageData?.results, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'error-final.png', fullPage: true });
  }
  
  // Keep browser open briefly
  await page.waitForTimeout(5000);
  await browser.close();
  console.log('\n✅ Test complete');
}

testFactorDisplay().catch(console.error);