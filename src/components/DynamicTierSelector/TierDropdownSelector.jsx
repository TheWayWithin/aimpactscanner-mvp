// TierDropdownSelector.jsx - Dropdown tier selection component
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useBillingPricing } from './useBillingPricing';

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
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const selectedTierData = tiers.find(t => t.internalId === selectedTier);
  const pricing = useBillingPricing(selectedTier, billingFrequency);
  const isGrowthTier = selectedTier === 'growth';

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
          setFocusedIndex(tiers.findIndex(t => t.internalId === selectedTier));
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
      default:
        break;
    }
  };

  // Handle tier selection
  const handleSelect = (tierId) => {
    if (!isTransitioning) {
      onTierSelect(tierId);
      setIsOpen(false);
      setFocusedIndex(-1);
      setShowTrialDetails(false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!isTransitioning) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(tiers.findIndex(t => t.internalId === selectedTier));
      } else {
        setFocusedIndex(-1);
      }
    }
  };

  return (
    <div className="tier-dropdown-selector relative" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select pricing tier"
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={`
          relative border-2 rounded-lg p-4 cursor-pointer transition-all min-h-[44px]
          ${borderColors[selectedTier]} ${bgColors[selectedTier]}
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
        `}
      >
        {/* Growth Tier Trial Badge */}
        {isGrowthTier && (
          <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-green-400 to-teal-400 text-xs font-bold rounded-full text-white shadow-md">
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
          className="absolute z-50 mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-xl overflow-hidden"
        >
          {tiers.map((tier, index) => {
            const isSelected = selectedTier === tier.internalId;
            const isFocused = focusedIndex === index;

            return (
              <div
                key={tier.internalId}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(tier.internalId)}
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
                  <div className="text-sm text-gray-600 mt-0.5">
                    {tier.description}
                  </div>
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="ml-3">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="text-3xl font-bold text-gray-900">
            {pricing.displayPrice}
          </div>
          {selectedTier !== 'free' && (
            <div className="text-sm text-gray-600 mt-1">
              {pricing.displayBilling}
            </div>
          )}
          {pricing.isAnnual && pricing.displaySavings && (
            <div className="text-sm text-green-600 font-semibold mt-1">
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
            onClick={(e) => {
              e.stopPropagation();
              console.log('[TierDropdownSelector] User clicked: Try Growth Free for 7 Days');
              console.log('[TierDropdownSelector] Calling onTrialSelect(true, true)');
              if (onTrialSelect) {
                onTrialSelect(true, true); // Second param = auto-proceed
              }
            }}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            🎁 Try Growth Free for 7 Days
          </button>

          {/* Secondary CTA - Skip Trial */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('[TierDropdownSelector] User clicked: Skip trial, subscribe now');
              console.log('[TierDropdownSelector] Calling onTrialSelect(false, true)');
              if (onTrialSelect) {
                onTrialSelect(false, true); // Second param = auto-proceed
              }
            }}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Skip trial, subscribe now
          </button>

          {/* Expandable Trial Details */}
          <div className="mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTrialDetails(!showTrialDetails);
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
