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
    const { priceId, userId, tier, successUrl, cancelUrl, mode, customerCreation, allowPromotionCodes } = requestBody;
    
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
      'subscription_data[metadata][tier]': tier,
      allow_promotion_codes: allowPromotionCodes?.toString() || 'true',
      billing_address_collection: 'auto',
      'payment_method_types[0]': 'card'
    });
    
    // Add customer information based on flow type
    if (isRegistrationFlow) {
      // Registration flow - let Stripe create customer
      sessionParams.append('customer_creation', customerCreation || 'always');
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