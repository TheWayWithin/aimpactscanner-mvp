/**
 * Step 1.3 - Route Protection Validation Test Suite
 * 
 * This test validates that the route protection system is working correctly
 * with the authentication system after the deferred route protection fix.
 * 
 * Test Scenarios:
 * 1. Direct navigation to /dashboard without authentication
 * 2. OAuth authentication flow with protected route access
 * 3. Magic link authentication with protected route navigation
 * 4. Session persistence across page refreshes with protected routes
 * 5. Cross-browser validation of route protection
 */

import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEMP_EMAIL_DOMAIN = 'tempmail.lol';
const TEST_TIMEOUT = 30000;

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  testSuites: [],
  overallStatus: 'UNKNOWN',
  criticalIssues: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// Utility function to add test result
function addTestResult(suiteName, testName, status, details = '', evidence = '') {
  let suite = results.testSuites.find(s => s.name === suiteName);
  if (!suite) {
    suite = { name: suiteName, tests: [], passed: 0, failed: 0 };
    results.testSuites.push(suite);
  }
  
  const test = {
    name: testName,
    status: status,
    details: details,
    evidence: evidence,
    timestamp: new Date().toISOString()
  };
  
  suite.tests.push(test);
  if (status === 'PASS') {
    suite.passed++;
    results.summary.passed++;
  } else {
    suite.failed++;
    results.summary.failed++;
    if (details.includes('CRITICAL') || details.includes('SECURITY')) {
      results.criticalIssues.push({
        suite: suiteName,
        test: testName,
        details: details
      });
    }
  }
  results.summary.total++;
}

// Utility function to wait with timeout
async function waitWithTimeout(page, selector, timeout = TEST_TIMEOUT) {
  try {
    await page.waitForSelector(selector, { timeout: timeout });
    return true;
  } catch (error) {
    console.log(`Timeout waiting for ${selector}: ${error.message}`);
    return false;
  }
}

// Utility function to capture evidence
async function captureEvidence(page, testName) {
  const screenshotPath = path.join(__dirname, 'test-results', `step1-3-${testName.replace(/\s+/g, '-').toLowerCase()}.png`);
  
  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch (error) {
    console.log(`Failed to capture screenshot: ${error.message}`);
    return '';
  }
}

// Test Suite 1: Direct Navigation to Protected Routes
async function testDirectNavigation(browser) {
  console.log('\n=== Test Suite 1: Direct Navigation to Protected Routes ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear any existing session data
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔄 Testing direct navigation to /dashboard without authentication...');
    
    // Navigate directly to dashboard via hash
    await page.goto(`${BASE_URL}#dashboard`);
    await page.waitForTimeout(2000); // Wait for route processing
    
    // Check the current URL and page content
    const currentURL = await page.url();
    const currentHash = await page.evaluate(() => window.location.hash);
    const pageContent = await page.content();
    
    console.log(`Current URL: ${currentURL}`);
    console.log(`Current Hash: ${currentHash}`);
    
    // Check if we're redirected away from dashboard
    const isOnDashboard = currentHash.includes('dashboard');
    const isOnLanding = pageContent.includes('AI Impact Scanner') || pageContent.includes('Analyze') || currentHash === '' || currentHash === '#';
    
    const evidence = await captureEvidence(page, 'direct-navigation-dashboard');
    
    if (!isOnDashboard && isOnLanding) {
      addTestResult(
        'Direct Navigation Protection',
        'Dashboard Access Without Auth',
        'PASS',
        `✅ PROTECTED: Unauthenticated user correctly redirected away from dashboard. Current hash: ${currentHash}`,
        evidence
      );
    } else {
      addTestResult(
        'Direct Navigation Protection',
        'Dashboard Access Without Auth',
        'FAIL',
        `❌ CRITICAL SECURITY ISSUE: Unauthenticated user can access dashboard! Current hash: ${currentHash}`,
        evidence
      );
    }
    
    // Test other protected routes
    const protectedRoutes = ['profile', 'settings', 'subscription', 'history'];
    
    for (const route of protectedRoutes) {
      console.log(`🔄 Testing direct navigation to /${route}...`);
      
      await page.goto(`${BASE_URL}#${route}`);
      await page.waitForTimeout(1500);
      
      const routeHash = await page.evaluate(() => window.location.hash);
      const isOnProtectedRoute = routeHash.includes(route);
      const isRedirectedAway = !isOnProtectedRoute;
      
      const routeEvidence = await captureEvidence(page, `direct-navigation-${route}`);
      
      if (isRedirectedAway) {
        addTestResult(
          'Direct Navigation Protection',
          `${route.charAt(0).toUpperCase() + route.slice(1)} Route Protection`,
          'PASS',
          `✅ PROTECTED: Route /${route} correctly redirects unauthenticated users`,
          routeEvidence
        );
      } else {
        addTestResult(
          'Direct Navigation Protection',
          `${route.charAt(0).toUpperCase() + route.slice(1)} Route Protection`,
          'FAIL',
          `❌ SECURITY ISSUE: Route /${route} accessible without authentication`,
          routeEvidence
        );
      }
    }
    
  } catch (error) {
    addTestResult(
      'Direct Navigation Protection',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 2: OAuth Authentication Flow Integration
async function testOAuthFlow(browser) {
  console.log('\n=== Test Suite 2: OAuth Authentication Flow Integration ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear session data
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔄 Testing OAuth flow initiation from protected route...');
    
    // Try to access dashboard (should trigger auth flow)
    await page.goto(`${BASE_URL}#dashboard`);
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to authentication
    const currentHash = await page.evaluate(() => window.location.hash);
    const pageContent = await page.content();
    
    // Look for auth elements
    const hasGoogleAuth = await page.locator('text=Google').count() > 0;
    const hasSignInOption = pageContent.includes('Sign in') || pageContent.includes('Sign up') || pageContent.includes('Continue with');
    
    const evidence = await captureEvidence(page, 'oauth-flow-initiation');
    
    if (hasGoogleAuth || hasSignInOption) {
      addTestResult(
        'OAuth Authentication Flow',
        'Auth Flow Initiation from Protected Route',
        'PASS',
        `✅ WORKING: Accessing protected route correctly initiates authentication flow`,
        evidence
      );
    } else {
      addTestResult(
        'OAuth Authentication Flow',
        'Auth Flow Initiation from Protected Route',
        'FAIL',
        `❌ FAILED: Protected route access does not initiate authentication flow`,
        evidence
      );
    }
    
    // Test OAuth callback handling (simulate)
    console.log('🔄 Testing OAuth callback route protection...');
    
    // Navigate to OAuth callback with mock token
    await page.goto(`${BASE_URL}#/oauth-callback?access_token=mock_token&token_type=bearer`);
    await page.waitForTimeout(3000);
    
    const callbackHash = await page.evaluate(() => window.location.hash);
    const callbackEvidence = await captureEvidence(page, 'oauth-callback-handling');
    
    // The callback should either process the token or redirect appropriately
    const isProcessingCallback = callbackHash.includes('oauth-callback') || callbackHash === '#' || callbackHash === '';
    
    if (isProcessingCallback) {
      addTestResult(
        'OAuth Authentication Flow',
        'OAuth Callback Route Handling',
        'PASS',
        `✅ WORKING: OAuth callback route handling correctly. Hash: ${callbackHash}`,
        callbackEvidence
      );
    } else {
      addTestResult(
        'OAuth Authentication Flow',
        'OAuth Callback Route Handling',
        'FAIL',
        `❌ ISSUE: OAuth callback not handling properly. Hash: ${callbackHash}`,
        callbackEvidence
      );
    }
    
  } catch (error) {
    addTestResult(
      'OAuth Authentication Flow',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 3: Session Persistence with Route Protection
async function testSessionPersistence(browser) {
  console.log('\n=== Test Suite 3: Session Persistence with Route Protection ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear initial session
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔄 Testing session persistence across page refreshes...');
    
    // Simulate an authenticated session
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh',
        user: {
          id: 'mock_user_id',
          email: 'test@example.com'
        }
      }));
    });
    
    // Navigate to dashboard
    await page.goto(`${BASE_URL}#dashboard`);
    await page.waitForTimeout(2000);
    
    let currentHash = await page.evaluate(() => window.location.hash);
    const evidence1 = await captureEvidence(page, 'session-persistence-before-refresh');
    
    console.log(`Before refresh - Hash: ${currentHash}`);
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(3000); // Wait for session restoration
    
    currentHash = await page.evaluate(() => window.location.hash);
    const evidence2 = await captureEvidence(page, 'session-persistence-after-refresh');
    
    console.log(`After refresh - Hash: ${currentHash}`);
    
    // Check if session persisted
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    
    const hasSessionData = !!sessionData;
    
    if (hasSessionData) {
      addTestResult(
        'Session Persistence',
        'Session Data Persistence Across Refresh',
        'PASS',
        `✅ WORKING: Session data persists across page refreshes`,
        evidence2
      );
    } else {
      addTestResult(
        'Session Persistence',
        'Session Data Persistence Across Refresh',
        'FAIL',
        `❌ FAILED: Session data lost after page refresh`,
        evidence2
      );
    }
    
    // Test deferred route processing
    console.log('🔄 Testing deferred route processing...');
    
    // Clear session and set a pending route
    await page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token');
      localStorage.setItem('initial_route_pending', '#dashboard');
    });
    
    // Refresh and check if pending route is processed
    await page.reload();
    await page.waitForTimeout(2000);
    
    const pendingRoute = await page.evaluate(() => {
      return localStorage.getItem('initial_route_pending');
    });
    
    const finalHash = await page.evaluate(() => window.location.hash);
    const evidence3 = await captureEvidence(page, 'deferred-route-processing');
    
    // Pending route should be cleared and user should be redirected away from dashboard
    const isPendingRouteCleared = !pendingRoute;
    const isRedirectedFromDashboard = !finalHash.includes('dashboard');
    
    if (isPendingRouteCleared && isRedirectedFromDashboard) {
      addTestResult(
        'Session Persistence',
        'Deferred Route Processing',
        'PASS',
        `✅ WORKING: Deferred route processing works correctly. Final hash: ${finalHash}`,
        evidence3
      );
    } else {
      addTestResult(
        'Session Persistence',
        'Deferred Route Processing',
        'FAIL',
        `❌ ISSUE: Deferred route processing failed. Pending: ${pendingRoute}, Hash: ${finalHash}`,
        evidence3
      );
    }
    
  } catch (error) {
    addTestResult(
      'Session Persistence',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 4: Cross-Browser Route Protection
async function testCrossBrowser() {
  console.log('\n=== Test Suite 4: Cross-Browser Route Protection ===');
  
  const browsers = [
    { name: 'Chromium', instance: chromium },
    { name: 'Firefox', instance: firefox },
    { name: 'WebKit', instance: webkit }
  ];
  
  for (const browserInfo of browsers) {
    try {
      console.log(`🔄 Testing route protection in ${browserInfo.name}...`);
      
      const browser = await browserInfo.instance.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Clear session data
      await page.goto(BASE_URL);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Test dashboard protection
      await page.goto(`${BASE_URL}#dashboard`);
      await page.waitForTimeout(2000);
      
      const currentHash = await page.evaluate(() => window.location.hash);
      const isProtected = !currentHash.includes('dashboard');
      
      const evidence = await captureEvidence(page, `cross-browser-${browserInfo.name.toLowerCase()}`);
      
      if (isProtected) {
        addTestResult(
          'Cross-Browser Compatibility',
          `${browserInfo.name} Route Protection`,
          'PASS',
          `✅ WORKING: Route protection works in ${browserInfo.name}`,
          evidence
        );
      } else {
        addTestResult(
          'Cross-Browser Compatibility',
          `${browserInfo.name} Route Protection`,
          'FAIL',
          `❌ FAILED: Route protection fails in ${browserInfo.name}`,
          evidence
        );
      }
      
      await browser.close();
      
    } catch (error) {
      addTestResult(
        'Cross-Browser Compatibility',
        `${browserInfo.name} Test Error`,
        'FAIL',
        `❌ Test execution failed in ${browserInfo.name}: ${error.message}`,
        ''
      );
    }
  }
}

// Main test execution
async function runValidationSuite() {
  console.log('🚀 Starting Step 1.3 Route Protection Validation Suite...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  try {
    // Launch primary browser
    const browser = await chromium.launch({ headless: true });
    
    // Run test suites
    await testDirectNavigation(browser);
    await testOAuthFlow(browser);
    await testSessionPersistence(browser);
    
    await browser.close();
    
    // Run cross-browser tests
    await testCrossBrowser();
    
  } catch (error) {
    console.error('❌ Fatal error during test execution:', error);
    addTestResult(
      'Test Execution',
      'Fatal Error',
      'FAIL',
      `❌ Fatal test execution error: ${error.message}`,
      ''
    );
  }
  
  // Calculate final results
  results.summary.successRate = results.summary.total > 0 ? 
    Math.round((results.summary.passed / results.summary.total) * 100) : 0;
  
  // Determine overall status
  if (results.criticalIssues.length > 0) {
    results.overallStatus = 'CRITICAL_FAILURE';
  } else if (results.summary.successRate >= 95) {
    results.overallStatus = 'SUCCESS';
  } else if (results.summary.successRate >= 80) {
    results.overallStatus = 'WARNING';
  } else {
    results.overallStatus = 'FAILURE';
  }
  
  // Generate report
  generateReport();
}

// Generate comprehensive test report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STEP 1.3 ROUTE PROTECTION VALIDATION RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n🏆 OVERALL STATUS: ${results.overallStatus}`);
  console.log(`📈 SUCCESS RATE: ${results.summary.successRate}% (${results.summary.passed}/${results.summary.total})`);
  console.log(`⏰ Test Execution Time: ${results.timestamp}`);
  
  if (results.criticalIssues.length > 0) {
    console.log(`\n🚨 CRITICAL ISSUES FOUND: ${results.criticalIssues.length}`);
    results.criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. [${issue.suite}] ${issue.test}`);
      console.log(`     ${issue.details}`);
    });
  }
  
  console.log('\n📋 DETAILED TEST RESULTS:');
  results.testSuites.forEach(suite => {
    console.log(`\n  ${suite.name}: ${suite.passed}/${suite.tests.length} passed`);
    suite.tests.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`    ${status} ${test.name}`);
      if (test.details) {
        console.log(`      ${test.details}`);
      }
    });
  });
  
  // Assessment and recommendations
  console.log('\n🎯 ASSESSMENT:');
  if (results.overallStatus === 'SUCCESS') {
    console.log('✅ Route protection system is working correctly with authentication');
    console.log('✅ All critical security vulnerabilities have been resolved');
    console.log('✅ Ready for Step 1.4 comprehensive validation');
  } else if (results.overallStatus === 'WARNING') {
    console.log('⚠️  Route protection mostly working but some issues remain');
    console.log('⚠️  Review failed test cases before proceeding');
  } else {
    console.log('❌ Critical route protection issues remain');
    console.log('❌ UAT cannot proceed until issues are resolved');
  }
  
  console.log('\n📁 Evidence files saved in test-results/ directory');
  console.log('='.repeat(80));
  
  // Save detailed report to file
  const reportPath = path.join(__dirname, 'test-results', 'step1-3-route-protection-validation-report.json');
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
}

// Run the validation suite
if (import.meta.url === `file://${process.argv[1]}`) {
  runValidationSuite().catch(console.error);
}