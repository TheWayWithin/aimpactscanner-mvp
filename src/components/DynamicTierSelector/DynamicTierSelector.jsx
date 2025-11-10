// DynamicTierSelector.jsx - Main container component for tier selection
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BillingToggle from './BillingToggle';
import TierDropdownSelector from './TierDropdownSelector';
import TierMessagingSection from './TierMessagingSection';
import SavingsHighlight from './SavingsHighlight';
import { useBillingPricing } from './useBillingPricing';
import { ANALYTICS_CONFIG, trackTierSelectorEvent } from '../../utils/analytics-config';

const DynamicTierSelector = ({
  defaultTier = 'growth',
  defaultBilling = 'annual',
  onTierChange,
  onBillingChange,
  onSelectionComplete
}) => {
  const [billingFrequency, setBillingFrequency] = useState(defaultBilling);
  const [selectedTier, setSelectedTier] = useState(defaultTier);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isTrial, setIsTrial] = useState(false); // Track if user selected trial option

  // Event #1: Track tier selector view on component mount
  useEffect(() => {
    trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TIER_SELECTOR_VIEWED, {
      default_tier: defaultTier,
      default_billing: defaultBilling,
      page_path: window.location.hash
    });
  }, []); // Only fire once on mount

  // Tier data structure
  const tiers = [
    {
      internalId: 'free',
      displayName: '⚠️ Free',
      description: 'Only 3 analyses/month',
      badge: null
    },
    {
      internalId: 'coffee',
      displayName: '💼 Solo',
      description: '10 analyses/month, 30-day tracking',
      badge: null
    },
    {
      internalId: 'growth',
      displayName: '🚀 Growth',
      description: '40 analyses/month, 90-day tracking, CSV + LLMS.txt',
      badge: '⭐ RECOMMENDED'
    },
    {
      internalId: 'scale',
      displayName: '🏢 Scale',
      description: '100 analyses/month, unlimited history, API access',
      badge: null
    }
  ];

  // Get pricing for selected tier
  const selectedPricing = useBillingPricing(selectedTier, billingFrequency);

  // Handle tier change with transition
  const handleTierChange = (tierId) => {
    const previousTier = selectedTier; // Capture before change
    setIsTransitioning(true);

    setTimeout(() => {
      setSelectedTier(tierId);
      // Reset trial flag when switching tiers
      setIsTrial(false);
      setIsTransitioning(false);

      // Event #2: Track tier selection change
      trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TIER_SELECTION_CHANGED, {
        previous_tier: previousTier,
        new_tier: tierId,
        billing_frequency: billingFrequency
      });

      if (onTierChange) {
        onTierChange(tierId);
      }
    }, 200); // Match exit animation duration
  };

  // Handle trial selection (Growth tier only)
  const handleTrialSelect = (wantsTrial, autoProceed = false) => {
    console.log('[DynamicTierSelector] handleTrialSelect called');
    console.log('[DynamicTierSelector] wantsTrial parameter:', wantsTrial);
    console.log('[DynamicTierSelector] autoProceed parameter:', autoProceed);
    console.log('[DynamicTierSelector] selectedTier:', selectedTier);
    console.log('[DynamicTierSelector] billingFrequency:', billingFrequency);

    setIsTrial(wantsTrial);
    console.log('🎁 Trial option selected:', wantsTrial ? 'YES' : 'NO');

    // If autoProceed is true, immediately proceed to OAuth selection
    if (autoProceed && onSelectionComplete) {
      console.log('🚀 Auto-proceeding to OAuth with trial:', wantsTrial);
      console.log('[DynamicTierSelector] Calling onSelectionComplete with:', {
        tier: selectedTier,
        billing: billingFrequency,
        isTrial: wantsTrial
      });
      onSelectionComplete(selectedTier, billingFrequency, wantsTrial);
    }
  };

  // Handle billing frequency change
  const handleBillingChange = (frequency) => {
    setBillingFrequency(frequency);

    if (onBillingChange) {
      onBillingChange(frequency);
    }
  };

  // Handle continue button click
  const handleContinue = () => {
    // Event #4: Track continue button click
    trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TIER_CTA_CLICKED, {
      cta_type: 'continue',
      selected_tier: selectedTier,
      billing_frequency: billingFrequency,
      is_trial: isTrial
    });

    if (onSelectionComplete) {
      onSelectionComplete(selectedTier, billingFrequency, isTrial);
    }
  };

  // Find display name for selected tier
  const selectedTierData = tiers.find(t => t.internalId === selectedTier);

  return (
    <div className="dynamic-tier-selector" data-testid="tier-selector-container">
      {/* Two-Column Layout: Left 40%, Right 60% */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-4 lg:gap-8 items-start">
        {/* Left Column (40%): Billing Toggle + Tier Dropdown Selector */}
        <div className="space-y-4 w-full max-w-full">
          <BillingToggle
            defaultBilling={defaultBilling}
            onBillingChange={handleBillingChange}
            currentTier={selectedTier}
          />
          <div className="w-full" data-testid="tier-dropdown-section">
            <TierDropdownSelector
              tiers={tiers}
              selectedTier={selectedTier}
              billingFrequency={billingFrequency}
              onTierSelect={handleTierChange}
              isTransitioning={isTransitioning}
              onTrialSelect={handleTrialSelect}
            />
          </div>
        </div>

        {/* Right Column (60%): Tier Messaging + Savings Highlight */}
        <div className="space-y-4 w-full max-w-full" data-testid="tier-messaging-wrapper">
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <TierMessagingSection
              selectedTier={selectedTier}
              isTransitioning={isTransitioning}
            />
          </div>
          <SavingsHighlight
            selectedTier={selectedTier}
            billingFrequency={billingFrequency}
            isTransitioning={isTransitioning}
          />
        </div>
      </div>

      {/* Selected Tier Summary */}
      {selectedPricing && (
        <div className={`
          mt-4 p-4 rounded-lg border-2 transition-all
          ${isTransitioning ? 'opacity-50' : 'opacity-100'}
          ${selectedTier === 'growth' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}
        `}>
          <div className="font-semibold text-gray-900 mb-2">
            Selected: {selectedTierData?.displayName}
            {selectedTier === 'growth' && isTrial && (
              <span className="ml-2 text-xs font-bold text-green-600">🎁 7-DAY TRIAL</span>
            )}
          </div>
          <div className="text-lg font-bold text-gray-900">
            {selectedTier === 'growth' && isTrial ? (
              <>$0 for 7 days</>
            ) : (
              selectedPricing.displayPrice
            )}
          </div>
          <div className="text-sm text-gray-600">
            {selectedTier === 'growth' && isTrial ? (
              <>then {selectedPricing.displayPrice} ({selectedPricing.displayBilling})</>
            ) : (
              selectedPricing.displayBilling
            )}
          </div>
          {selectedPricing.isAnnual && selectedPricing.displaySavings && !isTrial && (
            <div className="text-sm text-green-600 font-semibold mt-2">
              💰 {selectedPricing.displaySavings}
            </div>
          )}
        </div>
      )}

      {/* Continue Button */}
      <div className="mt-6">
        <button
          onClick={handleContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg shadow-lg hover:shadow-xl"
        >
          Continue to Sign Up →
        </button>
      </div>
    </div>
  );
};

DynamicTierSelector.propTypes = {
  defaultTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']),
  defaultBilling: PropTypes.oneOf(['annual', 'monthly']),
  onTierChange: PropTypes.func,
  onBillingChange: PropTypes.func,
  onSelectionComplete: PropTypes.func
};

export default DynamicTierSelector;
