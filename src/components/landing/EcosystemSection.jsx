import React from 'react';
import { Search, FileText, BarChart3, ArrowRight } from 'lucide-react';
import { SectionWrapper } from '../ui';

const steps = [
  {
    label: 'Diagnose',
    tool: 'AImpactScanner',
    description: 'Find out how AI search engines see your website. Get a 27-factor visibility score with prioritized gaps to fix.',
    icon: Search,
    href: null, // current site
    color: 'bg-signal/10 text-signal',
  },
  {
    label: 'Optimize',
    tool: 'LLM.txt Mastery',
    description: 'Generate quality-scored llms.txt files that address the gaps AImpactScanner identified. Discovers JS-rendered pages other tools miss.',
    icon: FileText,
    href: 'https://llmtxtmastery.com',
    color: 'bg-clarity/10 text-clarity',
  },
  {
    label: 'Monitor',
    tool: 'AImpactMonitor',
    description: 'Track your AI visibility progress over time. See how optimizations impact your scores across AI search engines.',
    icon: BarChart3,
    href: null, // coming soon
    comingSoon: true,
    color: 'bg-amber/10 text-amber-600',
  },
];

const EcosystemSection = () => {
  return (
    <SectionWrapper bg="white" id="ecosystem">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold text-signal uppercase tracking-wide mb-2">
          The AI Search Mastery Ecosystem
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Diagnose &rarr; Optimize &rarr; Monitor
        </h2>
        <p className="text-lg text-slate max-w-2xl mx-auto">
          Three tools that work together to improve how AI search engines understand and recommend your content.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {steps.map((step, i) => (
          <div key={step.label} className="relative">
            {i < steps.length - 1 && (
              <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 text-gray-300 z-10" />
            )}
            <div className="bg-cloud rounded-xl p-6 h-full border border-gray-100">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${step.color}`}>
                <step.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate uppercase tracking-wide mb-1">
                Step {i + 1}: {step.label}
              </p>
              <h3 className="text-lg font-bold text-ink mb-2">
                {step.tool}
                {step.comingSoon && (
                  <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </h3>
              <p className="text-sm text-slate mb-4">{step.description}</p>
              {step.href && (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-signal hover:text-signal/80 transition-colors"
                >
                  Try free <ArrowRight className="w-3.5 h-3.5" />
                </a>
              )}
              {!step.href && !step.comingSoon && (
                <span className="text-sm font-medium text-signal">You're here</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default EcosystemSection;
