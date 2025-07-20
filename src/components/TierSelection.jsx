// TierSelection.jsx - Coffee Tier Selection Component
// Provides tier comparison and upgrade options with Coffee tier highlighted

import React, { useState } from 'react';

const TierSelection = ({ currentTier = 'free', onUpgrade, className = '' }) => {
  const [loading, setLoading] = useState(false);

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      analyses: '3 per month',
      features: [
        'Basic recommendations',
        'Phase A factors',
        'Watermarked results',
        'Community support'
      ],
      cta: 'Current Plan',
      highlight: false,
      popular: false
    },
    {
      id: 'coffee',
      name: '☕ Coffee',
      price: 5,
      analyses: 'Unlimited',
      features: [
        'Unlimited Phase A analyses',
        'Professional recommendations',
        'Clean, exportable results',
        'Educational content',
        'Email support'
      ],
      cta: 'Buy Me a Coffee',
      highlight: true,
      popular: true,
      description: 'Perfect for individuals and small businesses'
    },
    {
      id: 'professional',
      name: '💼 Professional',
      price: 29,
      analyses: 'Unlimited',
      features: [
        'Everything in Coffee',
        'Phase B factors (22 total)',
        'Advanced analysis',
        'Priority support',
        'API access'
      ],
      cta: 'Go Professional',
      highlight: false,
      comingSoon: true,
      description: 'Complete analysis for growing businesses'
    },
    {
      id: 'enterprise',
      name: '🏢 Enterprise',
      price: 99,
      analyses: 'Unlimited',
      features: [
        'Everything in Professional',
        'Team collaboration',
        'Custom reporting',
        'White-label options',
        'Dedicated support'
      ],
      cta: 'Contact Sales',
      highlight: false,
      comingSoon: true,
      description: 'Full-featured solution for teams'
    }
  ];

  const handleUpgrade = async (tierId) => {
    if (loading || currentTier === tierId) return;
    
    setLoading(true);
    try {
      await onUpgrade(tierId);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (tier) => {
    if (tier.comingSoon) {
      return 'w-full py-3 px-4 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed text-sm font-medium';
    }
    
    if (currentTier === tier.id) {
      return 'w-full py-3 px-4 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed text-sm font-medium';
    }
    
    if (tier.highlight) {
      return 'w-full py-3 px-4 rounded-md font-medium text-sm transition-colors bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
    }
    
    return 'w-full py-3 px-4 rounded-md font-medium text-sm transition-colors bg-gray-900 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2';
  };

  const getButtonText = (tier) => {
    if (tier.comingSoon) return 'Coming Soon';
    if (currentTier === tier.id) return 'Current Plan';
    if (loading) return 'Processing...';
    return tier.cta;
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600">
          Start free, upgrade as you grow. Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-lg border-2 p-6 transition-all hover:shadow-lg ${
              tier.highlight
                ? 'border-blue-500 bg-blue-50 transform scale-105'
                : 'border-gray-200 bg-white'
            } ${tier.comingSoon ? 'opacity-75' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {tier.name}
              </h3>
              
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  ${tier.price}
                </span>
                {tier.price > 0 && (
                  <span className="text-gray-500 text-sm">/month</span>
                )}
              </div>
              
              <p className="text-sm font-medium text-blue-600 mb-1">
                {tier.analyses} analyses
              </p>
              
              {tier.description && (
                <p className="text-xs text-gray-500">
                  {tier.description}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <svg
                    className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={tier.comingSoon || currentTier === tier.id || loading}
                className={getButtonClass(tier)}
              >
                {getButtonText(tier)}
              </button>
            </div>

            {tier.id === 'coffee' && currentTier === 'free' && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600">
                  Start your unlimited analysis journey
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          All plans include secure payment processing and can be canceled anytime.
        </p>
      </div>
    </div>
  );
};

export default TierSelection;