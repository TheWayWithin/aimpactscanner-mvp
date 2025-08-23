// Google Tag Manager Integration - Simplified GA4 tracking with GDPR consent
// Handles GTM initialization, event tracking, and GDPR consent integration

import React, { useEffect } from 'react';
import { ANALYTICS_CONFIG, logAnalyticsEvent } from '../utils/analytics-config.js';

// GTM Integration Hook
export const useGTMTracking = () => {
  
  const initializeGTM = (gtmId) => {
    if (typeof window === 'undefined') return;

    // Initialize dataLayer first
    window.dataLayer = window.dataLayer || [];
    
    // Set default consent state (denied by default for GDPR compliance)
    window.dataLayer.push({
      event: 'gtm.init_start',
      gtm_container_id: gtmId
    });
    
    // Initialize Google Consent Mode (deny by default)
    window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'functionality_storage': 'granted', // Essential for site function
      'security_storage': 'granted' // Essential for site function
    });
    
    // Only inject GTM script if not already present
    if (!document.querySelector(`script[src*="gtm.js?id=${gtmId}"]`)) {
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

      console.log('🏷️ Google Tag Manager initialized with consent mode:', gtmId);
    }
  };

  const gtmPush = (data) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      // Add timestamp to all events
      const eventData = {
        ...data,
        timestamp: new Date().toISOString(),
        gtm_debug: true
      };
      window.dataLayer.push(eventData);
      logAnalyticsEvent('gtm_event', eventData);
    }
  };

  const trackPageView = (page_path = window.location.pathname) => {
    gtmPush({
      event: 'page_view',
      page_path: page_path,
      page_title: document.title,
      page_location: window.location.href,
      consent_analytics: getCurrentConsentStatus('analytics'),
      consent_marketing: getCurrentConsentStatus('marketing')
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

  // Helper function to get current consent status
  const getCurrentConsentStatus = (type) => {
    try {
      const stored = localStorage.getItem('gdpr-cookie-consent');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.consent) {
          return data.consent[type] ? 'granted' : 'denied';
        }
      }
    } catch (error) {
      // Fallback to sessionStorage
      try {
        const sessionStored = sessionStorage.getItem('gdpr-cookie-consent');
        if (sessionStored) {
          const data = JSON.parse(sessionStored);
          return data[type] ? 'granted' : 'denied';
        }
      } catch (sessionError) {
        console.warn('Could not read consent status');
      }
    }
    return 'denied'; // Default to denied for GDPR compliance
  };

  return {
    initializeGTM,
    trackPageView,
    trackAnalysisStart,
    trackAnalysisComplete,
    trackSignup,
    trackUpgrade,
    trackFeatureUsage,
    trackError,
    getCurrentConsentStatus
  };
};

// GTM Integration Component - Initializes GTM on mount with proper consent handling
export const GTMIntegration = () => {
  const { initializeGTM } = useGTMTracking();

  useEffect(() => {
    const gtmId = ANALYTICS_CONFIG.GTM_CONTAINER_ID;
    if (gtmId && gtmId !== 'GTM-XXXXXXX') {
      initializeGTM(gtmId);
      
      // Check for existing consent and apply it
      const checkAndApplyConsent = () => {
        try {
          const stored = localStorage.getItem('gdpr-cookie-consent');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.consent && data.expiresAt && new Date(data.expiresAt) > new Date()) {
              // Apply stored consent to GTM
              if (window.gtag) {
                window.gtag('consent', 'update', {
                  'analytics_storage': data.consent.analytics ? 'granted' : 'denied',
                  'ad_storage': data.consent.marketing ? 'granted' : 'denied',
                  'ad_user_data': data.consent.marketing ? 'granted' : 'denied',
                  'ad_personalization': data.consent.marketing ? 'granted' : 'denied'
                });
                
                console.log('🍪 Applied stored consent to GTM:', data.consent);
              }
            }
          }
        } catch (error) {
          console.warn('Could not apply stored consent:', error);
        }
      };
      
      // Apply consent immediately and after a brief delay to ensure GTM is ready
      checkAndApplyConsent();
      setTimeout(checkAndApplyConsent, 1000);
      
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