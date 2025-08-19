// Enzuzo GDPR Integration - Professional consent management
// Handles Enzuzo consent banner and privacy policy integration

import React, { useEffect } from 'react';

export const EnzuzoIntegration = () => {
  useEffect(() => {
    // Since Enzuzo script is now loaded directly in HTML, we just need to
    // initialize consent change listeners when the component mounts
    
    const initializeEnzuzoListeners = () => {
      if (window.Enzuzo) {
        console.log('🍪 Enzuzo consent management initialized from HTML');
        
        // Listen for consent changes
        window.Enzuzo.onConsentChange((consentData) => {
          console.log('🍪 Consent updated:', consentData);
          
          // Update GTM consent mode based on Enzuzo consent
          if (window.dataLayer) {
            window.dataLayer.push({
              event: 'consent_update',
              consent_analytics: consentData.analytics ? 'granted' : 'denied',
              consent_marketing: consentData.marketing ? 'granted' : 'denied'
            });
          }
        });
      } else {
        // If Enzuzo isn't ready yet, try again in a bit
        setTimeout(initializeEnzuzoListeners, 1000);
      }
    };

    // Start initialization
    initializeEnzuzoListeners();
  }, []);

  return null; // This component doesn't render anything
};

// Enzuzo Consent Utilities
export const useEnzuzoConsent = () => {
  
  const hasConsent = (category) => {
    if (typeof window === 'undefined' || !window.Enzuzo) {
      return false;
    }
    
    const consent = window.Enzuzo.getConsent();
    return consent && consent[category] === true;
  };

  const showConsentBanner = () => {
    if (typeof window !== 'undefined' && window.Enzuzo) {
      window.Enzuzo.showConsentBanner();
    }
  };

  const resetConsent = () => {
    if (typeof window !== 'undefined' && window.Enzuzo) {
      window.Enzuzo.resetConsent();
    }
  };

  return {
    hasConsent,
    showConsentBanner,
    resetConsent
  };
};

// Privacy Policy Component (uses Enzuzo-generated content)
export const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <div 
            id="enzuzo-privacy-policy"
            className="space-y-4"
          >
            <p className="text-gray-600">
              Loading privacy policy... If you don't see content below, Enzuzo integration may not be properly configured.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Configure Enzuzo Domain ID in environment variables</li>
                <li>2. Enable privacy policy auto-insertion in Enzuzo dashboard</li>
                <li>3. Customize policy content for AImpactScanner</li>
                <li>4. This placeholder content will be replaced automatically</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            This privacy policy is automatically generated and maintained by{' '}
            <a 
              href="https://enzuzo.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Enzuzo Privacy Compliance
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnzuzoIntegration;