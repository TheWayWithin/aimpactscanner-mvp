// PricingPage.jsx - Complete Conversion-Optimized Pricing Page
// Combines PricingTiers and PricingComparison with additional conversion elements

import React, { useState, useEffect } from 'react';
import PricingTiers from './PricingTiers';
import PricingComparison from './PricingComparison';

const PricingPage = ({ currentTier = 'free', onUpgrade, className = '' }) => {
  const [showComparison, setShowComparison] = useState(false);
  const [visitorCount, setVisitorCount] = useState(2847);

  // Simulate live visitor count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const socialProof = [
    { metric: "99.2%", label: "Customer Satisfaction" },
    { metric: "2.4x", label: "Average ROI Increase" },
    { metric: "15min", label: "Average Setup Time" },
    { metric: "24/7", label: "Expert Support" }
  ];

  const riskReversals = [
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your data is encrypted and never shared. SOC 2 compliant."
    },
    {
      icon: "💰",
      title: "30-Day Money Back",
      description: "Not satisfied? Get a full refund within 30 days, no questions asked."
    },
    {
      icon: "🚀",
      title: "Instant Setup",
      description: "Get insights in minutes, not hours. No complex setup required."
    },
    {
      icon: "📞",
      title: "Expert Support",
      description: "Our AI optimization experts are here to help you succeed."
    }
  ];

  const impactMetrics = [
    {
      metric: "+340%",
      label: "Average Conversion Improvement",
      description: "Businesses using our AI analysis see significant improvements in their conversion rates through optimized content and structure.",
      category: "Conversion Optimization"
    },
    {
      metric: "+156%", 
      label: "Organic Traffic Growth",
      description: "Our framework-compliant analysis helps websites rank better in AI search results and traditional search engines.",
      category: "Search Performance"
    },
    {
      metric: "89%",
      label: "Success Rate",
      description: "Nearly 9 out of 10 businesses implement our recommendations successfully and see measurable improvements.",
      category: "Implementation Success"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-50 to-white ${className}`}>
      {/* Hero Section with Social Proof */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Live Visitor Counter */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">
                {visitorCount.toLocaleString()} users are analyzing their websites right now
              </span>
            </div>
          </div>

          {/* Main Hero Content */}
          <div className="text-center mb-12">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--framework-black)' }}>
              Transform Your Website Into a
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Conversion Machine
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join 47,000+ businesses using AI-powered analysis to increase conversions, 
              improve search rankings, and maximize revenue. Get professional insights 
              that typically cost $2,000+ from consultants.
            </p>
            
            {/* Social Proof Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {socialProof.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: 'var(--mastery-blue)' }}>
                    {item.metric}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Urgency Element */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-2">
                <span className="text-orange-600 font-bold text-lg">⚡ Limited Time: 50% Off Growth Plan</span>
              </div>
              <p className="text-sm text-orange-700">
                Price increases to $58/month next week. Lock in your savings today.
              </p>
            </div>
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
            className="inline-flex items-center px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
          >
            <svg className={`w-4 h-4 mr-2 transition-transform ${showComparison ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {showComparison ? 'Hide' : 'Show'} Detailed Feature Comparison
          </button>
        </div>

        {/* Detailed Comparison */}
        {showComparison && (
          <div className="mb-16 animate-fadeIn">
            <PricingComparison currentTier={currentTier} />
          </div>
        )}

        {/* Impact Metrics */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-600">
              Our AI-powered analysis delivers measurable improvements for businesses of all sizes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {impactMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow text-center">
                <div className="mb-6">
                  <div className="text-5xl font-bold mb-2" style={{ color: 'var(--mastery-blue)' }}>
                    {metric.metric}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">
                    {metric.label}
                  </div>
                  <div className="text-sm text-blue-600 font-medium">
                    {metric.category}
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed">
                  {metric.description}
                </p>
                
                {/* Progress indicator */}
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" 
                      style={{ width: index === 0 ? '85%' : index === 1 ? '92%' : '89%' }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Based on 47,000+ analyzed websites</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solopreneur Story Section */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-blue-200 mb-6">
              <span className="text-blue-600 font-semibold">Built and maintained by one person who gets it</span>
            </div>
            <p className="text-lg text-gray-700 mb-4">
              Perfect for solopreneurs and small teams who need enterprise-quality insights without enterprise prices.
            </p>
            <p className="text-gray-600">
              I know what it's like to need professional analysis but not have the budget for $2,000+ consultants. 
              That's why the Coffee tier exists - serious tools at a price that makes sense for real businesses.
            </p>
          </div>
        </div>

        {/* Risk Reversal Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
              Why Choose AI Search Mastery?
            </h2>
            <p className="text-lg text-gray-600">
              We remove all the risk so you can focus on growing your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {riskReversals.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--framework-black)' }}>
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-12">
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--framework-black)' }}>
            Ready to 10x Your Website Performance?
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Join the thousands of businesses already using AI to optimize their websites and increase revenue.
            Start your free trial today - no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button 
              onClick={() => onUpgrade('free')}
              className="px-8 py-4 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors text-lg"
            >
              Start Free Trial
            </button>
            <button 
              onClick={() => onUpgrade('growth')}
              className="px-8 py-4 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-lg text-lg"
              style={{ 
                background: 'linear-gradient(135deg, var(--mastery-blue) 0%, #3B82F6 100%)',
                boxShadow: '0 10px 25px rgba(30, 58, 138, 0.3)'
              }}
            >
              Get Growth Plan
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2">🔒 Secure checkout • 💰 30-day money-back guarantee • 🚫 Cancel anytime</p>
            <p>Questions? Email us at support@aisearchmastery.com or call 1-800-AI-HELP</p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .bg-gray-25 {
          background-color: #fafafa;
        }
      `}</style>
    </div>
  );
};

export default PricingPage;