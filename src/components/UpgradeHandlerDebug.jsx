// UpgradeHandlerDebug.jsx - Debug version of UpgradeHandler to diagnose issues

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useUpgradeDebug = (user, onSuccess, onError) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (targetTier) => {
    if (loading || !user?.id) {
      return;
    }

    setLoading(true);
    
    try {
      // Check environment variables
      const priceIds = {
        coffee: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_coffee_tier_monthly',
        growth: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
        scale: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly',
        // Backward compatibility
        professional: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
        enterprise: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly'
      };
      
      const priceId = priceIds[targetTier];
      if (!priceId) {
        throw new Error(`Price ID not configured for tier: ${targetTier}`);
      }
      
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          tier: targetTier,
          successUrl: `${window.location.origin}/upgrade-success?tier=${targetTier}`,
          cancelUrl: `${window.location.origin}/pricing`
        }
      });
      
      
      if (error) {
        throw error;
      }
      
      if (!data?.sessionId && !data?.url) {
        throw new Error('No session ID or URL returned');
      }
      
      const checkoutUrl = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`;
      
      // Redirect to Stripe
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Upgrade error:', error);
      onError?.(error.message || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleUpgrade, loading };
};