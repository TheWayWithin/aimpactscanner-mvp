import React, { useState, useEffect } from 'react';

function SmartUpgradePrompt({ 
  trigger, // 'low-score', 'high-engagement', 'feature-limit', 'analysis-complete'
  score,
  onUpgrade,
  onDismiss 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

  useEffect(() => {
    // Show prompt based on trigger conditions
    if (!hasBeenDismissed) {
      if (trigger === 'low-score' && score < 50) {
        setIsVisible(true);
      } else if (trigger === 'high-engagement') {
        // Show after user has interacted with 3+ factors
        setIsVisible(true);
      } else if (trigger === 'feature-limit') {
        setIsVisible(true);
      } else if (trigger === 'analysis-complete') {
        setTimeout(() => setIsVisible(true), 2000);
      }
    }
  }, [trigger, score, hasBeenDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasBeenDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  const prompts = {
    'low-score': {
      title: 'Your Score Needs Immediate Attention',
      message: `With a score of ${score}/100, you are losing significant traffic to AI search engines.`,
      benefit: 'Get your complete recovery roadmap with step-by-step fixes across all 8 MASTERY-AI pillars.',
      cta: 'Start Recovering Traffic →',
      color: 'red'
    },
    'high-engagement': {
      title: "You're Discovering Important Issues",
      message: "You've found several critical factors affecting your AI visibility.",
      benefit: 'Unlock detailed fixes and weekly monitoring to track your improvements.',
      cta: 'Get Full Access →',
      color: 'blue'
    },
    'feature-limit': {
      title: "You've Reached the Free Preview Limit",
      message: 'To see your remaining factors and improvement opportunities...',
      benefit: 'Professional members see all 148 factors with detailed recommendations.',
      cta: 'Unlock Everything →',
      color: 'purple'
    },
    'analysis-complete': {
      title: 'Your Analysis is Ready',
      message: "We've identified opportunities to recover lost traffic.",
      benefit: 'Get your personalized action plan with priority fixes.',
      cta: 'View Full Results →',
      color: 'green'
    }
  };

  const prompt = prompts[trigger] || prompts['analysis-complete'];
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50 fade-in">
      <div className={`bg-gradient-to-r ${colorClasses[prompt.color]} text-white rounded-lg shadow-xl p-6`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          ✕
        </button>
        
        <h3 className="font-bold text-lg mb-2">{prompt.title}</h3>
        <p className="text-sm mb-3 opacity-90">{prompt.message}</p>
        <p className="text-sm mb-4 font-semibold">{prompt.benefit}</p>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onUpgrade('professional')}
            className="flex-1 bg-white text-gray-900 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors"
          >
            {prompt.cta}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white px-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmartUpgradePrompt;