/**
 * Trial Flow Diagnosis Test
 *
 * This test will:
 * 1. Navigate to signup page
 * 2. Click the GREEN trial button
 * 3. Capture ALL console logs
 * 4. Monitor localStorage/sessionStorage
 * 5. Track the complete flow
 *
 * This will show EXACTLY what happens when the trial button is clicked.
 */

import { test, expect } from '@playwright/test';

test('Diagnose Growth trial flow - capture everything', async ({ page, context }) => {
  // Enable console logging
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Monitor network requests
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('stripe')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        postData: request.postData()
      });
    }
  });

  // Monitor localStorage/sessionStorage changes
  const storageChanges = [];

  // Step 1: Navigate to signup page
  console.log('Step 1: Navigating to signup page...');
  await page.goto('https://develop--aimpactscanner.netlify.app/#signup');
  await page.waitForTimeout(2000);

  // Capture initial state
  const initialStorage = await page.evaluate(() => ({
    localStorage: JSON.parse(JSON.stringify(localStorage)),
    sessionStorage: JSON.parse(JSON.stringify(sessionStorage))
  }));
  console.log('Initial storage:', JSON.stringify(initialStorage, null, 2));

  // Step 2: Wait for page to load
  console.log('Step 2: Waiting for Signup component to mount...');
  await page.waitForSelector('text=Growth', { timeout: 10000 });

  // Check if Signup component mounted
  const signupMountLog = consoleLogs.find(log => log.includes('🚀 Signup component mounted'));
  console.log('Signup mount log found:', !!signupMountLog);

  // Step 3: Click Growth tier to select it
  console.log('Step 3: Clicking Growth tier...');
  await page.click('input[type="radio"][value="growth"]');
  await page.waitForTimeout(500);

  // Step 4: Look for the GREEN trial button
  console.log('Step 4: Looking for trial button...');

  // Take screenshot
  await page.screenshot({ path: 'test-results/trial-button-before-click.png', fullPage: true });

  // Try to find the trial button
  const trialButtonVisible = await page.isVisible('text=🎁 Try Growth Free for 7 Days');
  console.log('Trial button visible:', trialButtonVisible);

  if (!trialButtonVisible) {
    console.log('ERROR: Trial button not visible!');
    console.log('Looking for all buttons on page:');
    const buttons = await page.$$eval('button', btns => btns.map(b => b.textContent));
    console.log('Buttons found:', buttons);

    // Save console logs for debugging
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));

    throw new Error('Trial button not found!');
  }

  // Step 5: Click the GREEN trial button
  console.log('Step 5: Clicking GREEN trial button...');
  const storageBeforeClick = await page.evaluate(() => ({
    localStorage: JSON.parse(JSON.stringify(localStorage)),
    sessionStorage: JSON.parse(JSON.stringify(sessionStorage))
  }));

  await page.click('text=🎁 Try Growth Free for 7 Days');
  await page.waitForTimeout(1000);

  // Step 6: Check storage after click
  const storageAfterClick = await page.evaluate(() => ({
    localStorage: JSON.parse(JSON.stringify(localStorage)),
    sessionStorage: JSON.parse(JSON.stringify(sessionStorage))
  }));

  console.log('\n=== STORAGE CHANGES ===');
  console.log('Before click:', JSON.stringify(storageBeforeClick, null, 2));
  console.log('After click:', JSON.stringify(storageAfterClick, null, 2));

  // Check if authContext was created
  const authContext = storageAfterClick.localStorage['authContext'];
  if (authContext) {
    console.log('\n✅ authContext created:', authContext);
    const parsed = JSON.parse(authContext);
    console.log('Parsed authContext:', JSON.stringify(parsed, null, 2));
    console.log('isTrial value:', parsed.isTrial);
    console.log('isTrial type:', typeof parsed.isTrial);

    if (parsed.isTrial !== true) {
      console.log('❌ ERROR: isTrial is NOT true! Value:', parsed.isTrial);
    }
  } else {
    console.log('\n❌ ERROR: authContext NOT created in localStorage!');
  }

  // Step 7: Check if OAuth buttons appeared
  await page.waitForTimeout(1000);
  const oauthButtonsVisible = await page.isVisible('text=Continue with Google');
  console.log('OAuth buttons visible:', oauthButtonsVisible);

  // Take screenshot after click
  await page.screenshot({ path: 'test-results/trial-button-after-click.png', fullPage: true });

  // Step 8: Print all console logs related to trial
  console.log('\n=== TRIAL-RELATED CONSOLE LOGS ===');
  const trialLogs = consoleLogs.filter(log =>
    log.includes('trial') ||
    log.includes('Trial') ||
    log.includes('isTrial') ||
    log.includes('TierOptionsList') ||
    log.includes('DynamicTierSelector') ||
    log.includes('Signup')
  );
  trialLogs.forEach(log => console.log(log));

  // Step 9: Print ALL console logs
  console.log('\n=== ALL CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));

  // Step 10: Print network requests
  console.log('\n=== NETWORK REQUESTS ===');
  networkRequests.forEach(req => {
    console.log(`${req.method} ${req.url}`);
    if (req.postData) {
      console.log('  Body:', req.postData);
    }
  });

  // Final assertions
  expect(signupMountLog).toBeTruthy();
  expect(trialButtonVisible).toBe(true);
  expect(authContext).toBeTruthy();

  if (authContext) {
    const parsed = JSON.parse(authContext);
    expect(parsed.isTrial).toBe(true);
    expect(parsed.selectedTier).toBe('growth');
  }
});
