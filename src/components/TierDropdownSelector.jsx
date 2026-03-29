// TierDropdownSelector.jsx - Dropdown tier selector matching LLM.txt Mastery pattern
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TierDropdownSelector = ({ selectedTier, onTierChange }) => {
  const [currentTier, setCurrentTier] = useState(selectedTier || 'coffee');

  const handleChange = (e) => {
    const tier = e.target.value;
    setCurrentTier(tier);
    onTierChange(tier);
  };

  // Tier definitions for dropdown options
  const tiers = [
    { id: 'free', label: 'FREE - 3 daily (20 pages max)' },
    { id: 'coffee', label: 'COFFEE - 20 monthly ($4.95/month)' },
    { id: 'growth', label: 'GROWTH - Go Pro ($9.95/month)' },
    { id: 'scale', label: 'SCALE - Enterprise ($19.95/month)' }
  ];

  // Benefits/warnings based on selected tier
  const tierContent = {
    free: {
      badge: 'FREE',
      badgeColor: 'bg-red-600',
      description: '3 free analyses per day, up to 20 pages',
      warning: 'WARNING: You\'ll miss critical pages and your competitors will outrank you with better llms.txt files!',
      warningColor: 'bg-red-50 border-red-200 text-red-700',
      benefits: [
        { icon: '', text: 'Only 3 analyses per day (then locked out)', color: 'text-red-600' },
        { icon: '', text: 'Severely limited to 20 pages only', color: 'text-red-600' },
        { icon: '', text: 'No AI quality scoring (missing critical content)', color: 'text-red-600' },
        { icon: '', text: 'Basic HTML extraction only', color: 'text-red-600' },
        { icon: '', text: 'WARNING: AI will only see 20 pages - missing your pricing, features, case studies, and 90% of what makes you unique!', color: 'text-orange-600 font-semibold' }
      ]
    },
    coffee: {
      badge: 'SOLO',
      badgeColor: 'bg-orange-600',
      description: '20 monthly analyses, up to 200 pages each',
      message: 'SMART CHOICE! 20 monthly analyses + 30-day guarantee + cancel instantly. After signup, secure Stripe payment ($4.95/month)',
      messageColor: 'bg-green-50 border-green-200 text-green-700',
      benefits: [
        { icon: '', text: '20 monthly analysis credits', color: 'text-green-600' },
        { icon: '', text: '200 pages per analysis (10x more than free)', color: 'text-green-600' },
        { icon: '', text: 'AI-powered content scoring for all pages', color: 'text-green-600' },
        { icon: '', text: 'Priority processing and support', color: 'text-green-600' },
        { icon: '', text: '30-day money-back guarantee', color: 'text-green-600' }
      ]
    },
    growth: {
      badge: 'COMING SOON',
      badgeColor: 'bg-gray-400',
      description: 'Advanced features, priority support',
      message: 'COMING SOON: Advanced features in development. Start with Coffee tier, upgrade when available.',
      messageColor: 'bg-blue-50 border-blue-200 text-blue-700',
      benefits: []
    },
    scale: {
      badge: 'COMING SOON',
      badgeColor: 'bg-gray-400',
      description: 'Enterprise features, white-label reports',
      message: 'COMING SOON: Enterprise features in development. Start with Coffee tier, upgrade when available.',
      messageColor: 'bg-blue-50 border-blue-200 text-blue-700',
      benefits: []
    }
  };

  const content = tierContent[currentTier];

  return (
    <div className="tier-dropdown-selector" data-testid="tier-dropdown-section">
      {/* Dropdown Selector */}
      <div className="mb-4" data-testid="tier-dropdown-menu">
        <label htmlFor="tier-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Plan
        </label>
        <select
          id="tier-select"
          value={currentTier}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base font-medium"
          data-testid="tier-dropdown-button"
        >
          {tiers.map(tier => (
            <option key={tier.id} value={tier.id} data-testid={`tier-option-${tier.id}`}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Tier Content */}
      <div className="mt-6">
        {/* Badge & Description */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className={`${content.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
              {content.badge}
            </span>
          </div>
          <p className="text-sm text-gray-700">{content.description}</p>
        </div>

        {/* Warning/Message */}
        {content.warning && (
          <div className={`${content.warningColor} border rounded-lg p-3 mb-4`}>
            <p className="text-sm font-medium">{content.warning}</p>
          </div>
        )}

        {content.message && (
          <div className={`${content.messageColor} border rounded-lg p-3 mb-4`}>
            <p className="text-sm font-medium">{content.message}</p>
          </div>
        )}

        {/* Benefits List */}
        {content.benefits.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">
              {currentTier === 'free' ? '⭕ FREE Plan Benefits' : `${content.badge} Plan Benefits`}
            </h3>
            <ul className="space-y-2">
              {content.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{benefit.icon}</span>
                  <span className={`text-sm ${benefit.color}`}>{benefit.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ZERO RISK Section */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-bold text-green-800 mb-3">ZERO RISK - We Remove ALL Your Fears</h4>

        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5"></span>
            <div>
              <div className="font-semibold text-green-800">30-Day Money Back Guarantee</div>
              <div className="text-green-700">Don't like the results? Get every penny back. No questions asked. No hoops to jump through. Full refund processed in 24 hours.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5"></span>
            <div>
              <div className="font-semibold text-green-800">Cancel Instantly Anytime</div>
              <div className="text-green-700">One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat. Keep access until your billing period ends.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5"></span>
            <div>
              <div className="font-semibold text-green-800">Results in 24 Hours or Refund</div>
              <div className="text-green-700">See dramatic improvements within 24 hours or get a full refund immediately. We stand behind our MASTERY-AI framework.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5"></span>
            <div>
              <div className="font-semibold text-green-800">Outperform Competitors or Refund</div>
              <div className="text-green-700">We find 3x more pages than competitors or you get your money back. Guaranteed.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Credibility Signals */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <span className="mr-1"></span>
          <span>Built by Expert Solopreneur</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1"></span>
          <span>Not VC-Funded BS</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1"></span>
          <span>Real Results for Real Businesses</span>
        </div>
      </div>
    </div>
  );
};

TierDropdownSelector.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']),
  onTierChange: PropTypes.func.isRequired
};

TierDropdownSelector.defaultProps = {
  selectedTier: 'coffee'
};

export default TierDropdownSelector;
