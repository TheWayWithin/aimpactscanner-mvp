import fetch from 'node-fetch';

async function testDirectAPI() {
  console.log('🔍 Testing Direct API Calls');
  console.log('===========================\n');
  
  const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';
  
  try {
    // First, sign in to get the user ID
    console.log('1️⃣ Signing in user...');
    const signInResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        email: 'ugcbwkkfxvhhxyxmih@xfavaj.com',
        password: 'TestPassword123!'
      })
    });
    
    if (!signInResponse.ok) {
      const error = await signInResponse.text();
      console.log('   ❌ Sign in failed:', error);
      return;
    }
    
    const authData = await signInResponse.json();
    console.log('   ✓ Signed in successfully');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    const userId = authData.user.id;
    const accessToken = authData.access_token;
    
    // Now test the checkout session creation
    console.log('\n2️⃣ Creating checkout session...');
    const checkoutResponse = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': anonKey
      },
      body: JSON.stringify({
        priceId: 'price_1RnSa4IiC84gpR8HXmbDgaNy',
        userId: userId,
        tier: 'coffee',
        successUrl: 'https://aimpactscanner.com/upgrade-success?tier=coffee',
        cancelUrl: 'https://aimpactscanner.com/pricing'
      })
    });
    
    const checkoutData = await checkoutResponse.json();
    
    if (checkoutResponse.ok && checkoutData.success) {
      console.log('   ✅ Checkout session created successfully!');
      console.log('   Session ID:', checkoutData.sessionId);
      console.log('   Checkout URL:', checkoutData.url);
      console.log('\n🎉 SUCCESS! The Edge Function is working correctly.');
      console.log('   The issue must be in the frontend code.');
    } else {
      console.log('   ❌ Checkout session creation failed');
      console.log('   Error:', checkoutData.error || 'Unknown error');
      console.log('   Full response:', JSON.stringify(checkoutData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

console.log('==========================================');
console.log('🔍 DIRECT API TEST');
console.log('==========================================\n');

testDirectAPI().catch(console.error);