import React, { useEffect } from 'react';
import { Search, ScanLine, FileText, ArrowRight } from 'lucide-react';
import AILogo from './AILogo';

const tools = [
  {
    icon: <Search className="w-8 h-8 text-white" />,
    name: 'AISearchArena',
    role: 'Compare',
    description: 'See how AI search tools perform.',
    detail: 'Benchmark AI search engines side-by-side to understand how each discovers, evaluates, and cites web content differently.',
    bg: 'bg-mastery',
    url: 'https://aisearcharena.com',
  },
  {
    icon: <ScanLine className="w-8 h-8 text-white" />,
    name: 'AImpactScanner',
    role: 'Diagnose & Test',
    description: 'Find your AI visibility gaps.',
    detail: 'Scan any page against the 27-factor MASTERY-AI Framework. Get a score, pillar breakdown, and prioritized list of what to fix.',
    bg: 'bg-signal',
    url: null,
  },
  {
    icon: <FileText className="w-8 h-8 text-white" />,
    name: 'LLM.txt Mastery',
    role: 'Optimize',
    description: 'Fix the most common gap.',
    detail: 'Generate and manage llms.txt files that make your content directly accessible to AI language models. Integrated into AImpactScanner Growth tier.',
    bg: 'bg-clarity',
    url: 'https://llmtxtmastery.com',
  },
];

const SuitePage = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'The AI Search Mastery Suite | AImpactScanner';
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
            The AI Search Mastery Suite
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Three tools. One workflow. Complete AI visibility.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <div key={tool.name} className="relative">
              <div className="border border-mist rounded-xl p-6 h-full flex flex-col">
                <div className={`w-14 h-14 ${tool.bg} rounded-xl flex items-center justify-center mb-4`}>
                  {tool.icon}
                </div>
                <div className="text-xs uppercase tracking-wider text-stone font-medium mb-1">{tool.role}</div>
                <h2 className="text-xl font-bold text-ink mb-2">{tool.name}</h2>
                <p className="text-sm font-medium text-signal mb-3">{tool.description}</p>
                <p className="text-sm text-slate leading-relaxed flex-grow">{tool.detail}</p>
                {tool.url ? (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-signal hover:text-signal/80 transition-colors"
                  >
                    Visit {tool.name} <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clarity">
                    You are here
                  </span>
                )}
              </div>

              {/* Arrow connector between cards (hidden on mobile) */}
              {index < tools.length - 1 && (
                <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-stone" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Workflow explanation */}
        <div className="mt-16 bg-cloud rounded-xl border border-mist p-8 text-center">
          <h2 className="text-xl font-bold text-ink mb-3">The Complete Loop</h2>
          <p className="text-slate max-w-2xl mx-auto leading-relaxed">
            Use AImpactScanner to find gaps, LLM.txt Mastery to fix them, then re-scan to prove improvement.
            Growth tier members get all three in one place.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigate('landing')}
              className="px-6 py-3 bg-signal text-white font-semibold rounded-lg hover:bg-signal/90 transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
            >
              Start Your Free Scan
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-6 py-3 border-2 border-signal text-signal font-semibold rounded-lg hover:bg-signal hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-signal focus-visible:outline-offset-2"
            >
              See Growth Tier
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuitePage;
