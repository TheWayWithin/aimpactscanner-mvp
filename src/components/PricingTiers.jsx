// PricingTiers.jsx - Enhanced Conversion-Focused Pricing Component
// Features: Visual hierarchy, psychological elements, trust signals, mobile optimization

import React, { useState, useEffect } from 'react';

const PricingTiers = ({ currentTier = 'free', onUpgrade, className = '' }) => {
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly'); // monthly or annual
  const [currency, setCurrency] = useState('USD');
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 47, seconds: 32 });

  // Limited time offer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currencies = {
    USD: { symbol: '$', rates: { monthly: 1, annual: 1 } },
    EUR: { symbol: '€', rates: { monthly: 0.85, annual: 0.85 } },
    GBP: { symbol: '£', rates: { monthly: 0.73, annual: 0.73 } }
  };

  const formatPrice = (price, cycle = billingCycle) => {
    const rate = currencies[currency].rates[cycle];
    const convertedPrice = Math.round(price * rate);
    return `${currencies[currency].symbol}${convertedPrice}`;
  };

  const tiers = [
    {
      id: 'free',
      name: 'Free Trial',
      originalPrice: 0,
      price: 0,
      analyses: '3 analyses',
      features: [
        'See your actual AI readiness score',
        'Identify your 3 biggest AI visibility gaps',
        '3 analyses per month to track progress',
        'Perfect for testing the waters',
        'No credit card required'
      ],
      cta: 'Start Free Trial',
      highlight: false,
      popular: false,
      size: 'small',
      userCount: '12,487',
      guarantee: false,
      description: 'Perfect for trying our platform'
    },
    {
      id: 'coffee',
      name: 'Starter',
      originalPrice: 10,
      price: billingCycle === 'annual' ? 4.95 : 4.95,
      analyses: 'Unlimited',
      features: [
        'Unlimited analyses for continuous optimization',
        'Track improvements over time with history',
        'Export results as PDF reports',
        'Less than a coffee, more value than a consultant',
        'Built for people who ship fast and iterate',
        'Email support'
      ],
      cta: 'Start Analyzing',
      highlight: false,
      popular: false,
      size: 'standard',
      userCount: '8,234',
      guarantee: true,
      description: 'Perfect for solopreneurs and small teams',
      savings: billingCycle === 'annual' ? 50 : 0
    },
    {
      id: 'professional',
      name: 'Professional',
      originalPrice: 58,
      price: billingCycle === 'annual' ? 29 : 39,
      analyses: 'Unlimited',
      features: [
        'Everything in Starter',
        'Complete 22-factor analysis',
        'Advanced AI insights',
        'Priority support (24hr)',
        'API access & integrations',
        'Custom branding options',
        'Team collaboration tools',
        'Advanced reporting dashboard'
      ],
      cta: 'Go Professional',
      highlight: true,
      popular: true,
      size: 'featured',
      userCount: '15,692',
      guarantee: true,
      description: 'Most popular for growing businesses',
      savings: billingCycle === 'annual' ? 50 : 25,
      badge: 'MOST POPULAR',
      limitedOffer: true
    }
  ];

  const communityStats = [
    {
      text: "Our AI analysis helps businesses identify opportunities they never knew existed.",
      metric: "47,000+",
      label: "Websites Analyzed"
    },
    {
      text: "Advanced AI algorithms provide insights typically requiring expensive consultants.",
      metric: "2.4x",
      label: "Average Improvement"
    },
    {
      text: "Professional analysis and recommendations delivered in seconds.",
      metric: "15s",
      label: "Analysis Speed"
    }
  ];

  const handleUpgrade = async (tierId) => {
    // Check if this tier matches the current tier (case-insensitive)
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
      return `${baseClass} border-4 transform scale-110 lg:scale-105 xl:scale-110 z-10 shadow-2xl min-h-[650px]`;
    } else if (tier.size === 'small') {
      return `${baseClass} border-gray-200 bg-gray-50 opacity-90 min-h-[500px]`;
    } else {
      return `${baseClass} border-gray-300 bg-white hover:border-gray-400 min-h-[550px]`;
    }
  };

  const getTierStyle = (tier) => {
    if (tier.highlight) {
      return {
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)',
        borderColor: 'var(--mastery-blue)',
        boxShadow: '0 20px 40px rgba(30, 58, 138, 0.15)'
      };
    }
    return {};
  };

  const getButtonClass = (tier) => {
    // Check if this tier matches the current tier (case-insensitive)
    const isCurrentTier = currentTier && (currentTier.toLowerCase() === tier.id.toLowerCase());
    
    if (isCurrentTier) {
      return 'w-full py-4 px-6 rounded-xl text-sm font-bold border-2 border-green-500 text-green-700 bg-green-50 cursor-default flex items-center justify-center';
    }
    
    if (tier.highlight) {
      return 'w-full py-4 px-6 rounded-xl font-bold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-white';
    }
    
    return 'w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:transform hover:scale-105 border-2 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400';
  };

  const getButtonStyle = (tier) => {
    if (tier.highlight) {
      return {
        background: 'linear-gradient(135deg, var(--mastery-blue) 0%, #3B82F6 100%)',
        boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)'
      };
    }
    return {};
  };

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
          Choose Your AI Analysis Plan
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Transform your website performance with AI-powered insights
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 mb-6">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'monthly' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              billingCycle === 'annual' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Save 50%
            </span>
          </button>
        </div>

        {/* Currency Selector */}
        <div className="mb-6">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Limited Time Offer */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-2">
            <span className="text-red-600 font-semibold text-sm">⏰ Limited Time Offer</span>
          </div>
          <div className="flex items-center justify-center space-x-2 font-mono font-bold text-red-700">
            <div className="bg-red-100 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}</div>
            <span>:</span>
            <div className="bg-red-100 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}</div>
            <span>:</span>
            <div className="bg-red-100 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}</div>
          </div>
          <p className="text-xs text-red-600 mt-1">Extra 25% off Professional plan!</p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6 xl:gap-8 mb-12 items-end">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={getTierCardClass(tier)}
            style={getTierStyle(tier)}
          >
            {/* Popular Badge */}
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <span 
                  className="px-6 py-2 rounded-full text-xs font-bold text-white shadow-lg"
                  style={{ backgroundColor: 'var(--mastery-blue)' }}
                >
                  {tier.badge || 'MOST POPULAR'}
                </span>
              </div>
            )}

            {/* Savings Badge */}
            {tier.savings > 0 && (
              <div className="absolute -top-2 -right-2 z-20">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Save {tier.savings}%
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                {tier.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {tier.description}
              </p>

              {/* User Count */}
              <div className="flex items-center justify-center mb-4">
                <div className="flex -space-x-1 mr-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white"></div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{tier.userCount} users</span>
              </div>
              
              {/* Pricing */}
              <div className="mb-4">
                {tier.originalPrice > tier.price && (
                  <div className="text-lg text-gray-400 line-through font-medium">
                    {formatPrice(tier.originalPrice)}
                  </div>
                )}
                <div className="flex items-center justify-center">
                  <span className="text-5xl font-bold" style={{ color: 'var(--framework-black)' }}>
                    {formatPrice(tier.price)}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-gray-500 text-sm ml-1">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--mastery-blue)' }}>
                {tier.analyses}
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 mb-8 flex-grow">
              {tier.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <svg
                    className="h-4 w-4 text-green-500 mr-3 mt-0.5 flex-shrink-0"
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
                style={getButtonStyle(tier)}
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
                  <p className="text-xs text-gray-600 flex items-center justify-center">
                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    30-day money-back guarantee
                  </p>
                </div>
              )}

              {/* No Credit Card Required */}
              {tier.id === 'free' && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-600">
                    🔒 No credit card required
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trust Signals */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
            Trusted by thousands of businesses worldwide
          </h3>
        </div>

        {/* Security Badges */}
        <div className="flex justify-center items-center space-x-8 mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0015.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.148.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
            </svg>
            <span>99.9% Uptime</span>
          </div>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {communityStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stat.metric}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-2">
                {stat.label}
              </div>
              <p className="text-sm text-gray-600">
                {stat.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">
          ✨ All plans include secure payment processing • Cancel anytime • No setup fees
        </p>
        <p className="text-xs text-gray-400">
          Questions? Contact our support team at support@aisearchmastery.com
        </p>
      </div>
    </div>
  );
};

export default PricingTiers;