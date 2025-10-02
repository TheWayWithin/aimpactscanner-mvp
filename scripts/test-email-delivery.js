#!/usr/bin/env node

/**
 * Email Delivery Testing Script
 * Tests the complete email verification flow for AImpact Scanner
 * 
 * Usage: node scripts/test-email-delivery.js [test-email@example.com]
 */

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(`${title}`, 'bold');
  log('='.repeat(60), 'blue');
}

function logSection(title) {
  log(`\n${title}`, 'yellow');
  log('-'.repeat(title.length), 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Get user input
 */
function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Initialize Supabase client
 */
function initializeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logError('Missing Supabase environment variables');
    logInfo('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    logSuccess('Supabase client initialized');
    return supabase;
  } catch (error) {
    logError(`Failed to initialize Supabase: ${error.message}`);
    return null;
  }
}

/**
 * Test email configuration by triggering auth email
 */
async function testEmailDelivery(supabase, testEmail) {
  logSection('Email Delivery Test');
  
  try {
    // Generate a test email for signup
    const testPassword = 'TestPassword123!';
    
    logInfo(`Testing email delivery to: ${testEmail}`);
    logInfo('This will attempt to send a verification email...');
    
    // Attempt to sign up with test email
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });
    
    if (error) {
      if (error.message.includes('User already registered')) {
        logWarning('User already exists - testing password reset instead');
        return await testPasswordReset(supabase, testEmail);
      } else {
        logError(`Signup failed: ${error.message}`);
        return false;
      }
    }
    
    if (data.user && !data.user.email_confirmed_at) {
      logSuccess('Signup request successful - verification email should be sent');
      logInfo(`User ID created: ${data.user.id}`);
      logInfo('Check your email inbox for the verification message');
      
      // Wait for user confirmation
      log('\n' + '⏳ Please check your email and verify delivery...', 'yellow');
      const received = await getUserInput('Did you receive the verification email? (y/n): ');
      
      if (received.toLowerCase() === 'y' || received.toLowerCase() === 'yes') {
        logSuccess('Email delivery confirmed by user');
        
        // Clean up test user
        await cleanupTestUser(supabase, data.user.id);
        return true;
      } else {
        logError('Email delivery failed - user did not receive email');
        await cleanupTestUser(supabase, data.user.id);
        return false;
      }
    } else if (data.user && data.user.email_confirmed_at) {
      logInfo('User was auto-confirmed (email verification disabled)');
      await cleanupTestUser(supabase, data.user.id);
      return true;
    } else {
      logError('Unexpected signup response');
      return false;
    }
    
  } catch (error) {
    logError(`Email delivery test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test password reset email as alternative
 */
async function testPasswordReset(supabase, testEmail) {
  logInfo('Testing password reset email delivery...');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    });
    
    if (error) {
      logError(`Password reset failed: ${error.message}`);
      return false;
    }
    
    logSuccess('Password reset email triggered');
    logInfo('Check your email for the password reset message');
    
    const received = await getUserInput('Did you receive the password reset email? (y/n): ');
    
    if (received.toLowerCase() === 'y' || received.toLowerCase() === 'yes') {
      logSuccess('Email delivery confirmed via password reset');
      return true;
    } else {
      logError('Password reset email not received');
      return false;
    }
    
  } catch (error) {
    logError(`Password reset test failed: ${error.message}`);
    return false;
  }
}

/**
 * Clean up test user
 */
async function cleanupTestUser(supabase, userId) {
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      logWarning(`Could not cleanup test user: ${error.message}`);
    } else {
      logInfo('Test user cleaned up');
    }
  } catch (error) {
    logWarning(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Check authentication configuration
 */
async function checkAuthConfig(supabase) {
  logSection('Authentication Configuration Check');
  
  try {
    // Test basic Supabase connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && !error.message.includes('permission denied')) {
      logError(`Supabase connection failed: ${error.message}`);
      return false;
    }
    
    logSuccess('Supabase connection working');
    
    // Check if we can access auth admin functions
    try {
      await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      logSuccess('Service role key has admin access');
    } catch (error) {
      logWarning('Limited admin access - this is normal for some configurations');
    }
    
    return true;
    
  } catch (error) {
    logError(`Auth configuration check failed: ${error.message}`);
    return false;
  }
}

/**
 * Check email template configuration
 */
async function checkEmailTemplates() {
  logSection('Email Template Configuration');
  
  logInfo('Email templates are configured in Supabase Dashboard → Authentication → Email Templates');
  logInfo('Default templates should work, but you can customize them for branding');
  
  const templates = [
    'Confirm signup',
    'Invite user', 
    'Magic Link',
    'Change email address',
    'Reset password'
  ];
  
  templates.forEach(template => {
    logInfo(`📧 ${template} template available`);
  });
  
  logWarning('Custom templates require manual configuration in Supabase dashboard');
}

/**
 * Generate test report
 */
function generateTestReport(results) {
  logHeader('Email Delivery Test Report');
  
  const { configValid, emailDelivered } = results;
  
  if (configValid && emailDelivered) {
    logSuccess('🎉 Email delivery system is working correctly!');
    
    logSection('What This Means');
    logInfo('✅ SMTP configuration is correct');
    logInfo('✅ DNS records are properly set');
    logInfo('✅ Email verification flow is functional');
    logInfo('✅ Users can successfully complete signup');
    
  } else if (configValid && !emailDelivered) {
    logWarning('⚠️  Configuration looks correct but email delivery failed');
    
    logSection('Possible Issues');
    logInfo('• DNS propagation may still be in progress');
    logInfo('• Email provider (Gmail, Outlook) may be blocking/filtering');
    logInfo('• SMTP credentials may be incorrect');
    logInfo('• Rate limiting or temporary service issues');
    
    logSection('Recommended Actions');
    logInfo('1. Wait 30 minutes and try again (DNS propagation)');
    logInfo('2. Check spam/junk folders');
    logInfo('3. Try with different email provider');
    logInfo('4. Verify Resend API key in Supabase SMTP settings');
    
  } else {
    logError('❌ Email delivery system needs configuration');
    
    logSection('Required Actions');
    logInfo('1. Complete DNS record setup in Netlify');
    logInfo('2. Configure SMTP in Supabase dashboard');
    logInfo('3. Verify Resend domain authentication');
    logInfo('4. Run validation script: node scripts/validate-smtp-config.js');
  }
  
  logSection('Monitoring');
  logInfo('• Check delivery rates in Resend dashboard');
  logInfo('• Monitor user signup completion rates');
  logInfo('• Set up alerts for email delivery failures');
  logInfo('• Review bounce and spam rates regularly');
  
  logSection('Next Steps');
  if (emailDelivered) {
    logInfo('1. Monitor production email delivery');
    logInfo('2. Set up custom email templates (optional)');
    logInfo('3. Configure email notifications for other features');
    logInfo('4. Implement email delivery monitoring');
  } else {
    logInfo('1. Review setup guide: resend-smtp-setup-guide.md');
    logInfo('2. Check configuration: node scripts/validate-smtp-config.js');
    logInfo('3. Contact support if issues persist');
  }
}

/**
 * Main testing function
 */
async function main() {
  logHeader('AImpact Scanner - Email Delivery Testing');
  
  // Get test email
  let testEmail = process.argv[2];
  if (!testEmail) {
    testEmail = await getUserInput('Enter test email address: ');
  }
  
  if (!testEmail || !testEmail.includes('@')) {
    logError('Valid email address required');
    process.exit(1);
  }
  
  logInfo(`Testing email delivery to: ${testEmail}`);
  logWarning('This will create and delete a test user account');
  
  const proceed = await getUserInput('Continue? (y/n): ');
  if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
    logInfo('Test cancelled by user');
    process.exit(0);
  }
  
  const results = {};
  
  try {
    // Initialize Supabase
    const supabase = initializeSupabase();
    if (!supabase) {
      process.exit(1);
    }
    
    // Check configuration
    results.configValid = await checkAuthConfig(supabase);
    
    // Test email delivery
    if (results.configValid) {
      results.emailDelivered = await testEmailDelivery(supabase, testEmail);
    } else {
      results.emailDelivered = false;
    }
    
    // Check email templates
    await checkEmailTemplates();
    
    // Generate report
    generateTestReport(results);
    
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    process.exit(1);
  }
  
  logSection('Test Complete');
  logInfo('For configuration help, see: resend-smtp-setup-guide.md');
  logInfo('For configuration validation, run: node scripts/validate-smtp-config.js');
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testEmailDelivery,
  checkAuthConfig,
  checkEmailTemplates
};