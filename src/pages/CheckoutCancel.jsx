// CheckoutCancel.jsx - Payment cancelled page
import React from 'react';

const CheckoutCancel = () => {
  const handleRetry = () => {
    // Go back to upsell page
    window.location.hash = 'upsell-coffee';
  };

  const handleDashboard = () => {
    // Navigate to dashboard
    window.location.hash = 'dashboard';
  };

  return (
    <div className="checkout-cancel-page min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-5">
      <div className="container max-w-2xl mx-auto text-center">
        {/* Cancel Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Cancel Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>

        <p className="text-xl text-gray-700 mb-8 leading-normal">
          No worries! Your payment was not processed. You can try again anytime.
        </p>

        {/* What Happened Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            What Happened?
          </h2>

          <p className="text-gray-700 mb-4">
            You cancelled the checkout process before completing payment. This can happen if:
          </p>

          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>You clicked the "Back" button on the Stripe checkout page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>You closed the checkout window</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>You decided to review the features before upgrading</span>
            </li>
          </ul>

          <p className="text-gray-700 font-medium">
            Your account remains on the <span className="font-bold">Free tier</span> and you can continue using AImpactScanner.
          </p>
        </div>

        {/* Benefits Reminder */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
            Coffee Tier Benefits
          </h2>

          <div className="grid gap-3 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Unlimited</strong> AI-powered analyses</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>27 critical factors</strong> (AI readiness + SEO foundation)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Professional PDF reports</strong> (no watermarks)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>Email support</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span><strong>30-day money-back guarantee</strong></span>
            </div>
          </div>

          <p className="mt-4 text-center text-lg font-bold text-blue-900">
            Only $4.95/month • Cancel anytime
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
          <button
            onClick={handleRetry}
            className="
              px-8 py-4 text-lg font-semibold rounded-lg text-white
              transition-all transform hover:-translate-y-0.5
              shadow-lg hover:shadow-xl
              min-w-[240px]
            "
            style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #0D9488 100%)'
            }}
          >
            Try Again - Upgrade to Coffee
          </button>

          <button
            onClick={handleDashboard}
            className="
              px-8 py-3 text-base font-medium rounded-lg
              bg-gray-200 text-gray-800
              hover:bg-gray-300
              transition-all
              min-w-[240px]
            "
          >
            Continue with Free Tier
          </button>
        </div>

        {/* ZERO RISK Badge */}
        <div className="inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-4 py-2 mb-4">
          <span className="text-green-600 text-lg"></span>
          <span className="text-green-800 font-medium text-sm">
            ZERO RISK • 30-Day Money-Back Guarantee
          </span>
        </div>

        {/* Support Link */}
        <p className="mt-6 text-sm text-gray-500">
          Have questions? <a href="/#contact" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutCancel;
