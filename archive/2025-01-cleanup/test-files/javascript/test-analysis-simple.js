// Simple test to check analysis and console output
import { chromium } from 'playwright';

async function testAnalysis() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Edge Function') || text.includes('factors') || text.includes('SimpleResultsDashboard')) {
      console.log(`[CONSOLE ${msg.type()}]:`, text);
    }
  });
  
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });
  
  console.log('🚀 Opening AImpactScanner...');
  await page.goto('http://localhost:5173');
  
  // Enter URL and analyze
  await page.fill('input[placeholder="Enter your website URL..."]', 'https://example.com');
  await page.click('button:has-text("Analyze My Site Free")');
  
  console.log('⏳ Waiting for analysis results or errors...');
  
  // Wait for 45 seconds to see what happens
  await page.waitForTimeout(45000);
  
  // Check current URL
  console.log('Current URL:', page.url());
  
  // Check if we have any results elements
  const hasResults = await page.$('[data-testid="results-dashboard"]');
  const hasProgress = await page.$('.progress-container');
  const hasError = await page.$('.text-red-600');
  
  console.log('Results dashboard present:', !!hasResults);
  console.log('Progress screen present:', !!hasProgress);
  console.log('Error message present:', !!hasError);
  
  if (hasError) {
    const errorText = await page.textContent('.text-red-600');
    console.log('Error text:', errorText);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'analysis-test-result.png', fullPage: true });
  console.log('📸 Screenshot saved as analysis-test-result.png');
  
  await browser.close();
}

testAnalysis().catch(console.error);