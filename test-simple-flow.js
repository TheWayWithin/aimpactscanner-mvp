import { chromium } from 'playwright';

async function testSimpleFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Going to site...');
  await page.goto('http://localhost:5173');
  
  console.log('2. Starting analysis...');
  await page.fill('input[type="text"]', 'example.com');
  await page.click('button:has-text("Analyze")');
  
  console.log('3. Waiting for analysis to complete...');
  await page.waitForTimeout(16000);
  
  console.log('4. Looking for popup...');
  const popup = await page.locator('text="Your Score Needs Immediate Attention"').isVisible();
  console.log('   Popup visible:', popup);
  
  console.log('5. Clicking "Start Recovering Traffic"...');
  try {
    await page.click('button:has-text("Start Recovering Traffic")', { timeout: 5000 });
  } catch (e) {
    console.log('   Button not found, continuing...');
  }
  
  console.log('6. Looking for free trial link...');
  await page.waitForTimeout(2000);
  
  const freeTrialLink = await page.locator('a:has-text("free trial")').isVisible();
  console.log('   Free trial link visible:', freeTrialLink);
  
  if (freeTrialLink) {
    console.log('7. Clicking free trial link...');
    await page.click('a:has-text("free trial")');
    await page.waitForTimeout(2000);
  }
  
  // Check current URL
  console.log('8. Current URL:', page.url());
  
  // Check if auth form is visible
  const emailInput = await page.locator('input[type="email"]').isVisible();
  console.log('9. Email input visible:', emailInput);
  
  if (emailInput) {
    console.log('10. Filling registration form...');
    await page.fill('input[type="email"]', 'ugcbwkkfxvhhxyxmih@xfavaj.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Check for confirm password
    const confirmPassword = await page.locator('input[type="password"]').nth(1).isVisible();
    if (confirmPassword) {
      await page.fill('input[type="password"]', 'TestPassword123!', { strict: false });
    }
    
    // Check for terms checkbox
    const termsCheckbox = await page.locator('input[type="checkbox"]').isVisible();
    if (termsCheckbox) {
      await page.check('input[type="checkbox"]');
    }
    
    console.log('11. Submitting form...');
    await page.click('button[type="submit"], button:has-text("Create Account")');
    await page.waitForTimeout(5000);
    
    console.log('12. Final URL:', page.url());
  }
  
  // Take screenshot
  await page.screenshot({ path: 'after-click.png' });
  console.log('Screenshot saved as after-click.png');
  
  await page.waitForTimeout(10000); // Keep browser open for inspection
  await browser.close();
}

testSimpleFlow().catch(console.error);