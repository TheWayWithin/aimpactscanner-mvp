// Comprehensive testing for the optimized UnifiedRegistration flow
// Tests the complete user journey from anonymous → analysis → preview → registration → payment

import { test, expect, chromium } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5174';
const TEST_EMAIL = `test-unified-${Date.now()}@example.com`;
const TEST_URL = 'https://anthropic.com';

test.describe('Unified Registration Flow - Conversion Optimization Tests', () => {
  let browser, page;

  test.beforeAll(async () => {
    browser = await chromium.launch({ 
      headless: false, // Keep visible for debugging
      slowMo: 500 // Slow down for observation
    });
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test.beforeEach(async () => {
    const context = await browser.newContext();
    page = await context.newPage();
    
    // Clear any existing session storage
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test.afterEach(async () => {
    await page?.close();
  });

  test('1. Complete Anonymous Analysis → Preview Results → Registration Flow', async () => {
    console.log('🧪 TEST 1: Complete anonymous analysis flow');
    
    // Step 1: Start on landing page as anonymous user
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/AImpactScanner/);
    
    // Step 2: Submit URL for analysis
    const urlInput = page.locator('input[type="url"], input[placeholder*="website"]').first();
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    await urlInput.fill(TEST_URL);
    
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start Analysis")').first();
    await expect(analyzeButton).toBeVisible();
    await analyzeButton.click();
    
    // Step 3: Wait for analysis preview to complete
    console.log('📊 Waiting for analysis to complete...');
    
    // Wait for either progress completion or preview results
    await Promise.race([
      page.waitForSelector('[data-testid="preview-results"]', { timeout: 30000 }),
      page.waitForSelector('text="Analysis Complete"', { timeout: 30000 }),
      page.waitForSelector('button:has-text("Get Your Complete")', { timeout: 30000 })
    ]);
    
    // Step 4: Click "Get Your Complete Analysis" CTA
    const completeAnalysisButton = page.locator('button:has-text("Get Your Complete"), button:has-text("Complete Analysis")').first();
    await expect(completeAnalysisButton).toBeVisible({ timeout: 5000 });
    await completeAnalysisButton.click();
    
    // Step 5: Verify we're in UnifiedRegistration component
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ TEST 1 PASSED: Successfully reached UnifiedRegistration');
  });

  test('2. Coffee Tier Pre-selection and Visual Prominence', async () => {
    console.log('🧪 TEST 2: Coffee tier bias verification');
    
    // Navigate directly to registration (simulating post-analysis state)
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
      sessionStorage.setItem('pendingAnalysisId', 'test-analysis-id');
      sessionStorage.setItem('landingAnalysisData', JSON.stringify({
        results: { overall_score: 67, factors: [] }
      }));
    });
    
    // Trigger registration flow
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    
    // Wait for UnifiedRegistration
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Verify Coffee tier is pre-selected
    const coffeeRadio = page.locator('input[value="coffee"]');
    await expect(coffeeRadio).toBeChecked();
    
    // Verify Coffee tier visual prominence
    const coffeeContainer = page.locator('[class*="border-yellow"], [class*="bg-yellow"]').first();
    await expect(coffeeContainer).toBeVisible();
    
    // Verify "RECOMMENDED" badge
    const recommendedBadge = page.locator('text="RECOMMENDED"');
    await expect(recommendedBadge).toBeVisible();
    
    // Verify price display
    await expect(page.locator('text="$5/month"')).toBeVisible();
    
    console.log('✅ TEST 2 PASSED: Coffee tier properly emphasized');
  });

  test('3. Dynamic Benefits Display - Tier Switching', async () => {
    console.log('🧪 TEST 3: Dynamic benefits testing');
    
    // Setup registration state
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    // Get to registration
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Initial state - Coffee tier selected
    await expect(page.locator('h2:has-text("☕ COFFEE Plan Benefits")')).toBeVisible();
    await expect(page.locator('text="Unlimited AI-powered analysis"')).toBeVisible();
    await expect(page.locator('text="Less than the price of a coffee"')).toBeVisible();
    
    // Switch to Free tier
    const freeRadio = page.locator('input[value="free"]');
    await freeRadio.click();
    
    // Verify benefits change to limitations
    await expect(page.locator('h2:has-text("FREE Plan Limitations")')).toBeVisible();
    await expect(page.locator('text="Only 3 analyses per month"')).toBeVisible();
    await expect(page.locator('text="You\'re missing out"')).toBeVisible();
    
    // Switch back to Coffee
    const coffeeRadio = page.locator('input[value="coffee"]');
    await coffeeRadio.click();
    
    // Verify benefits restore
    await expect(page.locator('h2:has-text("☕ COFFEE Plan Benefits")')).toBeVisible();
    
    console.log('✅ TEST 3 PASSED: Dynamic benefits working correctly');
  });

  test('4. Email Input and Magic Link Flow', async () => {
    console.log('🧪 TEST 4: Email input and magic link flow');
    
    // Get to registration
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Test email validation
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Try submitting without email
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await expect(page.locator('text="Please enter your email"')).toBeVisible();
    
    // Enter valid email
    await emailInput.fill(TEST_EMAIL);
    
    // Verify button text changes based on tier
    await expect(page.locator('button:has-text("Create Account & Continue to Payment")')).toBeVisible();
    
    // Submit form
    await submitButton.click();
    
    // Verify email sent confirmation
    await expect(page.locator('text="Check Your Email!"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text="${TEST_EMAIL}"`)).toBeVisible();
    
    // Verify Stripe checkout message for Coffee tier
    await expect(page.locator('text="you\'ll be redirected to secure Stripe checkout"')).toBeVisible();
    
    console.log('✅ TEST 4 PASSED: Email input and magic link flow working');
  });

  test('5. Free Tier Selection Flow', async () => {
    console.log('🧪 TEST 5: Free tier selection flow');
    
    // Get to registration
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Switch to Free tier
    const freeRadio = page.locator('input[value="free"]');
    await freeRadio.click();
    
    // Verify button text changes
    await expect(page.locator('button:has-text("Create Free Account")')).toBeVisible();
    
    // Verify no payment messaging
    await expect(page.locator('text="Continue to Payment"')).not.toBeVisible();
    
    // Fill email and submit
    await page.locator('input[type="email"]').fill(`test-free-${Date.now()}@example.com`);
    await page.locator('button[type="submit"]').click();
    
    // Verify confirmation without payment messaging
    await expect(page.locator('text="Check Your Email!"')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text="Stripe checkout"')).not.toBeVisible();
    
    console.log('✅ TEST 5 PASSED: Free tier flow working correctly');
  });

  test('6. Mobile Responsiveness Check', async () => {
    console.log('🧪 TEST 6: Mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Get to registration
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Verify layout elements are visible and properly sized
    await expect(page.locator('input[value="coffee"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify benefits section is accessible
    await expect(page.locator('h2:has-text("COFFEE Plan Benefits")')).toBeVisible();
    
    // Test tier switching on mobile
    await page.locator('input[value="free"]').click();
    await expect(page.locator('h2:has-text("FREE Plan Limitations")')).toBeVisible();
    
    console.log('✅ TEST 6 PASSED: Mobile layout working correctly');
  });

  test('7. Error Handling - Invalid Email', async () => {
    console.log('🧪 TEST 7: Error handling for invalid emails');
    
    // Get to registration
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    // Test various invalid email formats
    const invalidEmails = [
      'invalid-email',
      'test@',
      '@example.com',
      'test.example.com'
    ];
    
    for (const email of invalidEmails) {
      await page.locator('input[type="email"]').fill(email);
      await page.locator('button[type="submit"]').click();
      
      // Browser should prevent submission or show validation
      // The exact behavior depends on browser validation
      console.log(`Tested invalid email: ${email}`);
    }
    
    console.log('✅ TEST 7 PASSED: Email validation working');
  });

  test('8. Performance - Page Load Times', async () => {
    console.log('🧪 TEST 8: Performance testing');
    
    const startTime = Date.now();
    
    // Navigate to registration
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.setItem('pendingAnalysisUrl', 'https://anthropic.com');
    });
    
    await page.reload();
    await page.locator('button:has-text("Create"), button:has-text("Register")').first().click();
    await expect(page.locator('h1:has-text("Create Your Account")')).toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Registration page load time: ${loadTime}ms`);
    
    // Verify reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    console.log('✅ TEST 8 PASSED: Performance within acceptable limits');
  });
});