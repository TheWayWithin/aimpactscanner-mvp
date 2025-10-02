#!/usr/bin/env node

/**
 * Email Configuration Checker
 * 
 * Checks the current email verification configuration and provides
 * specific guidance for fixing the SMTP setup
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check Supabase configuration
 */
async function checkSupabaseConfig() {
    console.log('🔍 Checking Supabase Configuration');
    console.log('==================================');
    
    try {
        const configPath = path.join(__dirname, '../supabase/config.toml');
        const configContent = await readFile(configPath, 'utf-8');
        
        // Check email confirmations
        const confirmationsEnabled = configContent.includes('enable_confirmations = true');
        console.log(`📧 Email confirmations: ${confirmationsEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        
        // Check SMTP configuration
        const smtpSectionExists = configContent.includes('[auth.email.smtp]');
        const smtpCommented = configContent.includes('# [auth.email.smtp]');
        
        if (smtpCommented) {
            console.log('📮 SMTP Configuration: ❌ COMMENTED OUT (This is the problem!)');
            console.log('   └─ SMTP settings are commented out in supabase/config.toml');
        } else if (smtpSectionExists) {
            console.log('📮 SMTP Configuration: ✅ PRESENT');
            
            // Check if Resend is configured
            if (configContent.includes('smtp.resend.com')) {
                console.log('   └─ ✅ Resend SMTP configured');
            } else {
                console.log('   └─ ⚠️  Different SMTP provider configured');
            }
        } else {
            console.log('📮 SMTP Configuration: ❌ NOT CONFIGURED');
        }
        
        // Check rate limiting
        const emailRateLimit = configContent.match(/email_sent = (\d+)/);
        if (emailRateLimit) {
            console.log(`📊 Email rate limit: ${emailRateLimit[1]} emails/hour`);
        }
        
        return {
            confirmationsEnabled,
            smtpConfigured: smtpSectionExists && !smtpCommented,
            smtpCommented
        };
        
    } catch (error) {
        console.error('❌ Could not read config file:', error.message);
        return null;
    }
}

/**
 * Check environment configuration
 */
async function checkEnvironmentConfig() {
    console.log('\n🌍 Checking Environment Configuration');
    console.log('====================================');
    
    try {
        // Check for .env.local
        const envPath = path.join(__dirname, '../.env.local');
        try {
            const envContent = await readFile(envPath, 'utf-8');
            console.log('📁 .env.local: ✅ EXISTS');
            
            const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
            const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
            const hasResendKey = envContent.includes('RESEND_API_KEY');
            
            console.log(`   └─ Supabase URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
            console.log(`   └─ Supabase Key: ${hasSupabaseKey ? '✅' : '❌'}`);
            console.log(`   └─ Resend API Key: ${hasResendKey ? '✅' : '❌'}`);
            
            return { envExists: true, hasResendKey };
            
        } catch (error) {
            console.log('📁 .env.local: ❌ NOT FOUND');
            console.log('   └─ This might be normal - check Supabase dashboard SMTP settings');
            return { envExists: false, hasResendKey: false };
        }
        
    } catch (error) {
        console.error('❌ Environment check failed:', error.message);
        return { envExists: false, hasResendKey: false };
    }
}

/**
 * Provide specific fix recommendations
 */
function provideFix(config, env) {
    console.log('\n🛠️  Fix Recommendations');
    console.log('=======================');
    
    if (!config) {
        console.log('❌ Cannot provide recommendations - config check failed');
        return;
    }
    
    const { confirmationsEnabled, smtpConfigured, smtpCommented } = config;
    
    if (confirmationsEnabled && !smtpConfigured) {
        console.log('🎯 ROOT CAUSE IDENTIFIED:');
        console.log('   Email verification is ENABLED but SMTP is NOT configured');
        console.log('   This means users need verification emails but they cannot be sent\n');
        
        console.log('🔧 SOLUTION OPTIONS:\n');
        
        console.log('📧 Option 1: Configure Resend SMTP (RECOMMENDED)');
        console.log('   1. Get your Resend API key from https://resend.com');
        console.log('   2. Go to Supabase Dashboard → Authentication → Settings → SMTP');
        console.log('   3. Enable Custom SMTP with these settings:');
        console.log('      Host: smtp.resend.com');
        console.log('      Port: 465');
        console.log('      Username: resend');
        console.log('      Password: [YOUR_RESEND_API_KEY]');
        console.log('      Sender: support@aimpactscanner.com\n');
        
        console.log('⚡ Option 2: Disable Email Verification (QUICK FIX)');
        console.log('   1. Edit supabase/config.toml');
        console.log('   2. Change: enable_confirmations = true → false');
        console.log('   3. Deploy configuration');
        console.log('   4. Users can sign up without email verification\n');
        
        console.log('🎯 RECOMMENDED: Option 1 (Configure Resend SMTP)');
        console.log('   Benefits: Professional email delivery, verification security');
        console.log('   Time: 30 minutes');
        console.log('   Cost: Free for first 3,000 emails/month\n');
        
    } else if (!confirmationsEnabled) {
        console.log('ℹ️  Email verification is DISABLED');
        console.log('   This explains why users don\'t need to verify emails');
        console.log('   If you want email verification, enable it and configure SMTP\n');
        
    } else if (confirmationsEnabled && smtpConfigured) {
        console.log('✅ Configuration looks correct');
        console.log('   Email verification is enabled and SMTP is configured');
        console.log('   If emails still aren\'t arriving, check:');
        console.log('   1. Resend dashboard for delivery status');
        console.log('   2. Spam folders');
        console.log('   3. Domain authentication in Resend\n');
    }
    
    console.log('📋 Next Steps:');
    console.log('1. Choose Option 1 or 2 above');
    console.log('2. Follow the specific instructions');
    console.log('3. Test with scripts/test-email-verification.js');
    console.log('4. Monitor email delivery in Resend dashboard');
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 AImpact Scanner Email Configuration Checker');
    console.log('===============================================');
    console.log(`📅 Date: ${new Date().toISOString()}\n`);
    
    const config = await checkSupabaseConfig();
    const env = await checkEnvironmentConfig();
    
    provideFix(config, env);
    
    console.log('\n📚 Additional Resources:');
    console.log('• Configuration Guide: scripts/configure-resend-smtp.md');
    console.log('• Test Script: scripts/test-email-verification.js');
    console.log('• Resend Dashboard: https://resend.com/domains');
    console.log('• Supabase Auth Settings: https://supabase.com/dashboard');
}

// Run the checker
main().catch(console.error);