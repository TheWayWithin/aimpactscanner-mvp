import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AILogo from './AILogo';

const faqs = [
  {
    question: 'Is a 27-factor score actually meaningful, or is it made up?',
    answer: 'The MASTERY-AI Framework is published and open. You can read every factor and how it\'s scored before you ever run a scan. We believe transparency is the foundation of trust.',
  },
  {
    question: 'How is this different from just asking ChatGPT to review my page?',
    answer: 'ChatGPT gives you a subjective, non-repeatable opinion. AImpactScanner gives you a standardized, trackable diagnostic against a fixed framework. You can run it again next month and measure your progress. You can\'t do that with a chat.',
  },
  {
    question: 'Will this work on my Webflow / Framer / React site?',
    answer: 'Yes. We use a Playwright-based browser to fully render your page, including all JavaScript, before we analyze it. We see what AI crawlers see, not a blank page.',
  },
  {
    question: 'What exactly happens after I enter my URL?',
    answer: 'We render your page in a real browser, then analyze it against the 27 factors in the MASTERY-AI Framework. In about 45 seconds, you get a score, an 8-pillar breakdown, and a prioritized list of the top 3 gaps to fix. No credit card required.',
  },
  {
    question: 'Why should I pay when the free scan already gives me a report?',
    answer: 'The free scan gives you your score and top 3 gaps. Paid tiers give you the full 27-factor breakdown, historical tracking to measure progress, PDF exports, and more scans per month. The Growth tier also includes LLM.txt Mastery tools so you can fix common issues and re-scan in one loop.',
  },
  {
    question: 'How is this different from an SEO audit tool?',
    answer: 'Traditional SEO tools measure how Google\'s search crawler sees your site. AImpactScanner measures how AI language models (ChatGPT, Perplexity, Gemini) evaluate your content for inclusion in their answers. These are different systems with different criteria.',
  },
];

const FaqPage = ({ onNavigate }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    document.title = 'FAQ | AImpactScanner';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-mastery border-b border-mastery/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-3">
              <AILogo className="h-10 md:h-12" />
              <div>
                <div className="text-lg font-bold text-white">AImpactScanner</div>
                <div className="text-xs text-white/70">Part of AI Search Mastery</div>
              </div>
            </button>
            <button
              onClick={() => onNavigate('landing')}
              className="text-white/80 hover:text-white text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-mastery to-clarity py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Straight answers to the questions skeptical professionals actually ask.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-mist rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                aria-expanded={expandedIndex === index}
                aria-controls={`faq-answer-${index}`}
                className="w-full flex items-center justify-between p-5 bg-cloud hover:bg-mist/50 transition-colors text-left focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
              >
                <span className="font-semibold text-ink pr-4">{faq.question}</span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-stone flex-shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone flex-shrink-0" aria-hidden="true" />
                )}
              </button>

              {expandedIndex === index && (
                <div id={`faq-answer-${index}`} className="border-t border-mist p-5">
                  <p className="text-slate leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-slate mb-4">Still have questions? Run a free scan and see for yourself.</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-8 py-3 bg-signal text-white font-semibold rounded-lg hover:bg-signal/90 transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
          >
            Scan My Page Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
