import React, { useState, useCallback } from 'react';
import { GitCompare, TrendingUp, TrendingDown, ArrowUpRight, Loader2, Lock, AlertCircle } from 'lucide-react';
import { hasFeatureAccess } from '../lib/tierUtils';

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL || 'https://aimpactscanner-backend-production.up.railway.app';

/**
 * CompetitorComparisonPanel
 *
 * Allows Growth+ users to compare their AI-readiness scan against a competitor URL.
 * Manages its own state for URL inputs, loading, and comparison results.
 */
export default function CompetitorComparisonPanel({ comparisonData: initialData, userTier, onNavigate }) {
  const [userUrl, setUserUrl] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(initialData || null);

  const canCompare = hasFeatureAccess(userTier, 'competitive_benchmarking') ||
    ['growth', 'professional', 'scale', 'enterprise'].includes(userTier);

  const handleCompare = useCallback(async () => {
    if (!userUrl.trim() || !competitorUrl.trim()) {
      setError('Both URLs are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const token = (await (await import('../lib/supabaseClient')).supabase.auth.getSession()).data?.session?.access_token;

      const response = await fetch(`${RAILWAY_API_URL}/api/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ url: userUrl.trim(), competitor_url: competitorUrl.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Comparison failed. Please try again.');
        return;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userUrl, competitorUrl]);

  // --- Locked teaser for non-Growth users ---
  if (!canCompare) {
    return (
      <div className="rounded-xl border border-mist shadow-sm bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">Competitive Benchmarking</h2>
        </div>

        <div className="relative">
          {/* Blurred placeholder */}
          <div className="filter blur-sm select-none pointer-events-none opacity-60">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg bg-cloud p-4 text-center">
                <p className="text-sm text-slate">Your Score</p>
                <p className="text-3xl font-bold text-ink">72</p>
              </div>
              <div className="rounded-lg bg-cloud p-4 text-center">
                <p className="text-sm text-slate">Competitor</p>
                <p className="text-3xl font-bold text-ink">68</p>
              </div>
            </div>
            <div className="space-y-2">
              {['Factor A', 'Factor B', 'Factor C'].map((f) => (
                <div key={f} className="flex justify-between rounded bg-cloud px-3 py-2">
                  <span className="text-sm text-slate">{f}</span>
                  <span className="text-sm font-medium text-green-600">+5</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 rounded-xl">
            <Lock className="w-8 h-8 text-signal mb-3" />
            <p className="text-ink font-semibold text-center mb-1">Unlock Competitive Benchmarking</p>
            <p className="text-sm text-slate text-center mb-4">Growth plan ($19.95/mo)</p>
            <button
              onClick={() => onNavigate?.('pricing')}
              className="px-5 py-2 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main panel for Growth+ users ---
  return (
    <div className="rounded-xl border border-mist shadow-sm bg-white">
      {/* Header */}
      <div className="p-6 border-b border-mist">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-signal" />
          <h2 className="text-lg font-semibold text-ink">Competitive Benchmarking</h2>
        </div>

        {/* Input section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Your URL</label>
            <input
              type="url"
              value={userUrl}
              onChange={(e) => setUserUrl(e.target.value)}
              placeholder="https://yoursite.com"
              disabled={loading}
              className="w-full rounded-lg border border-mist px-3 py-2 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate mb-1">Competitor URL</label>
            <input
              type="url"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="https://competitor.com"
              disabled={loading}
              className="w-full rounded-lg border border-mist px-3 py-2 text-sm text-ink placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-signal/30 focus:border-signal disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleCompare}
            disabled={loading || !userUrl.trim() || !competitorUrl.trim()}
            className="px-5 py-2 rounded-lg bg-signal text-white font-medium hover:bg-signal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                Compare
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-signal mb-3" />
          <p className="text-ink font-medium">Analyzing both sites...</p>
          <p className="text-sm text-slate mt-1">This may take up to 30 seconds</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="p-6 space-y-6">
          {/* Score comparison header */}
          <ScoreHeader
            userScore={data.user.overall_score}
            userGrade={data.user.grade}
            userUrl={data.user.url}
            competitorScore={data.competitor.overall_score}
            competitorGrade={data.competitor.grade}
            competitorUrl={data.competitor.url}
            delta={data.comparison.score_delta}
          />

          {/* Pillar comparison */}
          <PillarComparison pillarDeltas={data.comparison.pillar_deltas} />

          {/* Factor comparison table */}
          <FactorTable factorDeltas={data.comparison.factor_deltas} />

          {/* Close the gap recommendations */}
          {data.comparison.recommendations.length > 0 && (
            <Recommendations recommendations={data.comparison.recommendations} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function ScoreHeader({ userScore, userGrade, userUrl, competitorScore, competitorGrade, competitorUrl, delta }) {
  const deltaColor = delta > 0 ? 'text-green-600 bg-green-50' : delta < 0 ? 'text-red-600 bg-red-50' : 'text-slate bg-cloud';
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : ArrowUpRight;

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      {/* User score */}
      <div className="flex-1 rounded-xl bg-cloud p-5 text-center w-full">
        <p className="text-xs text-slate mb-1 truncate" title={userUrl}>Your Site</p>
        <p className="text-4xl font-bold text-ink">{Math.round(userScore)}</p>
        <p className="text-sm font-medium text-slate mt-1">Grade: {userGrade}</p>
      </div>

      {/* Delta badge */}
      <div className={`flex flex-col items-center justify-center rounded-full w-16 h-16 ${deltaColor} flex-shrink-0`}>
        <DeltaIcon className="w-4 h-4" />
        <span className="text-sm font-bold">{delta > 0 ? '+' : ''}{delta}</span>
      </div>

      {/* Competitor score */}
      <div className="flex-1 rounded-xl bg-cloud p-5 text-center w-full">
        <p className="text-xs text-slate mb-1 truncate" title={competitorUrl}>Competitor</p>
        <p className="text-4xl font-bold text-ink">{Math.round(competitorScore)}</p>
        <p className="text-sm font-medium text-slate mt-1">Grade: {competitorGrade}</p>
      </div>
    </div>
  );
}

function PillarComparison({ pillarDeltas }) {
  if (!pillarDeltas || pillarDeltas.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3">Pillar Breakdown</h3>
      <div className="space-y-3">
        {pillarDeltas.map((p) => {
          const maxScore = Math.max(p.user_score, p.competitor_score, 1);
          const userWidth = Math.round((p.user_score / 100) * 100);
          const competitorWidth = Math.round((p.competitor_score / 100) * 100);

          return (
            <div key={p.pillar} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate font-medium">{p.pillar_name}</span>
                <span className={`font-semibold ${p.delta > 0 ? 'text-green-600' : p.delta < 0 ? 'text-red-600' : 'text-slate'}`}>
                  {p.delta > 0 ? '+' : ''}{p.delta}
                </span>
              </div>
              <div className="flex gap-1 items-center">
                {/* User bar */}
                <div className="flex-1 bg-cloud rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-signal transition-all"
                    style={{ width: `${userWidth}%` }}
                  />
                </div>
                {/* Competitor bar */}
                <div className="flex-1 bg-cloud rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-clarity transition-all"
                    style={{ width: `${competitorWidth}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate">
                <span>You: {p.user_score}</span>
                <span>Competitor: {p.competitor_score}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-slate">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-signal" /> Your site</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-clarity" /> Competitor</span>
      </div>
    </div>
  );
}

function FactorTable({ factorDeltas }) {
  if (!factorDeltas || factorDeltas.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3">Factor-by-Factor Comparison</h3>
      <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-lg border border-mist">
        <table className="w-full text-sm">
          <thead className="bg-cloud sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-slate font-medium">Factor</th>
              <th className="text-right px-3 py-2 text-slate font-medium">You</th>
              <th className="text-right px-3 py-2 text-slate font-medium">Competitor</th>
              <th className="text-right px-3 py-2 text-slate font-medium">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {factorDeltas.map((fd) => (
              <tr key={fd.factor_id} className="hover:bg-cloud/50 transition-colors">
                <td className="px-3 py-2 text-ink">{fd.factor_name}</td>
                <td className="px-3 py-2 text-right text-ink font-medium">{fd.user_score}</td>
                <td className="px-3 py-2 text-right text-ink font-medium">{fd.competitor_score}</td>
                <td className={`px-3 py-2 text-right font-semibold ${
                  fd.delta > 0 ? 'text-green-600' : fd.delta < 0 ? 'text-red-600' : 'text-slate'
                }`}>
                  {fd.delta > 0 ? '+' : ''}{fd.delta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Recommendations({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-signal" />
        Close the Gap
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <div key={i} className="rounded-lg border border-mist bg-cloud/50 px-4 py-3">
            <p className="text-sm text-ink">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
