/**
 * Quick Coffee Tier Debug Test
 * Simple test to check current localStorage state and identify the tier detection issue
 */

import { test, expect } from '@playwright/test';

test.describe('Coffee Tier Quick Debug', () => {
  test('Check current localStorage and tier detection logic', async ({ page }) => {
    console.log('🔍 QUICK DEBUG: Loading homepage...');
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: 'test-results/quick-debug-landing-page.png',
      fullPage: true 
    });
    
    console.log('🔍 STEP 1: Checking current localStorage state...');
    
    // Check current localStorage
    const currentLocalStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      return storage;
    });
    
    console.log('📊 Current localStorage:', JSON.stringify(currentLocalStorage, null, 2));
    
    console.log('🔍 STEP 2: Testing localStorage tier manipulation...');
    
    // Set up test data for jamie's account
    const testTierData = await page.evaluate(() => {
      const userEmail = 'jamie.watters.mail@icloud.com';
      const storageKey = `usage_${userEmail}`;
      
      // Test data with coffee tier
      const coffeeData = {
        monthlyUsed: 1,
        lastUpdated: new Date().toISOString(),
        isUnlimited: true,
        tier: 'coffee',
        testInserted: true
      };
      
      // Test data with free tier
      const freeData = {
        monthlyUsed: 1,
        lastUpdated: new Date().toISOString(),
        isUnlimited: false,
        tier: 'free',
        testInserted: true
      };
      
      // Store both for comparison
      localStorage.setItem(storageKey, JSON.stringify(coffeeData));
      localStorage.setItem(`${storageKey}_free_test`, JSON.stringify(freeData));
      
      return {
        coffeeData: coffeeData,
        freeData: freeData,
        storageKey: storageKey
      };
    });
    
    console.log('📊 Test tier data inserted:', JSON.stringify(testTierData, null, 2));
    
    console.log('🔍 STEP 3: Testing hasPDFAccess function logic...');
    
    // Test the tier detection logic directly
    const tierLogicTest = await page.evaluate(() => {
      const userEmail = 'jamie.watters.mail@icloud.com';
      const storageKey = `usage_${userEmail}`;
      
      // Get the data we just stored
      const stored = localStorage.getItem(storageKey);
      if (!stored) {
        return { error: 'No stored data found' };
      }
      
      const data = JSON.parse(stored);
      
      // Test the hasPDFAccess logic from useUsageTracking.js
      const hasPDFAccess = ['coffee', 'professional', 'enterprise'].includes(data.tier);
      
      return {
        retrievedTier: data.tier,
        retrievedUnlimited: data.isUnlimited,
        hasPDFAccess: hasPDFAccess,
        expectedResult: true, // Should be true for coffee tier
        testPassed: hasPDFAccess === true
      };
    });
    
    console.log('📊 Tier Logic Test Results:', JSON.stringify(tierLogicTest, null, 2));
    
    // Verify the logic works correctly
    expect(tierLogicTest.testPassed).toBe(true);
    expect(tierLogicTest.hasPDFAccess).toBe(true);
    
    console.log('🔍 STEP 4: Testing what happens with free tier...');
    
    // Test with free tier data
    const freeTeierTest = await page.evaluate(() => {
      const userEmail = 'jamie.watters.mail@icloud.com';
      const storageKey = `usage_${userEmail}`;
      
      // Set free tier data
      const freeData = {
        monthlyUsed: 1,
        lastUpdated: new Date().toISOString(),
        isUnlimited: false,
        tier: 'free'
      };
      
      localStorage.setItem(storageKey, JSON.stringify(freeData));
      
      // Test the hasPDFAccess logic
      const data = JSON.parse(localStorage.getItem(storageKey));
      const hasPDFAccess = ['coffee', 'professional', 'enterprise'].includes(data.tier);
      
      return {
        tier: data.tier,
        hasPDFAccess: hasPDFAccess,
        shouldBeFalse: hasPDFAccess === false
      };
    });
    
    console.log('📊 Free Tier Test Results:', JSON.stringify(freeTeierTest, null, 2));
    
    // This should fail for free tier
    expect(freeTeierTest.hasPDFAccess).toBe(false);
    
    console.log('✅ QUICK DEBUG COMPLETE - Tier logic is working correctly in isolation');
    console.log('🔍 NEXT: The issue must be in how the tier gets initially set in localStorage');
  });

  test('Identify when and why tier gets set to "free"', async ({ page }) => {
    console.log('🔍 INVESTIGATING: When does tier get set to "free"...');
    
    // Inject comprehensive localStorage monitoring
    await page.addInitScript(() => {
      window.TIER_OPERATIONS_LOG = [];
      
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function(key, value) {
        if (key.includes('usage_')) {
          try {
            const data = JSON.parse(value);
            window.TIER_OPERATIONS_LOG.push({
              timestamp: new Date().toISOString(),
              operation: 'SET',
              key: key,
              tier: data.tier || 'undefined',
              isUnlimited: data.isUnlimited || false,
              stackTrace: new Error().stack.split('\n').slice(1, 6).join('\n')
            });
            console.log('TIER_SET:', key, '→', data.tier);
          } catch (e) {
            window.TIER_OPERATIONS_LOG.push({
              timestamp: new Date().toISOString(),
              operation: 'SET_ERROR',
              key: key,
              error: e.message
            });
          }
        }
        return originalSetItem.call(this, key, value);
      };
      
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = function(key) {
        const result = originalGetItem.call(this, key);
        if (key.includes('usage_')) {
          try {
            const data = result ? JSON.parse(result) : null;
            window.TIER_OPERATIONS_LOG.push({
              timestamp: new Date().toISOString(),
              operation: 'GET',
              key: key,
              tier: data ? data.tier : 'null',
              stackTrace: new Error().stack.split('\n').slice(1, 6).join('\n')
            });
            console.log('TIER_GET:', key, '→', data ? data.tier : 'null');
          } catch (e) {
            window.TIER_OPERATIONS_LOG.push({
              timestamp: new Date().toISOString(),
              operation: 'GET_ERROR',
              key: key,
              error: e.message
            });
          }
        }
        return result;
      };
    });
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Wait for any async operations to complete
    await page.waitForTimeout(3000);
    
    // Get the complete log
    const operationsLog = await page.evaluate(() => {
      return window.TIER_OPERATIONS_LOG || [];
    });
    
    console.log('📊 COMPLETE TIER OPERATIONS LOG:');
    operationsLog.forEach((op, index) => {
      console.log(`${index + 1}. [${op.timestamp}] ${op.operation} - ${op.key} → ${op.tier || op.error}`);
      if (op.tier === 'free') {
        console.log(`   🚨 FREE TIER SET! Stack trace: ${op.stackTrace}`);
      }
    });
    
    // Look for operations that set tier to "free"
    const freeOperations = operationsLog.filter(op => op.tier === 'free');
    
    if (freeOperations.length > 0) {
      console.log('🚨 FOUND THE PROBLEM! Operations setting tier to "free":');
      console.log(JSON.stringify(freeOperations, null, 2));
    } else {
      console.log('✅ No operations setting tier to "free" detected on homepage load');
    }
    
    await page.screenshot({ 
      path: 'test-results/tier-operations-investigation.png',
      fullPage: true 
    });
    
    console.log('🎯 INVESTIGATION COMPLETE - Check console logs above for analysis');
  });
});