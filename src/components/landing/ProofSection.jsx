import React from 'react';
import { BookOpen, Award, Monitor } from 'lucide-react';
import { SectionWrapper } from '../ui';

const proofs = [
  {
    icon: <BookOpen className="w-6 h-6 text-signal" />,
    title: 'Published Framework',
    description: 'Our 27-factor methodology is public. You can read the rules before you ever run a scan.',
  },
  {
    icon: <Award className="w-6 h-6 text-clarity" />,
    title: 'Independently Benchmarked',
    description: 'AImpactScanner is evaluated monthly by AISearchArena for diagnostic accuracy.',
  },
  {
    icon: <Monitor className="w-6 h-6 text-mastery" />,
    title: 'Renders JavaScript',
    description: 'We use a Playwright-based browser to see your site exactly as modern AI crawlers do, ensuring accuracy for sites built on Webflow, Framer, or React.',
  },
];

const ProofSection = () => {
  return (
    <SectionWrapper bg="cloud" id="proof">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Verifiable, Not Just Asserted.
        </h2>
        <p className="text-lg text-slate max-w-2xl mx-auto">
          Our analysis is built on a foundation of transparency and proof.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {proofs.map((proof) => (
          <div
            key={proof.title}
            className="bg-white rounded-xl border border-mist p-8 text-center shadow-sm"
          >
            <div className="w-14 h-14 bg-cloud rounded-xl flex items-center justify-center mx-auto mb-5">
              {proof.icon}
            </div>
            <h3 className="text-lg font-bold text-ink mb-3">{proof.title}</h3>
            <p className="text-slate leading-relaxed">{proof.description}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default ProofSection;
