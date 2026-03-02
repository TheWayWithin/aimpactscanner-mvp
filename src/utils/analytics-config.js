// Analytics Configuration
// Environment-specific settings for GTM, GA4 and GDPR compliance

export const ANALYTICS_CONFIG = {
  // Google Tag Manager Configuration
  GTM_CONTAINER_ID: import.meta.env.VITE_GTM_CONTAINER_ID || 'GTM-WCQGG5N6',
  
  // GA4 Configuration (configured via GTM)
  GA4_MEASUREMENT_ID: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-EJ5M874QBZ',
  
  // Enzuzo GDPR Configuration - REMOVED FOR TESTING
  // ENZUZO_DOMAIN_ID: import.meta.env.VITE_ENZUZO_DOMAIN_ID || 'd7ac73b6-7c38-11f0-9bf3-a7c11342cf5c',
  
  // Event Tracking Configuration
  CUSTOM_EVENTS: {
    ANALYSIS_START: 'analysis_start',
    ANALYSIS_COMPLETE: 'analysis_complete',
    SIGNUP: 'sign_up',
    PURCHASE: 'purchase',
    FEATURE_USAGE: 'feature_usage',
    ERROR_TRACKING: 'exception',
    // Audit v3 conversion funnel events
    SCAN_START: 'scan_start',
    SCAN_COMPLETE_FREE: 'scan_complete_free',
    VIEW_SAMPLE_REPORT: 'view_sample_report',
    VIEW_PRICING_PAGE: 'view_pricing_page',
    SELECT_PLAN: 'select_plan',
    CHECKOUT_START: 'checkout_start',
    PURCHASE_COMPLETE: 'purchase_complete',
    RESCAN_WITHIN_7D: 'rescan_within_7d',
    // Tier Selector Events (Phase 8)
    TIER_SELECTOR_VIEWED: 'tier_selector_viewed',
    TIER_SELECTION_CHANGED: 'tier_selection_changed',
    BILLING_TOGGLE_CLICKED: 'billing_toggle_clicked',
    TIER_CTA_CLICKED: 'tier_cta_clicked',
    TRIAL_DETAILS_EXPANDED: 'trial_details_expanded'
  },
  
  // Enhanced Ecommerce
  CURRENCY: 'USD',
  TIERS: {
    free: { value: 0, name: 'Free Tier' },
    coffee: { value: 5, name: 'Coffee Tier' },
    professional: { value: 25, name: 'Professional Tier' }
  }
};

// Environment detection
export const isProduction = () => {
  return import.meta.env.PROD || import.meta.env.VITE_ENVIRONMENT === 'production';
};

export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_ENVIRONMENT === 'development';
};

// Debug settings
export const DEBUG_ANALYTICS = isDevelopment() && import.meta.env.VITE_DEBUG_ANALYTICS === 'true';

// Console logging for analytics events
export const logAnalyticsEvent = (eventName, parameters) => {
  if (DEBUG_ANALYTICS) {
    console.group(`📊 Analytics Event: ${eventName}`);
    console.log('Parameters:', parameters);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

// Tier Selector Event Tracking Helper (Phase 8)
export const trackTierSelectorEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters,
      timestamp: new Date().toISOString()
    });

    if (DEBUG_ANALYTICS) {
      logAnalyticsEvent(eventName, parameters);
    }
  }
};

export default ANALYTICS_CONFIG;