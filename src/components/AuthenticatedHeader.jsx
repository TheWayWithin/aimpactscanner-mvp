import React from 'react';
import AILogo from './AILogo';
import TierIndicator from './TierIndicator';

const AuthenticatedHeader = ({ session, userTier, usageData, onSignOut, onUpgrade, onNavigate }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AILogo className="h-10 md:h-12" />
            <div>
              <div className="text-lg md:text-xl font-bold text-gray-900">
                AImpactScanner
              </div>
              <div className="text-xs text-gray-600">
                AI Search Optimization Platform
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <TierIndicator
              user={session?.user}
              tierData={{
                tier: userTier,
                remaining: userTier === 'free' ? usageData?.remaining : Infinity
              }}
              onUpgrade={onNavigate ? () => onNavigate('pricing') : onUpgrade}
            />
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;