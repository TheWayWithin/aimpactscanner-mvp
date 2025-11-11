// Signup.jsx - Tier selection BEFORE OAuth authentication
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabaseClient';
import AuthMethodSelector from '../components/AuthMethodSelector';
import DynamicTierSelector from '../components/DynamicTierSelector/DynamicTierSelector';

const Signup = ({ mode = 'signup', session = null, onNavigate = null }) => {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [selectedTier, setSelectedTier] = useState('growth'); // Default to GROWTH tier
  const [billingFrequency, setBillingFrequency] = useState('annual'); // Default to ANNUAL billing
  // For login mode, show OAuth buttons immediately (skip tier selection)
  // For signup mode, require explicit "Continue" button click
  const [showOAuthButtons, setShowOAuthButtons] = useState(mode === 'login');

  // DEBUG: Log when component mounts
  useEffect(() => {
    console.log('🚀 Signup component mounted');
    console.log('🔍 Mode:', mode);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Current hash:', window.location.hash);
    console.log('🔍 Session exists:', !!session);

    // FRICTIONLESS UX: If user is already logged in, redirect to dashboard
    if (session?.user) {
      console.log('✅ User already logged in, redirecting to dashboard');
      if (onNavigate) {
        onNavigate('dashboard');
      } else {
        window.location.hash = 'dashboard';
      }
      return;
    }

    // For login mode, set authContext to 'login' mode (no tier selection needed)
    if (mode === 'login') {
      const authContext = {
        mode: 'login',
        timestamp: Date.now()
      };
      localStorage.setItem('authContext', JSON.stringify(authContext));

      // FIX 3: Set 7-day expiry (was 24 hours)
      const ttl = 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());

      console.log('✅ Login mode: authContext set, skipping tier selection');

      // FIX: Update showOAuthButtons state when mode changes to 'login'
      setShowOAuthButtons(true);
    } else {
      // In signup mode, hide OAuth buttons until tier is selected
      setShowOAuthButtons(false);
    }

    // Note: Session detection now handled by App.jsx onAuthStateChange listener
    // No need for manual session checking here
  }, [mode, session, onNavigate]);

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
      <div className="max-w-7xl mx-auto px-1 sm:px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">
            {mode === 'login' ? 'Welcome Back' : 'Get Started with AImpactScanner'}
          </h1>
          <p className="text-lg text-gray-600">
            {mode === 'login'
              ? 'Sign in to continue optimizing your AI discoverability'
              : 'Make your business AI-discoverable in 60 seconds'}
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

        {/* STEP 1: Tier Selection - Side-by-side layout on wider screens */}
        {!showOAuthButtons && mode === 'signup' && (
          <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-8">
            {/* Blue banner - full width on mobile, spans both columns on desktop */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Step 1 of 2:</strong> Choose your plan first, then we'll securely connect your account.
              </p>
            </div>

            {/* Single column layout - content expands on wider screens */}
            <div className="max-w-3xl mx-auto">
              <DynamicTierSelector
                defaultTier="growth"
                defaultBilling="annual"
                onTierChange={(tier) => {
                  setSelectedTier(tier);
                  console.log('🔄 Tier changed to:', tier);
                }}
                onBillingChange={(frequency) => {
                  setBillingFrequency(frequency);
                  console.log('🔄 Billing frequency changed to:', frequency);
                }}
                onSelectionComplete={(tier, billing, isTrial) => {
                  console.log('[Signup] onSelectionComplete called');
                  console.log('[Signup] Received tier:', tier);
                  console.log('[Signup] Received billing:', billing);
                  console.log('[Signup] Received isTrial (raw):', isTrial);
                  console.log('[Signup] isTrial type:', typeof isTrial);

                  // CRITICAL FIX: Handle undefined explicitly instead of default parameter
                  // Default parameters can cause issues if the caller passes undefined
                  const normalizedIsTrial = isTrial === true;  // Only true if explicitly true
                  console.log('[Signup] Normalized isTrial:', normalizedIsTrial);

                  // Store in authContext for OAuth callback
                  const authContext = {
                    selectedTier: tier,
                    billingFrequency: billing,
                    isTrial: normalizedIsTrial, // FIXED: Use normalized boolean value
                    mode: 'signup',
                    timestamp: Date.now()
                  };

                  console.log('[Signup] authContext object:', authContext);
                  console.log('[Signup] authContext stringified:', JSON.stringify(authContext));

                  localStorage.setItem('authContext', JSON.stringify(authContext));

                  // Set 7-day expiry
                  const ttl = 7 * 24 * 60 * 60 * 1000;
                  localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());

                  console.log('✅ Selection confirmed:', { tier, billing, isTrial }, 'stored in authContext');

                  // NOW show OAuth buttons
                  setShowOAuthButtons(true);
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 2: OAuth Buttons (shown after tier selection for signup, immediately for login) */}
        {showOAuthButtons && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="max-w-2xl mx-auto">
              {/* Show tier confirmation ONLY in signup mode */}
              {mode === 'signup' && selectedTier && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Plan Selected:</strong> {
                      selectedTier === 'coffee' ? 'Solo' :
                      selectedTier === 'free' ? 'Free' :
                      selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)
                    } Tier ({billingFrequency === 'annual' ? 'Annual' : 'Monthly'} Billing)
                    <button
                      onClick={() => {
                        setSelectedTier('growth');
                        setBillingFrequency('annual');
                        setShowOAuthButtons(false);
                        localStorage.removeItem('authContext');
                        localStorage.removeItem('authContextExpiry');
                        console.log('🔄 Selection reset');
                      }}
                      className="ml-2 text-green-700 hover:text-green-900 underline font-semibold"
                    >
                      Change Plan
                    </button>
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>{mode === 'login' ? 'Sign in with:' : 'Step 2 of 2:'}</strong> {mode === 'login' ? 'Choose your preferred method' : 'Sign up with Google or GitHub. No passwords to remember.'}
                </p>
              </div>

              <AuthMethodSelector
                selectedTier={selectedTier}
                isTrial={selectedTier === 'growth'} // Pass trial flag to AuthMethodSelector
                billingFrequency={billingFrequency}
                mode={mode}
                onSuccess={handleAuthSuccess}
                onError={handleAuthError}
              />
            </div>
          </div>
        )}

        {/* Sign In/Up Link */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <div className="text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <a
                    href="/#signup"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Sign up here
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a
                    href="/#login"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Sign in here
                  </a>
                </>
              )}
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

Signup.propTypes = {
  mode: PropTypes.oneOf(['signup', 'login']),
  session: PropTypes.object,
  onNavigate: PropTypes.func
};

export default Signup;
