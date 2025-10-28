// BillingToggle.jsx - Toggle switch for annual/monthly billing selection
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BillingToggle = ({
  defaultBilling = 'annual',
  onBillingChange,
  currentTier = 'growth'
}) => {
  const [selected, setSelected] = useState(defaultBilling);

  // Max savings by tier (for display message)
  const maxSavings = {
    coffee: 21.90,
    growth: 65.90,
    scale: 119.90
  };

  const handleToggle = (frequency) => {
    setSelected(frequency);
    if (onBillingChange) {
      onBillingChange(frequency);
    }
  };

  const isAnnual = selected === 'annual';
  const tierSavings = maxSavings[currentTier] || maxSavings.scale; // Default to max

  return (
    <div className="billing-toggle mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Billing Frequency:
      </label>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => handleToggle('monthly')}
          data-billing="monthly"
          className={`
            flex-1 py-3 px-6 rounded-lg font-semibold text-base transition-all
            ${!isAnnual
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
          aria-pressed={!isAnnual}
        >
          Monthly
        </button>

        <button
          type="button"
          onClick={() => handleToggle('annual')}
          data-billing="annual"
          className={`
            flex-1 py-3 px-6 rounded-lg font-semibold text-base transition-all
            ${isAnnual
              ? 'bg-yellow-400 text-gray-900 shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
          aria-pressed={isAnnual}
        >
          Annual {isAnnual && '✓'}
        </button>
      </div>

      {/* Savings Message */}
      {isAnnual && (
        <div className="text-sm text-green-700 font-medium">
          💰 Save up to ${tierSavings.toFixed(2)}/year with annual billing
        </div>
      )}

      {!isAnnual && (
        <div className="text-sm text-gray-600">
          Switch to annual to save up to ${tierSavings.toFixed(2)}/year
        </div>
      )}
    </div>
  );
};

BillingToggle.propTypes = {
  defaultBilling: PropTypes.oneOf(['annual', 'monthly']),
  onBillingChange: PropTypes.func.isRequired,
  currentTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale'])
};

export default BillingToggle;
