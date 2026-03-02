// PricingComparison.jsx - Detailed Feature Comparison Table
// Shows side-by-side comparison of all plan features

import React from 'react';

const PricingComparison = ({ currentTier = 'free', className = '' }) => {
  const features = [
    {
      category: 'Analysis Features',
      items: [
        { name: '27-Factor Analysis', free: 'Basic depth', coffee: 'Full depth', growth: 'Full depth', scale: 'Full depth' },
        { name: 'AI Remediation Planner', free: false, coffee: false, growth: true, scale: true },
        { name: 'AI-Powered Recommendations', free: 'Basic', coffee: 'Advanced', growth: 'Expert', scale: 'Enterprise' },
        { name: 'Competitor Benchmarking', free: false, coffee: false, growth: true, scale: true },
        { name: 'Historical Tracking', free: false, coffee: true, growth: true, scale: true },
        { name: 'LLM.txt Mastery', free: false, coffee: false, growth: 'Included', scale: 'Included' }
      ]
    },
    {
      category: 'Usage & Limits',
      items: [
        { name: 'Monthly Scan Limit', free: '3', coffee: '10', growth: '40', scale: '100' },
        { name: 'Report Downloads', free: 'Watermarked', coffee: 'Clean PDFs', growth: 'Advanced PDFs', scale: 'White-label' },
        { name: 'Data Export', free: false, coffee: 'CSV', growth: 'CSV + JSON', scale: 'CSV + JSON + API' }
      ]
    },
    {
      category: 'Integration & API',
      items: [
        { name: 'Web Dashboard', free: true, coffee: true, growth: true, scale: true },
        { name: 'API Access', free: false, coffee: false, growth: false, scale: true },
        { name: 'Webhook Integration', free: false, coffee: false, growth: false, scale: true },
        { name: 'Team Collaboration', free: false, coffee: false, growth: false, scale: true }
      ]
    },
    {
      category: 'Support',
      items: [
        { name: 'Email Support', free: false, coffee: true, growth: true, scale: true },
        { name: 'Priority Support', free: false, coffee: false, growth: '24hr Response', scale: '1hr Response' },
        { name: 'Dedicated Support', free: false, coffee: false, growth: false, scale: true }
      ]
    }
  ];

  const plans = [
    { id: 'free', name: 'Free', price: '$0' },
    { id: 'coffee', name: 'Solo', price: '$9.95/mo' },
    { id: 'growth', name: 'Growth', price: '$19.95/mo' },
    { id: 'scale', name: 'Scale', price: '$39.95/mo' }
  ];

  const renderFeatureValue = (value, planId) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg className="w-5 h-5 text-clarity mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }

    if (typeof value === 'string') {
      const isHighlighted = (planId === 'growth' || planId === 'scale') && (
        value.includes('Expert') || 
        value.includes('Enterprise') ||
        value.includes('Premium') || 
        value.includes('24hr') || 
        value.includes('1hr') ||
        value.includes('Priority') ||
        value.includes('Custom') ||
        value.includes('Unlimited') ||
        value.includes('Dedicated')
      );

      return (
        <span className={`text-sm font-medium ${
          isHighlighted
            ? 'text-signal font-semibold'
            : 'text-ink/70'
        }`}>
          {value}
        </span>
      );
    }

    return null;
  };

  const getPlanHeaderClass = (planId) => {
    const baseClass = "p-6 text-center";
    
    if (planId === 'growth') {
      return `${baseClass} bg-signal/5 border-2 border-signal/30`;
    } else if (planId === 'scale') {
      return `${baseClass} bg-gradient-to-br from-mastery to-clarity border-2 border-mist`;
    } else if (planId === 'coffee') {
      return `${baseClass} bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200`;
    } else {
      return `${baseClass} bg-gray-25 border border-gray-100`;
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-ink mb-4">
          Compare All Features
        </h2>
        <p className="text-lg text-slate-500">
          See exactly what's included in each plan
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Plan Headers */}
        <div className="grid grid-cols-5 border-b border-gray-200">
          <div className="p-6 bg-gray-50 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Features</h3>
          </div>
          {plans.map((plan) => (
            <div key={plan.id} className={getPlanHeaderClass(plan.id)}>
              <h3 className="text-xl font-bold text-ink mb-2">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold text-signal">
                {plan.price}
              </p>
              {plan.id === 'growth' && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-signal/10 text-signal text-xs font-semibold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {currentTier && currentTier.toLowerCase() === plan.id.toLowerCase() && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    CURRENT PLAN
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Feature Rows */}
        {features.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            {/* Category Header */}
            <div className="grid grid-cols-5 bg-gray-100 border-b border-gray-200">
              <div className="p-4 border-r border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {category.category}
                </h4>
              </div>
              <div className="col-span-4"></div>
            </div>

            {/* Feature Items */}
            {category.items.map((feature, featureIndex) => (
              <div 
                key={featureIndex} 
                className={`grid grid-cols-5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                <div className="p-4 border-r border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    {feature.name}
                  </span>
                </div>
                <div className="p-4 border-r border-gray-200 text-center">
                  {renderFeatureValue(feature.free, 'free')}
                </div>
                <div className="p-4 border-r border-gray-200 text-center">
                  {renderFeatureValue(feature.coffee, 'coffee')}
                </div>
                <div className="p-4 border-r border-gray-200 text-center">
                  {renderFeatureValue(feature.growth, 'growth')}
                </div>
                <div className="p-4 text-center">
                  {renderFeatureValue(feature.scale, 'scale')}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* CTA Footer */}
        <div className="bg-signal/5 p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-ink mb-4">
              Ready to improve your AI visibility?
            </h3>
            <p className="text-slate-500 mb-6">
              Start free, upgrade when you see the gaps worth fixing
            </p>
            <div className="flex justify-center space-x-4">
              <button
                className="px-6 py-3 bg-cloud text-ink rounded-lg font-semibold hover:bg-mist transition-colors border border-mist"
              >
                Start Free
              </button>
              <button
                className="px-6 py-3 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg bg-gradient-to-r from-mastery to-signal"
              >
                Get Growth Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-cloud rounded-2xl p-8 border border-mist">
        <h3 className="text-2xl font-bold text-center text-ink mb-8">
          Frequently Asked Questions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately and you'll only pay the prorated difference.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
            <p className="text-sm text-gray-600">
              We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll provide a full refund.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">What's included in the free trial?</h4>
            <p className="text-sm text-gray-600">
              The free trial includes 3 complete website analyses with basic recommendations. No credit card required to start.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Is there a setup fee?</h4>
            <p className="text-sm text-gray-600">
              No setup fees, no hidden costs. You only pay the monthly subscription fee for your chosen plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingComparison;