import React from 'react';

/**
 * CriticalIssuesBanner - Displays blockers and warnings prominently at the top of results
 *
 * Severity levels:
 * - blocker: Critical issues that completely block SEO (red)
 * - warning: Important issues that significantly impact SEO (orange)
 * - info: Minor issues or informational (blue) - not shown in banner
 * - ok: No issues - not shown
 */
function CriticalIssuesBanner({ factors }) {
  if (!factors || factors.length === 0) return null;

  // Filter for blockers and warnings only
  const blockers = factors.filter(f => f.severity === 'blocker');
  const warnings = factors.filter(f => f.severity === 'warning');

  // If no critical issues, show success message
  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <div className="mb-6 p-4 rounded-lg border-2 border-green-200 bg-green-50">
        <div className="flex items-center">
          <span className="text-2xl mr-3">✅</span>
          <div>
            <h3 className="font-semibold text-green-800">No Critical SEO Issues Detected</h3>
            <p className="text-sm text-green-700">Your site passes all fundamental SEO checks. Focus on optimization recommendations below.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Blockers Section */}
      {blockers.length > 0 && (
        <div className="p-4 rounded-lg border-2 border-red-300 bg-red-50">
          <div className="flex items-start">
            <span className="text-2xl mr-3 mt-1">🚫</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-800 text-lg mb-2">
                {blockers.length} Critical Blocker{blockers.length > 1 ? 's' : ''} Found
              </h3>
              <p className="text-sm text-red-700 mb-3">
                These issues are preventing search engines from properly indexing your site. Fix these first!
              </p>
              <div className="space-y-2">
                {blockers.map((factor, index) => (
                  <div
                    key={factor.factor_id || index}
                    className="bg-white rounded-md p-3 border border-red-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-red-900">{factor.factor_name}</span>
                        <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Score: {Math.round(factor.score)}/100
                        </span>
                      </div>
                      <span className="text-xs text-red-600 font-medium">{factor.factor_id}</span>
                    </div>
                    {factor.recommendations && factor.recommendations.length > 0 && (
                      <p className="text-sm text-red-800 mt-2">
                        → {factor.recommendations[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-lg border-2 border-orange-300 bg-orange-50">
          <div className="flex items-start">
            <span className="text-2xl mr-3 mt-1">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-orange-800 text-lg mb-2">
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''} Detected
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                These issues may significantly impact your search engine visibility. Address soon.
              </p>
              <div className="space-y-2">
                {warnings.map((factor, index) => (
                  <div
                    key={factor.factor_id || index}
                    className="bg-white rounded-md p-3 border border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-orange-900">{factor.factor_name}</span>
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          Score: {Math.round(factor.score)}/100
                        </span>
                      </div>
                      <span className="text-xs text-orange-600 font-medium">{factor.factor_id}</span>
                    </div>
                    {factor.recommendations && factor.recommendations.length > 0 && (
                      <p className="text-sm text-orange-800 mt-2">
                        → {factor.recommendations[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CriticalIssuesBanner;
