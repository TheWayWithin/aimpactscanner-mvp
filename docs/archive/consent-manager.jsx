// Consent Manager - GDPR compliant cookie consent with Enzuzo integration
// Manages user consent for analytics, marketing, and functional cookies

import React, { createContext, useContext, useState, useEffect } from 'react';

// Consent Context
const ConsentContext = createContext();

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return context;
};

// Consent categories
export const CONSENT_CATEGORIES = {
  NECESSARY: 'necessary',
  ANALYTICS: 'analytics', 
  MARKETING: 'marketing'
};

// Consent Provider Component
export const ConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState({
    [CONSENT_CATEGORIES.NECESSARY]: true, // Always true
    [CONSENT_CATEGORIES.ANALYTICS]: false,
    [CONSENT_CATEGORIES.MARKETING]: false,
    initialized: false,
    bannerShown: false
  });

  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    loadConsentState();
  }, []);

  const loadConsentState = () => {
    try {
      const savedConsent = localStorage.getItem('cookie-consent');
      if (savedConsent) {
        const parsed = JSON.parse(savedConsent);
        setConsent(prev => ({
          ...prev,
          ...parsed,
          initialized: true,
          bannerShown: true
        }));
      } else {
        // First visit - show banner
        setShowBanner(true);
        setConsent(prev => ({ ...prev, initialized: true }));
      }
    } catch (error) {
      console.error('Error loading consent state:', error);
      setShowBanner(true);
      setConsent(prev => ({ ...prev, initialized: true }));
    }
  };

  const updateConsent = (category, granted) => {
    if (category === CONSENT_CATEGORIES.NECESSARY) return; // Can't disable necessary

    setConsent(prev => {
      const newConsent = {
        ...prev,
        [category]: granted,
        bannerShown: true
      };

      // Save to localStorage
      localStorage.setItem('cookie-consent', JSON.stringify({
        [CONSENT_CATEGORIES.ANALYTICS]: newConsent[CONSENT_CATEGORIES.ANALYTICS],
        [CONSENT_CATEGORIES.MARKETING]: newConsent[CONSENT_CATEGORIES.MARKETING],
        timestamp: new Date().toISOString()
      }));

      return newConsent;
    });

    // Trigger consent change events
    triggerConsentChange(category, granted);
  };

  const acceptAll = () => {
    const newConsent = {
      [CONSENT_CATEGORIES.NECESSARY]: true,
      [CONSENT_CATEGORIES.ANALYTICS]: true,
      [CONSENT_CATEGORIES.MARKETING]: true,
      initialized: true,
      bannerShown: true
    };

    setConsent(newConsent);
    setShowBanner(false);

    // Save to localStorage
    localStorage.setItem('cookie-consent', JSON.stringify({
      [CONSENT_CATEGORIES.ANALYTICS]: true,
      [CONSENT_CATEGORIES.MARKETING]: true,
      timestamp: new Date().toISOString()
    }));

    // Trigger events for all categories
    triggerConsentChange(CONSENT_CATEGORIES.ANALYTICS, true);
    triggerConsentChange(CONSENT_CATEGORIES.MARKETING, true);
  };

  const rejectAll = () => {
    const newConsent = {
      [CONSENT_CATEGORIES.NECESSARY]: true,
      [CONSENT_CATEGORIES.ANALYTICS]: false,
      [CONSENT_CATEGORIES.MARKETING]: false,
      initialized: true,
      bannerShown: true
    };

    setConsent(newConsent);
    setShowBanner(false);

    // Save to localStorage
    localStorage.setItem('cookie-consent', JSON.stringify({
      [CONSENT_CATEGORIES.ANALYTICS]: false,
      [CONSENT_CATEGORIES.MARKETING]: false,
      timestamp: new Date().toISOString()
    }));

    // Trigger events for rejection
    triggerConsentChange(CONSENT_CATEGORIES.ANALYTICS, false);
    triggerConsentChange(CONSENT_CATEGORIES.MARKETING, false);
  };

  const triggerConsentChange = (category, granted) => {
    // Custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('consentChange', {
      detail: { category, granted }
    }));

    // GA4 Consent Mode integration
    if (typeof window !== 'undefined' && window.gtag) {
      const consentUpdate = {};
      
      if (category === CONSENT_CATEGORIES.ANALYTICS) {
        consentUpdate.analytics_storage = granted ? 'granted' : 'denied';
      }
      
      if (category === CONSENT_CATEGORIES.MARKETING) {
        consentUpdate.ad_storage = granted ? 'granted' : 'denied';
        consentUpdate.ad_user_data = granted ? 'granted' : 'denied';
        consentUpdate.ad_personalization = granted ? 'granted' : 'denied';
      }

      window.gtag('consent', 'update', consentUpdate);
      console.log('🍪 Consent updated:', consentUpdate);
    }
  };

  const hasConsent = (category) => {
    return consent[category] === true;
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    setConsent({
      [CONSENT_CATEGORIES.NECESSARY]: true,
      [CONSENT_CATEGORIES.ANALYTICS]: false,
      [CONSENT_CATEGORIES.MARKETING]: false,
      initialized: true,
      bannerShown: false
    });
    setShowBanner(true);
  };

  const value = {
    consent,
    hasConsent,
    updateConsent,
    acceptAll,
    rejectAll,
    resetConsent,
    showBanner,
    setShowBanner,
    CONSENT_CATEGORIES
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
};

// Cookie Consent Banner Component
export const ConsentBanner = () => {
  const { 
    showBanner, 
    setShowBanner, 
    acceptAll, 
    rejectAll, 
    consent,
    updateConsent,
    CONSENT_CATEGORIES 
  } = useConsent();

  const [showDetails, setShowDetails] = useState(false);

  if (!showBanner || consent.bannerShown) return null;

  const handleCustomize = () => {
    setShowDetails(!showDetails);
  };

  const handleSavePreferences = () => {
    setShowBanner(false);
    console.log('🍪 Preferences saved:', consent);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🍪 We value your privacy
            </h3>
            <p className="text-gray-600 text-sm">
              We use cookies to enhance your experience, analyze website traffic, and for marketing purposes. 
              You can customize your preferences or accept all cookies to continue.
            </p>
            
            {showDetails && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Necessary Cookies</div>
                    <div className="text-xs text-gray-600">Required for basic website functionality</div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">Always Active</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Analytics Cookies</div>
                    <div className="text-xs text-gray-600">Help us understand how you use our website</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent[CONSENT_CATEGORIES.ANALYTICS]}
                      onChange={(e) => updateConsent(CONSENT_CATEGORIES.ANALYTICS, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Marketing Cookies</div>
                    <div className="text-xs text-gray-600">Used for targeted advertising (currently not used)</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consent[CONSENT_CATEGORIES.MARKETING]}
                      onChange={(e) => updateConsent(CONSENT_CATEGORIES.MARKETING, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-6">
            <button
              onClick={handleCustomize}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            
            {showDetails ? (
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            ) : (
              <>
                <button
                  onClick={rejectAll}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentProvider;