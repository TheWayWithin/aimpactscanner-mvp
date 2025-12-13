// TierDropdownSelector.jsx - Dropdown tier selection component
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useBillingPricing } from './useBillingPricing';
import { ANALYTICS_CONFIG, trackTierSelectorEvent } from '../../utils/analytics-config';

const TierDropdownSelector = ({
  tiers,
  selectedTier,
  billingFrequency,
  onTierSelect,
  onTrialSelect = null,
  isTransitioning = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showTrialDetails, setShowTrialDetails] = useState(false);
  const [optimisticTier, setOptimisticTier] = useState(null); // For immediate UI feedback
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Use optimistic tier during transition, fall back to actual selectedTier
  const displayTier = optimisticTier || selectedTier;
  const selectedTierData = tiers.find(t => t.internalId === displayTier);
  const pricing = useBillingPricing(displayTier, billingFrequency);
  const isGrowthTier = displayTier === 'growth';

  // Tier-specific border colors
  const borderColors = {
    free: 'border-gray-300',
    coffee: 'border-blue-400',
    growth: 'border-yellow-400',
    scale: 'border-purple-400'
  };

  // Tier-specific background colors
  const bgColors = {
    free: 'bg-gray-50',
    coffee: 'bg-blue-50',
    growth: 'bg-yellow-50',
    scale: 'bg-purple-50'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (isTransitioning) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0); // Start at first option for predictable keyboard navigation
        } else if (focusedIndex >= 0) {
          handleSelect(tiers[focusedIndex].internalId);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => (prev + 1) % tiers.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => (prev - 1 + tiers.length) % tiers.length);
        }
        break;
      case 'Home':
        // Jump to first option (when dropdown is open)
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(0);
        }
        break;
      case 'End':
        // Jump to last option (when dropdown is open)
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(tiers.length - 1);
        }
        break;
      case 'PageDown':
        // Jump down by 3 positions (useful for longer lists)
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 3, tiers.length - 1));
        }
        break;
      case 'PageUp':
        // Jump up by 3 positions (useful for longer lists)
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 3, 0));
        }
        break;
      default:
        break;
    }
  };

  // Handle tier selection
  const handleSelect = (tierId) => {
    // Immediately update UI for instant feedback (optimistic update)
    setOptimisticTier(tierId);
    onTierSelect(tierId);
    setIsOpen(false);
    setFocusedIndex(-1);
    setShowTrialDetails(false);
  };

  // Clear optimistic tier when actual selectedTier updates (transition complete)
  useEffect(() => {
    if (optimisticTier && optimisticTier === selectedTier) {
      setOptimisticTier(null);
    }
  }, [selectedTier, optimisticTier]);

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isTransitioning) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(0); // Start at first option for predictable keyboard navigation
      } else {
        setFocusedIndex(-1);
      }
    }
  };

  return (
    <div className="tier-dropdown-selector relative" ref={dropdownRef} data-testid="tier-dropdown">
      {/* Dropdown Trigger */}
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select pricing tier"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        data-testid="tier-dropdown-button"
        className={`
          relative border-2 rounded-lg p-4 cursor-pointer transition-all min-h-[48px]
          ${borderColors[displayTier]} ${bgColors[displayTier]}
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
        `}
      >
        {/* Growth Tier Trial Badge */}
        {isGrowthTier && (
          <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-green-600 to-teal-600 text-xs font-bold rounded-full text-white shadow-md">
            🎁 7-DAY FREE TRIAL
          </div>
        )}

        {/* Selected Tier Display */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-gray-900 flex items-center">
              {selectedTierData?.displayName}
              {selectedTierData?.badge && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-xs font-bold rounded text-gray-900">
                  {selectedTierData.badge}
                </span>
              )}
            </div>
            {selectedTierData?.tagline && (
              <div className="text-sm font-medium text-gray-700 mt-0.5 italic">
                "{selectedTierData.tagline}"
              </div>
            )}
            <div className="text-sm text-gray-600 mt-1">
              {selectedTierData?.description}
            </div>
          </div>

          {/* Dropdown Arrow */}
          <div className="ml-4">
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Pricing tier options"
          data-testid="tier-dropdown-menu"
          className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden"
        >
          {tiers.map((tier, index) => {
            const isSelected = displayTier === tier.internalId;
            const isFocused = focusedIndex === index;

            return (
              <div
                key={tier.internalId}
                role="option"
                aria-selected={isSelected ? 'true' : 'false'}
                onClick={() => handleSelect(tier.internalId)}
                data-testid={`tier-option-${tier.internalId}`}
                className={`
                  relative px-4 py-3 cursor-pointer transition-all min-h-[56px] flex items-center
                  ${isFocused ? 'bg-gray-100' : 'hover:bg-gray-50'}
                  ${isSelected ? bgColors[tier.internalId] : ''}
                  border-b border-gray-100 last:border-b-0
                `}
              >
                {/* Tier Info */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 flex items-center">
                    {tier.displayName}
                    {tier.badge && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-xs font-bold rounded text-gray-900">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  {tier.tagline && (
                    <div className="text-sm font-medium text-gray-700 mt-0.5 italic">
                      "{tier.tagline}"
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-0.5">
                    {tier.description}
                  </div>
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="ml-3">
                    <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pricing Display */}
      {pricing && (
        <div className="mt-4 text-center">
          <div className="text-3xl font-bold text-gray-900" data-testid="tier-price">
            {pricing.displayPrice}
          </div>
          {selectedTier !== 'free' && (
            <div className="text-sm text-gray-600 mt-1">
              {pricing.displayBilling}
            </div>
          )}
          {pricing.isAnnual && pricing.displaySavings && (
            <div className="text-sm text-green-700 font-semibold mt-1">
              💰 {pricing.displaySavings}
            </div>
          )}
        </div>
      )}

      {/* Trial CTAs (Growth tier only) */}
      {isGrowthTier && (
        <div className="mt-6 space-y-3">
          {/* Primary CTA - Start Trial */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[TierDropdownSelector] User clicked: Try Growth Free for 7 Days');
              console.log('[TierDropdownSelector] Calling onTrialSelect(true, true)');

              // Event #4: Track trial CTA click
              trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TIER_CTA_CLICKED, {
                cta_type: 'trial',
                selected_tier: selectedTier,
                billing_frequency: billingFrequency,
                is_trial: true
              });

              if (onTrialSelect) {
                onTrialSelect(true, true); // Second param = auto-proceed
              }
            }}
            data-testid="tier-cta-button"
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            🎁 Try Growth Free for 7 Days
          </button>

          {/* Secondary CTA - Skip Trial */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log('[TierDropdownSelector] User clicked: Skip trial, subscribe now');
              console.log('[TierDropdownSelector] Calling onTrialSelect(false, true)');

              // Event #4: Track skip trial CTA click
              trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TIER_CTA_CLICKED, {
                cta_type: 'skip_trial',
                selected_tier: selectedTier,
                billing_frequency: billingFrequency,
                is_trial: false
              });

              if (onTrialSelect) {
                onTrialSelect(false, true); // Second param = auto-proceed
              }
            }}
            data-testid="tier-skip-trial-button"
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 min-h-[40px]"
          >
            Skip trial, subscribe now
          </button>

          {/* Expandable Trial Details */}
          <div className="mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newExpandedState = !showTrialDetails;
                setShowTrialDetails(newExpandedState);

                // Event #5: Track trial details expansion
                trackTierSelectorEvent(ANALYTICS_CONFIG.CUSTOM_EVENTS.TRIAL_DETAILS_EXPANDED, {
                  expanded: newExpandedState,
                  selected_tier: selectedTier,
                  billing_frequency: billingFrequency
                });
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none"
            >
              {showTrialDetails ? '▼ Hide trial details' : '▶ Show trial details'}
            </button>

            {showTrialDetails && (
              <div className="mt-2 p-3 bg-white rounded-lg border border-yellow-300 text-sm text-gray-700 space-y-1">
                <p><strong>What happens during the trial:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Full access to Growth tier features (40 analyses)</li>
                  <li>Card required upfront, but not charged yet</li>
                  <li>After 7 days, converts to {billingFrequency === 'annual' ? `$${pricing.annualMonthlyEquivalent?.toFixed(2)}/mo (billed annually)` : `$${pricing.monthlyPrice.toFixed(2)}/mo`}</li>
                  <li>Cancel anytime during trial - no charge</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

TierDropdownSelector.propTypes = {
  tiers: PropTypes.arrayOf(PropTypes.shape({
    internalId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    tagline: PropTypes.string,
    description: PropTypes.string.isRequired,
    badge: PropTypes.string
  })).isRequired,
  selectedTier: PropTypes.string.isRequired,
  billingFrequency: PropTypes.oneOf(['annual', 'monthly']).isRequired,
  onTierSelect: PropTypes.func.isRequired,
  onTrialSelect: PropTypes.func,
  isTransitioning: PropTypes.bool
};

export default TierDropdownSelector;
