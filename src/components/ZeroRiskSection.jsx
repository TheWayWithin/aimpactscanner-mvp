// ZeroRiskSection.jsx - ZERO RISK messaging component with guarantees
import React from 'react';
import { DollarSign, Zap, Trophy, Rocket, Shield, Lock, CheckCircle } from 'lucide-react';

const ZeroRiskSection = () => {
  const guarantees = [
    {
      icon: <DollarSign className="w-10 h-10 text-clarity" />,
      title: '30-Day Money Back Guarantee',
      description: "Don't like the results? Get every penny back. No questions asked. No hoops to jump through."
    },
    {
      icon: <Zap className="w-10 h-10 text-amber" />,
      title: 'Cancel Instantly Anytime',
      description: 'One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.'
    },
    {
      icon: <Trophy className="w-10 h-10 text-signal" />,
      title: 'Results in 24 Hours or Refund',
      description: 'See dramatic improvements within 24 hours or get a full refund immediately.'
    },
    {
      icon: <Rocket className="w-10 h-10 text-mastery" />,
      title: 'Outperform Competitors or Refund',
      description: 'We find 3x more pages than competitors or you get your money back. Guaranteed.'
    }
  ];

  const credibilitySignals = [
    { text: 'Built by Expert Solopreneur' },
    { text: 'Not VC-Funded BS' },
    { text: 'Real Results for Real Businesses' }
  ];

  return (
    <section className="zero-risk-section py-12 px-5 md:py-20 md:px-10 bg-blue-50">
      <div className="container max-w-screen-xl mx-auto">
        <div className="risk-box bg-white border-4 border-green-500 rounded-2xl p-6 md:p-12 shadow-2xl">
          {/* Main Title */}
          <h2 className="text-center text-2xl md:text-4xl font-extrabold text-gray-900 mb-8 md:mb-10 leading-tight flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-success" /> ZERO RISK - We Remove ALL Your Fears
          </h2>

          {/* Guarantees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="guarantee-item text-center md:text-left">
                <div className="guarantee-icon mb-4">
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
              <div key={index} className="flex items-center gap-2 text-sm md:text-base font-semibold text-gray-800">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                {signal.text}
              </div>
            ))}
          </div>

          {/* Security Message */}
          <div className="security-message text-center text-sm md:text-base text-gray-700 leading-normal p-4 bg-gray-100 rounded-lg">
            <Lock className="w-4 h-4 inline-block mr-2 text-slate" />
            <strong>Secure & Private</strong> - Your data is encrypted and never shared.
            We only analyze public content and generate files you control.
          </div>
        </div>
      </div>
    </section>
  );
};

export default ZeroRiskSection;
