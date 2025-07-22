// create-checkout-session/index.ts - Stripe Checkout Session Creation
// Handles Coffee tier subscription checkout flow

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Stripe configuration
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_API_URL = 'https://api.stripe.com/v1';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE CHECKOUT SESSION START ===');
    
    const requestBody = await req.json();
    const { priceId, userId, tier, successUrl, cancelUrl } = requestBody;
    
    console.log('Parameters:', { priceId, userId, tier, successUrl, cancelUrl });
    
    // Validate inputs
    if (!priceId || !userId || !tier) {
      throw new Error('Missing required parameters: priceId, userId, or tier');
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    console.log('User found:', { email: user.email, hasStripeId: !!user.stripe_customer_id });

    // Prepare Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      console.log('Creating new Stripe customer...');
      
      // Create new Stripe customer
      const customerResponse = await fetch(`${STRIPE_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email: user.email,
          'metadata[user_id]': userId,
          'metadata[tier]': tier
        })
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        throw new Error(`Failed to create Stripe customer: ${error}`);
      }

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      console.log('Stripe customer created:', customerId);
    }

    // Create checkout session
    console.log('Creating Stripe checkout session...');
    
    const checkoutResponse = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl || `${req.headers.get('origin')}/upgrade-success`,
        cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
        'metadata[user_id]': userId,
        'metadata[tier]': tier,
        'subscription_data[metadata][user_id]': userId,
        'subscription_data[metadata][tier]': tier,
        allow_promotion_codes: 'true',
        billing_address_collection: 'auto',
        'payment_method_types[0]': 'card'
      })
    });

    if (!checkoutResponse.ok) {
      const error = await checkoutResponse.text();
      console.error('Stripe checkout session creation failed:', error);
      throw new Error(`Failed to create checkout session: ${error}`);
    }

    const session = await checkoutResponse.json();
    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      url: session.url,
      customerId: customerId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Checkout session creation error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});