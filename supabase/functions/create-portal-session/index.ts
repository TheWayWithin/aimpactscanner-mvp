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

    // Get user's Stripe customer ID from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.stripe_customer_id) {
      console.error('No Stripe customer ID found for user:', user.id)
      throw new Error('No active subscription found. Please subscribe first.')
    }

    console.log('Found Stripe customer:', userData.stripe_customer_id)

    // Configuration for the Customer Portal
    // You can create a configuration in Stripe Dashboard for custom settings
    // or use the default configuration
    const portalConfig = {
      customer: userData.stripe_customer_id,
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