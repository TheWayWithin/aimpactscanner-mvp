// OAuth Flow Diagnostic Tests
// Purpose: Identify exact failure point in OAuth authentication
// NO MANUAL TESTING REQUIRED - Fully automated

import { test, expect } from '@playwright/test';

test.describe('OAuth Flow Diagnostics', () => {

  test('Test 1: OAuth Token Detection in URL Hash', async ({ page }) => {
    console.log('\n🧪 TEST 1: OAuth Token Detection');

    const logs = [];
    const errors = [];

    // Capture all console output
    page.on('console', msg => {
      const text = msg.text();
      logs.push({ type: msg.type(), text });
      console.log(`  [${msg.type()}] ${text}`);
    });

    // Capture errors
    page.on('pageerror', err => {
      errors.push(err.message);
      console.log(`  [ERROR] ${err.message}`);
    });

    // Navigate to app
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    console.log('  📍 Initial page loaded');

    // Manually inject OAuth token URL (simulating Supabase OAuth redirect)
    console.log('  🔐 Simulating OAuth redirect with tokens in URL hash...');
    await page.goto('http://localhost:5173/#access_token=mock_token_12345&refresh_token=mock_refresh_67890&expires_in=3600&token_type=bearer');

    // Wait for routing logic to execute
    await page.waitForTimeout(3000);

    // Check current route
    const hash = await page.evaluate(() => window.location.hash);
    console.log(`  📍 Final hash: ${hash}`);

    // Check for routing logs
    const routingLogs = logs.filter(log =>
      log.text.includes('ROUTING TO') ||
      log.text.includes('APP INIT') ||
      log.text.includes('Setting view')
    );

    console.log(`  📊 Routing logs found: ${routingLogs.length}`);
    routingLogs.forEach(log => console.log(`    - ${log.text}`));

    // Check for GDPR logs only
    const gdprOnlyLogs = logs.filter(log =>
      log.text.includes('GDPR') || log.text.includes('consent')
    );
    console.log(`  📊 GDPR logs found: ${gdprOnlyLogs.length}`);

    // DIAGNOSTIC RESULTS
    console.log('\n  📋 DIAGNOSTIC RESULTS:');
    console.log(`    Expected hash: #oauth-callback or contains 'oauth-callback'`);
    console.log(`    Actual hash: ${hash}`);
    console.log(`    Routing logs present: ${routingLogs.length > 0 ? 'YES ✅' : 'NO ❌'}`);
    console.log(`    Only GDPR logs: ${gdprOnlyLogs.length > 0 && routingLogs.length === 0 ? 'YES ⚠️' : 'NO'}`);
    console.log(`    JavaScript errors: ${errors.length}`);

    // ASSERTIONS
    if (hash.includes('oauth-callback')) {
      console.log('  ✅ PASS: Correctly routed to oauth-callback');
    } else if (hash.includes('unified-registration')) {
      console.log('  ❌ FAIL: Routed to error page (unified-registration)');
      console.log('  🔍 ROOT CAUSE: Hash routing conflict - OAuth tokens not detected');
    } else if (hash.includes('landing')) {
      console.log('  ❌ FAIL: Routed to landing page');
      console.log('  🔍 ROOT CAUSE: Default route fallback triggered');
    } else {
      console.log(`  ⚠️ UNEXPECTED: Routed to ${hash}`);
    }

    // Save diagnostic data
    await page.screenshot({ path: 'test-results/oauth-token-detection.png' });
  });

  test('Test 2: Magic Link Redirect Detection', async ({ page }) => {
    console.log('\n🧪 TEST 2: Magic Link Redirect Detection');

    const logs = [];
    page.on('console', msg => {
      logs.push({ type: msg.type(), text: msg.text() });
      console.log(`  [${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);

    // Simulate magic link redirect (no tokens in URL, just path)
    console.log('  ✉️ Simulating magic link redirect to /#/oauth-callback...');
    await page.goto('http://localhost:5173/#/oauth-callback');

    await page.waitForTimeout(3000);

    const hash = await page.evaluate(() => window.location.hash);
    console.log(`  📍 Final hash: ${hash}`);

    const routingLogs = logs.filter(log =>
      log.text.includes('Magic link redirect detected') ||
      log.text.includes('ROUTING TO oauth-callback')
    );

    console.log('\n  📋 DIAGNOSTIC RESULTS:');
    console.log(`    Expected: Stay at #/oauth-callback`);
    console.log(`    Actual: ${hash}`);
    console.log(`    Magic link detection logs: ${routingLogs.length}`);

    await page.screenshot({ path: 'test-results/magic-link-detection.png' });
  });

  test('Test 3: GDPR Banner Count', async ({ page }) => {
    console.log('\n🧪 TEST 3: GDPR Banner Detection');

    // Clear storage to simulate first visit
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Count all cookie/consent banners
    const bannerSelectors = [
      '[data-testid="consent-banner"]',
      '#ez-cookie-notification',
      '.enzuzo-cookiebanner-container',
      '.ez-consent',
      '[id*="cookieyes"]',
      '[class*="cookieyes"]',
      '[id*="cookie-banner"]',
      '[class*="cookie-banner"]',
      '[class*="consent"]'
    ];

    const foundBanners = [];
    for (const selector of bannerSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const isVisible = await page.locator(selector).first().isVisible();
        foundBanners.push({ selector, count, visible: isVisible });
        console.log(`  🍪 Found: ${selector} (count: ${count}, visible: ${isVisible})`);
      }
    }

    console.log('\n  📋 DIAGNOSTIC RESULTS:');
    console.log(`    Total banner elements found: ${foundBanners.length}`);
    console.log(`    Visible banners: ${foundBanners.filter(b => b.visible).length}`);

    if (foundBanners.filter(b => b.visible).length > 1) {
      console.log('  ❌ FAIL: Multiple GDPR banners detected!');
      console.log('  🔍 ROOT CAUSE: Third-party consent script still loading');
    } else if (foundBanners.filter(b => b.visible).length === 1) {
      console.log('  ✅ PASS: Only one GDPR banner visible');
    } else {
      console.log('  ⚠️ WARNING: No GDPR banner found');
    }

    await page.screenshot({ path: 'test-results/gdpr-banners.png' });
  });

  test('Test 4: Console Log Flow Analysis', async ({ page }) => {
    console.log('\n🧪 TEST 4: Console Log Flow Analysis');

    const logs = [];
    page.on('console', msg => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });

    await page.goto('http://localhost:5173/#access_token=test123&refresh_token=test456');
    await page.waitForTimeout(3000);

    console.log('\n  📊 ALL CONSOLE LOGS (in order):');
    logs.forEach((log, i) => {
      console.log(`    ${i + 1}. [${log.type}] ${log.text}`);
    });

    const categories = {
      gdpr: logs.filter(l => l.text.includes('GDPR') || l.text.includes('consent')),
      routing: logs.filter(l => l.text.includes('ROUTING') || l.text.includes('APP INIT')),
      auth: logs.filter(l => l.text.includes('AUTH') || l.text.includes('Session')),
      signup: logs.filter(l => l.text.includes('[SIGNUP]')),
      oauth: logs.filter(l => l.text.includes('OAuth') || l.text.includes('callback'))
    };

    console.log('\n  📋 DIAGNOSTIC RESULTS:');
    console.log(`    GDPR logs: ${categories.gdpr.length}`);
    console.log(`    Routing logs: ${categories.routing.length}`);
    console.log(`    Auth logs: ${categories.auth.length}`);
    console.log(`    Signup logs: ${categories.signup.length}`);
    console.log(`    OAuth logs: ${categories.oauth.length}`);

    if (categories.gdpr.length > 0 && categories.routing.length === 0) {
      console.log('  ❌ CRITICAL: Only GDPR logs present, no routing logs!');
      console.log('  🔍 ROOT CAUSE: JavaScript execution blocked or routing code not running');
    }
  });

  test('Test 5: Network Request Analysis', async ({ page }) => {
    console.log('\n🧪 TEST 5: Network Request Analysis');

    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    await page.goto('http://localhost:5173/#/oauth-callback');
    await page.waitForTimeout(3000);

    const supabaseRequests = requests.filter(req => req.url.includes('supabase'));
    const authRequests = requests.filter(req =>
      req.url.includes('/auth/') ||
      req.url.includes('token') ||
      req.url.includes('session')
    );
    const scriptRequests = requests.filter(req => req.resourceType === 'script');

    console.log('\n  📋 DIAGNOSTIC RESULTS:');
    console.log(`    Total requests: ${requests.length}`);
    console.log(`    Supabase requests: ${supabaseRequests.length}`);
    console.log(`    Auth-related requests: ${authRequests.length}`);
    console.log(`    Script requests: ${scriptRequests.length}`);

    console.log('\n  🔍 External scripts loaded:');
    scriptRequests
      .filter(req => !req.url.includes('localhost'))
      .forEach(req => console.log(`    - ${req.url}`));

    if (authRequests.length === 0) {
      console.log('\n  ❌ FAIL: No auth requests made to Supabase');
      console.log('  🔍 ROOT CAUSE: OAuthCallback component not executing');
    }
  });

  test('Test 6: localStorage Inspection', async ({ page }) => {
    console.log('\n🧪 TEST 6: localStorage Inspection');

    await page.goto('http://localhost:5173/#access_token=test123');
    await page.waitForTimeout(2000);

    const storageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key)?.substring(0, 100); // Truncate long values
      }
      return data;
    });

    console.log('\n  📋 localStorage Contents:');
    Object.entries(storageData).forEach(([key, value]) => {
      console.log(`    ${key}: ${value}`);
    });

    const supabaseKeys = Object.keys(storageData).filter(k => k.startsWith('sb-'));
    console.log(`\n  Supabase keys found: ${supabaseKeys.length}`);

    if (supabaseKeys.length === 0) {
      console.log('  ⚠️ WARNING: No Supabase auth data in localStorage');
    }
  });
});
