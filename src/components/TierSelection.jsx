// TierSelection.jsx - Coffee Tier Selection Component
// Provides tier comparison and upgrade options with Coffee tier highlighted

import React, { useState } from 'react';

const TierSelection = ({ currentTier, onUpgrade, className = '', showRegistrationFlow = false }) => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('annual'); // Default to annual to show savings

  // Annual pricing (per year)
  const annualPrices = {
    coffee: 89.55,
    growth: 179.55,
    scale: 359.55
  };

  // Monthly savings compared to annual (25% discount)
  const yearSavings = {
    coffee: 29.85,  // (9.95*12) - 89.55
    growth: 59.85,  // (19.95*12) - 179.55
    scale: 119.85   // (39.95*12) - 359.55
  };

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      monthlyPrice: 0,
      annualPrice: 0,
      analyses: '3 per month',
      features: [
        '27 factors (basic depth)',
        'Basic recommendations',
        'Watermarked reports',
        'No credit card required'
      ],
      cta: showRegistrationFlow ? 'Start Free' : 'Switch to Free',
      highlight: false,
      popular: false
    },
    {
      id: 'coffee',
      name: 'Solo',
      price: 9.95,
      monthlyPrice: 9.95,
      annualPrice: 89.55,
      analyses: '10 per month',
      features: [
        '27 factors (full depth)',
        'Clean PDF reports',
        'Advanced recommendations',
        'Historical tracking',
        'Email support'
      ],
      cta: showRegistrationFlow ? 'Choose Solo' : 'Upgrade to Solo',
      highlight: false,
      popular: false,
      description: 'For focused solopreneurs'
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 19.95,
      monthlyPrice: 19.95,
      annualPrice: 179.55,
      analyses: '40 per month',
      features: [
        '7-day free trial',
        'Everything in Solo',
        'Remediation Planner',
        'Competitor benchmarking',
        'LLM.txt Mastery included',
        'Priority support'
      ],
      cta: showRegistrationFlow ? 'Choose Growth' : 'Upgrade to Growth',
      highlight: true,
      popular: true,
      description: 'Full optimization loop'
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 39.95,
      monthlyPrice: 39.95,
      annualPrice: 359.55,
      analyses: '100 per month',
      features: [
        'Everything in Growth',
        'API access & webhooks',
        'White-label PDF reports',
        'Team collaboration',
        'LLM.txt Scale included',
        'Dedicated support'
      ],
      cta: showRegistrationFlow ? 'Choose Scale' : 'Upgrade to Scale',
      highlight: false,
      popular: false,
      description: 'For teams & agencies'
    }
  ];

  const handleUpgrade = async (tierId) => {
    // Check if this tier matches the current tier (case-insensitive)
    const isCurrentTier = currentTier && (currentTier.toLowerCase() === tierId.toLowerCase());
    if (loading || isCurrentTier) return;

    setLoading(true);
    try {
      console.log(`[TierSelection] Upgrading to ${tierId} with ${billingCycle} billing`);
      await onUpgrade(tierId, billingCycle);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get display price based on billing cycle
  const getDisplayPrice = (tier) => {
    if (tier.price === 0) return { main: '$0', subtitle: null };

    if (billingCycle === 'annual') {
      const monthlyEquivalent = (tier.annualPrice / 12).toFixed(2);
      return {
        main: `$${monthlyEquivalent}`,
        subtitle: `billed $${tier.annualPrice.toFixed(2)}/year`
      };
    } else {
      return {
        main: `$${tier.monthlyPrice.toFixed(2)}`,
        subtitle: null
      };
    }
  };

  const getButtonClass = (tier) => {
    if (tier.comingSoon && !showRegistrationFlow) {
      return 'w-full py-3 px-4 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed text-sm font-medium';
    }
    
    // Check if this tier matches the current tier (case-insensitive)
    const isCurrentTier = !showRegistrationFlow && currentTier && 
      (currentTier.toLowerCase() === tier.id.toLowerCase());
    
    if (isCurrentTier) {
      return 'w-full py-3 px-4 border-2 border-green-500 rounded-md text-green-700 bg-green-50 cursor-default text-sm font-medium flex items-center justify-center';
    }
    
    if (tier.highlight) {
      return 'w-full py-3 px-4 rounded-md font-medium text-sm transition-colors bg-signal text-white hover:bg-signal/90 focus:ring-2 focus:ring-signal focus:ring-offset-2';
    }

    return 'w-full py-3 px-4 rounded-md font-medium text-sm transition-colors bg-ink text-white hover:bg-ink/90 focus:ring-2 focus:ring-ink focus:ring-offset-2';
  };

  const getButtonText = (tier) => {
    if (tier.comingSoon && !showRegistrationFlow) return 'Coming Soon';
    if (tier.comingSoon && showRegistrationFlow) return `Choose ${tier.name.replace(/[^A-Za-z\s]/g, '').trim()}`;
    
    // Check if this tier matches the current tier (case-insensitive)
    const isCurrentTier = !showRegistrationFlow && currentTier && 
      (currentTier.toLowerCase() === tier.id.toLowerCase());
    
    if (isCurrentTier) return (
      <>
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Active Plan
      </>
    );
    if (loading) return 'Processing...';
    return tier.cta;
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-ink mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-slate-500">
          Start free, upgrade as you grow. Cancel anytime.
        </p>
      </div>

      {/* Billing Frequency Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
              billingCycle === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-clarity text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              3 months free
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-lg border-2 p-6 transition-all hover:shadow-lg flex flex-col min-h-[500px] ${
              tier.highlight
                ? 'border-signal bg-signal/5 transform scale-105'
                : 'border-mist bg-white'
            } ${tier.comingSoon ? 'opacity-75' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-signal text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-ink mb-2">
                {tier.name}
              </h3>

              <div className="mb-2">
                <span className="text-4xl font-bold text-ink">
                  {getDisplayPrice(tier).main}
                </span>
                {tier.price > 0 && (
                  <span className="text-slate-500 text-sm">/mo</span>
                )}
              </div>

              {/* Show billing details for annual */}
              {getDisplayPrice(tier).subtitle && (
                <p className="text-xs text-slate-500 mb-1">
                  {getDisplayPrice(tier).subtitle}
                </p>
              )}

              {/* Show savings badge for annual billing on paid tiers */}
              {billingCycle === 'annual' && tier.price > 0 && yearSavings[tier.id] && (
                <p className="text-xs font-medium text-clarity mb-1">
                  Save ${yearSavings[tier.id].toFixed(2)}/year
                </p>
              )}

              <p className="text-sm font-medium text-signal mb-1">
                {tier.analyses} scans
              </p>

              {tier.description && (
                <p className="text-xs text-slate-500">
                  {tier.description}
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-grow">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-ink/80">
                  <svg
                    className="h-4 w-4 text-clarity mr-2 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="break-words hyphens-auto leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={(tier.comingSoon && !showRegistrationFlow) || (!showRegistrationFlow && currentTier && currentTier.toLowerCase() === tier.id.toLowerCase()) || loading}
                className={getButtonClass(tier)}
              >
                {getButtonText(tier)}
              </button>
            </div>

            {tier.id === 'coffee' && currentTier && currentTier.toLowerCase() === 'free' && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-600">
                  Professional reports for your business
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500">
          All plans include secure payment processing and can be canceled anytime.
        </p>
      </div>
    </div>
  );
};

export default TierSelection;