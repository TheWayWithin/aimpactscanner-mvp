import React, { useState, useMemo } from 'react';
import { Wrench, Copy, Check, AlertTriangle, Code, Shield, Filter, ArrowDownWideNarrow } from 'lucide-react';

/**
 * ActionItemsPanel - Displays prioritized "Fix This" action items from scan results
 *
 * Props:
 *   actionItems: array of { id, factor_id, factor_name, what, why, impact, fix_type, fix, code_snippet? }
 *   schemaAnalysis: { detected, missing, generated, validation, completeness_score } or null
 */

const IMPACT_CONFIG = {
  high: { label: 'High', bg: 'bg-red-50', border: 'border-l-red-500', badge: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', bg: 'bg-amber-50', border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700' },
  low: { label: 'Low', bg: 'bg-green-50', border: 'border-l-green-500', badge: 'bg-green-100 text-green-700' },
};

function ActionItemsPanel({ actionItems = [], schemaAnalysis = null }) {
  const [sortBy, setSortBy] = useState('impact');
  const [filterImpact, setFilterImpact] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Normalize impact values to lowercase for consistent comparison
  const normalizedItems = useMemo(() =>
    actionItems.map(item => ({
      ...item,
      impact: (item.impact || 'medium').toLowerCase(),
    })),
    [actionItems]
  );

  // Count items per impact level
  const counts = useMemo(() => {
    const c = { all: normalizedItems.length, high: 0, medium: 0, low: 0 };
    normalizedItems.forEach(item => {
      if (c[item.impact] !== undefined) c[item.impact]++;
    });
    return c;
  }, [normalizedItems]);

  // Filter
  const filteredItems = useMemo(() => {
    if (filterImpact === 'all') return normalizedItems;
    return normalizedItems.filter(item => item.impact === filterImpact);
  }, [normalizedItems, filterImpact]);

  // Sort
  const sortedItems = useMemo(() => {
    const impactOrder = { high: 0, medium: 1, low: 2 };
    const items = [...filteredItems];
    if (sortBy === 'impact') {
      items.sort((a, b) => (impactOrder[a.impact] ?? 1) - (impactOrder[b.impact] ?? 1));
    } else if (sortBy === 'factor') {
      items.sort((a, b) => (a.factor_name || '').localeCompare(b.factor_name || ''));
    }
    return items;
  }, [filteredItems, sortBy]);

  // Schema helpers
  const schemaCompleteness = schemaAnalysis?.completeness_score;
  const generatedSchemas = schemaAnalysis?.generated || [];
  const validationIssues = schemaAnalysis?.validation || [];

  // Empty state
  if (actionItems.length === 0 && !schemaAnalysis) {
    return (
      <div className="rounded-xl border border-mist shadow-sm bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">All clear! No critical issues found.</h3>
            <p className="text-sm text-green-700 mt-1">Your site is in good shape across all evaluated factors.</p>
          </div>
        </div>
      </div>
    );
  }

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'high', label: 'High Impact' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wrench className="w-5 h-5 text-signal" />
          <h2 className="text-lg font-bold text-ink">Fix This — Prioritized Action Plan</h2>
          {actionItems.length > 0 && (
            <span className="text-xs font-medium bg-signal text-white px-2 py-0.5 rounded-full">
              {actionItems.length}
            </span>
          )}
        </div>

        {/* Sort controls */}
        {actionItems.length > 0 && (
          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="w-4 h-4 text-stone" />
            <button
              onClick={() => setSortBy('impact')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                sortBy === 'impact'
                  ? 'bg-signal text-white border-signal'
                  : 'bg-white text-slate border-mist hover:border-signal'
              }`}
            >
              Impact (High→Low)
            </button>
            <button
              onClick={() => setSortBy('factor')}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                sortBy === 'factor'
                  ? 'bg-signal text-white border-signal'
                  : 'bg-white text-slate border-mist hover:border-signal'
              }`}
            >
              Factor
            </button>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      {actionItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-stone" />
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterImpact(tab.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                filterImpact === tab.key
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-slate border-mist hover:border-ink'
              }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">({counts[tab.key]})</span>
            </button>
          ))}
        </div>
      )}

      {/* Action cards */}
      {sortedItems.length > 0 && (
        <div className="space-y-4">
          {sortedItems.map((item, index) => {
            const config = IMPACT_CONFIG[item.impact] || IMPACT_CONFIG.medium;
            const itemId = item.id || `action-${index}`;

            return (
              <div
                key={itemId}
                className={`rounded-xl border border-mist shadow-sm bg-white border-l-4 ${config.border} overflow-hidden`}
              >
                <div className="p-4 space-y-3">
                  {/* Top row: impact badge + factor pill */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.badge}`}>
                      {config.label} Impact
                    </span>
                    {item.factor_name && (
                      <span className="text-xs font-medium bg-mastery/10 text-mastery px-2 py-0.5 rounded">
                        {item.factor_name}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-ink">{item.what}</h3>

                  {/* Why */}
                  {item.why && (
                    <p className="text-sm text-slate">{item.why}</p>
                  )}

                  {/* Fix guidance */}
                  {item.fix && (
                    <div className="bg-cloud rounded-lg p-3">
                      <p className="text-sm text-ink">
                        <span className="font-medium text-signal">Fix: </span>
                        {item.fix}
                      </p>
                    </div>
                  )}

                  {/* Code snippet */}
                  {item.code_snippet && (
                    <div className="relative">
                      <div className="flex items-center justify-between bg-ink rounded-t-lg px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs text-gray-400">Code snippet</span>
                        </div>
                        <button
                          onClick={() => handleCopy(item.code_snippet, `code-${itemId}`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedId === `code-${itemId}` ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-b-lg overflow-x-auto">
                        <code>{item.code_snippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered empty state */}
      {actionItems.length > 0 && sortedItems.length === 0 && (
        <div className="rounded-xl border border-mist bg-cloud p-6 text-center">
          <p className="text-sm text-slate">No action items match the selected filter.</p>
        </div>
      )}

      {/* Schema Analysis Section */}
      {schemaAnalysis && generatedSchemas.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-mastery" />
            <h3 className="text-base font-bold text-ink">Generated Schema Markup</h3>
          </div>

          {/* Completeness progress bar */}
          {schemaCompleteness != null && (
            <div className="rounded-xl border border-mist shadow-sm bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-ink">Schema completeness</span>
                <span className="text-sm font-semibold text-mastery">
                  {typeof schemaCompleteness === 'object'
                    ? `${schemaCompleteness.present || 0}/${schemaCompleteness.applicable || 0} applicable schemas present`
                    : `${Math.round(schemaCompleteness)}% complete`}
                </span>
              </div>
              <div className="w-full h-2 bg-cloud rounded-full overflow-hidden">
                <div
                  className="h-full bg-mastery rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      typeof schemaCompleteness === 'object'
                        ? ((schemaCompleteness.present || 0) / (schemaCompleteness.applicable || 1)) * 100
                        : schemaCompleteness
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Validation issues */}
          {validationIssues.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  {validationIssues.length} Validation Issue{validationIssues.length > 1 ? 's' : ''}
                </span>
              </div>
              <ul className="space-y-1">
                {validationIssues.map((issue, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                    <span className="mt-0.5 block w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {typeof issue === 'string' ? issue : issue.message || JSON.stringify(issue)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated schema cards */}
          <div className="space-y-4">
            {generatedSchemas.map((schema, index) => {
              const schemaId = `schema-${index}`;
              const jsonLd = typeof schema.jsonLd === 'string'
                ? schema.jsonLd
                : JSON.stringify(schema.jsonLd || schema.json_ld || schema, null, 2);

              return (
                <div
                  key={schemaId}
                  className="rounded-xl border border-mist shadow-sm bg-white overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-mastery" />
                      <h4 className="font-semibold text-ink">{schema.type || schema.name || 'Schema'}</h4>
                    </div>
                    {schema.description && (
                      <p className="text-sm text-slate">{schema.description}</p>
                    )}

                    {/* JSON-LD code block */}
                    <div className="relative">
                      <div className="flex items-center justify-between bg-ink rounded-t-lg px-3 py-1.5">
                        <span className="text-xs text-gray-400">JSON-LD</span>
                        <button
                          onClick={() => handleCopy(jsonLd, schemaId)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedId === schemaId ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-b-lg overflow-x-auto max-h-64">
                        <code>{jsonLd}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActionItemsPanel;
