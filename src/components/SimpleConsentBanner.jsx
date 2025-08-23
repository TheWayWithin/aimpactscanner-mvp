// Simple Consent Banner - Clean GDPR compliance without page takeover
import React, { useState, useEffect } from 'react';

// Secure consent storage utility
const CONSENT_STORAGE_KEY = 'gdpr-cookie-consent';
const CONSENT_EXPIRY_DAYS = 365; // 1 year expiry for GDPR compliance

// Secure consent storage functions
const getConsentData = () => {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Check expiry
      if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
        return data.consent;
      } else {
        // Expired consent, remove it
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.warn('LocalStorage not available, using session-only consent');
    // Fallback to sessionStorage for security-restricted environments
    try {
      const sessionStored = sessionStorage.getItem(CONSENT_STORAGE_KEY);
      if (sessionStored) {
        return JSON.parse(sessionStored);
      }
    } catch (sessionError) {
      console.warn('SessionStorage also not available, consent will not persist');
    }
  }
  return null;
};

const setConsentData = (consentData) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);
  
  const dataToStore = {
    consent: consentData,
    expiresAt: expiryDate.toISOString(),
    version: '1.0'
  };
  
  try {
    // Try localStorage first
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.warn('LocalStorage not available, using session-only consent');
    // Fallback to sessionStorage
    try {
      sessionStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
    } catch (sessionError) {
      console.warn('SessionStorage also not available, consent will not persist');
    }
  }
};

const SimpleConsentBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always required
    analytics: false,
    marketing: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getConsentData();
    if (!consent) {
      setIsVisible(true);
      
      // Hide any existing Enzuzo banners to prevent conflicts
      const hideEnzuzoBanners = () => {
        const enzuzoBanners = document.querySelectorAll('#ez-cookie-notification, .enzuzo-cookiebanner-container, .ez-consent');
        enzuzoBanners.forEach(banner => {
          banner.style.display = 'none';
        });
      };
      
      // Hide immediately and also after a small delay
      hideEnzuzoBanners();
      setTimeout(hideEnzuzoBanners, 100);
      setTimeout(hideEnzuzoBanners, 500);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    setConsentData(consent);
    setIsVisible(false);
    
    // Update GTM consent mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
    }
    
    // Send GTM event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: 'granted',
        consent_marketing: 'granted',
        consent_method: 'accept_all'
      });
    }
  };

  const handleAcceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    setConsentData(consent);
    setIsVisible(false);
    
    // Update GTM consent mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'ad_user_data': preferences.marketing ? 'granted' : 'denied',
        'ad_personalization': preferences.marketing ? 'granted' : 'denied'
      });
    }
    
    // Send GTM event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: preferences.analytics ? 'granted' : 'denied',
        consent_marketing: preferences.marketing ? 'granted' : 'denied',
        consent_method: 'custom_preferences'
      });
    }
  };

  const handleRejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    setConsentData(consent);
    setIsVisible(false);
    
    // Update GTM consent mode - deny all non-essential
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied'
      });
    }
    
    // Send GTM event
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: 'denied',
        consent_marketing: 'denied',
        consent_method: 'reject_all'
      });
    }
  };

  const handlePreferenceChange = (type) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!isVisible) return null;

  return (
    <div data-testid="consent-banner" className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Main Message */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🍪 We use cookies to enhance your experience
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use essential cookies for site functionality and optional cookies for analytics 
              and marketing. You can customize your preferences or accept all cookies.{' '}
              <span 
                data-testid="privacy-policy-link"
                className="text-blue-600 hover:underline cursor-pointer"
                onClick={() => {
                  // Navigate to privacy policy - try multiple methods
                  if (window.location.pathname !== '/privacy') {
                    window.history.pushState({}, '', '/privacy');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                  // Also dispatch custom event as fallback
                  window.dispatchEvent(new CustomEvent('navigate-to-privacy'));
                }}
              >
                Privacy Policy
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
            <button
              data-testid="manage-preferences"
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              data-testid="reject-all-cookies"
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reject All
            </button>
            <button
              data-testid="accept-all-cookies"
              onClick={handleAcceptAll}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Detailed Preferences */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Cookie Preferences</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Essential Cookies */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Essential</h5>
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    Always Active
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Required for basic site functionality, security, and user authentication.
                </p>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Analytics</h5>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      data-testid="analytics-toggle"
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => handlePreferenceChange('analytics')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  Help us understand how visitors use our site to improve performance.
                </p>
              </div>

              {/* Marketing Cookies */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-gray-900">Marketing</h5>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      data-testid="marketing-toggle"
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => handlePreferenceChange('marketing')}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-xs text-gray-600">
                  Enable personalized content and relevant advertising.
                </p>
              </div>

            </div>

            <div className="flex justify-end mt-4">
              <button
                data-testid="save-preferences"
                onClick={handleAcceptSelected}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleConsentBanner;