// PricingComparison.jsx - Detailed Feature Comparison Table
// Shows side-by-side comparison of all plan features

import React from 'react';

const PricingComparison = ({ currentTier = 'free', className = '' }) => {
  const features = [
    {
      category: 'Analysis Features',
      items: [
        { name: 'Phase A Factors (Basic Analysis)', free: true, starter: true, professional: true },
        { name: 'Complete 22-Factor Analysis', free: false, starter: false, professional: true },
        { name: 'AI-Powered Recommendations', free: 'Basic', starter: 'Advanced', professional: 'Expert' },
        { name: 'Educational Insights', free: false, starter: true, professional: true },
        { name: 'Competitor Benchmarking', free: false, starter: false, professional: true },
        { name: 'Historical Tracking', free: false, starter: 'Limited', professional: 'Unlimited' }
      ]
    },
    {
      category: 'Usage & Limits',
      items: [
        { name: 'Monthly Analysis Limit', free: '3', starter: 'Unlimited', professional: 'Unlimited' },
        { name: 'Report Downloads', free: 'Watermarked', starter: 'Clean PDFs', professional: 'Custom Branded' },
        { name: 'Data Export', free: false, starter: 'CSV', professional: 'CSV + API' },
        { name: 'Analysis Speed', free: 'Standard', starter: 'Fast', professional: 'Priority Queue' }
      ]
    },
    {
      category: 'Reporting & Insights',
      items: [
        { name: 'Basic Recommendations', free: true, starter: true, professional: true },
        { name: 'Advanced SEO Insights', free: false, starter: true, professional: true },
        { name: 'Performance Metrics', free: 'Basic', starter: 'Detailed', professional: 'Comprehensive' },
        { name: 'Custom Branding', free: false, starter: false, professional: true },
        { name: 'White-Label Reports', free: false, starter: false, professional: true }
      ]
    },
    {
      category: 'Integration & API',
      items: [
        { name: 'Web Dashboard Access', free: true, starter: true, professional: true },
        { name: 'API Access', free: false, starter: false, professional: true },
        { name: 'Webhook Integration', free: false, starter: false, professional: true },
        { name: 'Third-Party Integrations', free: false, starter: 'Basic', professional: 'Advanced' },
        { name: 'Team Collaboration', free: false, starter: false, professional: true }
      ]
    },
    {
      category: 'Support & Training',
      items: [
        { name: 'Community Support', free: true, starter: true, professional: true },
        { name: 'Email Support', free: false, starter: true, professional: true },
        { name: 'Priority Support', free: false, starter: false, professional: '24hr Response' },
        { name: 'Training Materials', free: 'Basic', starter: 'Standard', professional: 'Premium' },
        { name: 'Onboarding Call', free: false, starter: false, professional: true }
      ]
    }
  ];

  const plans = [
    { id: 'free', name: 'Free Trial', price: '$0' },
    { id: 'starter', name: 'Starter', price: '$5/mo' },
    { id: 'professional', name: 'Professional', price: '$29/mo' }
  ];

  const renderFeatureValue = (value, planId) => {
    if (typeof value === 'boolean') {
      return value ? (
        <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }

    if (typeof value === 'string') {
      const isHighlighted = planId === 'professional' && (
        value.includes('Expert') || 
        value.includes('Premium') || 
        value.includes('24hr') || 
        value.includes('Priority') ||
        value.includes('Custom') ||
        value.includes('Unlimited')
      );

      return (
        <span className={`text-sm font-medium ${
          isHighlighted 
            ? 'text-blue-600 font-semibold' 
            : 'text-gray-700'
        }`}>
          {value}
        </span>
      );
    }

    return null;
  };

  const getPlanHeaderClass = (planId) => {
    const baseClass = "p-6 text-center";
    
    if (planId === 'professional') {
      return `${baseClass} bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200`;
    } else if (planId === 'starter') {
      return `${baseClass} bg-gray-50 border border-gray-200`;
    } else {
      return `${baseClass} bg-gray-25 border border-gray-100`;
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
          Compare All Features
        </h2>
        <p className="text-lg text-gray-600">
          See exactly what's included in each plan
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Plan Headers */}
        <div className="grid grid-cols-4 border-b border-gray-200">
          <div className="p-6 bg-gray-50 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Features</h3>
          </div>
          {plans.map((plan) => (
            <div key={plan.id} className={getPlanHeaderClass(plan.id)}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                {plan.name}
              </h3>
              <p className="text-2xl font-bold" style={{ color: 'var(--mastery-blue)' }}>
                {plan.price}
              </p>
              {plan.id === 'professional' && (
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {currentTier === plan.id && (
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
            <div className="grid grid-cols-4 bg-gray-100 border-b border-gray-200">
              <div className="p-4 border-r border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  {category.category}
                </h4>
              </div>
              <div className="col-span-3"></div>
            </div>

            {/* Feature Items */}
            {category.items.map((feature, featureIndex) => (
              <div 
                key={featureIndex} 
                className={`grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
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
                  {renderFeatureValue(feature.starter, 'starter')}
                </div>
                <div className="p-4 text-center">
                  {renderFeatureValue(feature.professional, 'professional')}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* CTA Footer */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
              Ready to supercharge your website analysis?
            </h3>
            <p className="text-gray-600 mb-6">
              Join thousands of businesses improving their online presence with AI-powered insights
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Start Free Trial
              </button>
              <button 
                className="px-6 py-3 text-white rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, var(--mastery-blue) 0%, #3B82F6 100%)',
                  boxShadow: '0 8px 20px rgba(30, 58, 138, 0.3)'
                }}
              >
                Go Professional
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12 bg-gray-50 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--framework-black)' }}>
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