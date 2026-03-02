import React from 'react';
import { EyeOff, Quote, UserX } from 'lucide-react';
import { SectionWrapper } from '../ui';

const gaps = [
  {
    icon: <EyeOff className="w-8 h-8 text-signal" />,
    title: 'Not Found',
    description: "The AI model can't access or properly parse your page.",
    color: 'border-signal/30 bg-signal/5',
  },
  {
    icon: <Quote className="w-8 h-8 text-amber" />,
    title: 'Not Cited',
    description: 'The model can read your page but sees no reason to trust or reference it.',
    color: 'border-amber/30 bg-amber/5',
  },
  {
    icon: <UserX className="w-8 h-8 text-red-500" />,
    title: 'Not Chosen',
    description: "The model understands your page but prefers a competitor's clearer, more authoritative content.",
    color: 'border-red-300 bg-red-50',
  },
];

const ProblemSection = () => {
  return (
    <SectionWrapper bg="cloud" id="problem">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          If You're Invisible to AI, You're Invisible to Customers.
        </h2>
        <p className="text-lg text-slate max-w-3xl mx-auto leading-relaxed">
          When people ask ChatGPT, Perplexity, or Google for help, those answers either
          reference your business or they don't. AImpactScanner shows you why you might
          be ignored, diagnosing the three most common visibility gaps:
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {gaps.map((gap) => (
          <div
            key={gap.title}
            className={`rounded-xl border-2 p-8 text-center ${gap.color}`}
          >
            <div className="flex justify-center mb-4">
              {gap.icon}
            </div>
            <h3 className="text-xl font-bold text-ink mb-3">{gap.title}</h3>
            <p className="text-slate leading-relaxed">{gap.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default ProblemSection;
