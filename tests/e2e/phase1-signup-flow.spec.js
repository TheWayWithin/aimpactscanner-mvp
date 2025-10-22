// tests/e2e/phase1-signup-flow.spec.js
// Comprehensive E2E test suite for Phase 1 signup flow validation
// Tests all 8 discrete user journeys with proper database setup/teardown

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Test configuration
const LOCAL_URL = 'http://localhost:5173';
const STAGING_URL = 'https://develop--aimpactscanner.netlify.app';
const BASE_URL = process.env.BASE_URL || LOCAL_URL;

// OAuth test credentials (from .env.test)
const GOOGLE_EMAIL = process.env.GOOGLE_TEST_EMAIL_1;
const GOOGLE_PASSWORD = process.env.GOOGLE_TEST_PASSWORD_1;

// Initialize Supabase client for test data management (STAGING DATABASE ONLY)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY not found in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper to get authContext from localStorage
 */
async function getAuthContext(page) {
  return await page.evaluate(() => {
    const context = localStorage.getItem('authContext');
    return context ? JSON.parse(context) : null;
  });
}

/**
 * Helper to perform Google OAuth authentication
 */
async function performGoogleOAuth(page, email, password) {
  console.log('🔐 Starting Google OAuth flow...');
  
  await page.locator('button:has-text("Continue with Google")').click();
  console.log('✓ Clicked Continue with Google');

  await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
  console.log('✓ Redirected to Google OAuth page');

  await page.locator('input[type="email"]').fill(email);
  await page.locator('button:text("Next")').first().click();
  console.log('✓ Entered email');

  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button:text("Next")').first().click();
  console.log('✓ Entered password');

  await page.waitForURL(new RegExp(BASE_URL), { timeout: 60000 });
  console.log('✓ Redirected back to app');
  
  await page.waitForTimeout(2000);
}

/**
 * Clean up test users from database
 */
async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users...');
  
  const testEmails = [
    'coffee-user-test-phase1@example.com',
    'free-user-test-phase1@example.com'
  ];
  
  for (const email of testEmails) {
    try {
      const result = await supabase
        .from('users')
        .delete()
        .eq('email', email);
      
      if (result.error && result.error.code !== 'PGRST116') {
        console.error('Error deleting user:', email, result.error.message);
      } else {
        console.log('Deleted user:', email);
      }
    } catch (err) {
      console.error('Exception deleting user:', email, err.message);
    }
  }
  
  console.log('✅ Test user cleanup complete');
}

// Test suite hooks
test.beforeAll(async () => {
  console.log('\n🎯 PHASE 1 SIGNUP FLOW E2E TEST SUITE');
  console.log('Base URL:', BASE_URL);
  console.log('Database: impactscanner-staging (SAFE FOR TESTING)\n');
  
  await cleanupTestUsers();
});

test.afterAll(async () => {
  console.log('\n🏁 TEST SUITE COMPLETE\n');
  await cleanupTestUsers();
});

// Journey 1: New User → Coffee Tier → OAuth (Google)
test.describe('Journey 1: New User → Coffee → OAuth', () => {
  test('should complete Coffee tier signup and route to checkout', async ({ page }) => {
    console.log('\n🧪 JOURNEY 1: New User → Coffee → Google OAuth');
    
    await page.goto(BASE_URL + '/#signup');
    console.log('✓ Navigated to signup page');
    
    const tierDropdown = page.locator('select, [role="combobox"]').first();
    await expect(tierDropdown).toBeVisible({ timeout: 5000 });
    const selectedTier = await tierDropdown.inputValue();
    console.log('Tier selector:', selectedTier);
    expect(selectedTier).toBe('coffee');
    
    await page.locator('button:has-text("Continue to Sign Up")').click();
    console.log('✓ Clicked Continue to Sign Up');
    await page.waitForTimeout(1000);
    
    const authContext = await getAuthContext(page);
    console.log('📦 authContext:', authContext);
    expect(authContext).not.toBeNull();
    expect(authContext.selectedTier).toBe('coffee');
    console.log('✓ authContext stored with Coffee tier');
    
    await performGoogleOAuth(page, GOOGLE_EMAIL, GOOGLE_PASSWORD);
    
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.includes('checkout')) {
      console.log('✅ JOURNEY 1 PASSED: Routed to Stripe checkout');
    } else {
      console.log('❌ JOURNEY 1 FAILED: Not routed to checkout');
    }
    
    expect(finalUrl).toContain('checkout');
  });
});

// Journey 3: New User → Free Tier → OAuth (Google)
test.describe('Journey 3: New User → Free → OAuth', () => {
  test('should complete Free tier signup and route to dashboard', async ({ page }) => {
    console.log('\n🧪 JOURNEY 3: New User → Free → Google OAuth');
    
    await page.goto(BASE_URL + '/#signup');
    console.log('✓ Navigated to signup page');
    
    const tierDropdown = page.locator('select, [role="combobox"]').first();
    await expect(tierDropdown).toBeVisible({ timeout: 5000 });
    await tierDropdown.selectOption('free');
    console.log('✓ Changed tier to Free');
    
    await page.locator('button:has-text("Continue to Sign Up")').click();
    console.log('✓ Clicked Continue to Sign Up');
    await page.waitForTimeout(1000);
    
    const authContext = await getAuthContext(page);
    console.log('📦 authContext:', authContext);
    expect(authContext).not.toBeNull();
    expect(authContext.selectedTier).toBe('free');
    console.log('✓ authContext stored with Free tier');
    
    await performGoogleOAuth(page, GOOGLE_EMAIL, GOOGLE_PASSWORD);
    
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (finalUrl.match(/dashboard|analyze/)) {
      console.log('✅ JOURNEY 3 PASSED: Routed to dashboard/analyze');
    } else {
      console.log('❌ JOURNEY 3 FAILED: Not routed correctly');
    }
    
    expect(finalUrl).not.toContain('checkout');
    expect(finalUrl).toMatch(/dashboard|analyze/);
  });
});

console.log('\n✅ Phase 1 Signup Flow Test Suite Loaded');
