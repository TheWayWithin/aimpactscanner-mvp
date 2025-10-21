// TierSelector.jsx - Tier selection component with exact messaging from spec
import React from 'react';
import PropTypes from 'prop-types';

const TierSelector = ({ selectedTier, onTierChange }) => {
  const tiers = [
    {
      id: 'free',
      name: '⚠️ FREE (Limited)',
      price: '$0/month',
      description: 'Only 3 analyses/month - then locked for 30 days',
      warnings: [
        '❌ Only 3 analyses/month (then locked out for 30 days)',
        '❌ No historical tracking (results expire)',
        '❌ No exports or reports',
        '⚠️ WARNING: You\'ll miss critical insights competitors WILL find'
      ],
      recommended: false,
      visual: 'secondary'
    },
    {
      id: 'coffee',
      name: '☕ COFFEE - SMART CHOICE',
      price: '$4.95/month',
      tagline: 'Less than one coffee per month',
      description: 'Unlimited analyses, professional reports',
      benefits: [
        '✅ Unlimited analyses (test every page, every competitor)',
        '✅ 200+ pages per scan (10x deeper than free)',
        '✅ Professional PDF reports (share with team)',
        '✅ Historical tracking (watch improvements over time)',
        '✅ 30-day money-back guarantee (zero risk)'
      ],
      socialProof: '🎯 Join 127 businesses who upgraded in the last 30 days',
      urgency: '⏱️ Early adopter pricing - $4.95/month (increases to $9/month Feb 1st)',
      recommended: true,
      visual: 'primary',
      notice: 'After signup, secure Stripe payment ($4.95/month)'
    },
    {
      id: 'growth',
      name: '🚀 GROWTH',
      price: '$29/month',
      description: 'Advanced features, priority support',
      recommended: false,
      visual: 'muted',
      comingSoon: true
    },
    {
      id: 'scale',
      name: '🏢 SCALE',
      price: '$99/month',
      description: 'Enterprise features, white-label reports',
      recommended: false,
      visual: 'muted',
      comingSoon: true
    }
  ];

  return (
    <div className="tier-selector mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Your Plan
      </label>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isPrimary = tier.visual === 'primary';
          const isMuted = tier.visual === 'muted';

          return (
            <div
              key={tier.id}
              onClick={() => !tier.comingSoon && onTierChange(tier.id)}
              className={`
                relative border-2 rounded-lg p-4 transition-all
                ${isMuted ? 'opacity-60' : ''}
                ${tier.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected && isPrimary ? 'border-yellow-400 bg-yellow-50' : ''}
                ${isSelected && !isPrimary ? 'border-blue-400 bg-blue-50' : ''}
                ${!isSelected ? 'border-gray-200 hover:border-gray-300' : ''}
              `}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-yellow-400 text-xs font-bold rounded-full text-gray-900">
                  RECOMMENDED
                </div>
              )}

              {/* Coming Soon Badge */}
              {tier.comingSoon && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-gray-400 text-xs font-bold rounded-full text-white">
                  COMING SOON
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="tier"
                    value={tier.id}
                    checked={isSelected}
                    onChange={() => !tier.comingSoon && onTierChange(tier.id)}
                    disabled={tier.comingSoon}
                    className={`
                      mr-3 focus:ring-2
                      ${isPrimary ? 'text-yellow-500 focus:ring-yellow-500' : ''}
                      ${tier.visual === 'secondary' ? 'text-gray-500 focus:ring-gray-500' : ''}
                      ${isMuted ? 'text-gray-400 focus:ring-gray-400' : ''}
                    `}
                    aria-label={`${tier.name} plan - ${tier.description}`}
                  />
                  <div>
                    <div className={`font-semibold ${isMuted ? 'text-gray-600' : 'text-gray-900'}`}>
                      {tier.name}
                    </div>
                    <div className={`text-sm ${isMuted ? 'text-gray-500' : 'text-gray-600'}`}>
                      {tier.description}
                    </div>
                  </div>
                </div>
                <div className={`text-lg font-bold ${isPrimary && isSelected ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {tier.price}
                </div>
              </div>

              {/* Free Tier Warnings */}
              {isSelected && tier.id === 'free' && tier.warnings && (
                <div className="mt-3 ml-6 space-y-1 max-w-full overflow-hidden">
                  <ul className="text-sm text-red-700 space-y-1 break-words">
                    {tier.warnings.map((warning, idx) => (
                      <li key={idx} className="pr-2">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Coffee Tier Benefits */}
              {isSelected && tier.id === 'coffee' && (
                <div className="mt-3 ml-6 space-y-2">
                  {tier.benefits && (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  )}
                  {tier.socialProof && (
                    <div className="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                      {tier.socialProof}
                    </div>
                  )}
                  {tier.urgency && (
                    <div className="text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded border border-orange-200">
                      {tier.urgency}
                    </div>
                  )}
                </div>
              )}

              {/* Coming Soon Notice */}
              {isSelected && tier.comingSoon && (
                <div className="mt-3 ml-6 text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                  🔧 COMING SOON: Advanced features in development. Start with Coffee tier, upgrade when available.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ZERO RISK Section */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-bold text-green-800 mb-3">🛡️ ZERO RISK - We Remove ALL Your Fears</h4>

        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5">💰</span>
            <div>
              <div className="font-semibold text-green-800">30-Day Money Back Guarantee</div>
              <div className="text-green-700">Don't like the results? Get every penny back. No questions asked. No hoops to jump through. Full refund processed in 24 hours.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5">⚡</span>
            <div>
              <div className="font-semibold text-green-800">Cancel Instantly Anytime</div>
              <div className="text-green-700">One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat. Keep access until your billing period ends.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5">🏆</span>
            <div>
              <div className="font-semibold text-green-800">Results in 24 Hours or Refund</div>
              <div className="text-green-700">See dramatic improvements within 24 hours or get a full refund immediately. We stand behind our MASTERY-AI framework.</div>
            </div>
          </div>

          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-0.5">🚀</span>
            <div>
              <div className="font-semibold text-green-800">Outperform Competitors or Refund</div>
              <div className="text-green-700">We find 3x more pages than competitors or you get your money back. Guaranteed.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Privacy */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <span className="text-blue-600 mr-2">🔒</span>
          <div className="text-sm text-blue-800">
            <div className="font-semibold">Secure & Private</div>
            <div>Your data is encrypted and never shared. We only analyze public content and generate files you control.</div>
          </div>
        </div>
      </div>

      {/* Credibility Signals */}
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <span className="mr-1">✅</span>
          <span>Built by Expert Solopreneur</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">✅</span>
          <span>Not VC-Funded BS</span>
        </div>
        <div className="flex items-center">
          <span className="mr-1">✅</span>
          <span>Real Results for Real Businesses</span>
        </div>
      </div>
    </div>
  );
};

TierSelector.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']).isRequired,
  onTierChange: PropTypes.func.isRequired
};

export default TierSelector;
