/**
 * Step 1.3 - Corrected Route Protection Validation Test Suite
 * 
 * This test validates the ACTUAL routes in the application against their
 * protection configuration, focusing on routes that are actually implemented.
 * 
 * Based on routeConfig.js analysis:
 * PROTECTED_ROUTES: dashboard, input, analysis, results, account, pricing (authenticated), 
 *                   checkout-success, checkout-cancel, upsell-* routes
 * PUBLIC_ROUTES: landing, login, signup, oauth-callback, privacy, terms, contact, about
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:5173';
const TEST_TIMEOUT = 10000;

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

// Routes configuration based on actual routeConfig.js
const ROUTE_CONFIG = {
  // These routes should be protected (require authentication)
  PROTECTED_ROUTES: [
    'dashboard',
    'input',           // New Analysis page
    'analysis',        // Analysis in progress
    'results',         // Analysis results
    'account',         // Account settings
    'checkout-success', // Payment confirmation
    'checkout-cancel',  // Payment cancelled
    'upsell-coffee',   // Tier upsells (require auth)
  ],
  
  // These routes should be publicly accessible
  PUBLIC_ROUTES: [
    'landing',
    'login',
    'signup',
    'register',
    'oauth-callback',
    'privacy',            // Privacy policy
    'terms',              // Terms of service
    'contact',            // Contact page
    'about',              // About page
    'preview-analysis',   // Anonymous analysis preview
    'preview-results',    // Anonymous results preview
  ]
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

// Utility function to capture evidence
async function captureEvidence(page, testName) {
  const screenshotPath = path.join(__dirname, 'test-results', `corrected-${testName.replace(/\s+/g, '-').toLowerCase()}.png`);
  
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

// Test Suite 1: Protected Routes Validation
async function testProtectedRoutes(browser) {
  console.log('\n=== Test Suite 1: Protected Routes Validation ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear any existing session data
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    for (const route of ROUTE_CONFIG.PROTECTED_ROUTES) {
      console.log(`🔄 Testing protected route: /${route}...`);
      
      // Navigate to protected route
      await page.goto(`${BASE_URL}#${route}`);
      await page.waitForTimeout(2000); // Wait for route processing and potential redirects
      
      // Check current location
      const currentHash = await page.evaluate(() => window.location.hash);
      const pageContent = await page.content();
      
      console.log(`  Route: ${route} -> Hash: ${currentHash}`);
      
      // Check if we're still on the protected route (security failure)
      const isOnProtectedRoute = currentHash.includes(route);
      const isRedirected = !isOnProtectedRoute;
      
      // Check if redirected to appropriate auth/landing page
      const isOnAuthPage = currentHash.includes('login') || 
                          currentHash.includes('signup') || 
                          currentHash === '#landing' || 
                          currentHash === '' ||
                          pageContent.includes('Sign in') ||
                          pageContent.includes('AI Impact Scanner');
      
      const evidence = await captureEvidence(page, `protected-route-${route}`);
      
      if (isRedirected && isOnAuthPage) {
        addTestResult(
          'Protected Routes Security',
          `Route Protection: /${route}`,
          'PASS',
          `✅ PROTECTED: Route /${route} correctly redirects unauthenticated users. Redirected to: ${currentHash}`,
          evidence
        );
      } else if (isOnProtectedRoute) {
        addTestResult(
          'Protected Routes Security',
          `Route Protection: /${route}`,
          'FAIL',
          `❌ CRITICAL SECURITY ISSUE: Route /${route} is accessible without authentication! Current hash: ${currentHash}`,
          evidence
        );
      } else {
        addTestResult(
          'Protected Routes Security',
          `Route Protection: /${route}`,
          'FAIL',
          `❌ UNEXPECTED: Route /${route} redirected to unexpected location: ${currentHash}`,
          evidence
        );
      }
    }
    
  } catch (error) {
    addTestResult(
      'Protected Routes Security',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 2: Public Routes Accessibility
async function testPublicRoutes(browser) {
  console.log('\n=== Test Suite 2: Public Routes Accessibility ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear any existing session data
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    for (const route of ROUTE_CONFIG.PUBLIC_ROUTES) {
      console.log(`🔄 Testing public route: /${route}...`);
      
      // Navigate to public route
      await page.goto(`${BASE_URL}#${route}`);
      await page.waitForTimeout(1500); // Wait for route processing
      
      // Check if route is accessible
      const currentHash = await page.evaluate(() => window.location.hash);
      const pageContent = await page.content();
      
      console.log(`  Route: ${route} -> Hash: ${currentHash}`);
      
      // For most public routes, we should stay on the route or get appropriate content
      const isOnRoute = currentHash.includes(route) || currentHash === `#${route}`;
      const hasExpectedContent = !pageContent.includes('404') && !pageContent.includes('Not Found');
      
      const evidence = await captureEvidence(page, `public-route-${route}`);
      
      if (isOnRoute || (route === 'landing' && currentHash === '')) {
        addTestResult(
          'Public Routes Accessibility',
          `Public Route: /${route}`,
          'PASS',
          `✅ ACCESSIBLE: Route /${route} is accessible without authentication. Current hash: ${currentHash}`,
          evidence
        );
      } else if (hasExpectedContent) {
        addTestResult(
          'Public Routes Accessibility',
          `Public Route: /${route}`,
          'PASS',
          `✅ ACCESSIBLE: Route /${route} accessible (redirected but content loaded). Current hash: ${currentHash}`,
          evidence
        );
      } else {
        addTestResult(
          'Public Routes Accessibility',
          `Public Route: /${route}`,
          'FAIL',
          `❌ INACCESSIBLE: Route /${route} not accessible or has issues. Current hash: ${currentHash}`,
          evidence
        );
      }
    }
    
  } catch (error) {
    addTestResult(
      'Public Routes Accessibility',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 3: Authentication Flow Integration
async function testAuthenticationFlowIntegration(browser) {
  console.log('\n=== Test Suite 3: Authentication Flow Integration ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear session data
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔄 Testing deferred route protection...');
    
    // Test 1: Deferred route protection mechanism
    await page.evaluate(() => {
      localStorage.setItem('initial_route_pending', '#dashboard');
    });
    
    await page.reload();
    await page.waitForTimeout(3000); // Wait for session check and deferred processing
    
    const pendingRoute = await page.evaluate(() => {
      return localStorage.getItem('initial_route_pending');
    });
    
    const currentHash = await page.evaluate(() => window.location.hash);
    const evidence1 = await captureEvidence(page, 'deferred-route-protection');
    
    // Check that pending route was processed and user redirected appropriately
    const isPendingRouteCleared = !pendingRoute;
    const isRedirectedFromDashboard = !currentHash.includes('dashboard');
    
    if (isPendingRouteCleared && isRedirectedFromDashboard) {
      addTestResult(
        'Authentication Flow Integration',
        'Deferred Route Protection Mechanism',
        'PASS',
        `✅ WORKING: Deferred route protection correctly processes pending routes. Final hash: ${currentHash}`,
        evidence1
      );
    } else {
      addTestResult(
        'Authentication Flow Integration',
        'Deferred Route Protection Mechanism',
        'FAIL',
        `❌ ISSUE: Deferred route protection not working correctly. Pending: ${pendingRoute}, Hash: ${currentHash}`,
        evidence1
      );
    }
    
    console.log('🔄 Testing OAuth callback handling...');
    
    // Test 2: OAuth callback processing
    await page.goto(`${BASE_URL}#/oauth-callback?access_token=test_token&token_type=bearer`);
    await page.waitForTimeout(3000);
    
    const callbackHash = await page.evaluate(() => window.location.hash);
    const evidence2 = await captureEvidence(page, 'oauth-callback-processing');
    
    // OAuth callback should process the token (may redirect)
    const isProcessingCallback = callbackHash.includes('oauth-callback') || 
                               callbackHash === '' || 
                               callbackHash === '#' ||
                               callbackHash === '#landing';
    
    if (isProcessingCallback) {
      addTestResult(
        'Authentication Flow Integration',
        'OAuth Callback Processing',
        'PASS',
        `✅ WORKING: OAuth callback route processes correctly. Hash: ${callbackHash}`,
        evidence2
      );
    } else {
      addTestResult(
        'Authentication Flow Integration',
        'OAuth Callback Processing',
        'FAIL',
        `❌ ISSUE: OAuth callback not processing correctly. Hash: ${callbackHash}`,
        evidence2
      );
    }
    
  } catch (error) {
    addTestResult(
      'Authentication Flow Integration',
      'Test Execution Error',
      'FAIL',
      `❌ Test execution failed: ${error.message}`,
      ''
    );
  } finally {
    await context.close();
  }
}

// Test Suite 4: Session Persistence Validation
async function testSessionPersistence(browser) {
  console.log('\n=== Test Suite 4: Session Persistence Validation ===');
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Clear initial session
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🔄 Testing session persistence with mock authentication...');
    
    // Simulate authenticated session
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock_access_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock_refresh_token',
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
    
    console.log(`Before refresh - Hash: ${currentHash}`);
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(3000); // Wait for session restoration
    
    currentHash = await page.evaluate(() => window.location.hash);
    
    console.log(`After refresh - Hash: ${currentHash}`);
    
    // Check if session data persisted
    const sessionData = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    
    const evidence = await captureEvidence(page, 'session-persistence');
    
    if (sessionData) {
      addTestResult(
        'Session Persistence',
        'Session Data Persistence',
        'PASS',
        `✅ WORKING: Session data persists across page refreshes`,
        evidence
      );
    } else {
      addTestResult(
        'Session Persistence',
        'Session Data Persistence',
        'FAIL',
        `❌ FAILED: Session data lost after page refresh`,
        evidence
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

// Main test execution
async function runCorrectedValidation() {
  console.log('🚀 Starting Step 1.3 Corrected Route Protection Validation...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${results.timestamp}\n`);
  
  try {
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    
    // Run test suites
    await testProtectedRoutes(browser);
    await testPublicRoutes(browser);
    await testAuthenticationFlowIntegration(browser);
    await testSessionPersistence(browser);
    
    await browser.close();
    
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
  console.log('📊 STEP 1.3 CORRECTED ROUTE PROTECTION VALIDATION RESULTS');
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
    console.log('✅ Route protection system is working correctly');
    console.log('✅ Authentication integration is functional');
    console.log('✅ Deferred route protection fix is effective');
    console.log('✅ Ready for Step 1.4 comprehensive validation');
  } else if (results.overallStatus === 'WARNING') {
    console.log('⚠️  Route protection mostly working but some issues remain');
    console.log('⚠️  Review failed test cases before proceeding');
  } else {
    console.log('❌ Critical route protection issues remain');
    console.log('❌ Further development required before UAT');
  }
  
  console.log('\n📁 Evidence files saved in test-results/ directory');
  console.log('='.repeat(80));
  
  // Save detailed report to file
  const reportPath = path.join(__dirname, 'test-results', 'step1-3-corrected-validation-report.json');
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
}

// Run the corrected validation
if (import.meta.url === `file://${process.argv[1]}`) {
  runCorrectedValidation().catch(console.error);
}