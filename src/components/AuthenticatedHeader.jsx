import React from 'react';
import AILogo from './AILogo';
import TierIndicator from './TierIndicator';

const AuthenticatedHeader = ({ session, userTier, usageData, onSignOut }) => {
  return (
    <header className="bg-mastery shadow-sm border-b border-mastery/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AILogo className="h-10 md:h-12" />
            <div>
              <div className="text-lg md:text-xl font-bold text-white">
                AImpactScanner
              </div>
              <div className="text-xs text-white/70">
                Part of AI Search Mastery
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
            />
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-signal text-white rounded-lg font-semibold hover:bg-signal/90 transition-colors text-sm"
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