// create-portal-session/index.ts - Stripe Customer Portal Session Creator
// Allows users to manage subscriptions, cancel, and update payment methods

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('Missing STRIPE_SECRET_KEY')
    }
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get request data
    const { returnUrl } = await req.json()
    
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Creating portal session for user:', user.email)

    // Create service role client for database access
    const supabaseServiceUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceSupabase = createClient(supabaseServiceUrl, supabaseServiceKey)

    // Get user's Stripe customer ID from database using service role
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('stripe_customer_id, tier, subscription_tier')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Database error fetching user:', userError)
      throw new Error('Unable to access subscription information. Please try again.')
    }

    let stripeCustomerId = userData?.stripe_customer_id

    // If stripe_customer_id is missing, try to find it in Stripe by email
    if (!stripeCustomerId) {
      console.warn('No Stripe customer ID in database for user:', user.id)
      console.log('Attempting to find customer in Stripe by email:', user.email)

      try {
        // Search for customer by email in Stripe
        const customers = await stripe.customers.list({
          email: user.email,
          limit: 1
        })

        if (customers.data.length > 0) {
          const customer = customers.data[0]
          stripeCustomerId = customer.id
          console.log('✅ Found existing Stripe customer:', stripeCustomerId)

          // Update database with the found customer ID
          const { error: updateError } = await serviceSupabase
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', user.id)

          if (updateError) {
            console.error('Failed to update stripe_customer_id in database:', updateError)
            // Don't throw - we can still proceed with the portal session
          } else {
            console.log('✅ Updated database with stripe_customer_id')
          }
        } else {
          console.error('No Stripe customer found for email:', user.email)
          throw new Error('No active subscription found. Please subscribe to a plan first, or contact support if you believe this is an error.')
        }
      } catch (stripeError) {
        console.error('Error searching Stripe for customer:', stripeError)
        throw new Error('Unable to locate subscription information. Please contact support.')
      }
    }

    // Check if Stripe customer ID is truncated (should be longer than 18 chars)
    if (stripeCustomerId.length < 18) {
      console.error('Invalid Stripe customer ID detected:', stripeCustomerId)
      throw new Error('Subscription data appears corrupted. Please contact support with error code: INVALID_CUSTOMER_ID')
    }

    console.log('Found Stripe customer:', stripeCustomerId)

    // Configuration for the Customer Portal
    // You can create a configuration in Stripe Dashboard for custom settings
    // or use the default configuration
    const portalConfig = {
      customer: stripeCustomerId,
      return_url: returnUrl || `${req.headers.get('origin')}/account`,
    }

    // Optional: Use a specific portal configuration if you've created one
    const portalConfigId = Deno.env.get('STRIPE_PORTAL_CONFIGURATION_ID')
    if (portalConfigId) {
      portalConfig.configuration = portalConfigId
    }

    // Create the portal session
    const session = await stripe.billingPortal.sessions.create(portalConfig)

    console.log('Portal session created:', session.id)

    return new Response(
      JSON.stringify({ 
        url: session.url,
        success: true 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Portal session error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create portal session',
        success: false
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})