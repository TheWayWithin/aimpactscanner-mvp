// ZeroRiskSection.jsx - ZERO RISK messaging component with guarantees
import React from 'react';

const ZeroRiskSection = () => {
  const guarantees = [
    {
      icon: '💰',
      title: '30-Day Money Back Guarantee',
      description: "Don't like the results? Get every penny back. No questions asked. No hoops to jump through."
    },
    {
      icon: '⚡',
      title: 'Cancel Instantly Anytime',
      description: 'One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.'
    },
    {
      icon: '🏆',
      title: 'Results in 24 Hours or Refund',
      description: 'See dramatic improvements within 24 hours or get a full refund immediately.'
    },
    {
      icon: '🚀',
      title: 'Outperform Competitors or Refund',
      description: 'We find 3x more pages than competitors or you get your money back. Guaranteed.'
    }
  ];

  const credibilitySignals = [
    '✅ Built by Expert Solopreneur',
    '✅ Not VC-Funded BS',
    '✅ Real Results for Real Businesses'
  ];

  return (
    <section className="zero-risk-section py-12 px-5 md:py-20 md:px-10 bg-blue-50">
      <div className="container max-w-screen-xl mx-auto">
        <div className="risk-box bg-white border-4 border-green-500 rounded-2xl p-6 md:p-12 shadow-2xl">
          {/* Main Title */}
          <h2 className="text-center text-2xl md:text-4xl font-extrabold text-gray-900 mb-8 md:mb-10 leading-tight">
            🛡️ ZERO RISK - We Remove ALL Your Fears
          </h2>

          {/* Guarantees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="guarantee-item text-center md:text-left">
                <div className="guarantee-icon text-5xl mb-4">
                  {guarantee.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                  {guarantee.title}
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  {guarantee.description}
                </p>
              </div>
            ))}
          </div>

          {/* Credibility Signals */}
          <div className="credibility-section flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-6 bg-blue-50 rounded-lg mb-6">
            {credibilitySignals.map((signal, index) => (
              <div key={index} className="text-sm md:text-base font-semibold text-gray-800">
                {signal}
              </div>
            ))}
          </div>

          {/* Security Message */}
          <div className="security-message text-center text-sm md:text-base text-gray-700 leading-normal p-4 bg-gray-100 rounded-lg">
            <span className="mr-2">🔒</span>
            <strong>Secure & Private</strong> - Your data is encrypted and never shared.
            We only analyze public content and generate files you control.
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZeroRiskSection;
