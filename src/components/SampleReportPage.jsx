import React, { useEffect } from 'react';
import { BarChart3, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import AILogo from './AILogo';

const samplePillars = [
  { key: 'AI', name: 'AI Response Optimization', score: 68, weight: '23.8%' },
  { key: 'A', name: 'Authority & Trust Signals', score: 75, weight: '17.9%' },
  { key: 'M', name: 'Machine Readability', score: 82, weight: '14.6%' },
  { key: 'S', name: 'Semantic Content Quality', score: 71, weight: '13.9%' },
  { key: 'E', name: 'Engagement & UX', score: 65, weight: '10.9%' },
  { key: 'T', name: 'Technical SEO', score: 88, weight: '8.9%' },
  { key: 'R', name: 'Reference Networks', score: 55, weight: '5.9%' },
  { key: 'Y', name: 'Yield & Freshness', score: 60, weight: '4.1%' },
];

const topGaps = [
  {
    pillar: 'Reference Networks',
    factor: 'Outbound Citation Quality',
    issue: 'Page contains no outbound links to authoritative sources that validate claims.',
    fix: 'Add 3-5 links to authoritative sources (research papers, industry standards, official documentation) that support your key claims.',
  },
  {
    pillar: 'Yield & Freshness',
    factor: 'Content Freshness',
    issue: 'No visible "last updated" date. Content may appear stale to AI models.',
    fix: 'Add a visible "Last updated: [date]" element. Review and update content quarterly.',
  },
  {
    pillar: 'Engagement & UX',
    factor: 'Interactive Elements',
    issue: 'No clear CTAs or interactive engagement mechanisms detected.',
    fix: 'Add 1-2 clear calls-to-action above the fold. Consider adding a calculator, quiz, or interactive tool.',
  },
];

const overallScore = 72;

const getScoreColor = (score) => {
  if (score >= 80) return 'text-clarity';
  if (score >= 60) return 'text-amber';
  return 'text-red-500';
};

const getBarColor = (score) => {
  if (score >= 80) return 'bg-clarity';
  if (score >= 60) return 'bg-amber';
  return 'bg-red-500';
};

const SampleReportPage = ({ onNavigate }) => {
  useEffect(() => {
    document.title = 'Sample Scan Report | AImpactScanner';
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
            Sample Scan Report
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            This is what your free scan delivers. A clear score, an 8-pillar breakdown, and your top 3 gaps to fix first.
          </p>
        </div>
      </section>

      {/* Sample Report */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        {/* Report header */}
        <div className="bg-cloud rounded-xl border border-mist p-6 mb-8">
          <div className="flex items-center gap-2 text-xs text-stone mb-3">
            <BarChart3 className="w-4 h-4" />
            <span>SAMPLE REPORT</span>
            <span className="mx-1">|</span>
            <span>example-business.com</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Overall score */}
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}</div>
              <div className="text-sm text-stone mt-1">AI Visibility Score</div>
              <div className="text-xs text-amber font-medium mt-1">Good - Room for Optimization</div>
            </div>

            {/* Pillar bars */}
            <div className="flex-1 w-full space-y-2">
              {samplePillars.map((pillar) => (
                <div key={pillar.key} className="flex items-center gap-3">
                  <span className="w-6 text-xs font-bold text-ink text-center">{pillar.key}</span>
                  <div className="flex-1 bg-mist rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getBarColor(pillar.score)}`}
                      style={{ width: `${pillar.score}%` }}
                    />
                  </div>
                  <span className={`w-8 text-xs font-semibold text-right ${getScoreColor(pillar.score)}`}>
                    {pillar.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Gaps */}
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber" />
          Top 3 Gaps to Fix First
        </h2>
        <div className="space-y-4 mb-12">
          {topGaps.map((gap, index) => (
            <div key={index} className="border border-mist rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-amber/10 text-amber rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-ink">{gap.pillar}: {gap.factor}</div>
                  <p className="text-sm text-slate mt-1">{gap.issue}</p>
                  <div className="mt-3 bg-cloud rounded-lg p-3 border border-mist">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-clarity mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs uppercase tracking-wider text-stone mb-1">Recommended Fix</div>
                        <p className="text-sm text-ink">{gap.fix}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What paid tiers add */}
        <div className="bg-cloud rounded-xl border border-mist p-6 mb-12">
          <h3 className="font-semibold text-ink mb-3">What paid tiers add to this report</h3>
          <ul className="space-y-2 text-sm text-slate">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
              <span><strong className="text-ink">Full 27-factor breakdown</strong> - See scores for every individual factor, not just the 8 pillars</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
              <span><strong className="text-ink">Historical tracking</strong> - Compare scans over time to measure the impact of your changes</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
              <span><strong className="text-ink">PDF exports</strong> - Share branded reports with clients or stakeholders</span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-signal mt-0.5 flex-shrink-0" />
              <span><strong className="text-ink">LLM.txt Mastery tools</strong> (Growth tier) - Fix the most common gap and re-scan in one workflow</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-mastery to-clarity rounded-2xl p-10">
          <h2 className="text-2xl font-bold text-white mb-3">See your own report</h2>
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

export default SampleReportPage;
