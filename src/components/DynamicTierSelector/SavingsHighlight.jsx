// SavingsHighlight.jsx - Dramatic Demonstration (DD) with pricing comparisons
import React from 'react';
import PropTypes from 'prop-types';
import { useBillingPricing } from './useBillingPricing';

const SavingsHighlight = ({ selectedTier, billingFrequency, isTransitioning = false }) => {
  const pricing = useBillingPricing(selectedTier, billingFrequency);

  if (!pricing || selectedTier === 'free' || billingFrequency !== 'annual') {
    return null; // No pricing comparison for free tier or monthly billing
  }

  const isAnnual = billingFrequency === 'annual';
  const { monthlyPrice, annualPrice, annualMonthlyEquivalent, savings } = pricing;

  // Calculate cost per analysis
  const analysesPerMonth = {
    coffee: 10,
    growth: 40,
    scale: 100
  }[selectedTier];

  const costPerAnalysis = isAnnual && annualMonthlyEquivalent
    ? (annualMonthlyEquivalent / analysesPerMonth).toFixed(2)
    : (monthlyPrice / analysesPerMonth).toFixed(2);

  return (
    <div
      className={`
        mt-4 p-4 rounded-lg border-2 bg-gradient-to-br
        transition-all duration-500
        ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${isAnnual ? 'border-green-400 from-green-50 to-teal-50' : 'border-blue-300 from-blue-50 to-indigo-50'}
      `}
      data-testid="savings-highlight"
    >
      <h4 className="text-lg font-bold text-gray-900 mb-3">
        {isAnnual ? '💰 Annual Savings Breakdown' : '📊 Monthly Pricing Breakdown'}
      </h4>

      {/* Pricing Comparison Table */}
      <div className="space-y-2 mb-4">
        {isAnnual ? (
          <>
            {/* Annual Comparison */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-300">
              <span className="text-sm text-gray-600">Monthly billing (12 months)</span>
              <span className="text-sm font-semibold text-gray-900">
                ${(monthlyPrice * 12).toFixed(2)}/year
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-green-400">
              <span className="text-sm font-bold text-green-700">Annual billing</span>
              <span className="text-sm font-bold text-green-700">
                ${annualPrice.toFixed(2)}/year
              </span>
            </div>
            <div className="flex justify-between items-center bg-green-100 -mx-2 px-2 py-2 rounded">
              <span className="text-base font-bold text-green-800">You save</span>
              <span className="text-base font-bold text-green-800" data-testid="savings-amount">
                ${savings.toFixed(2)}/year ({Math.round((savings / (monthlyPrice * 12)) * 100)}% discount)
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Monthly Breakdown */}
            <div className="flex justify-between items-center pb-2 border-b border-gray-300">
              <span className="text-sm text-gray-600">Monthly subscription</span>
              <span className="text-sm font-semibold text-gray-900">
                ${monthlyPrice.toFixed(2)}/month
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-blue-400">
              <span className="text-sm font-bold text-blue-700">Annual would be</span>
              <span className="text-sm font-bold text-blue-700">
                ${annualMonthlyEquivalent.toFixed(2)}/month
              </span>
            </div>
            <div className="flex justify-between items-center bg-yellow-100 -mx-2 px-2 py-2 rounded">
              <span className="text-sm font-bold text-yellow-800">💡 Switch to annual and save</span>
              <span className="text-sm font-bold text-yellow-800">
                ${savings.toFixed(2)}/year
              </span>
            </div>
          </>
        )}
      </div>

      {/* Cost Per Analysis */}
      <div className="pt-3 border-t border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Cost per analysis</span>
          <span className={`
            text-lg font-bold
            ${isAnnual ? 'text-green-700' : 'text-blue-700'}
          `}>
            ${costPerAnalysis}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          vs $5-10 manual ChatGPT analysis (5 mins each, inconsistent results)
        </p>
      </div>

      {/* Dramatic Difference Statement */}
      <div className="mt-4 pt-3 border-t border-gray-300">
        <p className="text-xs text-gray-700 italic">
          {selectedTier === 'coffee' && (
            <>Manual ChatGPT analysis: 5 minutes per page, different results every time, hallucinated problems, no weighting, no tracking. <strong>AImpactScanner Solo:</strong> 12 seconds, same research-based framework every time, correctly weighted, see your improvements for 30 days.</>
          )}
          {selectedTier === 'growth' && (
            <>Solo tier tells you what's wrong with 10 pages. <strong>Growth tier</strong> gives you 40 analyses to optimize your entire site, track improvements for 90 days, export your data, AND make sure ChatGPT can find your content. That's the complete optimization system with the research-based framework, not just spot checks.</>
          )}
          {selectedTier === 'scale' && (
            <>Growth tier optimizes your portfolio with the research-based framework. <strong>Scale tier</strong> turns you into an optimization machine - API automation, team collaboration, unlimited history. Enterprise tools charge $500+/month for this. You pay ${isAnnual ? annualMonthlyEquivalent.toFixed(2) : monthlyPrice.toFixed(2)}/mo.</>
          )}
        </p>
      </div>
    </div>
  );
};

SavingsHighlight.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']).isRequired,
  billingFrequency: PropTypes.oneOf(['annual', 'monthly']).isRequired,
  isTransitioning: PropTypes.bool
};

export default SavingsHighlight;
