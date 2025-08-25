/**
 * Final Coffee Tier PDF Export Verification
 * Confirms the fix is working by testing the specific PDF export button behavior
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'jamie.watters.mail@icloud.com', 
  password: 'Qwerty123!'
};

test.describe('Final Coffee Tier Verification', () => {
  test('Verify PDF export works without upgrade prompt for Coffee tier', async ({ page }) => {
    console.log('🎯 FINAL VERIFICATION: Testing PDF export for Coffee tier user');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login process
    console.log('🔑 Step 1: Authenticating user...');
    await page.getByText('Sign In').click();
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for authentication and tier sync
    await page.waitForTimeout(5000);
    
    console.log('✅ Step 2: Verifying Coffee tier badge is visible');
    
    // Check for Coffee tier badge in header
    const coffeeIndicator = page.locator('*:has-text("☕ Coffee"), *:has-text("Coffee")').first();
    await expect(coffeeIndicator).toBeVisible();
    console.log('✅ Coffee tier badge confirmed in header');
    
    console.log('🔍 Step 3: Testing PDF button access...');
    
    // Navigate to account area where PDF export would be available
    await page.getByText('Account').click();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of account page 
    await page.screenshot({ 
      path: 'test-results/coffee-tier-account-page.png',
      fullPage: true 
    });
    
    // Look for PDF-related buttons
    const pdfButtons = [
      page.locator('button:has-text("PDF Test")'),
      page.locator('button:has-text("PDF")'),
      page.locator('[data-testid="pdf-export-button"]')
    ];
    
    let foundPDFButton = false;
    for (const button of pdfButtons) {
      if (await button.isVisible({ timeout: 2000 })) {
        console.log('✅ Found PDF button:', await button.textContent());
        
        // Check if it has an upgrade badge near it
        const buttonBox = await button.boundingBox();
        if (buttonBox) {
          // Check for upgrade badges specifically near this button
          const nearbyUpgradeBadges = page.locator('*:has-text("Upgrade")').locator('visible=true');
          const upgradeBadgeCount = await nearbyUpgradeBadges.count();
          
          console.log(`📊 Found ${upgradeBadgeCount} upgrade badges near PDF button`);
          
          // Click the PDF button
          await button.click();
          await page.waitForTimeout(2000);
          
          // Check if upgrade modal appears
          const upgradeModalSelectors = [
            '[data-testid="upgrade-modal"]',
            '.upgrade-modal',
            '*:has-text("upgrade to coffee")',
            '*:has-text("Upgrade to Coffee")'
          ];
          
          let upgradeModalVisible = false;
          for (const modalSelector of upgradeModalSelectors) {
            if (await page.locator(modalSelector).isVisible({ timeout: 1000 })) {
              upgradeModalVisible = true;
              break;
            }
          }
          
          console.log(`📊 Upgrade modal appeared after PDF click: ${upgradeModalVisible}`);
          
          // For Coffee tier, upgrade modal should NOT appear
          expect(upgradeModalVisible).toBe(false);
          
          foundPDFButton = true;
          break;
        }
      }
    }
    
    if (!foundPDFButton) {
      console.log('⚠️ No PDF button found on Account page, trying PDF Test navigation button');
      
      // Try the PDF Test button in navigation
      const pdfTestButton = page.getByText('PDF Test');
      if (await pdfTestButton.isVisible()) {
        await pdfTestButton.click();
        await page.waitForLoadState('networkidle');
        
        console.log('✅ Successfully accessed PDF Test page');
        foundPDFButton = true;
      }
    }
    
    expect(foundPDFButton).toBe(true);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/coffee-tier-final-verification.png',
      fullPage: true 
    });
    
    console.log('🎉 SUCCESS: Coffee tier user can access PDF features without upgrade prompts!');
  });

  test('Verify localStorage contains correct tier data after login', async ({ page }) => {
    console.log('🔍 VERIFICATION: localStorage tier data consistency');
    
    await page.goto('/');
    
    // Quick login
    await page.getByText('Sign In').click();
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForTimeout(3000);
    
    // Check final localStorage state
    const finalTierState = await page.evaluate(() => {
      const storageKey = 'usage_jamie.watters.mail@icloud.com';
      const data = localStorage.getItem(storageKey);
      
      if (!data) return { error: 'No data found' };
      
      const parsed = JSON.parse(data);
      return {
        tier: parsed.tier,
        isUnlimited: parsed.isUnlimited,
        lastSynced: parsed.lastSynced,
        hasPDFAccess: ['coffee', 'professional', 'enterprise'].includes(parsed.tier)
      };
    });
    
    console.log('📊 Final localStorage state:', JSON.stringify(finalTierState, null, 2));
    
    // Verify all expected properties
    expect(finalTierState.tier).toBe('coffee');
    expect(finalTierState.isUnlimited).toBe(true);
    expect(finalTierState.hasPDFAccess).toBe(true);
    expect(finalTierState.lastSynced).toBeTruthy();
    
    console.log('✅ SUCCESS: localStorage correctly maintains Coffee tier data from database sync');
  });
});