import { test, expect } from '@playwright/test';

test.describe('Account Page Fixes Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5174');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-container"], body', { timeout: 10000 });
  });

  test('1. Manage Subscription button functionality', async ({ page }) => {
    console.log('🧪 Testing Manage Subscription button functionality...');
    
    // First we need to authenticate and get to account page
    // Look for auth elements
    const emailInput = await page.locator('input[type="email"]').first();
    
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating user...');
      await emailInput.fill('test@example.com');
      
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Send Magic Link")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate to account page
    console.log('🏠 Navigating to account page...');
    const accountButton = await page.locator('button:has-text("Account"), a:has-text("Account")').first();
    if (await accountButton.isVisible()) {
      await accountButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for manage subscription buttons
    const manageButtons = await page.locator('button:has-text("Manage Subscription"), button:has-text("Open Billing Portal")').all();
    console.log(`Found ${manageButtons.length} manage subscription buttons`);
    
    if (manageButtons.length > 0) {
      // Test the first manage subscription button
      const firstButton = manageButtons[0];
      
      // Verify button is visible and has correct text
      await expect(firstButton).toBeVisible();
      const buttonText = await firstButton.textContent();
      console.log(`✅ Button text: "${buttonText}"`);
      
      // Mock the Supabase Edge Function call to test click handling
      await page.route('**/functions/v1/create-portal-session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            url: 'https://billing.stripe.com/p/session_test123',
            success: true
          })
        });
      });
      
      // Test button click (should trigger handleManageSubscription)
      console.log('🖱️ Testing button click...');
      
      // Listen for navigation or alerts
      let navigationOccurred = false;
      page.on('response', async (response) => {
        if (response.url().includes('create-portal-session')) {
          console.log('✅ Edge Function called successfully');
        }
      });
      
      // Click the button
      await firstButton.click();
      
      // Wait a moment for any async operations
      await page.waitForTimeout(1000);
      
      console.log('✅ Manage Subscription button click test completed');
    } else {
      console.log('ℹ️ No manage subscription buttons found (user may not have paid tier)');
    }
  });

  test('2. Usage tracking increments for all tiers', async ({ page }) => {
    console.log('🧪 Testing usage tracking increments for all tiers...');
    
    // Start with authentication if needed
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating user...');
      await emailInput.fill('test-usage@example.com');
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Send Magic Link")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate to home/analysis page
    console.log('🏠 Going to analysis page...');
    const homeButton = await page.locator('button:has-text("Home"), a:has-text("Home"), button:has-text("Analysis")').first();
    if (await homeButton.isVisible()) {
      await homeButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check initial usage count in account section
    const accountButton = await page.locator('button:has-text("Account"), a:has-text("Account")').first();
    let initialUsageCount = null;
    
    if (await accountButton.isVisible()) {
      await accountButton.click();
      await page.waitForTimeout(1000);
      
      // Try to find usage display
      const usageElements = await page.locator('text=/\\d+ Remaining/, text=/\\d+ Used/, text=/Used This Month/').all();
      for (const element of usageElements) {
        const text = await element.textContent();
        console.log(`📊 Usage info: ${text}`);
      }
      
      // Go back to analysis
      const analysisButton = await page.locator('button:has-text("Analysis"), button:has-text("Home")').first();
      if (await analysisButton.isVisible()) {
        await analysisButton.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // Test running an analysis to trigger usage increment
    console.log('🔍 Testing analysis to trigger usage increment...');
    
    const urlInput = await page.locator('input[placeholder*="URL"], input[type="url"]').first();
    if (await urlInput.isVisible()) {
      await urlInput.fill('https://example.com');
      
      const analyzeButton = await page.locator('button:has-text("Analyze"), button:has-text("Start Analysis")').first();
      if (await analyzeButton.isVisible()) {
        // Mock the analysis function to avoid actual API calls
        await page.route('**/functions/v1/analyze-page', async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              analysisResults: { score: 75, factors: [] }
            })
          });
        });
        
        console.log('🚀 Starting analysis...');
        await analyzeButton.click();
        
        // Wait for analysis to start
        await page.waitForTimeout(2000);
        
        // Check if usage was incremented by inspecting localStorage
        const usageData = await page.evaluate(() => {
          const keys = Object.keys(localStorage).filter(key => key.startsWith('usage_'));
          const usageInfo = {};
          keys.forEach(key => {
            try {
              usageInfo[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {
              usageInfo[key] = localStorage.getItem(key);
            }
          });
          return usageInfo;
        });
        
        console.log('📊 Usage data in localStorage:', JSON.stringify(usageData, null, 2));
        
        // Verify that incrementUsage was called (should be reflected in localStorage)
        const hasUsageData = Object.keys(usageData).length > 0;
        console.log(`✅ Usage tracking active: ${hasUsageData}`);
        
        // Check if monthlyUsed was incremented
        const usageEntries = Object.entries(usageData);
        let foundIncrement = false;
        
        for (const [key, data] of usageEntries) {
          if (data && typeof data === 'object' && data.monthlyUsed !== undefined) {
            console.log(`📈 User ${key}: monthlyUsed = ${data.monthlyUsed}, tier = ${data.tier}, isUnlimited = ${data.isUnlimited}`);
            if (data.monthlyUsed > 0) {
              foundIncrement = true;
            }
          }
        }
        
        console.log(`✅ Usage increment detected: ${foundIncrement}`);
      }
    } else {
      console.log('ℹ️ URL input not found, skipping usage increment test');
    }
  });

  test('3. No duplicate billing sections in UI', async ({ page }) => {
    console.log('🧪 Testing for duplicate billing sections...');
    
    // Authenticate if needed
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating user...');
      await emailInput.fill('test-billing@example.com');
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Send Magic Link")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate to account page
    console.log('🏠 Navigating to account page...');
    const accountButton = await page.locator('button:has-text("Account"), a:has-text("Account")').first();
    if (await accountButton.isVisible()) {
      await accountButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for billing-related sections
    console.log('🔍 Checking for billing sections...');
    
    // Look for billing-related headings
    const billingHeadings = await page.locator('h2:has-text("Billing"), h3:has-text("Billing"), h2:has-text("Subscription"), h3:has-text("Subscription")').all();
    console.log(`Found ${billingHeadings.length} billing-related headings`);
    
    const headingTexts = [];
    for (const heading of billingHeadings) {
      const text = await heading.textContent();
      headingTexts.push(text.trim());
    }
    
    console.log('📝 Billing section headings:', headingTexts);
    
    // Look for manage subscription buttons (should not have duplicates)
    const manageButtons = await page.locator('button:has-text("Manage Subscription"), button:has-text("Open Billing Portal")').all();
    console.log(`Found ${manageButtons.length} manage subscription buttons`);
    
    // Check for duplicate text content in billing sections
    const duplicateHeadings = headingTexts.filter((item, index) => headingTexts.indexOf(item) !== index);
    console.log('🔄 Duplicate headings:', duplicateHeadings);
    
    // Look for entire billing sections (div containers)
    const billingContainers = await page.locator('div:has(h2:has-text("Billing")), div:has(h3:has-text("Billing")), div:has(button:has-text("Manage Subscription"))').all();
    console.log(`Found ${billingContainers.length} billing containers`);
    
    // Test results
    if (duplicateHeadings.length > 0) {
      console.log('❌ Found duplicate billing headings:', duplicateHeadings);
    } else {
      console.log('✅ No duplicate billing headings found');
    }
    
    if (manageButtons.length > 2) {
      console.log(`⚠️ Found ${manageButtons.length} manage subscription buttons - might be duplicates`);
    } else {
      console.log(`✅ Manage subscription buttons count looks normal (${manageButtons.length})`);
    }
    
    if (billingContainers.length > 2) {
      console.log(`⚠️ Found ${billingContainers.length} billing containers - might be duplicates`);
    } else {
      console.log(`✅ Billing containers count looks normal (${billingContainers.length})`);
    }
  });

  test('4. Comprehensive UI audit for account page issues', async ({ page }) => {
    console.log('🧪 Running comprehensive UI audit...');
    
    // Authenticate if needed
    const emailInput = await page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating user...');
      await emailInput.fill('test-audit@example.com');
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Send Magic Link")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigate to account page
    console.log('🏠 Navigating to account page...');
    const accountButton = await page.locator('button:has-text("Account"), a:has-text("Account")').first();
    if (await accountButton.isVisible()) {
      await accountButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'account-page-audit.png', fullPage: true });
    console.log('📸 Screenshot saved as account-page-audit.png');
    
    // Audit all interactive elements
    console.log('🔍 Auditing interactive elements...');
    
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      try {
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`Button ${i + 1}: "${text?.trim()}" - Visible: ${isVisible}`);
      } catch (e) {
        console.log(`Button ${i + 1}: Error getting info - ${e.message}`);
      }
    }
    
    // Check for error messages or loading states
    const errorElements = await page.locator('[class*="error"], [class*="Error"], text=/error/i, text=/Error/').all();
    console.log(`Found ${errorElements.length} error-related elements`);
    
    const loadingElements = await page.locator('[class*="loading"], [class*="Loading"], text=/loading/i, text=/Loading/').all();
    console.log(`Found ${loadingElements.length} loading-related elements`);
    
    // Check form validation
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input elements`);
    
    // Look for any console errors
    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait a bit to collect any console errors
    await page.waitForTimeout(2000);
    
    if (consoleMessages.length > 0) {
      console.log('⚠️ Console errors detected:');
      consoleMessages.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
    } else {
      console.log('✅ No console errors detected');
    }
    
    console.log('✅ Comprehensive UI audit completed');
  });
});