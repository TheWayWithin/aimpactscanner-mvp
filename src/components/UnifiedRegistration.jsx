// UnifiedRegistration.jsx - Optimized registration flow biased towards paid tier
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUpgrade } from './UpgradeHandler';

const UnifiedRegistration = ({ onRegistrationComplete }) => {
  const [selectedTier, setSelectedTier] = useState('coffee'); // Default to paid tier
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEmailSent, setShowEmailSent] = useState(false);

  // Tier configurations
  const tiers = {
    coffee: {
      name: '☕ Coffee Plan',
      price: '$5/month',
      subtitle: 'Most Popular Choice',
      color: 'yellow',
      recommended: true
    },
    free: {
      name: 'Free Plan',
      price: '$0/month',
      subtitle: 'Limited Access',
      color: 'gray',
      recommended: false
    }
  };

  // Dynamic benefits based on selected tier
  const getBenefits = () => {
    if (selectedTier === 'coffee') {
      return {
        title: '☕ COFFEE Plan Benefits',
        benefits: [
          { icon: '✅', text: 'Unlimited AI-powered analysis', highlight: true },
          { icon: '✅', text: 'All 11 factors with detailed recommendations', highlight: true },
          { icon: '✅', text: 'Professional reports (no watermarks)', highlight: false },
          { icon: '✅', text: 'Export to PDF and share', highlight: false },
          { icon: '✅', text: 'Priority email support', highlight: false },
          { icon: '✅', text: 'Cancel anytime, no questions asked', highlight: false }
        ],
        value: 'Less than the price of a coffee per month!',
        cta: 'After signup, you\'ll be redirected to Stripe for payment ($5/month)'
      };
    } else {
      return {
        title: 'FREE Plan Limitations',
        benefits: [
          { icon: '⚠️', text: 'Only 3 analyses per month', highlight: false, warning: true },
          { icon: '❌', text: 'Basic recommendations only', highlight: false, strike: true },
          { icon: '❌', text: 'Watermarked results', highlight: false, strike: true },
          { icon: '❌', text: 'No export options', highlight: false, strike: true },
          { icon: '❌', text: 'Community support only', highlight: false, strike: true },
          { icon: '⚠️', text: 'Missing advanced AI insights', highlight: false, warning: true }
        ],
        value: 'You\'re missing out on comprehensive analysis',
        cta: 'Continue with limited free tier'
      };
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Store selected tier for post-auth handling
      localStorage.setItem('selectedTier', selectedTier);
      localStorage.setItem('registrationEmail', email);

      // Sign up with magic link - add analysis data to redirect URL
      const redirectUrl = new URL(window.location.origin);
      const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
      const pendingId = localStorage.getItem('pendingAnalysisId');
      
      if (pendingUrl && pendingId) {
        redirectUrl.searchParams.set('analysisUrl', pendingUrl);
        redirectUrl.searchParams.set('analysisId', pendingId);
        redirectUrl.searchParams.set('tier', selectedTier);
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl.toString(),
          data: {
            tier: selectedTier
          }
        }
      });

      if (error) throw error;

      setShowEmailSent(true);
      setMessage(`Check ${email} for your magic link to complete registration`);
      setMessageType('success');

    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const benefits = getBenefits();

  if (showEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-4">Check Your Email!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500">
            Click the link in your email to complete registration and see your full analysis results.
          </p>
          {selectedTier === 'coffee' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ☕ After confirming your email, you'll be redirected to secure Stripe checkout
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

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

            {/* Tier Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Plan
              </label>
              
              <div className="space-y-3">
                {/* Coffee Tier - Pre-selected and highlighted */}
                <div 
                  onClick={() => setSelectedTier('coffee')}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTier === 'coffee' 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tiers.coffee.recommended && (
                    <div className="absolute -top-3 left-4 px-2 bg-yellow-400 text-xs font-bold rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="tier"
                        value="coffee"
                        checked={selectedTier === 'coffee'}
                        onChange={() => setSelectedTier('coffee')}
                        className="mr-3 text-yellow-500 focus:ring-yellow-500"
                      />
                      <div>
                        <div className="font-semibold">{tiers.coffee.name}</div>
                        <div className="text-sm text-gray-600">{tiers.coffee.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-yellow-600">{tiers.coffee.price}</div>
                  </div>
                  <div className="mt-2 ml-6 text-sm text-gray-700">
                    Unlimited AI analysis, up to 200 pages
                  </div>
                  {selectedTier === 'coffee' && (
                    <div className="mt-2 ml-6 text-xs text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded">
                      ℹ️ After signup, you'll be redirected to Stripe for payment ($5/month)
                    </div>
                  )}
                </div>

                {/* Free Tier - De-emphasized */}
                <div 
                  onClick={() => setSelectedTier('free')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all opacity-75 ${
                    selectedTier === 'free' 
                      ? 'border-gray-400 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="tier"
                        value="free"
                        checked={selectedTier === 'free'}
                        onChange={() => setSelectedTier('free')}
                        className="mr-3 text-gray-500 focus:ring-gray-500"
                      />
                      <div>
                        <div className="font-semibold text-gray-700">{tiers.free.name}</div>
                        <div className="text-sm text-gray-500">{tiers.free.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-lg text-gray-500">{tiers.free.price}</div>
                  </div>
                  <div className="mt-2 ml-6 text-sm text-gray-500">
                    3 free analyses per month, up to 20 pages
                  </div>
                </div>
              </div>
            </div>

            {/* Email Input */}
            <form onSubmit={handleSignUp}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  selectedTier === 'coffee'
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : 
                 selectedTier === 'coffee' ? 'Create Account & Continue to Payment →' : 'Create Free Account'}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

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
                    <span className="text-green-700 font-semibold"><strong>AImpactScanner:</strong> Enterprise AI Analysis for $5/month</span>
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
                  <p className="text-sm text-blue-700">While competitors spend $5,000+ on consultants, you get enterprise insights for $5/month</p>
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