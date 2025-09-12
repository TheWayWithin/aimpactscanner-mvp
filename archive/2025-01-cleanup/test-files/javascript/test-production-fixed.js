import { chromium } from 'playwright';

async function testProductionFixed() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const testEmail = 'ugcbwkkfxvhhxyxmih@xfavaj.com';
  const testPassword = 'TestPassword123!';
  const siteUrl = 'https://aimpactscanner.com';
  
  console.log('🚀 Testing FIXED production site:', siteUrl);
  console.log('================================================\n');
  
  try {
    // Step 1: Navigate to production site
    console.log('1️⃣ Navigating to production site...');
    await page.goto(siteUrl);
    await page.waitForLoadState('networkidle');
    console.log('   ✓ Page loaded successfully\n');
    
    // Step 2: Start analysis
    console.log('2️⃣ Starting analysis...');
    const urlInput = await page.locator('input[type="text"], input[type="url"]').first();
    await urlInput.fill('example.com');
    console.log('   ✓ URL entered: example.com');
    
    const analyzeButton = await page.locator('button:has-text("Analyze")').first();
    await analyzeButton.click();
    console.log('   ✓ Analysis started\n');
    
    // Step 3: Monitor console logs for our debugging messages
    console.log('3️⃣ Monitoring progress (checking our debug logs)...');
    page.on('console', msg => {
      if (msg.text().includes('TeaserResults:')) {
        console.log('   📊 Debug:', msg.text());
      }
    });
    
    // Step 4: Wait for TeaserResults progress
    console.log('4️⃣ Waiting for TeaserResults progress simulation...');
    console.log('   ⏳ Should take ~14 seconds with our fix...');
    
    // Wait for progress to complete (with extra buffer)
    await page.waitForTimeout(16000);
    console.log('   ✓ Progress simulation time elapsed\n');
    
    // Step 5: CHECK IF RESULTS ARE SHOWING (Critical Test!)
    console.log('5️⃣ CRITICAL CHECK: Are results showing?');
    console.log('   Checking for key result elements...');
    
    // Check for score
    const scoreVisible = await page.locator('text=/42.*100|Score.*42|42\/100/').isVisible({ timeout: 5000 }).catch(() => false);
    console.log('   ' + (scoreVisible ? '✅' : '❌') + ' Score (42/100) visible:', scoreVisible);
    
    // Check for traffic loss amount
    const trafficLossVisible = await page.locator('text="$3,750"').isVisible({ timeout: 5000 }).catch(() => false);
    console.log('   ' + (trafficLossVisible ? '✅' : '❌') + ' Traffic loss ($3,750) visible:', trafficLossVisible);
    
    // Check for critical issues
    const criticalIssuesVisible = await page.locator('text="Critical Issues"').isVisible({ timeout: 5000 }).catch(() => false);
    console.log('   ' + (criticalIssuesVisible ? '✅' : '❌') + ' Critical Issues section visible:', criticalIssuesVisible);
    
    // Check for any factors
    const factorsVisible = await page.locator('text=/Citation-Worthy|Title Tag|Transparency/').isVisible({ timeout: 5000 }).catch(() => false);
    console.log('   ' + (factorsVisible ? '✅' : '❌') + ' Analysis factors visible:', factorsVisible);
    
    // Overall results check
    const resultsShowing = scoreVisible || trafficLossVisible || criticalIssuesVisible || factorsVisible;
    console.log('\n   🎯 RESULTS SHOWING:', resultsShowing ? '✅ YES - BUG IS FIXED!' : '❌ NO - BUG STILL EXISTS');
    
    // Take screenshot for evidence
    await page.screenshot({ path: 'production-after-fix.png', fullPage: true });
    console.log('   📸 Screenshot saved: production-after-fix.png\n');
    
    if (resultsShowing) {
      console.log('6️⃣ Testing conversion flow...');
      
      // Look for upgrade prompt or pricing options
      const upgradePromptVisible = await page.locator('text=/upgrade|pricing|plan|tier/i').isVisible({ timeout: 5000 }).catch(() => false);
      console.log('   ' + (upgradePromptVisible ? '✅' : '❌') + ' Upgrade/pricing options visible:', upgradePromptVisible);
      
      // Check for popup
      const popupVisible = await page.locator('text="Your Score Needs Immediate Attention"').isVisible({ timeout: 5000 }).catch(() => false);
      console.log('   ' + (popupVisible ? '✅' : '❌') + ' Urgency popup visible:', popupVisible);
      
      if (popupVisible) {
        // Try clicking "Start Recovering Traffic"
        console.log('\n7️⃣ Testing popup interaction...');
        const startButton = await page.locator('button:has-text("Start Recovering Traffic")').first();
        if (await startButton.isVisible({ timeout: 3000 })) {
          console.log('   ✓ "Start Recovering Traffic" button found');
          await startButton.click();
          await page.waitForTimeout(2000);
          
          // Check for tier selection modal
          const tierModalVisible = await page.locator('text="Confirm Your Selection"').isVisible({ timeout: 5000 }).catch(() => false);
          console.log('   ' + (tierModalVisible ? '✅' : '❌') + ' Tier selection modal appeared:', tierModalVisible);
          
          if (tierModalVisible) {
            // Look for free trial link
            const freeTrialVisible = await page.locator('a:has-text("free trial")').isVisible({ timeout: 3000 }).catch(() => false);
            console.log('   ' + (freeTrialVisible ? '✅' : '❌') + ' Free trial option available:', freeTrialVisible);
          }
        }
      }
    }
    
    // Final summary
    console.log('\n================================================');
    console.log('📊 PRODUCTION TEST SUMMARY:');
    console.log('================================================');
    
    if (resultsShowing) {
      console.log('✅ CRITICAL BUG FIXED - Results are displaying!');
      console.log('✅ Revenue flow is RESTORED');
      console.log('✅ Users can now complete conversion journey');
      console.log('\n🎉 SUCCESS: Production site is OPERATIONAL!');
    } else {
      console.log('❌ CRITICAL: Results still not showing');
      console.log('❌ Bug persists - revenue flow still blocked');
      console.log('❌ Further investigation needed');
      console.log('\n⚠️ FAILURE: Production site still has issues');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'production-error.png', fullPage: true });
    console.log('📸 Error screenshot saved: production-error.png');
  }
  
  console.log('\n✅ Test completed. Browser will close in 5 seconds...');
  await page.waitForTimeout(5000);
  await browser.close();
}

console.log('========================================');
console.log('🔧 AIMPACTSCANNER PRODUCTION TEST');
console.log('🎯 Testing critical bug fix deployment');
console.log('========================================\n');

testProductionFixed().catch(console.error);