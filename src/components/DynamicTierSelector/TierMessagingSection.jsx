// TierMessagingSection.jsx - Dynamic OB + RRB messaging for tier selection
import React from 'react';
import PropTypes from 'prop-types';

const TIER_MESSAGING = {
  free: {
    ob: "WHAT YOU'RE MISSING",
    obSubtitle: "Free tier vs Growth tier comparison",
    rrb: [
      "❌ Only 3 analyses per month (vs 40 with Growth)",
      "❌ Basic features only (no CSV exports, no LLMS.txt)",
      "❌ 30-day history (vs 90 days with Growth)",
      "❌ Standard support (vs priority 24hr response)",
      "💡 Growth is only $12.46/mo on annual billing"
    ]
  },
  coffee: {
    ob: "Perfect for solopreneurs testing AI optimization",
    obSubtitle: "Analyze your 10 most important pages",
    rrb: [
      "✅ 10 analyses = complete core coverage",
      "✅ $0.50 per analysis vs $5-10 manual cost",
      "✅ 30-day history: Track your improvements",
      "✅ Professional PDF reports",
      "✅ Cancel anytime, no questions asked",
      "💡 Growth is only $7 more/mo on annual (40 analyses + CSV + LLMS.txt)"
    ]
  },
  growth: {
    ob: "YOU MADE THE RIGHT CHOICE ⭐",
    obSubtitle: "Scale your AI discoverability without breaking the bank",
    rrb: [
      "✅ 40 analyses per month = flexible optimization",
      "✅ $0.37 per analysis (1/3 cheaper than Solo)",
      "✅ 90-day history: See long-term improvements",
      "✅ CSV export: Analyze your data your way",
      "✅ Get found by ChatGPT with one-click LLMS.txt",
      "✅ 30-day money-back guarantee + 7-day free trial",
      "✅ Priority support: 24-hour response"
    ]
  },
  scale: {
    ob: "Enterprise-grade AI optimization at scale",
    obSubtitle: "For agencies and power users who mean business",
    rrb: [
      "✅ 100 analyses per month = large-scale optimization",
      "✅ $0.30 per analysis (cheapest per-analysis cost)",
      "✅ Unlimited history: Never lose your data",
      "✅ API access: Automate bulk analysis",
      "✅ Team collaboration: 3 seats included",
      "✅ Dedicated support + priority feature requests",
      "✅ Priority support: 12-hour response + strategy calls"
    ]
  }
};

const TierMessagingSection = ({ selectedTier, isTransitioning = false }) => {
  const messaging = TIER_MESSAGING[selectedTier];

  if (!messaging) {
    console.error(`No messaging found for tier: ${selectedTier}`);
    return null;
  }

  const isFree = selectedTier === 'free';
  const isGrowth = selectedTier === 'growth';

  return (
    <div
      className={`
        transition-all duration-500
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Overarching Benefit (OB) */}
      <div className={`
        p-4 rounded-lg mb-4
        ${isFree ? 'bg-red-50 border-2 border-red-300' : ''}
        ${isGrowth ? 'bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-yellow-400' : ''}
        ${!isFree && !isGrowth ? 'bg-blue-50 border-2 border-blue-300' : ''}
      `}>
        <h3 className={`
          text-xl font-bold mb-1
          ${isFree ? 'text-red-800' : ''}
          ${isGrowth ? 'text-green-700' : ''}
          ${!isFree && !isGrowth ? 'text-blue-800' : ''}
        `}>
          {messaging.ob}
        </h3>
        <p className="text-sm text-gray-700">
          {messaging.obSubtitle}
        </p>
      </div>

      {/* Real Reasons to Believe (RRB) */}
      <div className="space-y-2">
        {messaging.rrb.map((reason, index) => {
          const isUpsellNudge = reason.startsWith('💡');
          const isMissing = reason.startsWith('❌');

          return (
            <div
              key={index}
              className={`
                flex items-start gap-2 text-sm
                ${isUpsellNudge ? 'bg-blue-50 border-l-4 border-blue-400 pl-3 py-2 rounded font-semibold' : ''}
                ${isMissing ? 'text-red-700' : 'text-gray-800'}
              `}
            >
              <span className={isUpsellNudge ? '' : 'mt-0.5'}>
                {reason}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

TierMessagingSection.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']).isRequired,
  isTransitioning: PropTypes.bool
};

export default TierMessagingSection;
