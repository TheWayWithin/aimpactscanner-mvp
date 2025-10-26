// TierOptionsList.jsx - Tier selection component with radio buttons
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useBillingPricing } from './useBillingPricing';

const TierOptionsList = ({
  tiers,
  selectedTier,
  billingFrequency,
  onTierSelect,
  isTransitioning = false,
  onTrialSelect = null // Callback for trial selection
}) => {
  const [showTrialDetails, setShowTrialDetails] = useState(false);

  return (
    <div className="space-y-3">
      {tiers.map((tier) => {
        const isSelected = selectedTier === tier.internalId;
        const pricing = useBillingPricing(tier.internalId, billingFrequency);
        const isGrowthTier = tier.internalId === 'growth';

        // Tier-specific border colors
        const borderColors = {
          free: 'border-gray-300',
          coffee: 'border-blue-400',
          growth: 'border-yellow-400',
          scale: 'border-purple-400'
        };

        // Tier-specific background colors when selected
        const bgColors = {
          free: 'bg-gray-50',
          coffee: 'bg-blue-50',
          growth: 'bg-yellow-50',
          scale: 'bg-purple-50'
        };

        return (
          <div
            key={tier.internalId}
            onClick={() => !isTransitioning && onTierSelect(tier.internalId)}
            className={`
              relative border-2 rounded-lg p-4 transition-all cursor-pointer
              ${isSelected ? `${borderColors[tier.internalId]} ${bgColors[tier.internalId]}` : 'border-gray-200 hover:border-gray-300'}
              ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {/* Badge (for Growth tier) */}
            {tier.badge && (
              <div className="absolute -top-3 right-4 px-3 py-1 bg-yellow-400 text-xs font-bold rounded-full text-gray-900">
                {tier.badge}
              </div>
            )}

            {/* Trial Badge (Growth tier only, top-left) */}
            {isGrowthTier && (
              <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-green-400 to-teal-400 text-xs font-bold rounded-full text-white shadow-md">
                🎁 7-DAY FREE TRIAL
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <input
                  type="radio"
                  name="tier"
                  value={tier.internalId}
                  checked={isSelected}
                  onChange={() => onTierSelect(tier.internalId)}
                  disabled={isTransitioning}
                  className="mr-3 focus:ring-2 focus:ring-yellow-500"
                  aria-label={`${tier.displayName} - ${tier.description}`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {tier.displayName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tier.description}
                  </div>
                </div>
              </div>

              {/* Pricing Display */}
              {pricing && (
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">
                    {pricing.displayPrice}
                  </div>
                  {tier.internalId !== 'free' && (
                    <div className="text-xs text-gray-500">
                      {pricing.displayBilling}
                    </div>
                  )}
                  {pricing.isAnnual && pricing.displaySavings && (
                    <div className="text-xs text-green-600 font-semibold">
                      {pricing.displaySavings}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trial Details (Growth tier only, shown when selected) */}
            {isGrowthTier && isSelected && (
              <div className="mt-4 pt-4 border-t border-yellow-300">
                {/* Trial CTA Buttons */}
                <div className="space-y-2">
                  {/* Primary CTA - Start Trial */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTrialSelect) {
                        onTrialSelect(true, true); // Second param = auto-proceed
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    🎁 Try Growth Free for 7 Days
                  </button>

                  {/* Secondary CTA - Skip Trial */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTrialSelect) {
                        onTrialSelect(false, true); // Second param = auto-proceed
                      }
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all border-2 border-gray-300 hover:border-gray-400 text-sm"
                  >
                    Skip trial, subscribe now
                  </button>
                </div>

                {/* Expandable Trial Details */}
                <div className="mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTrialDetails(!showTrialDetails);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
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
      })}
    </div>
  );
};

TierOptionsList.propTypes = {
  tiers: PropTypes.arrayOf(PropTypes.shape({
    internalId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    badge: PropTypes.string
  })).isRequired,
  selectedTier: PropTypes.string.isRequired,
  billingFrequency: PropTypes.oneOf(['annual', 'monthly']).isRequired,
  onTierSelect: PropTypes.func.isRequired,
  isTransitioning: PropTypes.bool,
  onTrialSelect: PropTypes.func
};

export default TierOptionsList;
