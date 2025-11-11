// UpgradeHandler.jsx - Handles tier upgrades and Stripe checkout
// Integrates with Coffee tier payment flow

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const UpgradeHandler = ({ user, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  // Stripe Price IDs (these would be set in Stripe Dashboard)
  const PRICE_IDS = {
    coffee: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_coffee_tier_monthly',
    growth: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
    scale: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly',
    // Backward compatibility
    professional: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
    enterprise: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly'
  };

  const handleUpgrade = async (targetTier, billingFrequency = 'monthly') => {
    if (loading || !user?.id) return;

    setLoading(true);
    try {
      console.log(`Initiating upgrade to ${targetTier} tier for user:`, user.id);
      console.log(`Billing frequency: ${billingFrequency}`);

      // Don't send priceId - let Edge Function select based on tier and billing frequency
      // This ensures we always use the correct Stripe price IDs from the Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          tier: targetTier,
          billingFrequency: billingFrequency,
          successUrl: `${window.location.origin}/#checkout-success`,
          cancelUrl: `${window.location.origin}/#pricing`
        }
      });

      if (error) {
        console.error('Checkout session creation error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (!data?.sessionId) {
        throw new Error('No session ID returned from checkout creation');
      }

      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe Checkout with session:', data.sessionId);
      
      // For now, we'll use a simple redirect approach
      // In production, you'd use the Stripe JS SDK
      window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;

    } catch (error) {
      console.error('Upgrade error:', error);
      onError?.(error.message || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Note: Mock upgrade function removed - now using real Stripe payment flow only

  // Return the upgrade function that components can use
  return {
    handleUpgrade: handleUpgrade, // Always use real Stripe payment flow
    loading
  };
};

// Hook version for easier use in components
export const useUpgrade = (user, onSuccess, onError) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (targetTier, billingFrequency = 'monthly') => {
    if (loading || !user?.id) return;

    setLoading(true);
    try {
      console.log(`Initiating upgrade to ${targetTier} tier for user:`, user.id);
      console.log(`Billing frequency: ${billingFrequency}`);

      // Don't send priceId - let Edge Function select based on tier and billing frequency
      // This ensures we always use the correct Stripe price IDs from the Edge Function
      const { data, error} = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: user.id,
          tier: targetTier,
          billingFrequency: billingFrequency,
          successUrl: `${window.location.origin}/#checkout-success`,
          cancelUrl: `${window.location.origin}/#pricing`
        }
      });

      if (error) throw error;
      if (!data?.sessionId) throw new Error('No session ID returned');

      // Redirect to Stripe Checkout
      window.location.href = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`;

    } catch (error) {
      console.error('Upgrade error:', error);
      onError?.(error.message || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleUpgrade, loading };
};

export default UpgradeHandler;