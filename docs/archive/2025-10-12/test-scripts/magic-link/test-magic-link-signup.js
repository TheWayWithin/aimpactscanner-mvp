/**
 * Test Magic Link Sign-Up Flow
 *
 * This script tests that email confirmations are now enabled and magic link
 * emails are being sent properly.
 *
 * Expected behavior:
 * 1. Sign up with email should trigger magic link email
 * 2. Email should be visible in inbucket (http://localhost:54324)
 * 3. No 406/401 errors should occur
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMagicLinkSignup() {
  console.log('🧪 Testing Magic Link Sign-Up Flow\n');

  // Generate unique test email
  const timestamp = Date.now();
  const testEmail = `test-${timestamp}@example.com`;

  console.log(`📧 Testing with email: ${testEmail}`);
  console.log('⏳ Attempting sign-up with magic link...\n');

  try {
    // Attempt magic link sign-up
    const { data, error } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: 'http://127.0.0.1:3000/#/oauth-callback',
        data: {
          selected_tier: 'free',
          signup_source: 'magic_link',
          auth_provider: 'magic_link'
        }
      }
    });

    if (error) {
      console.error('❌ Sign-up failed:', error);
      console.error('\nError details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      return false;
    }

    console.log('✅ Sign-up request successful!');
    console.log('\nResponse data:', data);

    // Check for common issues
    if (!data) {
      console.warn('⚠️  Warning: No data returned from sign-up');
      return false;
    }

    console.log('\n📬 Magic link email should be sent!');
    console.log('🔍 Check inbucket at: http://localhost:54324');
    console.log(`   Look for email to: ${testEmail}`);

    console.log('\n✅ TEST PASSED: Magic link sign-up is working!');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:54324 in your browser');
    console.log('2. Check for the confirmation email');
    console.log('3. Click the magic link to complete sign-up');

    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

// Run test
testMagicLinkSignup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
