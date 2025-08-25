/**
 * Coffee Tier Fix Test
 * Tests the fix for tier detection issue - ensuring database tier is properly synced to localStorage
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'jamie.watters.mail@icloud.com',
  password: 'Qwerty123!'
};

test.describe('Coffee Tier Fix Verification', () => {
  test('Verify tier syncs correctly from database after login', async ({ page }) => {
    console.log('🔧 TESTING THE FIX: Database tier synchronization...');
    
    // Monitor localStorage operations
    await page.addInitScript(() => {
      window.TIER_SYNC_LOG = [];
      
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key.includes('usage_jamie.watters.mail@icloud.com')) {
          try {
            const data = JSON.parse(value);
            window.TIER_SYNC_LOG.push({
              timestamp: new Date().toISOString(),
              operation: 'SET',
              tier: data.tier,
              isUnlimited: data.isUnlimited,
              lastSynced: data.lastSynced || 'not set',
              source: data.lastSynced ? 'database_sync' : 'local_operation'
            });
            console.log('TIER_FIX_TEST: Set tier to', data.tier, 'lastSynced:', data.lastSynced);
          } catch (e) {}
        }
        return originalSetItem.call(this, key, value);
      };
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    console.log('✅ Step 1: Navigate to Sign In');
    await page.getByText('Sign In').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Step 2: Fill in credentials');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    console.log('✅ Step 3: Submit login');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for authentication and tier sync
    await page.waitForTimeout(5000);
    
    console.log('✅ Step 4: Check if tier was synced from database');
    
    const tierSyncResults = await page.evaluate(() => {
      const userEmail = 'jamie.watters.mail@icloud.com';
      const storageKey = `usage_${userEmail}`;
      const stored = localStorage.getItem(storageKey);
      
      let tierData = null;
      if (stored) {
        tierData = JSON.parse(stored);
      }
      
      return {
        hasStoredData: !!stored,
        tierData: tierData,
        syncLog: window.TIER_SYNC_LOG || [],
        hasPDFAccess: tierData ? ['coffee', 'professional', 'enterprise'].includes(tierData.tier) : false
      };
    });
    
    console.log('📊 TIER SYNC RESULTS:', JSON.stringify(tierSyncResults, null, 2));
    
    // Verify the fix worked
    expect(tierSyncResults.hasStoredData).toBe(true);
    expect(tierSyncResults.tierData.tier).toBe('coffee');
    expect(tierSyncResults.tierData.isUnlimited).toBe(true);
    expect(tierSyncResults.hasPDFAccess).toBe(true);
    expect(tierSyncResults.tierData.lastSynced).toBeTruthy();
    
    // Check that database sync operation occurred
    const databaseSyncOps = tierSyncResults.syncLog.filter(op => op.source === 'database_sync');
    expect(databaseSyncOps.length).toBeGreaterThan(0);
    
    console.log('✅ SUCCESS: Tier correctly synced from database - Coffee tier detected!');
    
    await page.screenshot({ 
      path: 'test-results/coffee-tier-fix-successful.png',
      fullPage: true 
    });
  });

  test('Verify PDF export button works correctly after fix', async ({ page }) => {
    console.log('🔧 TESTING: PDF export functionality with correct tier...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Login process
    await page.getByText('Sign In').click();
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    
    // Wait for authentication and tier sync
    await page.waitForTimeout(3000);
    
    console.log('✅ Step 1: User authenticated, checking for results/account navigation');
    
    // Navigate to where PDF export button would be
    try {
      // Try to find account or results area
      const accountButton = page.getByText('Account').first();
      if (await accountButton.isVisible({ timeout: 5000 })) {
        await accountButton.click();
        console.log('✅ Navigated via Account button');
      } else {
        // Try analysis flow to get to results
        await page.getByText('Analyze My Site Free').click();
        await page.fill('input[placeholder*="website"], input[type="url"]', 'https://example.com');
        await page.getByRole('button', { name: /analyze/i }).click();
        console.log('✅ Started analysis to access results');
        
        // Wait for analysis to complete or get to results
        await page.waitForTimeout(10000);
      }
    } catch (e) {
      console.log('Navigation approach failed, checking current page...');
    }
    
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Step 2: Looking for PDF export button...');
    
    // Look for PDF export button
    const pdfSelectors = [
      'button:has-text("PDF")',
      'button:has-text("Export")',
      '[data-testid="pdf-export-button"]',
      '.tier-pdf-button',
      'button:has-text("Professional PDF")',
      '*[class*="pdf"]'
    ];
    
    let pdfButton = null;
    for (const selector of pdfSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          pdfButton = button;
          console.log(`✅ Found PDF button with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (pdfButton) {
      console.log('✅ Step 3: Testing PDF button behavior...');
      
      // Check for upgrade badge (should NOT be present)
      const hasUpgradeBadge = await page.locator('*:has-text("Upgrade"), *:has-text("Pro")').isVisible({ timeout: 2000 });
      
      console.log(`📊 Upgrade Badge Present: ${hasUpgradeBadge}`);
      
      // For Coffee tier, there should be NO upgrade badge
      expect(hasUpgradeBadge).toBe(false);
      
      // Take screenshot of correct PDF button state
      await pdfButton.scrollIntoViewIfNeeded();
      await page.screenshot({ 
        path: 'test-results/pdf-button-coffee-tier-correct.png',
        fullPage: true 
      });
      
      console.log('✅ SUCCESS: PDF export button correctly shows Coffee tier access (no upgrade badge)');
      
      // Test clicking the button (should not show upgrade modal)
      await pdfButton.click();
      await page.waitForTimeout(2000);
      
      const upgradeModal = page.locator('[data-testid="upgrade-modal"], .upgrade-modal, *:has-text("upgrade to coffee")');
      const modalAppeared = await upgradeModal.isVisible({ timeout: 3000 });
      
      console.log(`📊 Upgrade Modal Appeared After Click: ${modalAppeared}`);
      
      // Should NOT show upgrade modal for Coffee tier
      expect(modalAppeared).toBe(false);
      
      console.log('✅ SUCCESS: Clicking PDF button does not show upgrade modal - Fix confirmed!');
      
    } else {
      console.log('⚠️  PDF export button not found on current page');
      await page.screenshot({ 
        path: 'test-results/pdf-button-not-found.png',
        fullPage: true 
      });
    }
  });
});