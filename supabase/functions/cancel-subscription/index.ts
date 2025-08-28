// cancel-subscription/index.ts - Handle subscription cancellation with 30-day guarantee
// Processes cancellations and refunds for Coffee tier users

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
    const { reason, feedback, immediately = true } = await req.json()
    
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Processing cancellation for user:', user.email)

    // Get user's subscription data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, tier, subscription_started_at')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.stripe_customer_id) {
      console.error('No subscription found for user:', user.id)
      throw new Error('No active subscription found')
    }

    // Get active subscription from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      status: 'active',
      limit: 1
    })

    if (!subscriptions.data.length) {
      throw new Error('No active subscription found in Stripe')
    }

    const subscription = subscriptions.data[0]
    console.log('Found subscription:', subscription.id)

    // Check if within 30-day guarantee period
    const subscriptionStartDate = userData.subscription_started_at 
      ? new Date(userData.subscription_started_at)
      : new Date(subscription.created * 1000)
    
    const daysSinceStart = Math.floor(
      (Date.now() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const eligibleForRefund = daysSinceStart <= 30
    console.log(`Days since subscription: ${daysSinceStart}, eligible for refund: ${eligibleForRefund}`)

    // Process cancellation
    let canceledSubscription
    if (immediately) {
      // Cancel immediately
      canceledSubscription = await stripe.subscriptions.cancel(subscription.id)
      console.log('Subscription canceled immediately')
    } else {
      // Cancel at end of period
      canceledSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      })
      console.log('Subscription set to cancel at period end')
    }

    // Process refund if eligible (30-day guarantee)
    let refundData = null
    if (eligibleForRefund && immediately) {
      try {
        // Get the last payment
        const charges = await stripe.charges.list({
          customer: userData.stripe_customer_id,
          limit: 1
        })

        if (charges.data.length > 0) {
          const lastCharge = charges.data[0]
          
          // Create refund
          const refund = await stripe.refunds.create({
            charge: lastCharge.id,
            reason: 'requested_by_customer',
            metadata: {
              guarantee: '30_day_money_back',
              days_since_start: daysSinceStart.toString(),
              cancellation_reason: reason || 'not_specified'
            }
          })

          refundData = {
            amount: refund.amount / 100, // Convert from cents
            currency: refund.currency,
            status: refund.status,
            created: new Date(refund.created * 1000).toISOString()
          }

          console.log('Refund processed:', refundData)
        }
      } catch (refundError) {
        console.error('Refund processing error:', refundError)
        // Continue with cancellation even if refund fails
      }
    }

    // Update user tier in database
    if (immediately) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          tier: 'free',
          subscription_status: 'canceled',
          subscription_canceled_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user tier:', updateError)
      }
    }

    // Store cancellation feedback
    if (reason || feedback) {
      const { error: feedbackError } = await supabaseAdmin
        .from('cancellation_feedback')
        .insert({
          user_id: user.id,
          reason: reason,
          feedback: feedback,
          subscription_id: subscription.id,
          days_since_start: daysSinceStart,
          refund_issued: !!refundData
        })

      if (feedbackError) {
        console.error('Error storing feedback:', feedbackError)
      }
    }

    // Send cancellation confirmation email (you can implement this later)
    // await sendCancellationEmail(user.email, { ... })

    return new Response(
      JSON.stringify({
        success: true,
        message: immediately 
          ? 'Your subscription has been canceled' 
          : 'Your subscription will be canceled at the end of the billing period',
        refund: refundData,
        eligibleForRefund,
        daysSinceStart,
        canceledAt: immediately ? new Date().toISOString() : null,
        endsAt: new Date(canceledSubscription.current_period_end * 1000).toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Cancellation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to cancel subscription',
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