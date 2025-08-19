// GA4 Integration Component - Main analytics wrapper with consent management
// Handles GA4 initialization, event tracking, and MCP integration

import React, { useEffect } from 'react';
import { useConsent, CONSENT_CATEGORIES } from '../privacy/consent-manager.jsx';
import { ga4MCP, initializeGA4, trackEvent, trackConversion } from './ga4-mcp-client.js';
import { ANALYTICS_CONFIG, logAnalyticsEvent } from '../utils/analytics-config.js';

export const GA4Integration = () => {
  const { hasConsent, consent } = useConsent();

  useEffect(() => {
    if (consent.initialized && hasConsent(CONSENT_CATEGORIES.ANALYTICS)) {
      initializeGA4WithConsent();
    }
  }, [consent.initialized, hasConsent]);

  useEffect(() => {
    // Listen for consent changes
    const handleConsentChange = (event) => {
      const { category, granted } = event.detail;
      
      if (category === CONSENT_CATEGORIES.ANALYTICS) {
        if (granted) {
          initializeGA4WithConsent();
        } else {
          // Disable GA4 tracking
          if (window.gtag) {
            window.gtag('consent', 'update', {
              analytics_storage: 'denied'
            });
            console.log('📊 GA4 analytics disabled due to consent withdrawal');
          }
        }
      }
    };

    window.addEventListener('consentChange', handleConsentChange);
    return () => window.removeEventListener('consentChange', handleConsentChange);
  }, []);

  const initializeGA4WithConsent = () => {
    // Initialize standard GA4
    initializeGA4(ANALYTICS_CONFIG.GA4_MEASUREMENT_ID);

    // Set initial consent mode
    if (window.gtag) {
      const consentSettings = {
        ...ANALYTICS_CONFIG.CONSENT_MODE_DEFAULTS,
        analytics_storage: hasConsent(CONSENT_CATEGORIES.ANALYTICS) ? 'granted' : 'denied',
        ad_storage: hasConsent(CONSENT_CATEGORIES.MARKETING) ? 'granted' : 'denied',
        ad_user_data: hasConsent(CONSENT_CATEGORIES.MARKETING) ? 'granted' : 'denied',
        ad_personalization: hasConsent(CONSENT_CATEGORIES.MARKETING) ? 'granted' : 'denied'
      };
      
      window.gtag('consent', 'default', consentSettings);
      logAnalyticsEvent('consent_initialized', consentSettings);
      console.log('🍪 GA4 consent mode initialized');
    }

    // Track initial page view
    trackPageView();
  };

  return null; // This component doesn't render anything
};

// Enhanced tracking functions with consent checks
export const useGA4Tracking = () => {
  const { hasConsent } = useConsent();

  const trackPageView = (page_path = window.location.pathname) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      page_title: document.title,
      page_location: window.location.href,
      page_path: page_path
    };
    
    trackEvent('page_view', params);
    logAnalyticsEvent('page_view', params);
  };

  const trackAnalysisStart = (url) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      event_category: 'engagement',
      analyzed_url: url,
      user_tier: localStorage.getItem('user-tier') || 'free'
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ANALYSIS_START, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ANALYSIS_START, params);
  };

  const trackAnalysisComplete = (url, score, duration) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      event_category: 'engagement', 
      analyzed_url: url,
      analysis_score: score,
      analysis_duration: duration,
      user_tier: localStorage.getItem('user-tier') || 'free'
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ANALYSIS_COMPLETE, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ANALYSIS_COMPLETE, params);
  };

  const trackSignup = (tier = 'free') => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      event_category: 'conversion',
      method: 'email',
      tier: tier
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.SIGNUP, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.SIGNUP, params);

    // Also track as conversion
    trackConversion(ANALYTICS_CONFIG.CUSTOM_EVENTS.SIGNUP, 0);
  };

  const trackUpgrade = (fromTier, toTier, value) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const tierConfig = ANALYTICS_CONFIG.TIERS[toTier] || { value, name: toTier };
    const params = {
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
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.PURCHASE, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.PURCHASE, params);

    // Enhanced ecommerce tracking
    trackConversion(ANALYTICS_CONFIG.CUSTOM_EVENTS.PURCHASE, value);
  };

  const trackFeatureUsage = (feature, action) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      event_category: 'engagement',
      feature_name: feature,
      action: action,
      user_tier: localStorage.getItem('user-tier') || 'free'
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.FEATURE_USAGE, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.FEATURE_USAGE, params);
  };

  const trackError = (errorType, errorMessage, page) => {
    if (!hasConsent(CONSENT_CATEGORIES.ANALYTICS)) return;
    
    const params = {
      description: `${errorType}: ${errorMessage}`,
      fatal: false,
      page: page
    };
    
    trackEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ERROR_TRACKING, params);
    logAnalyticsEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.ERROR_TRACKING, params);
  };

  return {
    trackPageView,
    trackAnalysisStart,
    trackAnalysisComplete,
    trackSignup,
    trackUpgrade,
    trackFeatureUsage,
    trackError
  };
};

// MCP Analytics Hook - For advanced analytics via Claude Code
export const useMCPAnalytics = () => {
  const generateWeeklyReport = async () => {
    try {
      const result = await ga4MCP.generateWeeklyReport();
      console.log('📊 MCP Weekly Report:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ MCP Analytics not available:', error.message);
      return { error: 'MCP not available', fallback: 'Use standard GA4 reporting' };
    }
  };

  const analyzeConversionFunnel = async () => {
    try {
      const result = await ga4MCP.getConversionFunnel();
      console.log('📊 MCP Conversion Analysis:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ MCP Analytics not available:', error.message);
      return { error: 'MCP not available', fallback: 'Use GA4 conversion reports' };
    }
  };

  const forecastRevenue = async (timeframe = '3_months') => {
    try {
      const result = await ga4MCP.forecastRevenue(timeframe);
      console.log('📊 MCP Revenue Forecast:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ MCP Analytics not available:', error.message);
      return { error: 'MCP not available', fallback: 'Use GA4 Intelligence insights' };
    }
  };

  const identifyAnomalies = async () => {
    try {
      const result = await ga4MCP.identifyAnomalies();
      console.log('📊 MCP Anomaly Detection:', result);
      return result;
    } catch (error) {
      console.warn('⚠️ MCP Analytics not available:', error.message);
      return { error: 'MCP not available', fallback: 'Monitor GA4 Intelligence alerts' };
    }
  };

  return {
    generateWeeklyReport,
    analyzeConversionFunnel,
    forecastRevenue,
    identifyAnomalies
  };
};

export default GA4Integration;