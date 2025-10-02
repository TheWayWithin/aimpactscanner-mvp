// UnifiedRegistration.jsx - OAuth-first registration flow (NO PASSWORDS)
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUpgrade } from './UpgradeHandler';
import TierSelector from './TierSelector';
import AuthMethodSelector from './AuthMethodSelector';
import { storePendingAnalysis } from '../utils/authRouting';

const UnifiedRegistration = ({ onRegistrationComplete }) => {
  const [selectedTier, setSelectedTier] = useState(null); // No tier selected initially
  const [showTierSelector, setShowTierSelector] = useState(false); // Don't show tier selector initially
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Store pending analysis URL if it exists
  useEffect(() => {
    const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
    const pendingId = localStorage.getItem('pendingAnalysisId');
    if (pendingUrl) {
      console.log('📍 Found pending analysis URL:', pendingUrl);
      // It's already in localStorage, just log it
    }
  }, []);

  // Handle successful authentication
  const handleAuthSuccess = (successMessage) => {
    setMessage(successMessage);
    setMessageType('success');
  };

  // Handle authentication errors
  const handleAuthError = (errorMessage) => {
    setMessage(errorMessage);
    setMessageType('error');
  };

  // Dynamic benefits based on selected tier
  const getBenefits = () => {
    if (selectedTier === 'coffee') {
      return {
        title: '☕ COFFEE Plan Benefits',
        benefits: [
          { icon: '✅', text: 'Unlimited AI-powered analyses per month', highlight: true },
          { icon: '✅', text: '10 MASTERY-AI Framework factors (Phase A)', highlight: true },
          { icon: '✅', text: 'Professional PDF reports (no watermarks)', highlight: false },
          { icon: '✅', text: 'Clean, exportable results dashboard', highlight: false },
          { icon: '✅', text: 'Educational content & recommendations', highlight: false },
          { icon: '✅', text: 'Email support', highlight: false },
          { icon: '✅', text: '30-day money-back guarantee', highlight: false }
        ],
        value: 'Less than the price of a coffee per month!',
        cta: 'Choose your authentication method below'
      };
    } else if (selectedTier === 'free') {
      return {
        title: '🆓 FREE Plan Limitations',
        benefits: [
          { icon: '⚠️', text: 'Only 3 analyses per month', highlight: false, warning: true },
          { icon: '❌', text: 'Basic recommendations only', highlight: false, strike: true },
          { icon: '❌', text: 'Phase A factors only', highlight: false, strike: true },
          { icon: '❌', text: 'Web-only results (no PDF export)', highlight: false, strike: true },
          { icon: '❌', text: 'Community support only', highlight: false, strike: true },
          { icon: '❌', text: 'No advanced AI insights', highlight: false, strike: true }
        ],
        value: 'You\'re missing out on comprehensive analysis',
        cta: 'Choose your authentication method below'
      };
    } else {
      return {
        title: `${selectedTier.toUpperCase()} Plan`,
        benefits: [
          { icon: '🔧', text: 'Coming Soon - Advanced features in development', highlight: true }
        ],
        value: 'Start with Coffee tier, upgrade when available',
        cta: 'Choose Coffee tier to get started'
      };
    }
  };

  const benefits = getBenefits();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Left side - Registration Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
            <p className="text-gray-600 mb-6">
              Join early adopters making their businesses AI-discoverable
            </p>

            {/* OAuth-First: Show auth buttons immediately, NO tier selection upfront */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Sign up with your preferred method. You'll choose your plan after authentication.
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                messageType === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Authentication Method Selector (OAuth + Magic Link) */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {benefits.cta}
              </h3>
              <AuthMethodSelector
                selectedTier={selectedTier}
                mode="signup"
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
              />
            </div>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>

          {/* Right side - Dynamic Benefits */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{benefits.title}</h2>
            
            <ul className="space-y-3 mb-6">
              {benefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-xl mr-3">{benefit.icon}</span>
                  <span className={`flex-1 ${
                    benefit.highlight ? 'font-semibold text-gray-900' : 
                    benefit.warning ? 'text-orange-600' :
                    benefit.strike ? 'text-gray-400 line-through' : 
                    'text-gray-700'
                  }`}>
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className={`p-4 rounded-lg mb-6 ${
              selectedTier === 'coffee' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-semibold ${
                selectedTier === 'coffee' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {benefits.value}
              </p>
            </div>

            {/* Why Choose Section - Enhanced with OVERT, DRAMATIC, REAL messaging */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-4 text-red-600">⚠️ Don't Get Left Behind by AI!</h3>
              
              {/* Dramatic Difference - Us vs Them */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-red-800 mb-3">While Others Struggle, You'll Dominate:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    <span className="text-red-700"><strong>Basic SEO Tools:</strong> Ignore AI completely (your traffic dies)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    <span className="text-red-700"><strong>AI Consultants:</strong> $5,000+ (you can't afford this)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-green-700 font-semibold"><strong>AImpactScanner:</strong> Enterprise AI Analysis for $4.95/month</span>
                  </div>
                </div>
              </div>

              {/* Real Reasons to Believe */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-xl mr-2">💰</span>
                    <h4 className="font-bold text-green-800">30-Day Money Back Guarantee</h4>
                  </div>
                  <p className="text-sm text-green-700">Don't see improvements? Get every penny back. No questions asked.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">🔄</span>
                    <div>
                      <div className="font-medium">Cancel Anytime</div>
                      <div className="text-xs text-gray-600">No contracts, no BS, no hassle</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 mr-2">👤</span>
                    <div>
                      <div className="font-medium">Direct Founder Access</div>
                      <div className="text-xs text-gray-600">I personally respond to emails</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-2">⚡</span>
                    <div>
                      <div className="font-medium">15-Second Results</div>
                      <div className="text-xs text-gray-600">No waiting, no complexity</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">🔍</span>
                    <div>
                      <div className="font-medium">100% Transparent</div>
                      <div className="text-xs text-gray-600">See exactly what we check</div>
                    </div>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 text-xl mr-2">🏆</span>
                    <h4 className="font-bold text-yellow-800">Early Adopters Winning Big</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">Join 500+ smart founders who got ahead of AI before everyone else</p>
                  <p className="text-xs text-yellow-600 italic">"40%+ traffic increase in first month" - Real customer results</p>
                </div>

                {/* Urgency & Value */}
                <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-800 mb-1">Less Than Your Daily Coffee</h4>
                  <p className="text-sm text-blue-700">While competitors spend $5,000+ on consultants, you get enterprise insights for $4.95/month</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">⏰ Algorithm changes happen daily - don't wait</p>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🔒</span>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold">Secure & Private</div>
                  <div>Your data is encrypted and never shared. We only analyze public content.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRegistration;