// WelcomeScale.jsx - Scale tier welcome/onboarding page
import React from 'react';

const WelcomeScale = () => {
  const handleContinueToDashboard = () => {
    window.location.hash = 'dashboard';
  };

  const nextSteps = [
    {
      number: 1,
      title: 'Access Your Dashboard',
      description: 'Run unlimited analyses with all 22 MASTERY-AI factors unlocked',
      action: 'Go to Dashboard',
      onClick: handleContinueToDashboard
    },
    {
      number: 2,
      title: 'Set Up API Access',
      description: 'Generate your API keys and integrate with your workflow',
      action: 'View API Docs',
      onClick: () => alert('API documentation coming soon!')
    },
    {
      number: 3,
      title: 'Contact Your Account Manager',
      description: 'Schedule a call to optimize your AI optimization strategy',
      action: 'Schedule Call',
      onClick: () => alert('Account manager contact coming soon!')
    }
  ];

  const featurePills = [
    'API Access Enabled',
    'White-Label Reports',
    'Team Collaboration',
    'Dedicated Support'
  ];

  return (
    <div className="welcome-scale-page">
      {/* Welcome Hero */}
      <section
        className="welcome-hero py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #EDE9FE 0%, #FFFFFF 100%)'
        }}
      >
        <div className="container max-w-3xl mx-auto">
          {/* Success Icon with Animation */}
          <div className="success-icon mb-8">
            <svg
              className="checkmark mx-auto"
              width="80"
              height="80"
              viewBox="0 0 52 52"
              style={{
                animation: 'fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both'
              }}
            >
              <circle
                className="checkmark-circle"
                cx="26"
                cy="26"
                r="25"
                fill="none"
                style={{
                  stroke: '#059669',
                  strokeWidth: '2',
                  strokeDasharray: '166',
                  strokeDashoffset: '166',
                  animation: 'stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards'
                }}
              />
              <path
                className="checkmark-check"
                fill="none"
                d="M14.1 27.2l7.1 7.2 16.7-16.8"
                style={{
                  stroke: '#059669',
                  strokeWidth: '2',
                  strokeDasharray: '48',
                  strokeDashoffset: '48',
                  animation: 'stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards'
                }}
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Scale Tier! 🎉
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            You now have access to all enterprise features, white-label reports,
            API access, and dedicated support. Let's get you started.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {featurePills.map((pill, index) => (
              <span
                key={index}
                className="inline-block bg-white text-purple-600 font-semibold text-sm px-4 py-2 rounded-full border-2 border-purple-600"
              >
                ✅ {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Next Steps Section */}
      <section className="next-steps-section py-12 px-5 md:py-20 md:px-10 bg-white">
        <div className="container max-w-screen-lg mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Get Started in 3 Steps
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {nextSteps.map((step) => (
              <div
                key={step.number}
                className="
                  step-card bg-white border-2 border-gray-200 rounded-xl p-6 text-center
                  transition-all duration-300 transform hover:-translate-y-1
                  hover:border-purple-400 hover:shadow-xl
                "
              >
                {/* Step Number */}
                <div className="step-number w-14 h-14 bg-purple-600 text-white text-2xl font-bold rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.number}
                </div>

                {/* Step Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>

                {/* Step Description */}
                <p className="text-base text-gray-600 mb-6 leading-normal">
                  {step.description}
                </p>

                {/* Step Action Button */}
                <button
                  onClick={step.onClick}
                  className="
                    w-full px-6 py-3 bg-purple-600 hover:bg-purple-700
                    text-white font-semibold rounded-lg
                    transition-all transform hover:-translate-y-0.5
                  "
                >
                  {step.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section py-12 px-5 md:py-16 md:px-10 bg-purple-50">
        <div className="container max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-8">
            Your Dedicated Support Team
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Manager Card */}
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Dedicated Account Manager
              </h3>
              <p className="text-gray-600 mb-4">
                Your personal point of contact for strategy, optimization advice, and custom solutions.
              </p>
              <button
                onClick={() => alert('Account manager contact coming soon!')}
                className="text-purple-600 hover:text-purple-800 font-semibold underline"
              >
                Schedule Your First Call →
              </button>
            </div>

            {/* Priority Support Card */}
            <div className="bg-white border-2 border-purple-200 rounded-xl p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Priority Support
              </h3>
              <p className="text-gray-600 mb-4">
                Get fast responses from our expert team. Technical questions, feature requests, and troubleshooting.
              </p>
              <button
                onClick={() => alert('Support portal coming soon!')}
                className="text-purple-600 hover:text-purple-800 font-semibold underline"
              >
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="final-cta py-16 px-5 md:py-20 md:px-10 text-center"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
        }}
      >
        <div className="container max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Optimizing?
          </h2>

          <p className="text-lg text-white/90 mb-8">
            Your Scale tier is fully activated. Let's analyze your first site
            and see the power of enterprise-grade AI optimization.
          </p>

          <button
            onClick={handleContinueToDashboard}
            className="
              px-10 py-4 text-lg font-semibold rounded-lg
              bg-white text-purple-900 hover:bg-gray-100
              transition-all transform hover:-translate-y-0.5
              shadow-lg hover:shadow-xl
              min-w-[280px]
            "
          >
            Continue to Dashboard
          </button>
        </div>
      </section>

      {/* CSS for animations */}
      <style>{`
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }

        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 30px #059669;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScale;
