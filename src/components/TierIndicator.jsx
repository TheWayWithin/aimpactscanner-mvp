// TierIndicator.jsx - Compact tier indicator for header
// Shows current tier and remaining analyses

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const TierIndicator = ({ user, onUpgrade, className = '' }) => {
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchTierData();
    }
  }, [user]);

  const fetchTierData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('tier, tier_expires_at, monthly_analyses_used, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching tier data:', error);
        // Set default for free users if no data found
        setTierData({ tier: 'free', monthly_analyses_used: 0 });
      } else {
        setTierData(data);
      }
    } catch (error) {
      console.error('Error fetching tier data:', error);
      setTierData({ tier: 'free', monthly_analyses_used: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier) => {
    const tierNames = {
      'free': '🆓 Free',
      'coffee': '☕ Coffee',
      'professional': '💼 Pro',
      'enterprise': '🏢 Enterprise'
    };
    return tierNames[tier] || tier;
  };

  const getRemainingAnalyses = () => {
    if (!tierData) return 0;
    
    if (tierData.tier === 'free') {
      return Math.max(0, 3 - (tierData.monthly_analyses_used || 0));
    }
    return '∞';
  };

  const getIndicatorColor = () => {
    if (!tierData || tierData.tier !== 'free') return 'bg-green-100 text-green-800';
    
    const remaining = getRemainingAnalyses();
    if (remaining === 0) return 'bg-red-100 text-red-800';
    if (remaining === 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const shouldShowUpgradePrompt = () => {
    return tierData?.tier === 'free' && getRemainingAnalyses() <= 1;
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex space-x-2">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    );
  }

  if (!tierData) return null;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Tier Badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getIndicatorColor()}`}>
        {getTierDisplayName(tierData.tier)}
      </div>

      {/* Remaining Analyses */}
      <div className="text-sm text-white hidden sm:block">
        <span className="font-medium">{getRemainingAnalyses()}</span> 
        {tierData.tier === 'free' ? ' left' : ''}
      </div>

      {/* Upgrade Button (only for free users with low remaining) */}
      {shouldShowUpgradePrompt() && (
        <button
          onClick={() => onUpgrade?.('coffee')}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium transition-colors"
        >
          Upgrade
        </button>
      )}

      {/* Expiration Warning */}
      {tierData.tier_expires_at && new Date(tierData.tier_expires_at) < new Date() && (
        <div className="text-xs text-red-600 font-medium">
          Expired
        </div>
      )}
    </div>
  );
};

export default TierIndicator;