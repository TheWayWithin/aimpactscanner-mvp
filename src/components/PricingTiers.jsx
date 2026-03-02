// PricingTiers.jsx - Pricing Component with v2 pricing and brand alignment

import React, { useState } from 'react';

const PricingTiers = ({ currentTier = 'free', onUpgrade, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      annualPrice: 0,
      price: 0,
      analyses: '3 scans/month',
      features: [
        '27 factors (basic depth)',
        'Overall AI Visibility Score',
        'Top 3 gaps identified',
        'Basic recommendations',
        'Watermarked reports',
        'No credit card required'
      ],
      cta: 'Start Free',
      highlight: false,
      popular: false,
      size: 'small',
      guarantee: false,
      description: 'Try it risk-free'
    },
    {
      id: 'coffee',
      name: 'Solo',
      monthlyPrice: 9.95,
      annualPrice: 89.55,
      price: 0,
      analyses: '10 scans/month',
      features: [
        '27 factors (full depth)',
        'Clean PDF reports',
        'Advanced recommendations',
        'Historical tracking',
        'Email support',
        'Cancel anytime'
      ],
      cta: 'Start Solo',
      highlight: false,
      popular: false,
      size: 'standard',
      guarantee: true,
      description: 'For focused solopreneurs'
    },
    {
      id: 'growth',
      name: 'Growth',
      monthlyPrice: 19.95,
      annualPrice: 179.55,
      trial: true,
      price: 0,
      analyses: '40 scans/month',
      features: [
        '7-day free trial',
        'Everything in Solo',
        'Remediation Planner',
        'Competitor benchmarking',
        'LLM.txt Mastery included',
        'Priority support'
      ],
      cta: 'Start Free Trial',
      highlight: true,
      popular: true,
      size: 'featured',
      guarantee: true,
      description: 'Full optimization loop',
      badge: 'MOST POPULAR'
    },
    {
      id: 'scale',
      name: 'Scale',
      monthlyPrice: 39.95,
      annualPrice: 359.55,
      price: 0,
      analyses: '100 scans/month',
      features: [
        'Everything in Growth',
        'API access & webhooks',
        'White-label PDF reports',
        'Team collaboration',
        'LLM.txt Scale included',
        'Dedicated support'
      ],
      cta: 'Start Scale',
      highlight: false,
      popular: false,
      size: 'standard',
      guarantee: true,
      description: 'For teams & agencies'
    }
  ];

  // Compute display price based on billing cycle
  const getDisplayPrice = (tier) => {
    if (tier.monthlyPrice === 0) return 0;
    if (billingCycle === 'annual') {
      return parseFloat((tier.annualPrice / 12).toFixed(2));
    }
    return tier.monthlyPrice;
  };

  const handleUpgrade = async (tierId) => {
    const isCurrentTier = currentTier && (currentTier.toLowerCase() === tierId.toLowerCase());
    if (loading || isCurrentTier) return;

    setLoading(true);
    try {
      await onUpgrade(tierId, billingCycle);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierCardClass = (tier) => {
    const baseClass = "relative rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-2xl flex flex-col";

    if (tier.size === 'featured') {
      return `${baseClass} border-signal border-4 transform scale-110 lg:scale-105 xl:scale-110 z-10 shadow-2xl bg-signal/5 min-h-[650px]`;
    } else if (tier.size === 'small') {
      return `${baseClass} border-mist bg-cloud opacity-90 min-h-[500px]`;
    } else {
      return `${baseClass} border-mist bg-white hover:border-signal/40 min-h-[550px]`;
    }
  };

  const getButtonClass = (tier) => {
    const isCurrentTier = currentTier && (currentTier.toLowerCase() === tier.id.toLowerCase());

    if (isCurrentTier) {
      return 'w-full py-4 px-6 rounded-xl text-sm font-bold border-2 border-clarity text-clarity bg-clarity/10 cursor-default flex items-center justify-center';
    }

    if (tier.highlight) {
      return 'w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-white bg-gradient-to-r from-mastery to-signal';
    }

    return 'w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:transform hover:scale-105 border-2 border-mist text-ink bg-white hover:bg-cloud hover:border-signal/40';
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-ink mb-4">
          Choose Your AI Analysis Plan
        </h2>
        <p className="text-xl text-slate-500 mb-8">
          Start free. Upgrade when you're ready. Cancel anytime.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-cloud rounded-full p-1 mb-6 border border-mist">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white shadow-sm text-ink'
                : 'text-slate-500 hover:text-ink'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'annual'
                ? 'bg-white shadow-sm text-ink'
                : 'text-slate-500 hover:text-ink'
            }`}
          >
            Annual
            <span className="ml-2 px-2 py-1 bg-clarity/10 text-clarity text-xs rounded-full font-bold">
              3 months free
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 xl:gap-6 mb-12 items-end">
        {tiers.map((tier) => {
          const displayPrice = getDisplayPrice(tier);
          return (
            <div
              key={tier.id}
              className={getTierCardClass(tier)}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="px-6 py-2 rounded-full text-xs font-bold text-white shadow-lg bg-signal">
                    {tier.badge || 'MOST POPULAR'}
                  </span>
                </div>
              )}

              {/* Savings Badge */}
              {billingCycle === 'annual' && tier.monthlyPrice > 0 && (
                <div className="absolute -top-2 -right-2 z-20">
                  <span className="bg-clarity text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    Save 25%
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-ink mb-2">
                  {tier.name}
                </h3>

                <p className="text-sm text-slate-500 mb-4">
                  {tier.description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-center justify-center">
                    <span className="text-5xl font-bold text-ink">
                      ${displayPrice.toFixed(2)}
                    </span>
                    {tier.monthlyPrice > 0 && (
                      <span className="text-slate-500 text-sm ml-1">
                        /month
                      </span>
                    )}
                  </div>
                  {billingCycle === 'annual' && tier.annualPrice > 0 && (
                    <div className="text-sm text-slate-500 mt-1">
                      Billed as ${tier.annualPrice.toFixed(2)}/year
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium text-signal mb-1">
                  {tier.analyses}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-ink/80">
                    <svg
                      className="h-4 w-4 text-clarity mr-3 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-auto">
                <button
                  onClick={() => handleUpgrade(tier.id)}
                  disabled={(currentTier && currentTier.toLowerCase() === tier.id.toLowerCase()) || loading}
                  className={getButtonClass(tier)}
                >
                  {(currentTier && currentTier.toLowerCase() === tier.id.toLowerCase()) ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Active Plan
                    </>
                  ) : loading ? 'Processing...' : tier.cta}
                </button>

                {/* Money-back Guarantee */}
                {tier.guarantee && !(currentTier && currentTier.toLowerCase() === tier.id.toLowerCase()) && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-slate-500 flex items-center justify-center">
                      <svg className="w-3 h-3 mr-1 text-clarity" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      30-day money-back guarantee
                    </p>
                  </div>
                )}

                {/* No Credit Card Required */}
                {tier.id === 'free' && (
                  <div className="mt-3 text-center">
                    <p className="text-xs text-slate-500">
                      No credit card required
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Risk Reversals (replaces fake community stats) */}
      <div className="bg-cloud rounded-2xl p-8 mb-12 border border-mist">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-ink mb-2">
            Risk-Free Guarantee
          </h3>
          <p className="text-sm text-slate-500">
            We stand behind our analysis with real guarantees
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center border border-mist">
            <div className="w-10 h-10 bg-signal/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-signal" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-ink mb-1">
              3 Gaps Guarantee
            </div>
            <p className="text-xs text-slate-500">
              We find at least 3 actionable improvements or your money back
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center border border-mist">
            <div className="w-10 h-10 bg-clarity/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-clarity" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-ink mb-1">
              30-Day Money Back
            </div>
            <p className="text-xs text-slate-500">
              Not satisfied? Full refund, no questions asked
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-center border border-mist">
            <div className="w-10 h-10 bg-mastery/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-mastery" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm font-semibold text-ink mb-1">
              Free Tier Forever
            </div>
            <p className="text-xs text-slate-500">
              No credit card required. Upgrade only when ready.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center">
        <p className="text-sm text-slate-500 mb-2">
          All plans include secure payment processing &middot; Cancel anytime &middot; No setup fees
        </p>
        <p className="text-xs text-slate-400">
          Questions? Contact our support team at support@aimpactscanner.com
        </p>
      </div>
    </div>
  );
};

export default PricingTiers;
