// PricingIntegrationExample.jsx - Example showing how to integrate new pricing components
// This demonstrates how to use the new enhanced pricing components with existing app logic

import React, { useState } from 'react';
import PricingTiers from './PricingTiers';
import PricingComparison from './PricingComparison';
import PricingPage from './PricingPage';

const PricingIntegrationExample = ({ 
  session, 
  currentTier, 
  onUpgrade, 
  className = '' 
}) => {
  const [viewType, setViewType] = useState('enhanced'); // 'enhanced', 'tiers-only', 'comparison', 'full-page'

  // Enhanced upgrade handler that includes billing cycle
  const handleEnhancedUpgrade = async (tierId, billingCycle = 'monthly') => {
    try {
      // You can add billing cycle logic here if needed
      console.log(`Upgrading to ${tierId} with ${billingCycle} billing`);
      await onUpgrade(tierId);
    } catch (error) {
      console.error('Enhanced upgrade error:', error);
      throw error;
    }
  };

  const componentOptions = [
    { id: 'enhanced', label: 'Enhanced Tiers', desc: 'Drop-in replacement for TierSelection' },
    { id: 'tiers-only', label: 'Tiers Only', desc: 'Just the pricing cards' },
    { id: 'comparison', label: 'Feature Comparison', desc: 'Detailed feature table' },
    { id: 'full-page', label: 'Complete Page', desc: 'Full conversion-optimized experience' }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Component Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--framework-black)' }}>
          Choose Pricing Component Style
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {componentOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setViewType(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                viewType === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-semibold text-sm mb-1">{option.label}</div>
              <div className="text-xs text-gray-600">{option.desc}</div>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Implementation Guide:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div><strong>Enhanced Tiers:</strong> Replace existing TierSelection with PricingTiers for better conversions</div>
            <div><strong>Tiers Only:</strong> Use standalone pricing cards component anywhere in your app</div>
            <div><strong>Feature Comparison:</strong> Add detailed feature comparison for transparency</div>
            <div><strong>Complete Page:</strong> Full-featured pricing page with all conversion optimizations</div>
          </div>
        </div>
      </div>

      {/* Component Display */}
      <div className="bg-gray-50 rounded-xl p-8">
        {viewType === 'enhanced' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                Enhanced Pricing Tiers
              </h2>
              <p className="text-gray-600">
                Drop-in replacement for TierSelection.jsx with conversion optimizations
              </p>
            </div>
            <PricingTiers 
              currentTier={currentTier}
              onUpgrade={handleEnhancedUpgrade}
            />
          </div>
        )}

        {viewType === 'tiers-only' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                Pricing Tiers Component
              </h2>
              <p className="text-gray-600">
                Standalone pricing cards with conversion psychology
              </p>
            </div>
            <PricingTiers 
              currentTier={currentTier}
              onUpgrade={handleEnhancedUpgrade}
            />
          </div>
        )}

        {viewType === 'comparison' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                Feature Comparison Table
              </h2>
              <p className="text-gray-600">
                Detailed side-by-side feature comparison
              </p>
            </div>
            <PricingComparison currentTier={currentTier} />
          </div>
        )}

        {viewType === 'full-page' && (
          <div>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
                Complete Pricing Experience
              </h2>
              <p className="text-gray-600">
                Full conversion-optimized pricing page with all elements
              </p>
            </div>
            <PricingPage 
              currentTier={currentTier}
              onUpgrade={handleEnhancedUpgrade}
            />
          </div>
        )}
      </div>

      {/* Integration Code Examples */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--framework-black)' }}>
          Integration Code Examples
        </h3>

        {viewType === 'enhanced' && (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`// Replace existing TierSelection with enhanced version
import PricingTiers from './components/PricingTiers';

// In your component:
<PricingTiers 
  currentTier={userTier} 
  onUpgrade={(tierId, billingCycle) => {
    console.log(\`Upgrading to \${tierId} with \${billingCycle} billing\`);
    return handleUpgrade(tierId);
  }} 
/>`}
            </pre>
          </div>
        )}

        {viewType === 'comparison' && (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`// Add feature comparison anywhere
import PricingComparison from './components/PricingComparison';

// In your component:
<PricingComparison currentTier={userTier} />`}
            </pre>
          </div>
        )}

        {viewType === 'full-page' && (
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`// Use complete pricing page for dedicated pricing route
import PricingPage from './components/PricingPage';

// In your routing logic:
{currentView === 'pricing' && (
  <PricingPage 
    currentTier={userTier}
    onUpgrade={handleUpgrade}
  />
)}`}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-sm mb-2 text-blue-800">Migration Tips:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• All new components are backward compatible with existing onUpgrade function</li>
            <li>• Enhanced components include A/B testing hooks for conversion optimization</li>
            <li>• Mobile-first responsive design works across all device sizes</li>
            <li>• All components use existing CSS variables for brand consistency</li>
            <li>• Optional billing cycle parameter for annual/monthly toggle functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingIntegrationExample;