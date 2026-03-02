import React from 'react';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import { SectionWrapper } from '../ui';

const OutputSection = ({ onNavigate }) => {
  return (
    <SectionWrapper bg="cloud" id="output">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Left: Copy */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
            A Clear Score, Not a Black Box.
          </h2>
          <p className="text-lg text-slate mb-8 leading-relaxed">
            Your free scan provides a tangible, actionable report. You get a single
            AI Visibility Score, a breakdown across the 8 pillars of the MASTERY-AI
            framework, and your top 3 most critical gaps to fix.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-signal/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-signal" />
              </div>
              <div>
                <p className="font-semibold text-ink">Overall AI Visibility Score</p>
                <p className="text-sm text-slate">A single number that tells you where you stand.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-clarity/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-clarity" />
              </div>
              <div>
                <p className="font-semibold text-ink">8-Pillar Breakdown</p>
                <p className="text-sm text-slate">See exactly which areas are strong and which need work.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber" />
              </div>
              <div>
                <p className="font-semibold text-ink">Top 3 Gaps to Fix First</p>
                <p className="text-sm text-slate">Prioritized, actionable recommendations you can act on today.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('sample-report')}
            className="mt-8 text-signal hover:text-signal/80 font-medium transition-colors"
          >
            View a full sample report →
          </button>
        </div>

        {/* Right: Sample report preview */}
        <div className="bg-white rounded-2xl shadow-xl border border-mist overflow-hidden">
          {/* Report header */}
          <div className="bg-mastery px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/70 text-xs uppercase tracking-wider">AI Visibility Score</div>
                <div className="text-white font-bold text-sm">example-business.com</div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white">72</div>
                <div className="text-white/70 text-xs">out of 100</div>
              </div>
            </div>
          </div>

          {/* Pillar breakdown preview */}
          <div className="p-6 space-y-3">
            {[
              { name: 'AI Readiness', score: 85, color: 'bg-clarity' },
              { name: 'Authority', score: 78, color: 'bg-signal' },
              { name: 'Machine Readability', score: 62, color: 'bg-amber' },
              { name: 'Semantic Structure', score: 71, color: 'bg-signal' },
              { name: 'Engagement', score: 68, color: 'bg-amber' },
              { name: 'Technical', score: 82, color: 'bg-clarity' },
              { name: 'Reference', score: 55, color: 'bg-red-500' },
              { name: 'Yield', score: 74, color: 'bg-signal' },
            ].map((pillar) => (
              <div key={pillar.name} className="flex items-center gap-3">
                <span className="text-xs text-slate w-32 truncate">{pillar.name}</span>
                <div className="flex-1 bg-mist rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pillar.color}`}
                    style={{ width: `${pillar.score}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-ink w-8 text-right">{pillar.score}</span>
              </div>
            ))}
          </div>

          {/* Top gap preview */}
          <div className="border-t border-mist px-6 py-4">
            <div className="text-xs uppercase tracking-wider text-slate mb-2">Top Gap to Fix</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm font-medium text-ink">Missing structured data markup</span>
            </div>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default OutputSection;
