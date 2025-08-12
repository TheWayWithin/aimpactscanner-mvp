// UpgradeHandlerDebug.jsx - Debug version of UpgradeHandler to diagnose issues

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useUpgradeDebug = (user, onSuccess, onError) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (targetTier) => {
    console.log('🔍 DEBUG: handleUpgrade called');
    console.log('   Target tier:', targetTier);
    console.log('   User:', user);
    console.log('   User ID:', user?.id);
    
    if (loading || !user?.id) {
      console.log('   ❌ Blocked: loading =', loading, ', user.id =', user?.id);
      return;
    }

    setLoading(true);
    
    try {
      console.log('   📡 Getting price IDs...');
      
      // Check environment variables
      const priceIds = {
        coffee: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_coffee_tier_monthly',
        professional: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly',
        enterprise: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
      };
      
      console.log('   Price IDs:', priceIds);
      console.log('   Coffee price ID from env:', import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID);
      
      const priceId = priceIds[targetTier];
      if (!priceId) {
        throw new Error(`Price ID not configured for tier: ${targetTier}`);
      }
      
      console.log('   Selected price ID:', priceId);
      console.log('   📤 Calling Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          tier: targetTier,
          successUrl: `${window.location.origin}/upgrade-success?tier=${targetTier}`,
          cancelUrl: `${window.location.origin}/pricing`
        }
      });
      
      console.log('   📥 Edge Function response:');
      console.log('   Data:', data);
      console.log('   Error:', error);
      
      if (error) {
        throw error;
      }
      
      if (!data?.sessionId && !data?.url) {
        throw new Error('No session ID or URL returned');
      }
      
      const checkoutUrl = data.url || `https://checkout.stripe.com/pay/${data.sessionId}`;
      console.log('   ✅ Redirecting to:', checkoutUrl);
      
      // Redirect to Stripe
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('   ❌ Upgrade error:', error);
      onError?.(error.message || 'Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { handleUpgrade, loading };
};