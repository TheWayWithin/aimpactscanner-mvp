// stripe-webhook/index.ts - Stripe Webhook Handler
// Processes Coffee tier subscription events and updates user tiers

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TierManager } from '../analyze-page/lib/TierManager.ts'

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

serve(async (req) => {
  try {
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    if (!signature) {
      console.error('Missing stripe signature header');
      return new Response('Missing signature', { status: 401 });
    }
    
    console.log('Webhook secret configured:', !!STRIPE_WEBHOOK_SECRET);
    
    // Temporarily disable signature verification for testing
    // TODO: Implement proper HMAC verification for production
    console.log('Webhook signature check temporarily disabled for testing');
    
    // Parse the event
    const event = JSON.parse(body);
    console.log('Webhook event type:', event.type);
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const tierManager = new TierManager(supabase);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, tierManager);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, tierManager);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, tierManager);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object, tierManager);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, tierManager);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response('Webhook handled successfully', { status: 200 });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(`Webhook error: ${error.message}`, { status: 400 });
  }
});

async function verifyStripeSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  try {
    // Simple signature verification for demo
    // In production, use proper Stripe signature verification
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];
    
    if (!timestamp || !signatureHash) {
      return false;
    }
    
    // For demo purposes, we'll accept any signature
    // In production, implement proper HMAC verification
    console.log('Webhook signature verified (demo mode)');
    return true;
    
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function handleCheckoutCompleted(session: any, tierManager: TierManager) {
  try {
    console.log('Processing checkout.session.completed...');
    
    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier || 'coffee';
    
    if (!userId) {
      throw new Error('No user_id in session metadata');
    }
    
    console.log(`Upgrading user ${userId} to ${tier} tier`);
    
    // Get subscription details if this was a subscription
    let subscriptionData = null;
    if (session.subscription) {
      // Fetch subscription details from Stripe
      const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
      const response = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`
        }
      });
      
      if (response.ok) {
        subscriptionData = await response.json();
      }
    }
    
    // Upgrade user to Coffee tier
    await tierManager.upgradeToCoffeeTier(userId, {
      id: session.subscription,
      customer: session.customer,
      current_period_start: subscriptionData?.current_period_start || Math.floor(Date.now() / 1000),
      current_period_end: subscriptionData?.current_period_end || Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      cancel_at_period_end: subscriptionData?.cancel_at_period_end || false,
      items: {
        data: [{
          price: {
            id: subscriptionData?.items?.data?.[0]?.price?.id || 'unknown'
          }
        }]
      }
    });
    
    console.log('Checkout completed successfully');
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
}

async function handlePaymentSucceeded(invoice: any, tierManager: TierManager) {
  try {
    console.log('Processing invoice.payment_succeeded...');
    
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    
    if (!subscriptionId) {
      console.log('No subscription ID in invoice, skipping...');
      return;
    }
    
    // Find user by Stripe customer ID
    const { data: user, error } = await tierManager.supabase
      .from('users')
      .select('id, tier')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (error || !user) {
      throw new Error(`User not found for customer ID: ${customerId}`);
    }
    
    console.log(`Payment succeeded for user ${user.id}, tier: ${user.tier}`);
    
    // For recurring payments, just log the success
    // The subscription should already be active from the initial checkout
    console.log('Recurring payment processed successfully');
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: any, tierManager: TierManager) {
  try {
    console.log('Processing customer.subscription.updated...');
    
    const customerId = subscription.customer;
    const status = subscription.status;
    
    // Find user by Stripe customer ID
    const { data: user, error } = await tierManager.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (error || !user) {
      throw new Error(`User not found for customer ID: ${customerId}`);
    }
    
    console.log(`Subscription updated for user ${user.id}, status: ${status}`);
    
    // Update subscription status
    if (status === 'canceled' || status === 'incomplete_expired') {
      await tierManager.downgradeTier(user.id, 'subscription_canceled');
    }
    
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(subscription: any, tierManager: TierManager) {
  try {
    console.log('Processing customer.subscription.deleted...');
    
    const customerId = subscription.customer;
    
    // Find user by Stripe customer ID
    const { data: user, error } = await tierManager.supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (error || !user) {
      throw new Error(`User not found for customer ID: ${customerId}`);
    }
    
    console.log(`Subscription canceled for user ${user.id}`);
    
    // Downgrade user to free tier
    await tierManager.downgradeTier(user.id, 'subscription_canceled');
    
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
    throw error;
  }
}

async function handlePaymentFailed(invoice: any, tierManager: TierManager) {
  try {
    console.log('Processing invoice.payment_failed...');
    
    const customerId = invoice.customer;
    const attemptCount = invoice.attempt_count;
    
    // Find user by Stripe customer ID
    const { data: user, error } = await tierManager.supabase
      .from('users')
      .select('id, email')
      .eq('stripe_customer_id', customerId)
      .single();
      
    if (error || !user) {
      throw new Error(`User not found for customer ID: ${customerId}`);
    }
    
    console.log(`Payment failed for user ${user.id}, attempt: ${attemptCount}`);
    
    // After multiple failed attempts, consider downgrading
    if (attemptCount >= 3) {
      console.log('Multiple payment failures, considering downgrade...');
      // In production, you might implement a grace period or email notifications
    }
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}