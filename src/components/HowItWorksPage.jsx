import React, { useEffect } from 'react';
import { Search, Wrench, FlaskConical, RefreshCw, Globe, FileText, BarChart3, CheckCircle } from 'lucide-react';
import AILogo from './AILogo';

const phases = [
  {
    step: 1,
    icon: <Search className="w-8 h-8 text-white" aria-hidden="true" />,
    title: 'Diagnose',
    subtitle: 'Understand where you stand',
    bg: 'bg-signal',
    description: 'Enter your URL. Our Playwright-based browser renders your page exactly as AI crawlers see it, then analyzes it against all 27 factors of the MASTERY-AI Framework.',
    output: 'AI Visibility Score + 8-pillar breakdown + Top 3 gaps',
    details: [
      'Full JavaScript rendering (works with React, Webflow, Framer)',
      'Analysis against published 27-factor framework',
      'Prioritized list of what to fix first',
    ],
  },
  {
    step: 2,
    icon: <Wrench className="w-8 h-8 text-white" aria-hidden="true" />,
    title: 'Optimize',
    subtitle: 'Fix what matters most',
    bg: 'bg-clarity',
    description: 'Use your prioritized recommendations to fix the highest-impact gaps. Growth tier users get LLM.txt Mastery integration to generate optimized AI-accessibility files automatically.',
    output: 'Targeted fixes based on your specific gaps',
    details: [
      'Actionable recommendations for each factor',
      'Priority order based on score impact',
      'LLM.txt Mastery tools for Growth tier users',
    ],
  },
  {
    step: 3,
    icon: <FlaskConical className="w-8 h-8 text-white" aria-hidden="true" />,
    title: 'Test',
    subtitle: 'Verify your improvements',
    bg: 'bg-mastery',
    description: 'Re-scan your page after making changes. Compare your new scores to the previous baseline. See exactly which factors improved and by how much.',
    output: 'Before/after comparison + score delta',
    details: [
      'Instant re-scan to verify changes',
      'Historical tracking shows progress over time',
      'Score changes per pillar and factor',
    ],
  },
  {
    step: 4,
    icon: <RefreshCw className="w-8 h-8 text-white" aria-hidden="true" />,
    title: 'Repeat',
    subtitle: 'Continuous improvement',
    bg: 'bg-ink',
    description: 'AI search evolves constantly. Regular scanning ensures you stay visible as models update their criteria. Each scan builds on the last, creating a continuous improvement cycle.',
    output: 'Ongoing visibility monitoring',
    details: [
      'Track trends across multiple scans',
      'Catch regressions before they impact visibility',
      'Stay ahead as AI search criteria evolve',
    ],
  },
];

const HowItWorksPage = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'How It Works | AImpactScanner';
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
            How AImpactScanner Works
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            The Diagnose-Optimize-Test-Repeat loop turns guesswork into measurable progress.
          </p>
        </div>
      </section>

      {/* Phases */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-12">
          {phases.map((phase, index) => (
            <div key={phase.step} className="flex flex-col md:flex-row gap-8 items-start">
              {/* Step indicator */}
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 ${phase.bg} rounded-2xl flex items-center justify-center shadow-lg`}>
                  {phase.icon}
                </div>
                {index < phases.length - 1 && (
                  <div className="hidden md:block w-0.5 h-12 bg-mist ml-8 mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-sm font-medium text-stone uppercase tracking-wider">Step {phase.step}</span>
                  <h2 className="text-2xl font-bold text-ink">{phase.title}</h2>
                </div>
                <p className="text-sm text-signal font-medium mb-3">{phase.subtitle}</p>
                <p className="text-slate mb-4 leading-relaxed">{phase.description}</p>

                <div className="bg-cloud rounded-lg border border-mist p-4 mb-4">
                  <div className="text-xs uppercase tracking-wider text-stone mb-2">Output</div>
                  <div className="text-sm font-medium text-ink">{phase.output}</div>
                </div>

                <ul className="space-y-2">
                  {phase.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-clarity mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 bg-gradient-to-br from-mastery to-clarity rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">Start your first scan</h2>
          <p className="text-white/70 mb-6">Free. No email. No credit card. Results in 60 seconds.</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-8 py-3 bg-signal text-white font-semibold rounded-lg hover:bg-signal/90 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            Scan My Page Free
          </button>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
