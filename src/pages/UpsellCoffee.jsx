// UpsellCoffee.jsx - Free → Coffee tier upgrade page ($4.95/month)
import React, { useState, useEffect } from 'react';
import ComparisonGrid from '../components/ComparisonGrid';
import ZeroRiskSection from '../components/ZeroRiskSection';
import { supabase } from '../lib/supabaseClient';

const UpsellCoffee = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Get authenticated user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // Free tier limitations (exact messaging from spec)
  const freeLimitations = [
    'Only 3 analyses per month',
    'Basic recommendations only',
    'Phase A factors only',
    'Web-only results (no PDF export)',
    'Community support only',
    'No advanced AI insights'
  ];

  // Coffee tier benefits (exact messaging from spec)
  const coffeeBenefits = [
    'Unlimited AI-powered analyses per month',
    '10 MASTERY-AI Framework factors (Phase A)',
    'Professional PDF reports (no watermarks)',
    'Clean, exportable results dashboard',
    'Educational content & recommendations',
    'Email support',
    '30-day money-back guarantee'
  ];

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Initiating Stripe checkout for Coffee tier...');

      if (!user) {
        throw new Error('You must be logged in to upgrade. Please sign in first.');
      }

      // Get current user details from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to retrieve user information. Please try again.');
      }

      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          userId: userData.id,
          tier: 'coffee',
          priceId: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID,
          successUrl: `${window.location.origin}/#checkout-success`,
          cancelUrl: `${window.location.origin}/#upsell-coffee`,
          mode: 'subscription',
          allowPromotionCodes: true
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to create checkout session');
      }

      if (!data?.success || !data?.url) {
        throw new Error('Invalid response from checkout session creation');
      }

      console.log('✅ Checkout session created, redirecting to Stripe...');

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('❌ Upgrade error:', error);
      setError(error.message);

      // Show error banner with retry option
      // User stays on page for graceful degradation
    } finally {
      setLoading(false);
    }
  };

  const handleMaybeLater = () => {
    // Navigate to dashboard
    window.location.hash = 'dashboard';
  };

  return (
    <div className="upsell-coffee-page">
      {/* Error Banner - Graceful Degradation */}
      {error && (
        <div
          className="error-banner p-4 text-center"
          style={{ backgroundColor: '#FEE2E2', borderBottom: '2px solid #EF4444' }}
        >
          <div className="container max-w-3xl mx-auto">
            <p className="text-red-800 font-medium mb-2">
              ⚠️ {error}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Try Again
              </button>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section
        className="hero-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #F5E6D3 0%, #FFFFFF 100%)'
        }}
      >
        <div className="container max-w-3xl mx-auto">
          {/* Coffee Icon */}
          <div
            className="icon-coffee text-7xl mb-6"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            ☕
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Unlock Unlimited AI Optimization
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-normal max-w-2xl mx-auto">
            Remove limits. Run unlimited analyses. Get professional PDF reports
            without watermarks. Cancel anytime.
          </p>

          {/* Primary CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="
              px-8 py-4 text-lg font-semibold rounded-lg text-white
              transition-all transform hover:-translate-y-0.5
              shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              w-full md:w-auto min-w-[280px]
            "
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #0891B2 100%)'
            }}
            aria-label="Upgrade to Coffee tier - $4.95 per month"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              'Upgrade to Coffee - $4.95/month'
            )}
          </button>

          {/* Trust Signal */}
          <p className="mt-4 text-sm text-green-600 font-medium">
            30-day money-back guarantee • Cancel in 10 seconds
          </p>
        </div>
      </section>

      {/* Comparison Section */}
      <ComparisonGrid
        currentTier={{
          icon: '🆓',
          name: 'FREE Plan',
          price: '$0/month',
          limitations: freeLimitations
        }}
        upgradeTier={{
          icon: '☕',
          name: 'COFFEE Plan',
          price: '$4.95/month',
          benefits: coffeeBenefits
        }}
      />

      {/* Zero Risk Section */}
      <ZeroRiskSection />

      {/* Final CTA Section */}
      <section
        className="final-cta-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #0891B2 100%)'
        }}
      >
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Unlock Unlimited Analyses?
          </h2>

          <p className="text-lg text-white/90 mb-8 leading-normal">
            Join the Coffee tier and remove all limits. $4.95/month, cancel anytime.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="
                px-8 py-4 text-lg font-semibold rounded-lg
                bg-white text-blue-900 hover:bg-gray-100
                transition-all transform hover:-translate-y-0.5
                shadow-lg hover:shadow-xl
                disabled:opacity-50 disabled:cursor-not-allowed
                min-w-[240px]
              "
              aria-label="Start Coffee plan now - $4.95 per month"
            >
              {loading ? 'Processing...' : 'Start Coffee Plan Now - $4.95/month'}
            </button>

            <button
              onClick={handleMaybeLater}
              className="
                px-8 py-3 text-base font-medium rounded-lg
                bg-white/10 text-white border border-white/30
                hover:bg-white/20 hover:border-white
                transition-all
                min-w-[240px]
              "
              aria-label="Skip upgrade for now"
            >
              Maybe Later
            </button>
          </div>

          <p className="mt-6 text-sm text-white/80 leading-normal">
            You'll be redirected to secure Stripe checkout.
            Your subscription starts immediately after payment.
          </p>
        </div>
      </section>

      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default UpsellCoffee;
