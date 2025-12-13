// TierMessagingSection.jsx - Value Ladder Messaging for tier selection
// Based on LLMtxtMastery pattern + Doug Hall Marketing Physics + "So What?" test
import React from 'react';
import PropTypes from 'prop-types';

const TIER_MESSAGING = {
  free: {
    tagline: "Am I losing customers?",
    obHeadline: "Discover where you're losing customers to AI",
    obBullets: [
      "27-factor scan across 9 AI visibility pillars",
      "No credit card required"
    ],
    fomo: {
      style: 'yellow', // Upgrade prompt
      headline: "What you're missing:",
      message: "Free finds the problem - but then you're stuck. Fix something? That's scan 2. Verify it worked? Scan 3. You're done. No more pages, no more progress. Solo gives you 10 scans to actually move forward.",
      upgradeNudge: "Upgrade to Solo for just $4.95/month"
    },
    whatYouGet: {
      highlighted: "Find out if you're losing customers right now",
      bullets: [
        "See what AI sees (and what it misses)",
        "Pinpoint your biggest visibility gap",
        "No commitment - just answers"
      ]
    },
    volumeLine: "3 free analyses per month"
  },
  coffee: {
    tagline: "Stop losing customers",
    obHeadline: "Fix the problems that are costing you customers",
    obBullets: [
      "Scan → Fix → Verify → Move to next page",
      "Keep your results for 30 days"
    ],
    fomo: {
      style: 'yellow', // Upgrade prompt
      headline: "More than a side project?",
      message: "You'll need to work across pages and sites, track your progress, and keep AI finding you after every change. Growth is built for that.",
      upgradeNudge: "Upgrade to Growth for $14.95/month"
    },
    whatYouGet: {
      highlighted: "10 scans to fix your key pages",
      bullets: [
        "30-day history proves your fixes worked",
        "PDF reports to share with clients or your team",
        "Email support when you get stuck"
      ]
    },
    volumeLine: "10 analyses per month"
  },
  growth: {
    tagline: "Never lose a customer to AI",
    obHeadline: "The complete system: scan, plan, track, get found",
    obBullets: [
      "Know exactly what to fix, in what order",
      "Track your progress across 90 days"
    ],
    fomo: {
      style: 'yellow', // Upgrade prompt
      headline: "Working with clients?",
      message: "40 scans won't cover their sites plus yours. Scale gives you 100 scans, unlimited LLMS.txt, and unlimited history - never say no to a project.",
      upgradeNudge: "Upgrade to Scale for $29.95/month"
    },
    whatYouGet: {
      highlighted: "Know exactly what to fix, in what order",
      bullets: [
        "40 scans to cover everything",
        "Track your progress over 90 days",
        "Generate LLMS.txt after every change",
        "Priority support when you need help"
      ]
    },
    volumeLine: "40 analyses per month"
  },
  scale: {
    tagline: "Never say no to a client",
    obHeadline: "100 scans, unlimited LLMS.txt, unlimited history - take on any project",
    obBullets: [
      "Cover every client site from one account",
      "Regenerate LLMS.txt after every change, on every site"
    ],
    fomo: {
      style: 'green', // Top tier confirmation
      headline: "No limits",
      message: "Take on any project. Cover any site. Never run out of scans or history."
    },
    whatYouGet: {
      highlighted: "Never say no to a project",
      bullets: [
        "100 scans to cover every client site",
        "Unlimited LLMS.txt after every change",
        "Unlimited history - your data forever",
        "5-page comparisons for client reports"
      ]
    },
    volumeLine: "100 analyses per month"
  }
};

const TierMessagingSection = ({ selectedTier, isTransitioning = false }) => {
  const messaging = TIER_MESSAGING[selectedTier];

  if (!messaging) {
    console.error(`No messaging found for tier: ${selectedTier}`);
    return null;
  }

  const isScale = selectedTier === 'scale';
  const isFree = selectedTier === 'free';

  return (
    <div
      className={`
        transition-opacity duration-500
        ${isTransitioning ? 'opacity-0' : 'opacity-100'}
      `}
      data-testid="tier-messaging-section"
    >
      {/* OB Box - Overarching Benefit */}
      <div className={`
        p-4 rounded-lg mb-4
        ${isFree ? 'bg-gray-50 border-2 border-gray-300' : ''}
        ${selectedTier === 'coffee' ? 'bg-blue-50 border-2 border-blue-300' : ''}
        ${selectedTier === 'growth' ? 'bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-yellow-400' : ''}
        ${isScale ? 'bg-purple-50 border-2 border-purple-400' : ''}
      `}>
        <h3
          className={`
            text-xl font-bold mb-2
            ${isFree ? 'text-gray-900' : ''}
            ${selectedTier === 'coffee' ? 'text-blue-900' : ''}
            ${selectedTier === 'growth' ? 'text-green-900' : ''}
            ${isScale ? 'text-purple-900' : ''}
          `}
          data-testid="tier-heading"
        >
          {messaging.obHeadline}
        </h3>
        <ul className="space-y-1">
          {messaging.obBullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* FOMO Box - Upgrade Motivation */}
      <div className={`
        p-4 rounded-lg mb-4 border-l-4
        ${messaging.fomo.style === 'yellow' ? 'bg-amber-50 border-amber-400' : ''}
        ${messaging.fomo.style === 'green' ? 'bg-green-50 border-green-500' : ''}
      `}>
        <h4 className={`
          font-bold mb-2
          ${messaging.fomo.style === 'yellow' ? 'text-amber-800' : ''}
          ${messaging.fomo.style === 'green' ? 'text-green-800' : ''}
        `}>
          {messaging.fomo.headline}
        </h4>
        <p className="text-sm text-gray-700 mb-2">
          {messaging.fomo.message}
        </p>
        {messaging.fomo.upgradeNudge && (
          <p className="text-sm font-semibold text-blue-600">
            → {messaging.fomo.upgradeNudge}
          </p>
        )}
      </div>

      {/* What You Get Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="tier-benefits">
        <h4 className="font-bold text-gray-900 mb-3">
          What You Get with {selectedTier === 'coffee' ? 'SOLO' : selectedTier.toUpperCase()}
        </h4>
        <ul className="space-y-2">
          {/* Highlighted first benefit */}
          <li className="flex items-start gap-2 text-sm bg-yellow-50 border-l-4 border-yellow-400 pl-3 py-2 rounded font-semibold text-gray-900">
            <span className="text-yellow-600">★</span>
            <span>{messaging.whatYouGet.highlighted}</span>
          </li>
          {/* Regular bullets */}
          {messaging.whatYouGet.bullets.map((bullet, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reasons to Believe - Trust indicators */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <span>✓</span> 30-Day Money Back Guarantee
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span> Cancel in 10 Seconds
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span> Built by Solopreneur for Solopreneurs
          </span>
        </div>
      </div>
    </div>
  );
};

TierMessagingSection.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale']).isRequired,
  isTransitioning: PropTypes.bool
};

export default TierMessagingSection;
