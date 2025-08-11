import { chromium } from 'playwright';

async function testLocalBuild() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Going to local build...');
  await page.goto('http://localhost:8080');
  
  console.log('2. Starting analysis...');
  await page.fill('input[type="text"]', 'example.com');
  await page.click('button:has-text("Analyze")');
  
  console.log('3. Waiting for TeaserResults progress (14 seconds)...');
  await page.waitForTimeout(15000);
  
  console.log('4. Checking if results are visible...');
  
  // Check for results content
  const scoreVisible = await page.locator('text=/42.*100|Score.*42/').isVisible();
  const criticalIssues = await page.locator('text="Critical Issues"').isVisible();
  const trafficLoss = await page.locator('text="$3,750"').isVisible();
  
  console.log('   Score visible:', scoreVisible);
  console.log('   Critical Issues visible:', criticalIssues);  
  console.log('   Traffic Loss visible:', trafficLoss);
  
  // Take screenshot
  await page.screenshot({ path: 'local-build-results.png', fullPage: true });
  console.log('5. Screenshot saved as local-build-results.png');
  
  if (!scoreVisible && !criticalIssues && !trafficLoss) {
    console.log('   ❌ Results not showing - BUG CONFIRMED');
  } else {
    console.log('   ✅ Results are showing correctly');
  }
  
  await page.waitForTimeout(5000);
  await browser.close();
}

testLocalBuild().catch(console.error);