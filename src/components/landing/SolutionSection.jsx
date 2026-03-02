import React from 'react';
import { Search, Wrench, FlaskConical, RefreshCw } from 'lucide-react';
import { SectionWrapper } from '../ui';

const steps = [
  {
    icon: <Search className="w-7 h-7 text-white" />,
    title: 'Diagnose',
    description: 'Scan your page against 27 factors to find exactly what AI models struggle with.',
    bg: 'bg-signal',
  },
  {
    icon: <Wrench className="w-7 h-7 text-white" />,
    title: 'Optimize',
    description: 'Get prioritized recommendations and fix the highest-impact gaps first.',
    bg: 'bg-clarity',
  },
  {
    icon: <FlaskConical className="w-7 h-7 text-white" />,
    title: 'Test',
    description: 'Re-scan to verify your changes improved AI visibility scores.',
    bg: 'bg-mastery',
  },
  {
    icon: <RefreshCw className="w-7 h-7 text-white" />,
    title: 'Repeat',
    description: 'Track progress over time. Each scan builds on the last.',
    bg: 'bg-ink',
  },
];

const SolutionSection = ({ onNavigate }) => {
  return (
    <SectionWrapper bg="white" id="solution">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          A Simple Loop That Drives Real Results
        </h2>
        <p className="text-lg text-slate max-w-2xl mx-auto">
          The Diagnose-Optimize-Test-Repeat loop turns guesswork into measurable progress.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Loop visual */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center relative">
              {/* Connector arrow (hidden on mobile, hidden after last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-3 z-10">
                  <svg className="w-6 h-6 text-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              {/* Step circle */}
              <div className={`w-16 h-16 ${step.bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md`}>
                {step.icon}
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">{step.title}</h3>
              <p className="text-sm text-slate leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Loop-back arrow */}
        <div className="hidden md:flex justify-center mt-6">
          <div className="flex items-center gap-2 text-stone text-sm">
            <RefreshCw className="w-4 h-4" />
            <span>Continuous improvement cycle</span>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => onNavigate('how-it-works')}
          className="text-signal hover:text-signal/80 font-medium transition-colors"
        >
          See how it works in detail →
        </button>
      </div>
    </SectionWrapper>
  );
};

export default SolutionSection;
