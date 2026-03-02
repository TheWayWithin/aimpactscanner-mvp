// PricingPage.jsx - Pricing Page with genuine trust signals
// Combines PricingTiers and PricingComparison

import React, { useState } from 'react';
import { Lock, DollarSign, Rocket, Phone, Ban } from 'lucide-react';
import PricingTiers from './PricingTiers';
import PricingComparison from './PricingComparison';

const PricingPage = ({ currentTier = 'free', onUpgrade, className = '' }) => {
  const [showComparison, setShowComparison] = useState(false);

  const riskReversals = [
    {
      icon: <Lock className="w-8 h-8 text-signal" />,
      title: "Secure & Private",
      description: "Your data is encrypted and never shared."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-clarity" />,
      title: "30-Day Money Back",
      description: "Not satisfied? Get a full refund within 30 days, no questions asked."
    },
    {
      icon: <Rocket className="w-8 h-8 text-mastery" />,
      title: "Instant Setup",
      description: "Get insights in minutes, not hours. No complex setup required."
    },
    {
      icon: <Phone className="w-8 h-8 text-signal" />,
      title: "Expert Support",
      description: "Our AI optimization experts are here to help you succeed."
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-cloud to-white ${className}`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold text-ink mb-6 leading-tight">
              Simple, Honest Pricing
              <span className="block bg-gradient-to-r from-mastery to-signal bg-clip-text text-transparent">
                Start Free. Upgrade When Ready.
              </span>
            </h1>
            <p className="text-xl text-slate mb-8 max-w-3xl mx-auto leading-relaxed">
              AI-powered analysis to increase conversions, improve search rankings,
              and maximize revenue. Professional insights without the consultant price tag.
            </p>
          </div>
        </div>
      </div>

      {/* Main Pricing Section */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <PricingTiers
          currentTier={currentTier}
          onUpgrade={onUpgrade}
          className="mb-16"
        />

        {/* Comparison Toggle */}
        <div className="text-center mb-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="inline-flex items-center px-6 py-3 border-2 border-mist rounded-xl text-ink bg-white hover:bg-cloud hover:border-slate/30 transition-all font-medium"
          >
            <svg className={`w-4 h-4 mr-2 transition-transform ${showComparison ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {showComparison ? 'Hide' : 'Show'} Detailed Feature Comparison
          </button>
        </div>

        {/* Detailed Comparison */}
        {showComparison && (
          <div className="mb-16">
            <PricingComparison currentTier={currentTier} />
          </div>
        )}

        {/* Solopreneur Story Section */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <div className="bg-gradient-to-r from-signal/5 to-mastery/5 rounded-2xl p-8 border border-mist">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-mist mb-6">
              <span className="text-mastery font-semibold">Built and maintained by one person who gets it</span>
            </div>
            <p className="text-lg text-ink mb-4">
              Perfect for solopreneurs and small teams who need enterprise-quality insights without enterprise prices.
            </p>
            <p className="text-slate">
              I know what it's like to need professional analysis but not have the budget for $2,000+ consultants.
              That's why the Solo tier exists - serious tools at a price that makes sense for real businesses.
            </p>
          </div>
        </div>

        {/* Risk Reversal Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink mb-4">
              Why Choose AImpactScanner?
            </h2>
            <p className="text-lg text-slate">
              We remove all the risk so you can focus on growing your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {riskReversals.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-ink mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-signal/5 to-mastery/10 rounded-3xl p-12 border border-mist">
          <h2 className="text-3xl font-bold text-ink mb-4">
            Ready to Improve Your AI Visibility?
          </h2>
          <p className="text-lg text-slate mb-8">
            Start with a free scan - no credit card required. See exactly where
            your website stands in AI search results.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => onUpgrade('free')}
              className="px-8 py-4 bg-cloud text-ink rounded-xl font-semibold hover:bg-mist transition-colors text-lg border border-mist"
            >
              Start Free
            </button>
            <button
              onClick={() => onUpgrade('growth')}
              className="px-8 py-4 bg-signal text-white rounded-xl font-semibold hover:bg-signal/90 transition-all shadow-lg text-lg"
            >
              Get Growth Plan
            </button>
          </div>

          <div className="text-sm text-slate">
            <p className="mb-2 flex items-center justify-center gap-1 flex-wrap"><Lock className="w-3.5 h-3.5 inline" /> Secure checkout <span className="mx-1">&bull;</span> <DollarSign className="w-3.5 h-3.5 inline" /> 30-day money-back guarantee <span className="mx-1">&bull;</span> <Ban className="w-3.5 h-3.5 inline" /> Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
