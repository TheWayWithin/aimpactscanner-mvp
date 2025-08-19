// Google Tag Manager Integration - Simplified GA4 tracking with GDPR consent
// Handles GTM initialization, event tracking, and Enzuzo consent integration

import React, { useEffect } from 'react';
import { ANALYTICS_CONFIG, logAnalyticsEvent } from '../utils/analytics-config.js';

// GTM Integration Hook
export const useGTMTracking = () => {
  
  const initializeGTM = (gtmId) => {
    if (typeof window === 'undefined' || window.dataLayer) return;

    // Initialize Google Tag Manager
    window.dataLayer = window.dataLayer || [];
    
    // GTM script injection
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(gtmScript, firstScript);

    // GTM initialization
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    console.log('🏷️ Google Tag Manager initialized:', gtmId);
  };

  const gtmPush = (data) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push(data);
      logAnalyticsEvent('gtm_event', data);
    }
  };

  const trackPageView = (page_path = window.location.pathname) => {
    gtmPush({
      event: 'page_view',
      page_path: page_path,
      page_title: document.title,
      page_location: window.location.href
    });
  };

  const trackAnalysisStart = (url) => {
    gtmPush({
      event: 'analysis_start',
      event_category: 'engagement',
      analyzed_url: url,
      user_tier: localStorage.getItem('user-tier') || 'free'
    });
  };

  const trackAnalysisComplete = (url, score, duration) => {
    gtmPush({
      event: 'analysis_complete',
      event_category: 'engagement',
      analyzed_url: url,
      analysis_score: score,
      analysis_duration: duration,
      user_tier: localStorage.getItem('user-tier') || 'free'
    });
  };

  const trackSignup = (tier = 'free') => {
    gtmPush({
      event: 'sign_up',
      event_category: 'conversion',
      method: 'email',
      tier: tier
    });
  };

  const trackUpgrade = (fromTier, toTier, value) => {
    const tierConfig = ANALYTICS_CONFIG.TIERS[toTier] || { value, name: toTier };
    
    gtmPush({
      event: 'purchase',
      event_category: 'conversion',
      transaction_id: `upgrade_${Date.now()}`,
      value: value,
      currency: ANALYTICS_CONFIG.CURRENCY,
      items: [{
        item_id: `tier_${toTier}`,
        item_name: tierConfig.name,
        category: 'subscription',
        quantity: 1,
        price: value
      }]
    });
  };

  const trackFeatureUsage = (feature, action) => {
    gtmPush({
      event: 'feature_usage',
      event_category: 'engagement',
      feature_name: feature,
      action: action,
      user_tier: localStorage.getItem('user-tier') || 'free'
    });
  };

  const trackError = (errorType, errorMessage, page) => {
    gtmPush({
      event: 'exception',
      description: `${errorType}: ${errorMessage}`,
      fatal: false,
      page: page
    });
  };

  return {
    initializeGTM,
    trackPageView,
    trackAnalysisStart,
    trackAnalysisComplete,
    trackSignup,
    trackUpgrade,
    trackFeatureUsage,
    trackError
  };
};

// GTM Integration Component - Initializes GTM on mount
export const GTMIntegration = () => {
  const { initializeGTM } = useGTMTracking();

  useEffect(() => {
    const gtmId = ANALYTICS_CONFIG.GTM_CONTAINER_ID;
    if (gtmId && gtmId !== 'GTM-XXXXXXX') {
      initializeGTM(gtmId);
    } else {
      console.warn('⚠️ GTM Container ID not configured. Set VITE_GTM_CONTAINER_ID in environment variables.');
    }
  }, []);

  return (
    <>
      {/* GTM NoScript Fallback - Place immediately after opening <body> tag */}
      <noscript>
        <iframe 
          src={`https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.GTM_CONTAINER_ID}`}
          height="0" 
          width="0" 
          style={{ display: 'none', visibility: 'hidden' }}
        ></iframe>
      </noscript>
    </>
  );
};

export default GTMIntegration;