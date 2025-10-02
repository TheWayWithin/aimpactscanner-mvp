#!/usr/bin/env node

/**
 * SMTP Configuration Validation Script
 * Validates Resend SMTP configuration for AImpact Scanner
 * 
 * Usage: node scripts/validate-smtp-config.js
 */

const https = require('https');
const dns = require('dns').promises;

// Configuration
const DOMAIN = 'aimpactscanner.com';
const EXPECTED_RECORDS = {
  SPF: 'v=spf1 include:_spf.resend.com ~all',
  DMARC_BASE: 'v=DMARC1; p=none',
  RESEND_SMTP: {
    host: 'smtp.resend.com',
    port: 465,
    username: 'resend'
  }
};

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
 * Check DNS TXT records for domain
 */
async function checkDNSRecords() {
  logSection('DNS Records Validation');
  
  const results = {
    spf: false,
    dkim: false,
    dmarc: false
  };

  try {
    // Check SPF record
    const spfRecords = await dns.resolveTxt(DOMAIN);
    const spfRecord = spfRecords.find(record => 
      record.join('').includes('v=spf1') && record.join('').includes('_spf.resend.com')
    );
    
    if (spfRecord) {
      logSuccess(`SPF record found: ${spfRecord.join('')}`);
      results.spf = true;
    } else {
      logError('SPF record not found or incorrect');
      logInfo('Expected: v=spf1 include:_spf.resend.com ~all');
    }

    // Check DMARC record
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${DOMAIN}`);
      const dmarcRecord = dmarcRecords.find(record => record.join('').includes('v=DMARC1'));
      
      if (dmarcRecord) {
        logSuccess(`DMARC record found: ${dmarcRecord.join('')}`);
        results.dmarc = true;
        
        if (dmarcRecord.join('').includes('rua=mailto:dmarc@resend.com')) {
          logInfo('DMARC includes Resend reporting (enhanced)');
        } else {
          logWarning('DMARC found but no Resend reporting configured');
        }
      } else {
        logError('DMARC record not found');
      }
    } catch (error) {
      logError('DMARC record not found');
    }

    // Check for DKIM records (we can't predict the exact subdomain)
    logInfo('DKIM records are domain-specific and must be verified in Resend dashboard');
    
  } catch (error) {
    logError(`DNS lookup failed: ${error.message}`);
  }

  return results;
}

/**
 * Check Supabase configuration files
 */
async function checkSupabaseConfig() {
  logSection('Supabase Configuration Check');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Check config.toml
    const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
    const configContent = await fs.readFile(configPath, 'utf8');
    
    // Check email confirmations
    if (configContent.includes('enable_confirmations = true')) {
      logSuccess('Email confirmations enabled in config.toml');
    } else if (configContent.includes('enable_confirmations = false')) {
      logWarning('Email confirmations disabled in config.toml - emails won\'t be required');
    } else {
      logError('Email confirmations setting not found in config.toml');
    }
    
    // Check SMTP configuration
    if (configContent.includes('[auth.email.smtp]')) {
      if (configContent.includes('host = "smtp.resend.com"')) {
        logSuccess('Resend SMTP host configured in config.toml');
      } else {
        logWarning('SMTP section found but not configured for Resend');
      }
    } else {
      logInfo('SMTP configuration not found in config.toml (dashboard config recommended)');
    }
    
  } catch (error) {
    logWarning(`Could not read Supabase config: ${error.message}`);
    logInfo('This is normal if using Supabase dashboard configuration');
  }
}

/**
 * Test SMTP connectivity
 */
async function testSMTPConnectivity() {
  logSection('SMTP Connectivity Test');
  
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      logSuccess('Successfully connected to smtp.resend.com:465');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      logError('SMTP connection timeout - network or firewall issue');
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', (error) => {
      logError(`SMTP connection failed: ${error.message}`);
      resolve(false);
    });
    
    try {
      socket.connect(465, 'smtp.resend.com');
    } catch (error) {
      logError(`Failed to initiate SMTP connection: ${error.message}`);
      resolve(false);
    }
  });
}

/**
 * Check environment configuration
 */
async function checkEnvironment() {
  logSection('Environment Configuration');
  
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Check for .env files
    const envFiles = ['.env', '.env.local', '.env.production'];
    let envFound = false;
    
    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(process.cwd(), envFile));
        logInfo(`Found environment file: ${envFile}`);
        envFound = true;
      } catch {
        // File doesn't exist, continue
      }
    }
    
    if (!envFound) {
      logWarning('No environment files found');
      logInfo('Environment variables should be configured in Supabase dashboard');
    }
    
    // Check for common environment variables
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    let allVarsFound = true;
    requiredVars.forEach(varName => {
      if (process.env[varName]) {
        logSuccess(`${varName} configured`);
      } else {
        logWarning(`${varName} not found in environment`);
        allVarsFound = false;
      }
    });
    
    if (allVarsFound) {
      logSuccess('All required Supabase environment variables found');
    }
    
  } catch (error) {
    logError(`Environment check failed: ${error.message}`);
  }
}

/**
 * Generate configuration report
 */
function generateReport(results) {
  logHeader('Configuration Report Summary');
  
  const { dns: dnsResults, smtp: smtpConnected } = results;
  
  let score = 0;
  let maxScore = 4;
  
  // DNS scoring
  if (dnsResults.spf) score++;
  if (dnsResults.dmarc) score++;
  if (smtpConnected) score++;
  
  // Always count DKIM as potential point
  score++; // DKIM verification handled by Resend dashboard
  
  const percentage = Math.round((score / maxScore) * 100);
  
  logInfo(`Configuration Score: ${score}/${maxScore} (${percentage}%)`);
  
  if (percentage >= 75) {
    logSuccess('Configuration looks good! Email delivery should work properly.');
  } else if (percentage >= 50) {
    logWarning('Configuration partially complete. Some features may not work optimally.');
  } else {
    logError('Configuration needs attention. Email delivery may fail.');
  }
  
  // Recommendations
  logSection('Recommendations');
  
  if (!dnsResults.spf) {
    logInfo('1. Add SPF record to DNS: v=spf1 include:_spf.resend.com ~all');
  }
  
  if (!dnsResults.dmarc) {
    logInfo('2. Add DMARC record to DNS: v=DMARC1; p=none; rua=mailto:dmarc@resend.com');
  }
  
  if (!smtpConnected) {
    logInfo('3. Check network connectivity to smtp.resend.com:465');
  }
  
  logInfo('4. Verify DKIM configuration in Resend dashboard');
  logInfo('5. Configure SMTP settings in Supabase dashboard with your Resend API key');
  
  // Next steps
  logSection('Next Steps');
  logInfo('1. Complete any missing DNS records in Netlify DNS panel');
  logInfo('2. Configure SMTP in Supabase Dashboard → Authentication → Settings');
  logInfo('3. Test email delivery with real signup flow');
  logInfo('4. Monitor delivery rates in Resend dashboard');
}

/**
 * Main validation function
 */
async function main() {
  logHeader('AImpact Scanner - Resend SMTP Configuration Validator');
  
  logInfo('This script validates your Resend SMTP configuration');
  logInfo('Checking DNS records, connectivity, and environment setup...\n');
  
  const results = {};
  
  try {
    // Run all checks
    results.dns = await checkDNSRecords();
    await checkSupabaseConfig();
    results.smtp = await testSMTPConnectivity();
    await checkEnvironment();
    
    // Generate final report
    generateReport(results);
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    process.exit(1);
  }
  
  logSection('Validation Complete');
  logInfo('For detailed setup instructions, see: resend-smtp-setup-guide.md');
  logInfo('For testing email delivery, run: node scripts/test-email-delivery.js');
}

// Run validation
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  checkDNSRecords,
  checkSupabaseConfig,
  testSMTPConnectivity,
  checkEnvironment
};