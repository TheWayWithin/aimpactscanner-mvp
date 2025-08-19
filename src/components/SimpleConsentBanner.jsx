// Simple Consent Banner - Clean GDPR compliance without page takeover
import React, { useState, useEffect } from 'react';

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
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setIsVisible(false);
    
    // Enable GTM analytics
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: 'granted',
        consent_marketing: 'granted'
      });
    }
  };

  const handleAcceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setIsVisible(false);
    
    // Update GTM based on preferences
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: preferences.analytics ? 'granted' : 'denied',
        consent_marketing: preferences.marketing ? 'granted' : 'denied'
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
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setIsVisible(false);
    
    // Disable all non-essential tracking
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: 'denied',
        consent_marketing: 'denied'
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
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
              <span className="text-blue-600 hover:underline cursor-pointer">
                Learn more in our Privacy Policy
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {showDetails ? 'Hide Details' : 'Customize'}
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reject All
            </button>
            <button
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