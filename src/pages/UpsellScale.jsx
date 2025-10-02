// UpsellScale.jsx - Growth/Coffee → Scale tier waitlist page
import React, { useState } from 'react';
import FeatureCard from '../components/FeatureCard';
import WaitlistCTA from '../components/WaitlistCTA';

const UpsellScale = () => {
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

  const handleStayOnCurrentTier = () => {
    window.location.hash = 'dashboard';
  };

  // Scale tier enterprise features
  const scaleFeatures = [
    {
      icon: '🔌',
      title: 'API Access',
      description: 'Automate analyses and integrate with your workflow'
    },
    {
      icon: '🎨',
      title: 'White-Label Reports',
      description: 'Brand PDFs with your logo and colors'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Share analyses across your team'
    },
    {
      icon: '📊',
      title: 'Custom Reporting',
      description: 'Build reports tailored to your clients'
    },
    {
      icon: '🔔',
      title: 'Webhook Integrations',
      description: 'Connect with your existing tools'
    },
    {
      icon: '🎯',
      title: 'Dedicated Support',
      description: 'Priority support with dedicated account manager'
    }
  ];

  return (
    <div className="upsell-scale-page">
      {/* Hero Section */}
      <section
        className="hero-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #EDE9FE 0%, #FFFFFF 100%)'
        }}
      >
        <div className="container max-w-3xl mx-auto">
          {/* Scale Icon */}
          <div className="icon-scale text-7xl mb-6">
            🏢
          </div>

          {/* Coming Soon Badge */}
          <div
            className="inline-block px-6 py-2 bg-purple-600 text-white text-sm font-bold rounded-full mb-6 uppercase"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            Enterprise Tier Coming Soon
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Scale Your Agency with Enterprise Features
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-normal max-w-2xl mx-auto">
            White-label reports, API access, team collaboration, and dedicated support.
            Built for agencies and enterprise teams.
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

      {/* Features Section */}
      <section className="features-section py-12 px-5 md:py-20 md:px-10 bg-white">
        <div className="container max-w-screen-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            What's Coming in Scale Tier
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Enterprise-grade features designed for agencies, consultants, and teams
            who need advanced capabilities and white-label solutions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {scaleFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color="purple"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <WaitlistCTA
        tier="scale"
        onSuccess={handleSuccess}
        onError={handleError}
      />

      {/* Pricing Preview Section */}
      <section className="py-12 px-5 md:py-16 md:px-10 bg-gray-50">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            Scale Tier Pricing
          </h2>

          <div className="bg-white border-2 border-purple-200 rounded-xl p-8 max-w-md mx-auto">
            <div className="text-5xl font-bold text-purple-600 mb-2">
              $99
              <span className="text-xl text-gray-600">/month</span>
            </div>
            <p className="text-gray-600 mb-6">
              Billed monthly. Cancel anytime.
            </p>
            <ul className="text-left space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>All Growth tier features</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>API access with generous limits</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>White-label branding</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>Team collaboration tools</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>Dedicated account manager</span>
              </li>
            </ul>
          </div>

          <p className="mt-6 text-sm text-purple-700 font-medium">
            Early-bird pricing available for waitlist members
          </p>
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="final-cta-section py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
        }}
      >
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready for Enterprise-Grade Features?
          </h2>

          <p className="text-lg text-white/90 mb-8 leading-normal">
            Join the Scale waitlist and be among the first to access advanced
            features built for agencies and teams.
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
                bg-white text-purple-900 hover:bg-gray-100
                transition-all transform hover:-translate-y-0.5
                shadow-lg hover:shadow-xl
                min-w-[240px]
              "
              aria-label="Join Scale waitlist"
            >
              Join Scale Waitlist
            </button>

            <button
              onClick={handleStayOnCurrentTier}
              className="
                px-8 py-3 text-base font-medium rounded-lg
                bg-white/10 text-white border border-white/30
                hover:bg-white/20 hover:border-white
                transition-all
                min-w-[240px]
              "
              aria-label="Stay on current tier"
            >
              Stay on Current Tier
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

export default UpsellScale;
