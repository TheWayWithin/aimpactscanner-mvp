#!/usr/bin/env node
/**
 * COMPREHENSIVE SECURITY TEST SUITE
 * Tests edge cases and vulnerabilities in tier sign-up system
 */

import { chromium } from 'playwright';

const TEST_CONFIG = {
  baseUrl: 'http://localhost:5177',
  timeouts: {
    navigation: 10000,
    action: 5000,
    assertion: 3000
  }
};

class SecurityTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    console.log('🚀 Starting Security Test Suite for Tier Sign-up System');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Set timeouts
    this.page.setDefaultTimeout(TEST_CONFIG.timeouts.action);
    this.page.setDefaultNavigationTimeout(TEST_CONFIG.timeouts.navigation);
    
    // Navigate to registration page
    await this.page.goto(`${TEST_CONFIG.baseUrl}/#register`);
    await this.page.waitForLoadState('networkidle');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  log(testName, status, details = '') {
    const result = { testName, status, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'SKIP' ? '⏭️' : '⚠️';
    console.log(`${emoji} ${testName}: ${status} ${details ? `- ${details}` : ''}`);
  }

  async testDuplicateEmailRegistration() {
    console.log('\n🔍 Testing Duplicate Email Registration...');
    
    try {
      // First, try to register with a known email
      const testEmail = 'test@example.com';
      
      await this.page.fill('input[type="email"]', testEmail);
      await this.page.fill('input[type="password"]', 'TestPassword123!');
      await this.page.fill('input[placeholder*="Confirm"]', 'TestPassword123!');
      await this.page.check('input[type="checkbox"]');
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(2000);
      
      // Check for error message
      const errorMessage = await this.page.textContent('.text-red-700, .bg-red-50');
      
      if (errorMessage && errorMessage.includes('already registered')) {
        this.log('Duplicate Email Registration', 'PASS', 'Shows proper error message');
      } else {
        this.log('Duplicate Email Registration', 'FAIL', 'No duplicate email detection');
      }
      
    } catch (error) {
      this.log('Duplicate Email Registration', 'ERROR', error.message);
    }
  }

  async testInvalidEmailFormats() {
    console.log('\n🔍 Testing Invalid Email Format Validation...');
    
    const invalidEmails = [
      'plainaddress',           // No @ symbol
      '@missingdomain.com',     // Missing local part
      'missing@domain',         // Missing TLD
      'spaces @example.com',    // Spaces in email
      'special!#$%@domain.com', // Special characters
      'double@@domain.com',     // Double @
      'trailing.dot@domain.com.', // Trailing dot
    ];

    for (const email of invalidEmails) {
      try {
        await this.page.fill('input[type="email"]', email);
        await this.page.fill('input[type="password"]', 'TestPassword123!');
        await this.page.fill('input[placeholder*="Confirm"]', 'TestPassword123!');
        await this.page.check('input[type="checkbox"]');
        
        await this.page.click('button[type="submit"]');
        await this.page.waitForTimeout(1000);
        
        const errorMessage = await this.page.textContent('.text-red-700, .bg-red-50');
        
        if (errorMessage && errorMessage.includes('valid email')) {
          this.log(`Invalid Email: ${email}`, 'PASS', 'Rejected properly');
        } else {
          this.log(`Invalid Email: ${email}`, 'FAIL', 'Should be rejected');
        }
        
      } catch (error) {
        this.log(`Invalid Email: ${email}`, 'ERROR', error.message);
      }
    }
  }

  async testPasswordRequirements() {
    console.log('\n🔍 Testing Password Requirements...');
    
    const weakPasswords = [
      'weak',                  // Too short
      'password',              // Common, no uppercase/numbers
      '12345678',              // Only numbers
      'PASSWORD',              // Only uppercase
      'onlylowercase',         // Only lowercase
    ];

    for (const password of weakPasswords) {
      try {
        await this.page.fill('input[type="email"]', 'test@valid.com');
        await this.page.fill('input[type="password"]', password);
        await this.page.fill('input[placeholder*="Confirm"]', password);
        await this.page.check('input[type="checkbox"]');
        
        // Check if submit button is disabled
        const submitButton = await this.page.locator('button[type="submit"]');
        const isDisabled = await submitButton.isDisabled();
        
        if (isDisabled) {
          this.log(`Weak Password: ${password}`, 'PASS', 'Submit disabled');
        } else {
          this.log(`Weak Password: ${password}`, 'FAIL', 'Should be disabled');
        }
        
      } catch (error) {
        this.log(`Weak Password: ${password}`, 'ERROR', error.message);
      }
    }

    // Test password mismatch
    try {
      await this.page.fill('input[type="email"]', 'test@valid.com');
      await this.page.fill('input[type="password"]', 'StrongPassword123!');
      await this.page.fill('input[placeholder*="Confirm"]', 'DifferentPassword456!');
      await this.page.check('input[type="checkbox"]');
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);
      
      const errorMessage = await this.page.textContent('.text-red-700, .bg-red-50');
      
      if (errorMessage && errorMessage.includes('do not match')) {
        this.log('Password Mismatch', 'PASS', 'Shows mismatch error');
      } else {
        this.log('Password Mismatch', 'FAIL', 'No mismatch detection');
      }
      
    } catch (error) {
      this.log('Password Mismatch', 'ERROR', error.message);
    }
  }

  async testDirectURLAccess() {
    console.log('\n🔍 Testing Unauthorized Route Access...');
    
    const protectedRoutes = [
      '#dashboard',
      '#results',
      '#account',
      '#analysis'
    ];

    for (const route of protectedRoutes) {
      try {
        // Open new incognito context for each test
        const context = await this.browser.newContext();
        const page = await context.newPage();
        
        await page.goto(`${TEST_CONFIG.baseUrl}/${route}`);
        await page.waitForTimeout(2000);
        
        // Check if redirected to login/auth
        const currentUrl = page.url();
        const hasAuthForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
        const hasLoginText = await page.textContent('body').then(text => 
          text.includes('Sign In') || text.includes('Login') || text.includes('magic link')
        ).catch(() => false);
        
        if (hasAuthForm || hasLoginText || currentUrl.includes('login')) {
          this.log(`Protected Route: ${route}`, 'PASS', 'Redirected to authentication');
        } else {
          this.log(`Protected Route: ${route}`, 'FAIL', 'Unauthorized access allowed');
        }
        
        await context.close();
        
      } catch (error) {
        this.log(`Protected Route: ${route}`, 'ERROR', error.message);
      }
    }
  }

  async testResendVerificationEmail() {
    console.log('\n🔍 Testing Resend Verification Email...');
    
    try {
      // Navigate to email verification page if exists
      await this.page.goto(`${TEST_CONFIG.baseUrl}/#email-verification`);
      await this.page.waitForTimeout(2000);
      
      // Look for resend button
      const resendButton = await this.page.locator('button').filter({ hasText: /resend/i }).first();
      
      if (await resendButton.isVisible()) {
        await resendButton.click();
        await this.page.waitForTimeout(1000);
        
        // Check for success/cooldown message
        const message = await this.page.textContent('body');
        
        if (message.includes('sent') || message.includes('cooldown') || message.includes('wait')) {
          this.log('Resend Verification Email', 'PASS', 'Shows proper feedback');
        } else {
          this.log('Resend Verification Email', 'WARN', 'Unclear feedback');
        }
      } else {
        this.log('Resend Verification Email', 'SKIP', 'No resend functionality found');
      }
      
    } catch (error) {
      this.log('Resend Verification Email', 'ERROR', error.message);
    }
  }

  async testErrorMessageQuality() {
    console.log('\n🔍 Testing Error Message Quality...');
    
    try {
      // Test empty form submission
      await this.page.goto(`${TEST_CONFIG.baseUrl}/#register`);
      await this.page.waitForTimeout(1000);
      
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(1000);
      
      const errorMessages = await this.page.locator('.text-red-700, .bg-red-50').allTextContents();
      
      let qualityScore = 0;
      let qualityDetails = [];
      
      // Check for user-friendly language
      errorMessages.forEach(msg => {
        if (msg.includes('Please') || msg.includes('enter') || msg.includes('valid')) {
          qualityScore++;
          qualityDetails.push('Polite language');
        }
        if (msg.length > 10 && msg.length < 100) {
          qualityScore++;
          qualityDetails.push('Appropriate length');
        }
        if (!msg.includes('Error:') && !msg.includes('Exception')) {
          qualityScore++;
          qualityDetails.push('User-friendly, not technical');
        }
      });
      
      if (qualityScore >= 2) {
        this.log('Error Message Quality', 'PASS', qualityDetails.join(', '));
      } else {
        this.log('Error Message Quality', 'FAIL', 'Poor error message quality');
      }
      
    } catch (error) {
      this.log('Error Message Quality', 'ERROR', error.message);
    }
  }

  async generateReport() {
    console.log('\n📊 SECURITY TEST REPORT');
    console.log('=' * 50);
    
    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'PASS').length,
      failed: this.testResults.filter(r => r.status === 'FAIL').length,
      errors: this.testResults.filter(r => r.status === 'ERROR').length,
      skipped: this.testResults.filter(r => r.status === 'SKIP').length,
      warnings: this.testResults.filter(r => r.status === 'WARN').length
    };
    
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️ Errors: ${summary.errors}`);
    console.log(`⏭️ Skipped: ${summary.skipped}`);
    console.log(`🔶 Warnings: ${summary.warnings}`);
    
    const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    // Critical vulnerabilities
    const criticalVulns = this.testResults.filter(r => 
      r.status === 'FAIL' && (
        r.testName.includes('Protected Route') ||
        r.testName.includes('Duplicate Email') ||
        r.testName.includes('Password')
      )
    );
    
    if (criticalVulns.length > 0) {
      console.log('\n🚨 CRITICAL SECURITY VULNERABILITIES:');
      criticalVulns.forEach(vuln => {
        console.log(`  - ${vuln.testName}: ${vuln.details}`);
      });
    }
    
    // Detailed results
    console.log('\n📋 DETAILED TEST RESULTS:');
    this.testResults.forEach(result => {
      const emoji = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : 
                   result.status === 'ERROR' ? '💥' :
                   result.status === 'SKIP' ? '⏭️' : '⚠️';
      console.log(`  ${emoji} ${result.testName} - ${result.details || result.status}`);
    });
    
    return summary;
  }

  async runAllTests() {
    try {
      await this.setup();
      
      // Mark test as started
      await this.page.evaluate(() => {
        console.log('🔒 SECURITY TEST SUITE STARTED');
      });
      
      // Run all security tests
      await this.testDuplicateEmailRegistration();
      await this.testInvalidEmailFormats();
      await this.testPasswordRequirements();
      await this.testDirectURLAccess();
      await this.testResendVerificationEmail();
      await this.testErrorMessageQuality();
      
      // Generate comprehensive report
      const summary = await this.generateReport();
      
      return summary;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      this.log('Test Suite', 'ERROR', error.message);
    } finally {
      await this.teardown();
    }
  }
}

// Run the security test suite
async function main() {
  const testSuite = new SecurityTestSuite();
  const results = await testSuite.runAllTests();
  
  // Exit with appropriate code
  if (results && results.failed === 0 && results.errors === 0) {
    console.log('\n🎉 All security tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Security issues detected - review required');
    process.exit(1);
  }
}

// Handle script execution
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

export default SecurityTestSuite;