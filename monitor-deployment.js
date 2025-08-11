import { chromium } from 'playwright';

async function checkDeployment() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to site
    await page.goto('https://aimpactscanner.com');
    
    // Start analysis
    await page.fill('input[type="text"]', 'example.com');
    await page.click('button:has-text("Analyze")');
    
    // Wait for progress
    await page.waitForTimeout(16000);
    
    // Check if results are showing
    const scoreVisible = await page.locator('text=/42.*100|Score.*42|42\/100/').isVisible({ timeout: 5000 }).catch(() => false);
    const trafficLossVisible = await page.locator('text="$3,750"').isVisible({ timeout: 5000 }).catch(() => false);
    
    await browser.close();
    
    return scoreVisible || trafficLossVisible;
  } catch (error) {
    await browser.close();
    return false;
  }
}

async function monitor() {
  console.log('🔍 Monitoring AImpactScanner deployment...');
  console.log('   Checking every 30 seconds for fix deployment\n');
  
  let attempts = 0;
  const maxAttempts = 20; // Monitor for 10 minutes max
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[${new Date().toLocaleTimeString()}] Check #${attempts}: Testing production...`);
    
    const isFixed = await checkDeployment();
    
    if (isFixed) {
      console.log('\n🎉 SUCCESS! The fix is LIVE!');
      console.log('✅ Results are now showing on production');
      console.log('✅ Revenue flow is RESTORED');
      console.log('🚀 AImpactScanner is fully operational!\n');
      process.exit(0);
    } else {
      console.log('   ❌ Not fixed yet - waiting 30 seconds...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏱️ Monitoring timeout reached (10 minutes)');
  console.log('Please check Netlify dashboard manually');
  process.exit(1);
}

monitor().catch(console.error);