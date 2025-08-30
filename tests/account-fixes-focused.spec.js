import { test, expect } from '@playwright/test';

test.describe('Account Page Fixes - Focused Testing', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('Account Page Key Issues Analysis', async ({ page }) => {
    console.log('🔍 Starting focused account page analysis...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'initial-state.png', fullPage: true });
    console.log('📸 Initial state captured');
    
    // Try to get to account page without authentication first
    console.log('🏠 Looking for navigation elements...');
    const navElements = await page.locator('nav button, header button, a').all();
    
    for (let i = 0; i < navElements.length; i++) {
      try {
        const text = await navElements[i].textContent();
        console.log(`Nav element ${i + 1}: "${text?.trim()}"`);
      } catch (e) {
        console.log(`Nav element ${i + 1}: Could not get text`);
      }
    }
    
    // Look for account or sign in related elements
    const accountRelated = await page.locator('button:has-text("Account"), button:has-text("Sign In"), a:has-text("Account")').all();
    console.log(`Found ${accountRelated.length} account-related elements`);
    
    // If we find account elements, try to access
    if (accountRelated.length > 0) {
      const accountBtn = accountRelated[0];
      const btnText = await accountBtn.textContent();
      console.log(`🖱️ Clicking: "${btnText?.trim()}"`);
      
      await accountBtn.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot after click
      await page.screenshot({ path: 'after-navigation-click.png', fullPage: true });
      
      // Check current URL and page content
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Look for account dashboard elements
      const accountElements = await page.locator('h1, h2, h3').all();
      console.log('🏷️ Found headings:');
      for (let i = 0; i < Math.min(accountElements.length, 10); i++) {
        try {
          const text = await accountElements[i].textContent();
          console.log(`  H${i + 1}: "${text?.trim()}"`);
        } catch (e) {
          console.log(`  H${i + 1}: Could not get text`);
        }
      }
      
      // TEST 1: Look for Manage Subscription buttons
      console.log('🧪 TEST 1: Checking for Manage Subscription buttons...');
      const manageButtons = await page.locator('button').all();
      let manageSubscriptionCount = 0;
      let billingPortalCount = 0;
      
      for (const btn of manageButtons) {
        try {
          const text = await btn.textContent();
          const textContent = text?.toLowerCase().trim() || '';
          
          if (textContent.includes('manage subscription')) {
            manageSubscriptionCount++;
            console.log(`✅ Found "Manage Subscription" button: "${text}"`);
            
            // Check if button is clickable
            const isVisible = await btn.isVisible();
            const isEnabled = await btn.isEnabled();
            console.log(`   Visible: ${isVisible}, Enabled: ${isEnabled}`);
          }
          
          if (textContent.includes('billing portal') || textContent.includes('open billing')) {
            billingPortalCount++;
            console.log(`✅ Found billing portal button: "${text}"`);
          }
        } catch (e) {
          // Skip buttons that can't be accessed
        }
      }
      
      console.log(`📊 RESULT: ${manageSubscriptionCount} "Manage Subscription" buttons`);
      console.log(`📊 RESULT: ${billingPortalCount} billing portal buttons`);
      console.log(`📊 TOTAL SUBSCRIPTION MANAGEMENT BUTTONS: ${manageSubscriptionCount + billingPortalCount}`);
      
      // TEST 2: Check for duplicate billing sections
      console.log('🧪 TEST 2: Checking for duplicate billing sections...');
      
      const billingHeadings = await page.locator('h1, h2, h3, h4').all();
      const billingRelatedHeadings = [];
      
      for (const heading of billingHeadings) {
        try {
          const text = await heading.textContent();
          const textContent = text?.toLowerCase().trim() || '';
          
          if (textContent.includes('billing') || 
              textContent.includes('subscription') || 
              textContent.includes('manage') ||
              textContent.includes('payment')) {
            billingRelatedHeadings.push(text?.trim());
          }
        } catch (e) {
          // Skip headings that can't be accessed
        }
      }
      
      console.log('📝 Found billing-related headings:');
      billingRelatedHeadings.forEach((heading, i) => {
        console.log(`  ${i + 1}. "${heading}"`);
      });
      
      // Check for duplicates
      const duplicates = billingRelatedHeadings.filter((item, index) => 
        billingRelatedHeadings.indexOf(item) !== index
      );
      
      console.log(`🔄 DUPLICATE HEADINGS: ${duplicates.length > 0 ? duplicates.join(', ') : 'None found'}`);
      
      // TEST 3: Check usage tracking elements
      console.log('🧪 TEST 3: Checking for usage tracking display...');
      
      const usageElements = await page.locator('text=/remaining/i, text=/used/i, text=/analyses/i, text=/month/i').all();
      console.log(`Found ${usageElements.length} usage-related elements`);
      
      for (let i = 0; i < Math.min(usageElements.length, 5); i++) {
        try {
          const text = await usageElements[i].textContent();
          console.log(`  Usage info ${i + 1}: "${text?.trim()}"`);
        } catch (e) {
          console.log(`  Usage info ${i + 1}: Could not get text`);
        }
      }
      
      // Take final screenshot of account page
      await page.screenshot({ path: 'account-page-final.png', fullPage: true });
      console.log('📸 Account page final state captured');
    }
    
    // TEST 4: Test usage increment functionality
    console.log('🧪 TEST 4: Testing usage increment functionality...');
    
    // Navigate to home/analysis page
    const homeBtn = await page.locator('button:has-text("Home"), a:has-text("Home"), button:has-text("Analysis")').first();
    if (await homeBtn.isVisible()) {
      await homeBtn.click();
      await page.waitForTimeout(1000);
      
      // Check localStorage before analysis
      const beforeUsage = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('usage_'));
        const data = {};
        keys.forEach(key => {
          try {
            data[key] = JSON.parse(localStorage.getItem(key));
          } catch (e) {
            data[key] = localStorage.getItem(key);
          }
        });
        return data;
      });
      
      console.log('📊 Usage data BEFORE analysis:', JSON.stringify(beforeUsage, null, 2));
      
      // Try to trigger an analysis
      const urlInput = await page.locator('input[type="url"], input[placeholder*="URL"]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://example.com');
        
        const analyzeBtn = await page.locator('button:has-text("Analyze"), button:has-text("Start")').first();
        if (await analyzeBtn.isVisible()) {
          console.log('🚀 Clicking analyze button...');
          await analyzeBtn.click();
          await page.waitForTimeout(3000);
          
          // Check localStorage after analysis
          const afterUsage = await page.evaluate(() => {
            const keys = Object.keys(localStorage).filter(key => key.startsWith('usage_'));
            const data = {};
            keys.forEach(key => {
              try {
                data[key] = JSON.parse(localStorage.getItem(key));
              } catch (e) {
                data[key] = localStorage.getItem(key);
              }
            });
            return data;
          });
          
          console.log('📊 Usage data AFTER analysis:', JSON.stringify(afterUsage, null, 2));
          
          // Compare before and after
          const keys = Object.keys(afterUsage);
          let incrementDetected = false;
          
          keys.forEach(key => {
            const before = beforeUsage[key]?.monthlyUsed || 0;
            const after = afterUsage[key]?.monthlyUsed || 0;
            
            console.log(`📈 Key ${key}: ${before} → ${after}`);
            if (after > before) {
              incrementDetected = true;
            }
          });
          
          console.log(`✅ Usage increment detected: ${incrementDetected}`);
        }
      }
    }
    
    console.log('🎯 FOCUSED TEST SUMMARY:');
    console.log('1. Manage Subscription button functionality - Tested button existence and availability');
    console.log('2. Usage tracking increments - Tested localStorage changes during analysis');
    console.log('3. Billing section consolidation - Checked for duplicate headings and sections');
    console.log('4. Screenshots captured for visual verification');
  });
});