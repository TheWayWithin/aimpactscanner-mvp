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
    let { priceId, userId, tier, successUrl, cancelUrl, mode, customerCreation, allowPromotionCodes, billingFrequency, isTrial } = requestBody;
    
    // Map 'starter' to 'coffee' for backward compatibility
    if (tier === 'starter') {
      tier = 'coffee';
      console.log('Mapped starter tier to coffee');
    }

    // Price ID mapping (Test Mode) - matches STRIPE-PRICE-IDS.md
    const STRIPE_PRICE_IDS = {
      coffee: {
        monthly: 'price_1SMFnZIiC84gpR8HBsYj7vsE',
        annual: 'price_1SMFnZIiC84gpR8HD7oRJxlN'
      },
      growth: {
        monthly: 'price_1SMFnaIiC84gpR8HzHaQmjYc',
        annual: 'price_1SMFnbIiC84gpR8HB3CeS1ud' // Has 7-day trial configured in Stripe
      },
      scale: {
        monthly: 'price_1SMFncIiC84gpR8HbCRQwnCW',
        annual: 'price_1SMFncIiC84gpR8HaHS0RCGe'
      }
    };

    // Determine billing frequency (default to monthly if not provided)
    const billing = billingFrequency || 'monthly';
    console.log('Billing frequency:', billing);
    console.log('Is trial:', isTrial);

    // If priceId is not provided, select based on tier and billing frequency
    if (!priceId || priceId === 'price_coffee_tier_monthly') {
      if (STRIPE_PRICE_IDS[tier] && STRIPE_PRICE_IDS[tier][billing]) {
        priceId = STRIPE_PRICE_IDS[tier][billing];
        console.log(`Using ${tier} ${billing} price ID:`, priceId);

        // For Growth Annual with trial, Stripe handles trial automatically
        if (tier === 'growth' && billing === 'annual' && isTrial) {
          console.log('✅ Growth Annual trial - Stripe will apply 7-day trial period automatically');
        }
      } else {
        // Fallback to old Coffee price ID
        priceId = 'price_1RnSa4IiC84gpR8HXmbDgaNy';
        console.log('⚠️ Using fallback Coffee price ID:', priceId);
      }
    }
    
    console.log('Parameters:', { priceId, userId, tier, successUrl, cancelUrl, mode, customerCreation });
    
    // Validate inputs - userId is optional for registration flow
    if (!priceId || !tier) {
      throw new Error('Missing required parameters: priceId or tier');
    }
    
    // Check if this is registration flow (no userId provided)
    const isRegistrationFlow = mode === 'registration' || !userId;

    if (!STRIPE_SECRET_KEY) {
      throw new Error('Stripe secret key not configured');
    }
    
    let customerId = null;
    let userEmail = null;
    
    if (!isRegistrationFlow) {
      // Existing user flow - get user information
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
      userEmail = user.email;
      customerId = user.stripe_customer_id;
      
      if (!customerId) {
        console.log('Creating new Stripe customer for existing user...');
        
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
    } else {
      console.log('Registration flow - customer will be created by Stripe Checkout');
    }

    // Create checkout session
    console.log('Creating Stripe checkout session...');
    
    // Build checkout session parameters
    const sessionParams = new URLSearchParams({
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/upgrade-success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
      'metadata[tier]': tier,
      'metadata[billing_frequency]': billing,
      'metadata[is_trial]': isTrial?.toString() || 'false',
      'subscription_data[metadata][tier]': tier,
      'subscription_data[metadata][billing_frequency]': billing,
      'subscription_data[metadata][is_trial]': isTrial?.toString() || 'false',
      allow_promotion_codes: allowPromotionCodes?.toString() || 'true',
      billing_address_collection: 'auto',
      'payment_method_types[0]': 'card'
    });

    // Add 7-day trial period if user selected trial
    if (isTrial && tier === 'growth') {
      sessionParams.append('subscription_data[trial_period_days]', '7');
      console.log('✅ Added 7-day trial period to checkout session');
    }
    
    // Add customer information based on flow type
    if (isRegistrationFlow) {
      // Registration flow - for subscription mode, Stripe creates customer automatically
      // Don't use customer_creation parameter as it's only for payment mode
      // Stripe will create a customer automatically for subscriptions

      // FIX: Add userId to metadata even in registration flow (webhook needs this)
      if (userId) {
        sessionParams.append('metadata[user_id]', userId);
        sessionParams.append('subscription_data[metadata][user_id]', userId);
        console.log('Added userId to metadata for registration flow:', userId);
      }
    } else {
      // Existing user flow
      if (customerId) {
        sessionParams.append('customer', customerId);
      }
      if (userId) {
        sessionParams.append('metadata[user_id]', userId);
        sessionParams.append('subscription_data[metadata][user_id]', userId);
      }
    }
    
    const checkoutResponse = await fetch(`${STRIPE_API_URL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams
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