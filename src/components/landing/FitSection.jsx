import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { SectionWrapper } from '../ui';

const goodFit = [
  'An established solopreneur or small business with 4-20 critical pages.',
  'Willing to spend 2-4 hours per month on focused optimization.',
  'Want to know how ChatGPT, Perplexity, and Gemini see your content.',
  'Looking for a systematic, repeatable process — not a one-time audit.',
];

const notYet = [
  "You have fewer than 3 substantive pages. Focus on content creation first.",
  "You want a full SEO suite — we focus specifically on AI visibility.",
  "You're looking for fully automated optimization. We diagnose; you implement.",
];

const FitSection = () => {
  return (
    <SectionWrapper bg="cloud" id="fit">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Is AImpactScanner Right For You?
        </h2>
        <p className="text-lg text-slate max-w-2xl mx-auto">
          This tool is designed for a specific user. We'd rather be honest upfront.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Good fit */}
        <div className="bg-white rounded-xl border border-mist p-8">
          <h3 className="text-lg font-bold text-ink mb-6">
            This is for you if...
          </h3>
          <ul className="space-y-4">
            {goodFit.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-clarity mt-0.5 flex-shrink-0" />
                <span className="text-slate leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Not yet */}
        <div className="bg-white rounded-xl border border-mist p-8">
          <h3 className="text-lg font-bold text-ink mb-6">
            It's likely too early if...
          </h3>
          <ul className="space-y-4">
            {notYet.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-stone mt-0.5 flex-shrink-0" />
                <span className="text-slate leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default FitSection;
