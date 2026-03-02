import React from 'react';
import { CheckCircle, Shield, DollarSign, Zap } from 'lucide-react';
import { SectionWrapper } from '../ui';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try it risk-free',
    features: [
      '3 scans per month',
      'Overall AI Visibility Score',
      'Top 3 gaps to fix',
      'Basic recommendations',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Solo',
    price: '$9.95',
    period: '/month',
    description: 'For focused solopreneurs',
    features: [
      '10 scans per month',
      'Full 27-factor breakdown',
      'PDF report exports',
      'Historical tracking',
      'Priority recommendations',
    ],
    cta: 'Start Solo',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$19.95',
    period: '/month',
    description: 'Full optimization loop',
    badge: 'Most Popular',
    features: [
      '40 scans per month',
      'Everything in Solo',
      'LLM.txt Mastery included',
      'Remediation Planner',
      'Competitive benchmarking',
      'Priority support',
    ],
    cta: 'Start Growth',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$39.95',
    period: '/month',
    description: 'For teams & agencies',
    features: [
      '100 scans per month',
      'Everything in Growth',
      'API access & webhooks',
      'White-label reports',
      'Team collaboration',
    ],
    cta: 'Start Scale',
    highlighted: false,
  },
];

const guarantees = [
  {
    icon: <Zap className="w-5 h-5 text-signal" />,
    text: '3 Gaps Guarantee — we find at least 3 actionable improvements or refund',
  },
  {
    icon: <DollarSign className="w-5 h-5 text-clarity" />,
    text: '30-day money-back guarantee — no questions asked',
  },
  {
    icon: <Shield className="w-5 h-5 text-mastery" />,
    text: 'Free tier available forever — no credit card required',
  },
];

const PriceSection = ({ onNavigate }) => {
  return (
    <SectionWrapper bg="white" id="price">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Simple, Honest Pricing
        </h2>
        <p className="text-lg text-slate max-w-2xl mx-auto">
          Start free. Upgrade when you're ready. No surprises.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border-2 p-8 ${
              tier.highlighted
                ? 'border-signal bg-signal/5 shadow-lg scale-[1.02]'
                : 'border-mist bg-white'
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-signal text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {tier.badge}
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-ink">{tier.name}</h3>
              <p className="text-sm text-slate mt-1">{tier.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-ink">{tier.price}</span>
                <span className="text-slate">{tier.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-clarity mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-ink">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onNavigate('pricing')}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                tier.highlighted
                  ? 'bg-signal text-white hover:bg-signal/90'
                  : 'bg-cloud text-ink hover:bg-mist border border-mist'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Risk reversals */}
      <div className="max-w-3xl mx-auto bg-cloud rounded-xl border border-mist p-6">
        <div className="text-center mb-4">
          <h3 className="font-semibold text-ink">Risk-Free Guarantee</h3>
        </div>
        <div className="space-y-3">
          {guarantees.map((g) => (
            <div key={g.text} className="flex items-center gap-3">
              {g.icon}
              <span className="text-sm text-slate">{g.text}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default PriceSection;
