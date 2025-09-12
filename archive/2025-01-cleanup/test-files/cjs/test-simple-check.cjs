// Simple test to check the current state of the application
const { chromium } = require('playwright');

async function simpleCheck() {
  console.log('🔍 Simple Application State Check');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1. Loading landing page...');
    await page.goto('http://localhost:5174');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    const url = page.url();
    console.log('Page title:', title);
    console.log('Current URL:', url);
    
    // Take screenshot
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    console.log('📸 Screenshot saved: current-state.png');
    
    // Check for key elements
    console.log('\n2. Checking for key elements...');
    
    // Landing page elements
    const urlInput = await page.$('input[placeholder*="URL"], input[placeholder*="website"]');
    const analyzeButton = await page.$('button:has-text("Analyze"), button:has-text("Start")');
    
    console.log('URL input found:', !!urlInput);
    console.log('Analyze button found:', !!analyzeButton);
    
    if (urlInput && analyzeButton) {
      console.log('✅ Landing page elements present');
      
      // Try to enter URL
      await urlInput.fill('example.com');
      console.log('✅ URL entered');
      
      await analyzeButton.click();
      console.log('✅ Analyze button clicked');
      
      // Wait a bit and see what happens
      await page.waitForTimeout(5000);
      
      const newUrl = page.url();
      console.log('New URL after click:', newUrl);
      
      // Take another screenshot
      await page.screenshot({ path: 'after-click.png', fullPage: true });
      console.log('📸 After-click screenshot saved: after-click.png');
      
    } else {
      console.log('❌ Landing page elements not found');
      
      // Log all visible text
      const bodyText = await page.textContent('body');
      console.log('Page content preview:', bodyText.substring(0, 500) + '...');
    }
    
    // Check if authenticated
    console.log('\n3. Checking authentication state...');
    const dashboardElements = await page.$$('text="Dashboard", text="Account"');
    const authElements = await page.$$('text="Sign in", text="Login"');
    
    console.log('Dashboard elements found:', dashboardElements.length);
    console.log('Auth elements found:', authElements.length);
    
    if (dashboardElements.length > 0) {
      console.log('✅ User appears to be authenticated');
    } else if (authElements.length > 0) {
      console.log('✅ Authentication flow present');
    } else {
      console.log('✅ Landing page state (anonymous)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

simpleCheck().catch(console.error);