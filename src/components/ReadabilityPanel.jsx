import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';

const IMPACT_CONFIG = {
  high: { label: 'High', badge: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', badge: 'bg-green-100 text-green-700' },
};

function scoreColor(score) {
  if (score >= 80) return { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700', text: 'text-green-700' };
  if (score >= 60) return { bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' };
  return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'text-red-700' };
}

function ReadabilityPanel({ readability }) {
  if (!readability) return null;

  const { overall_score, factors = [], top_improvements = [] } = readability;
  const overallColors = scoreColor(overall_score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-signal" />
          <h2 className="text-lg font-bold text-ink">AI Readability Score</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-ink">{Math.round(overall_score)}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${overallColors.badge}`}>
            / 100
          </span>
        </div>
      </div>

      {/* Factor breakdown */}
      {factors.length > 0 && (
        <div className="rounded-xl border border-mist shadow-sm bg-white p-4">
          <h3 className="text-sm font-semibold text-ink mb-4">Factor Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {factors.map((factor) => {
              const colors = scoreColor(factor.score);
              return (
                <div key={factor.key || factor.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink font-medium truncate mr-2">{factor.name}</span>
                    <span className={`text-sm font-semibold ${colors.text} tabular-nums`}>
                      {Math.round(factor.score)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cloud rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, factor.score))}%` }}
                    />
                  </div>
                  {factor.description && (
                    <p className="text-xs text-slate leading-relaxed">{factor.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top improvements */}
      {top_improvements.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">Top Improvements</h3>
          {top_improvements.slice(0, 3).map((improvement, index) => {
            const impact = (improvement.impact || 'medium').toLowerCase();
            const config = IMPACT_CONFIG[impact] || IMPACT_CONFIG.medium;

            return (
              <div
                key={index}
                className="rounded-xl border border-mist shadow-sm bg-white overflow-hidden"
              >
                <div className="p-4 space-y-3">
                  {/* Impact badge + factor */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.badge}`}>
                      {config.label} Impact
                    </span>
                    {improvement.factor && (
                      <span className="text-xs font-medium bg-mastery/10 text-mastery px-2 py-0.5 rounded">
                        {improvement.factor}
                      </span>
                    )}
                  </div>

                  {/* Issue */}
                  {improvement.issue && (
                    <p className="text-sm text-ink font-medium">{improvement.issue}</p>
                  )}

                  {/* Before / After */}
                  {(improvement.original || improvement.suggestion) && (
                    <div className="space-y-2">
                      {improvement.original && (
                        <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                          <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Before</span>
                          <p className="text-sm text-red-800 mt-1">{improvement.original}</p>
                        </div>
                      )}
                      {improvement.original && improvement.suggestion && (
                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate" />
                        </div>
                      )}
                      {improvement.suggestion && (
                        <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                          <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">After</span>
                          <p className="text-sm text-green-800 mt-1">{improvement.suggestion}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReadabilityPanel;
