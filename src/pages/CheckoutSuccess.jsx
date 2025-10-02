// CheckoutSuccess.jsx - Payment success confirmation page
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getPendingAnalysis } from '../utils/authRouting';

const CheckoutSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [tierUpdated, setTierUpdated] = useState(false);
  const [userName, setUserName] = useState('');
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    // Check if user's tier has been updated by webhook
    const checkTierUpdate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }

        // Get user's current tier
        const { data: userData, error } = await supabase
          .from('users')
          .select('tier, email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          setLoading(false);
          return;
        }

        // Extract name from email (before @)
        const name = userData.email?.split('@')[0] || 'there';
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));

        // Check if tier has been updated to coffee
        if (userData.tier === 'coffee') {
          setTierUpdated(true);
        }

        // Determine destination based on pending analysis
        const pendingAnalysis = getPendingAnalysis();
        if (pendingAnalysis?.url) {
          console.log('✅ Has pending analysis, will route to /analyze with pre-filled URL');
          setDestination({
            path: '/analyze',
            url: pendingAnalysis.url,
            id: pendingAnalysis.id
          });
        } else {
          console.log('📊 No pending analysis, will route to /analyze');
          setDestination({
            path: '/analyze',
            url: null,
            id: null
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking tier update:', error);
        setLoading(false);
      }
    };

    checkTierUpdate();

    // If tier not updated immediately, poll for updates (webhook may take a few seconds)
    const pollInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (userData?.tier === 'coffee') {
        setTierUpdated(true);
        clearInterval(pollInterval);
      }
    }, 2000);

    // Clear interval after 30 seconds
    setTimeout(() => clearInterval(pollInterval), 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleContinue = () => {
    // Route to appropriate destination
    if (destination?.url) {
      // Store URL for Analysis page to retrieve
      sessionStorage.setItem('prefilledUrl', destination.url);
      if (destination.id) {
        sessionStorage.setItem('analysisId', destination.id);
      }
      sessionStorage.setItem('analysisSource', 'post_payment');
      window.location.hash = 'input'; // Analysis page
    } else {
      // No pending analysis, go to analysis page
      window.location.hash = 'input';
    }
  };

  if (loading) {
    return (
      <div className="checkout-success-page min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success-page min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-5">
      <div className="container max-w-2xl mx-auto text-center">
        {/* Success Icon with Animation */}
        <div className="mb-8">
          <div
            className="w-24 h-24 mx-auto rounded-full bg-green-500 flex items-center justify-center"
            style={{
              animation: 'successPulse 1s ease-out'
            }}
          >
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 30,
                  animation: 'checkDraw 0.5s ease-out 0.3s forwards'
                }}
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          🎉 Welcome to Coffee Tier!
        </h1>

        <p className="text-xl text-gray-700 mb-8 leading-normal">
          {tierUpdated ? (
            <>
              Thank you for your payment, <span className="font-semibold">{userName}</span>!
              Your account has been upgraded to <span className="font-semibold text-green-600">Coffee tier</span>.
            </>
          ) : (
            <>
              Thank you for your payment, <span className="font-semibold">{userName}</span>!
              Your upgrade is being processed and will be active within a few moments.
            </>
          )}
        </p>

        {/* What's Unlocked Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            ✨ What You've Unlocked
          </h2>

          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="text-green-500 text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">Unlimited AI-powered analyses</h3>
                <p className="text-gray-600 text-sm">Run as many analyses as you need, no limits</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-green-500 text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">10 MASTERY-AI Framework factors</h3>
                <p className="text-gray-600 text-sm">Comprehensive Phase A analysis for AI optimization</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-green-500 text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">Professional PDF reports</h3>
                <p className="text-gray-600 text-sm">Clean, watermark-free reports you can share</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-green-500 text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">Email support</h3>
                <p className="text-gray-600 text-sm">Get help when you need it</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="text-green-500 text-2xl">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900">30-day money-back guarantee</h3>
                <p className="text-gray-600 text-sm">Risk-free trial period</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            🚀 Next Steps
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Head to your dashboard to start analyzing</li>
            <li>Run unlimited analyses on any URL</li>
            <li>Download professional PDF reports</li>
            <li>Reach out if you need any help!</li>
          </ol>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          className="
            px-8 py-4 text-lg font-semibold rounded-lg text-white
            transition-all transform hover:-translate-y-0.5
            shadow-lg hover:shadow-xl
            w-full md:w-auto min-w-[280px]
          "
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          }}
        >
          Go to Dashboard →
        </button>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          Questions? <a href="/#contact" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes successPulse {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkDraw {
          to {
            strokeDashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutSuccess;
