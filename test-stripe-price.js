import fetch from 'node-fetch';

async function testStripePrice() {
  console.log('🔍 Testing Stripe Price Configuration');
  console.log('====================================\n');
  
  const priceId = 'price_1RnSa4IiC84gpR8HXmbDgaNy';
  
  console.log('Price ID being used:', priceId);
  console.log('\nThis error suggests the price ID is not configured as a recurring subscription.');
  console.log('It might be a one-time payment price instead of a subscription price.\n');
  
  console.log('To fix this:');
  console.log('1. Go to Stripe Dashboard → Products');
  console.log('2. Find your Coffee Tier product');
  console.log('3. Make sure the price is set as "Recurring" not "One time"');
  console.log('4. If it\'s one-time, create a new recurring price');
  console.log('5. Update VITE_STRIPE_COFFEE_PRICE_ID in Netlify with the recurring price ID');
  
  console.log('\nAlternatively, if this IS a recurring price, the issue might be:');
  console.log('- The price is archived or inactive');
  console.log('- The price is in test mode but we\'re using live keys (or vice versa)');
  console.log('- The price ID is incorrect');
  
  console.log('\n📝 Let me test if we can create a one-time payment session instead...\n');
  
  const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';
  
  // Sign in first
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
    console.log('Sign in failed');
    return;
  }
  
  const authData = await signInResponse.json();
  const userId = authData.user.id;
  const accessToken = authData.access_token;
  
  // Test with payment mode instead of subscription
  console.log('Testing with mode: "payment" (one-time) instead of "subscription"...');
  
  const testResponse = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': anonKey
    },
    body: JSON.stringify({
      priceId: priceId,
      userId: userId,
      tier: 'coffee',
      mode: 'payment', // Try payment mode
      successUrl: 'https://aimpactscanner.com/upgrade-success?tier=coffee',
      cancelUrl: 'https://aimpactscanner.com/pricing'
    })
  });
  
  const result = await testResponse.json();
  
  if (result.success) {
    console.log('✅ Success with payment mode!');
    console.log('   This confirms the price is ONE-TIME, not RECURRING');
    console.log('   You need to create a recurring price in Stripe');
  } else {
    console.log('❌ Still failed:', result.error);
    
    // Check the actual error
    if (result.error && result.error.includes('recurring')) {
      console.log('\n🎯 DIAGNOSIS: The price ID is not a recurring subscription price.');
      console.log('   ACTION NEEDED: Create a recurring price in Stripe Dashboard');
    }
  }
  
  process.exit(0);
}

testStripePrice().catch(console.error);