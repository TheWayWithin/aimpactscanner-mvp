// Signup.jsx - Tier selection BEFORE OAuth authentication
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthMethodSelector from '../components/AuthMethodSelector';
import TierSelector from '../components/TierSelector';

const Signup = () => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [showOAuthButtons, setShowOAuthButtons] = useState(false);

  // DEBUG: Log when component mounts
  useEffect(() => {
    console.log('🚀 Signup component mounted');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Current hash:', window.location.hash);

    // Note: Session detection now handled by App.jsx onAuthStateChange listener
    // No need for manual session checking here
  }, []);

  const handleAuthSuccess = (successMessage) => {
    setMessage(successMessage);
    setMessageType('success');
  };

  const handleAuthError = (errorMessage) => {
    setMessage(errorMessage);
    setMessageType('error');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Get Started with AImpactScanner</h1>
            <p className="text-lg text-gray-600">
              Make your business AI-discoverable in 60 seconds
            </p>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${
              messageType === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* STEP 1: Tier Selection (shown first) */}
          {!showOAuthButtons && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Step 1 of 2:</strong> Choose your plan first, then we'll securely connect your account.
                </p>
              </div>

              <TierSelector
                selectedTier={selectedTier}
                onTierChange={(tier) => {
                  setSelectedTier(tier);
                  setShowOAuthButtons(true);

                  // Store in authContext for OAuth callback
                  const authContext = {
                    selectedTier: tier,
                    mode: 'signup',
                    timestamp: Date.now()
                  };
                  localStorage.setItem('authContext', JSON.stringify(authContext));

                  // Set 24-hour expiry
                  const ttl = 24 * 60 * 60 * 1000;
                  localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());

                  console.log('✅ Tier selected:', tier, 'stored in authContext');
                }}
              />
            </div>
          )}

          {/* STEP 2: OAuth Buttons (shown after tier selection) */}
          {showOAuthButtons && (
            <div className="mb-8">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✅ <strong>Plan Selected:</strong> {selectedTier === 'free' ? 'Free' : selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
                  <button
                    onClick={() => {
                      setSelectedTier(null);
                      setShowOAuthButtons(false);
                      localStorage.removeItem('authContext');
                      localStorage.removeItem('authContextExpiry');
                      console.log('🔄 Tier selection reset');
                    }}
                    className="ml-2 text-green-700 hover:text-green-900 underline font-semibold"
                  >
                    Change Plan
                  </button>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Step 2 of 2:</strong> Sign up with Google or GitHub. No passwords to remember.
                </p>
              </div>

              <AuthMethodSelector
                selectedTier={selectedTier}
                mode="signup"
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
              />
            </div>
          )}

          {/* Sign In Link */}
          <div className="text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a
                href="/#/login"
                className="text-blue-600 hover:underline font-semibold"
              >
                Sign in here
              </a>
            </p>
          </div>

          {/* Benefits Section */}
          <div className="mt-8 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Why Early Adopters Love Us</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Benefit 1 */}
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Lightning Fast</h3>
                <p className="text-sm text-gray-600">
                  Get AI optimization insights in under 60 seconds
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold mb-2">Proven Framework</h3>
                <p className="text-sm text-gray-600">
                  MASTERY-AI framework based on real AI search behavior
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-semibold mb-2">Risk-Free</h3>
                <p className="text-sm text-gray-600">
                  Start free, upgrade anytime. 30-day money-back guarantee
                </p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-2xl">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="text-center text-gray-700 italic">
              "Finally, a tool that shows me EXACTLY how to optimize for AI search engines.
              Game-changer for my SaaS!"
            </p>
            <p className="text-center text-sm text-gray-600 mt-2">
              — Solo Founder, Tech Startup
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;
