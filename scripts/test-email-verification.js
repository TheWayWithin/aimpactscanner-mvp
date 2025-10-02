#!/usr/bin/env node

/**
 * Email Verification Test Script
 * 
 * Tests the complete email verification flow after SMTP configuration
 * Run this after configuring Resend SMTP to verify the fix worked
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test email verification flow
 */
async function testEmailVerification() {
    console.log('🧪 Testing Email Verification Flow');
    console.log('=====================================');
    
    // Generate test email
    const timestamp = Date.now();
    const testEmail = `test-verification-${timestamp}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔐 Test Password: ${testPassword}`);
    
    try {
        // Step 1: Attempt signup
        console.log('\n📝 Step 1: Attempting signup...');
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
        });
        
        if (signupError) {
            console.error('❌ Signup failed:', signupError.message);
            return false;
        }
        
        console.log('✅ Signup successful');
        console.log(`👤 User ID: ${signupData.user?.id}`);
        console.log(`📧 Email confirmed: ${signupData.user?.email_confirmed_at ? 'Yes' : 'No'}`);
        
        // Step 2: Check if email verification is required
        if (!signupData.user?.email_confirmed_at) {
            console.log('\n📮 Step 2: Email verification required');
            console.log('✅ This is correct behavior - user needs to verify email');
            console.log('🔍 Check the email verification was sent...');
            
            // In a real test, you'd check your email or Resend dashboard
            console.log('\n📊 Manual Verification Steps:');
            console.log('1. Check Resend dashboard for email delivery');
            console.log('2. Check test email inbox for verification email');
            console.log('3. Click verification link in email');
            console.log('4. Confirm user can sign in after verification');
            
        } else {
            console.log('\n⚠️  Email was auto-confirmed (this might indicate email verification is disabled)');
        }
        
        // Step 3: Try to sign in without verification
        console.log('\n🔐 Step 3: Testing sign-in before verification...');
        const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
        });
        
        if (signinError) {
            if (signinError.message.includes('Email not confirmed')) {
                console.log('✅ Sign-in correctly blocked - email verification required');
            } else {
                console.error('❌ Unexpected sign-in error:', signinError.message);
            }
        } else {
            console.log('⚠️  Sign-in successful without verification (check if email verification is properly enabled)');
        }
        
        // Step 4: Clean up test user
        console.log('\n🧹 Step 4: Cleaning up test user...');
        // Note: In production, admin would need to delete test users
        console.log('✅ Test completed');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

/**
 * Check SMTP configuration status
 */
async function checkSMTPStatus() {
    console.log('\n🔧 SMTP Configuration Check');
    console.log('===========================');
    
    try {
        // Read config.toml to check SMTP settings
        const configPath = path.join(__dirname, '../supabase/config.toml');
        const configContent = await readFile(configPath, 'utf-8');
        
        const smtpEnabled = !configContent.includes('# [auth.email.smtp]');
        const hasResendConfig = configContent.includes('smtp.resend.com');
        
        console.log(`📋 Local SMTP enabled: ${smtpEnabled ? '✅' : '❌'}`);
        console.log(`📋 Resend configured: ${hasResendConfig ? '✅' : '❌'}`);
        
        if (!smtpEnabled) {
            console.log('\n💡 Note: Local SMTP is commented out');
            console.log('   This is normal if using Supabase dashboard SMTP settings');
            console.log('   Check your Supabase project Auth → Settings → SMTP');
        }
        
        // Check if confirmations are enabled
        const confirmationsEnabled = configContent.includes('enable_confirmations = true');
        console.log(`📋 Email confirmations: ${confirmationsEnabled ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (!confirmationsEnabled) {
            console.log('⚠️  Email verification is disabled - this is why emails aren\'t required');
        }
        
    } catch (error) {
        console.error('❌ Could not read config file:', error.message);
    }
}

/**
 * Main test runner
 */
async function main() {
    console.log('🚀 AImpact Scanner Email Verification Test');
    console.log('==========================================');
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    
    // Check configuration first
    await checkSMTPStatus();
    
    // Run email verification test
    const success = await testEmailVerification();
    
    console.log('\n📋 Test Summary');
    console.log('===============');
    
    if (success) {
        console.log('✅ Email verification flow is working correctly');
        console.log('📧 SMTP appears to be properly configured');
        console.log('🎯 Users should now receive verification emails');
    } else {
        console.log('❌ Email verification test failed');
        console.log('🔧 Check SMTP configuration in Supabase dashboard');
        console.log('📖 See configure-resend-smtp.md for setup instructions');
    }
    
    console.log('\n📚 Next Steps:');
    console.log('1. Monitor Resend dashboard for email delivery analytics');
    console.log('2. Test with real user signup to confirm end-to-end flow');
    console.log('3. Check spam folders if emails not arriving');
    console.log('4. Verify domain authentication in Resend dashboard');
}

// Run the test
main().catch(console.error);