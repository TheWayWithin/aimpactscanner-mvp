import React, { useEffect } from 'react';
import { ScanLine, FileText, Wrench, PenTool, BarChart3, ArrowRight } from 'lucide-react';
import AILogo from './AILogo';

const tools = [
  {
    step: 1,
    icon: <ScanLine className="w-8 h-8 text-white" />,
    name: 'AImpactScanner',
    role: 'Diagnose',
    description: 'Find your AI visibility gaps.',
    detail: 'Scan any page against the 27-factor MASTERY-AI Framework. Get a score, pillar breakdown, and prioritized list of what to fix.',
    bg: 'bg-signal',
    url: null,
    comingSoon: false,
  },
  {
    step: 2,
    icon: <FileText className="w-8 h-8 text-white" />,
    name: 'LLM.txt Mastery',
    role: 'Optimize',
    description: 'Make your content AI-accessible.',
    detail: 'Generate quality-scored llms.txt files that address the gaps AImpactScanner identified. Discovers JS-rendered pages other tools miss.',
    bg: 'bg-clarity',
    url: 'https://llmtxtmastery.com',
    comingSoon: false,
  },
  {
    step: 2,
    icon: <Wrench className="w-8 h-8 text-white" />,
    name: 'AImpactBooster',
    role: 'Remediate',
    description: 'Fix what the scan found.',
    detail: 'Guided remediation workflows that turn your AImpactScanner findings into concrete fixes. Prioritized actions, implementation guides, and before/after validation.',
    bg: 'bg-mastery',
    url: null,
    comingSoon: true,
  },
  {
    step: 2,
    icon: <PenTool className="w-8 h-8 text-white" />,
    name: 'AImpactContent',
    role: 'Create',
    description: 'Content built for AI discovery.',
    detail: 'Create and optimize content specifically designed to be discovered, understood, and recommended by AI search engines.',
    bg: 'bg-mastery',
    url: null,
    comingSoon: true,
  },
  {
    step: 3,
    icon: <BarChart3 className="w-8 h-8 text-white" />,
    name: 'AImpactMonitor',
    role: 'Monitor',
    description: 'Track your AI visibility over time.',
    detail: 'See how your optimizations impact your scores across AI search engines. Continuous monitoring with alerts when visibility changes.',
    bg: 'bg-clarity',
    url: null,
    comingSoon: true,
  },
];

const ToolCard = ({ tool, onNavigate }) => (
  <div className="border border-mist rounded-xl p-6 h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-14 h-14 ${tool.bg} rounded-xl flex items-center justify-center`}>
        {tool.icon}
      </div>
      {tool.comingSoon && (
        <span className="text-xs font-semibold text-clarity bg-clarity/10 px-2.5 py-1 rounded-full">
          Coming Soon
        </span>
      )}
    </div>
    <div className="text-xs uppercase tracking-wider text-stone font-medium mb-1">{tool.role}</div>
    <h3 className="text-xl font-bold text-ink mb-2">{tool.name}</h3>
    <p className="text-sm font-medium text-signal mb-3">{tool.description}</p>
    <p className="text-sm text-slate leading-relaxed flex-grow">{tool.detail}</p>
    {tool.comingSoon ? null : tool.url ? (
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-signal hover:text-signal/80 transition-colors"
      >
        Try free <ArrowRight className="w-4 h-4" />
      </a>
    ) : (
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-clarity">
        You're here
      </span>
    )}
  </div>
);

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
            One account. One dashboard. Full AI search optimization with integrated mission control.
          </p>
        </div>
      </section>

      {/* Tools */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        {/* Step 1: Diagnose */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 bg-signal text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <h2 className="text-lg font-bold text-ink">Diagnose</h2>
          </div>
          <div className="grid md:grid-cols-1 max-w-md">
            {tools.filter(t => t.step === 1).map((tool) => (
              <ToolCard key={tool.name} tool={tool} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* Arrow between steps */}
        <div className="flex justify-start ml-3.5 mb-6">
          <ArrowRight className="w-6 h-6 text-stone rotate-90" />
        </div>

        {/* Step 2: Optimize & Remediate */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 bg-clarity text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <h2 className="text-lg font-bold text-ink">Optimize & Remediate</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {tools.filter(t => t.step === 2).map((tool) => (
              <ToolCard key={tool.name} tool={tool} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* Arrow between steps */}
        <div className="flex justify-start ml-3.5 mb-6">
          <ArrowRight className="w-6 h-6 text-stone rotate-90" />
        </div>

        {/* Step 3: Monitor */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 bg-mastery text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <h2 className="text-lg font-bold text-ink">Monitor</h2>
          </div>
          <div className="grid md:grid-cols-1 max-w-md">
            {tools.filter(t => t.step === 3).map((tool) => (
              <ToolCard key={tool.name} tool={tool} onNavigate={onNavigate} />
            ))}
          </div>
        </div>

        {/* Value prop */}
        <div className="bg-cloud rounded-xl border border-mist p-8 text-center">
          <h2 className="text-xl font-bold text-ink mb-3">Integrated Mission Control</h2>
          <p className="text-slate max-w-2xl mx-auto leading-relaxed">
            Diagnose with AImpactScanner, optimize and remediate with purpose-built tools, then monitor your progress over time.
            One AI Search Mastery account gives you access to every tool from a single dashboard.
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
              See Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SuitePage;
