// UpsellGrowth.jsx - Coffee  Growth tier waitlist page
import React, { useState } from 'react';
import ComparisonGrid from '../components/ComparisonGrid';
import WaitlistCTA from '../components/WaitlistCTA';

const UpsellGrowth = () => {
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  const handleSuccess = (msg) => {
    setMessage(msg);
    setMessageType('success');
  };

  const handleError = (msg) => {
    setMessage(msg);
    setMessageType('error');
  };

  const handleStayOnCoffee = () => {
    window.location.hash = 'dashboard';
  };

  // Coffee tier features (current)
  const coffeeFeatures = [
    'Unlimited AI-powered analyses per month',
    '10 MASTERY-AI Framework factors (Phase A)',
    'Professional PDF reports (no watermarks)',
    'Email support'
  ];

  // Growth tier features (coming soon)
  const growthFeatures = [
    'All Coffee tier features',
    '22 total MASTERY-AI Framework factors (Phase A + Phase B)',
    'AI Remediation Planner with action steps',
    'Priority support (faster response times)',
    'Advanced analytics and insights',
    'Competitive analysis reports',
    'Historical tracking and trends'
  ];

  return (
    <div className="upsell-growth-page">
      {/* Hero Section */}
      <section
        className="hero-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #D1FAE5 0%, #FFFFFF 100%)'
        }}
      >
        <div className="container max-w-3xl mx-auto">
          {/* Growth Icon */}
          <div className="icon-growth text-7xl mb-6">
            
          </div>

          {/* Coming Soon Badge */}
          <div
            className="inline-block px-6 py-2 bg-green-500 text-white text-sm font-bold rounded-full mb-6 uppercase"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            Coming Soon
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Ready to Scale Your AI Optimization?
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-normal max-w-2xl mx-auto">
            Growth tier brings 22 total factors, AI Remediation Planner,
            and priority support. Join the waitlist for early access.
          </p>
        </div>
      </section>

      {/* Message Display */}
      {message && (
        <div className={`
          py-4 px-5 text-center font-medium
          ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
        `}>
          {message}
        </div>
      )}

      {/* Comparison Section */}
      <ComparisonGrid
        currentTier={{
          icon: '',
          name: 'COFFEE Plan (Current)',
          price: '$4.95/month'
        }}
        upgradeTier={{
          icon: '',
          name: 'GROWTH Plan (Coming Soon)',
          price: '$29/month',
          benefits: growthFeatures
        }}
        benefits={coffeeFeatures}
      />

      {/* Waitlist CTA */}
      <WaitlistCTA
        tier="growth"
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Final CTA Section */}
      <section
        className="final-cta-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        }}
      >
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Want to Be First in Line?
          </h2>

          <p className="text-lg text-white/90 mb-8 leading-normal">
            Join the Growth waitlist today and get notified the moment we launch.
            Plus, lock in special early-bird pricing!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                // Scroll to waitlist section
                const waitlistSection = document.querySelector('.waitlist-cta-section');
                if (waitlistSection) {
                  waitlistSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="
                px-8 py-4 text-lg font-semibold rounded-lg
                bg-white text-green-900 hover:bg-gray-100
                transition-all transform hover:-translate-y-0.5
                shadow-lg hover:shadow-xl
                min-w-[240px]
              "
              aria-label="Reserve your spot on Growth waitlist"
            >
              Reserve Your Spot
            </button>

            <button
              onClick={handleStayOnCoffee}
              className="
                px-8 py-3 text-base font-medium rounded-lg
                bg-white/10 text-white border border-white/30
                hover:bg-white/20 hover:border-white
                transition-all
                min-w-[240px]
              "
              aria-label="Stay on Coffee tier"
            >
              Stay on Coffee
            </button>
          </div>
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

export default UpsellGrowth;
