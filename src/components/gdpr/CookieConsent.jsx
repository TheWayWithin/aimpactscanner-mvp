import React, { useState, useEffect, useCallback } from 'react';

// Default Categories
const DEFAULT_CATEGORIES = [
  {
    id: 'necessary',
    name: 'Necessary',
    description: 'Essential cookies required for the website to function. These cannot be disabled.',
    required: true,
    defaultEnabled: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Help us understand how visitors interact with the website by collecting anonymous data.',
    defaultEnabled: false,
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Used to deliver personalized advertisements and track their performance.',
    defaultEnabled: false,
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'Enable enhanced functionality and personalization, such as remembering your preferences.',
    defaultEnabled: false,
  },
];

// Helper Functions
function getStoredPreferences(storageKey) {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storePreferences(storageKey, preferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // localStorage not available — fail silently
  }
}

// Utility: Check if consent has been given
export function hasConsent(storageKey = 'cookie-consent') {
  return getStoredPreferences(storageKey) !== null;
}

export function getConsent(storageKey = 'cookie-consent') {
  return getStoredPreferences(storageKey);
}

export function isCategoryAllowed(categoryId, storageKey = 'cookie-consent') {
  const prefs = getStoredPreferences(storageKey);
  if (!prefs) return false;
  return prefs[categoryId] === true;
}

// Main Component
export function CookieConsent({
  categories = DEFAULT_CATEGORIES,
  storageKey = 'cookie-consent',
  onConsent,
  title = 'We respect your privacy',
  description = 'We use cookies to improve your experience. You can accept all cookies, reject non-essential ones, or customize your preferences.',
  acceptText = 'Accept All',
  rejectText = 'Reject All',
  customizeText = 'Customize',
  saveText = 'Save Preferences',
  privacyPolicyUrl = '/privacy',
  privacyPolicyText = 'Privacy Policy',
  position = 'bottom',
  className = '',
  primaryButtonClass = '',
  secondaryButtonClass = '',
}) {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState({});

  // Initialize preferences from categories
  useEffect(() => {
    const stored = getStoredPreferences(storageKey);
    if (stored) {
      // Already consented — don't show banner
      setVisible(false);
      return;
    }

    // Build default preferences — GDPR compliant: non-required default to OFF
    const defaults = {};
    categories.forEach((cat) => {
      defaults[cat.id] = cat.required ? true : false;
    });
    setPreferences(defaults);
    setVisible(true);
  }, [categories, storageKey]);

  const handleConsent = useCallback(
    (prefs) => {
      storePreferences(storageKey, prefs);
      setVisible(false);
      onConsent?.(prefs);
      
      // Update GTM consent mode for AImpactScanner integration
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': prefs.analytics ? 'granted' : 'denied',
          'ad_storage': prefs.marketing ? 'granted' : 'denied',
          'ad_user_data': prefs.marketing ? 'granted' : 'denied',
          'ad_personalization': prefs.marketing ? 'granted' : 'denied'
        });
      }
      
      // Send GTM event for AImpactScanner analytics
      if (window.dataLayer) {
        window.dataLayer.push({
          event: 'consent_update',
          consent_analytics: prefs.analytics ? 'granted' : 'denied',
          consent_marketing: prefs.marketing ? 'granted' : 'denied',
          consent_method: 'gdpr_banner'
        });
      }
    },
    [storageKey, onConsent]
  );

  const handleAcceptAll = useCallback(() => {
    const all = {};
    categories.forEach((cat) => {
      all[cat.id] = true;
    });
    handleConsent(all);
  }, [categories, handleConsent]);

  const handleRejectAll = useCallback(() => {
    const minimal = {};
    categories.forEach((cat) => {
      minimal[cat.id] = cat.required ? true : false;
    });
    handleConsent(minimal);
  }, [categories, handleConsent]);

  const handleSaveCustom = useCallback(() => {
    handleConsent(preferences);
  }, [preferences, handleConsent]);

  const toggleCategory = useCallback((categoryId) => {
    setPreferences((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  }, []);

  if (!visible) return null;

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  const defaultPrimaryBtn =
    'px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors';
  const defaultSecondaryBtn =
    'px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors';

  const primaryBtn = primaryButtonClass || defaultPrimaryBtn;
  const secondaryBtn = secondaryButtonClass || defaultSecondaryBtn;

  return (
    <div
      className={`fixed ${positionClass} left-0 right-0 z-[9999] p-4 ${className}`}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {description}{' '}
          {privacyPolicyUrl && (
            <a
              href={privacyPolicyUrl}
              className="underline hover:text-gray-900"
            >
              {privacyPolicyText}
            </a>
          )}
        </p>

        {/* Customize Panel */}
        {showCustomize && (
          <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={preferences[category.id] ?? false}
                  disabled={category.required}
                  onChange={() => !category.required && toggleCategory(category.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                    {category.required && (
                      <span className="ml-2 text-xs text-gray-400">(Required)</span>
                    )}
                  </span>
                  <p className="text-xs text-gray-500">
                    {category.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick={handleAcceptAll} className={primaryBtn}>
            {acceptText}
          </button>
          <button onClick={handleRejectAll} className={secondaryBtn}>
            {rejectText}
          </button>
          {!showCustomize ? (
            <button
              onClick={() => setShowCustomize(true)}
              className={secondaryBtn}
            >
              {customizeText}
            </button>
          ) : (
            <button onClick={handleSaveCustom} className={secondaryBtn}>
              {saveText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;