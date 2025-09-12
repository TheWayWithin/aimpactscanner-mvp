import fetch from 'node-fetch';

async function testRegistrationFlow() {
  console.log('🔍 Testing Registration Flow (No User ID)\n');
  
  const supabaseUrl = 'https://pdmtvkcxnqysujnpcnyh.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXR2a2N4bnF5c3VqbnBjbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODQ3MjAsImV4cCI6MjA2NjQ2MDcyMH0.EJmcxGQwsCsf4uGwNAz_D_DnJxGN2ZV3Doux_FyPtEg';
  
  // Test what the registration flow sends (no user ID)
  console.log('📤 Sending registration flow request...');
  console.log('   Mode: registration');
  console.log('   Tier: starter (will be mapped to coffee)');
  console.log('   No user ID (registration flow)');
  
  const requestBody = {
    priceId: 'price_coffee_tier_monthly', // This is what the frontend sends
    tier: 'starter', // This is what the frontend sends
    mode: 'registration',
    successUrl: 'https://aimpactscanner.com/register?payment=success',
    cancelUrl: 'https://aimpactscanner.com/register?payment=cancelled',
    allowPromotionCodes: true,
    customerCreation: 'always'
  };
  
  console.log('\nRequest body:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      },
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS! Registration flow working!');
      console.log('   Session ID:', result.sessionId);
      console.log('   Checkout URL:', result.url?.substring(0, 80) + '...');
    } else {
      console.log('\n❌ FAILED!');
      console.log('   Status:', response.status);
      console.log('   Error:', result.error || result);
      
      // Try with 'coffee' directly
      console.log('\n🔄 Trying with tier="coffee" directly...');
      
      const fixedBody = {
        ...requestBody,
        tier: 'coffee',
        priceId: 'price_1RnSa4IiC84gpR8HXmbDgaNy' // Use actual price ID
      };
      
      const retryResponse = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey
        },
        body: JSON.stringify(fixedBody)
      });
      
      const retryResult = await retryResponse.json();
      
      if (retryResponse.ok && retryResult.success) {
        console.log('\n✅ SUCCESS with coffee tier!');
        console.log('   The issue is the tier name or price ID');
        console.log('   Session ID:', retryResult.sessionId);
      } else {
        console.log('\n❌ Still failed with coffee tier');
        console.log('   Error:', retryResult.error || retryResult);
      }
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
  
  process.exit(0);
}

testRegistrationFlow().catch(console.error);