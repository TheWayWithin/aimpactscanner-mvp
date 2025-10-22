// TierIndicator.jsx - Compact tier indicator for header
// Shows current tier and remaining analyses

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getActualUserTier, getTierDisplayInfo } from '../lib/tierUtils';

const TierIndicator = ({ user, className = '', tierData = null, refreshTrigger = 0 }) => {
  const [localTierData, setLocalTierData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tierData) {
      // Use provided tier data if available
      setLocalTierData(tierData);
      setLoading(false);
    } else if (user?.id) {
      // Fallback to fetching data if not provided
      fetchTierData();
    }
  }, [user, tierData, refreshTrigger]);

  const fetchTierData = async () => {
    try {
      setLoading(true);
      
      // Get the actual tier considering all sources
      const actualTierInfo = await getActualUserTier(user.id);
      
      // Fetch user data for monthly usage
      const { data, error } = await supabase
        .from('users')
        .select('tier, subscription_tier, tier_expires_at, monthly_analyses_used, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching tier data:', error);
        // Use actual tier info as fallback
        setLocalTierData({ 
          tier: actualTierInfo.tier, 
          monthly_analyses_used: 0,
          subscription_status: actualTierInfo.subscriptionStatus,
          has_active_subscription: actualTierInfo.hasActiveSubscription
        });
      } else {
        // Merge actual tier info with user data
        setLocalTierData({
          ...data,
          tier: actualTierInfo.tier,
          subscription_status: actualTierInfo.subscriptionStatus,
          has_active_subscription: actualTierInfo.hasActiveSubscription
        });
      }
    } catch (error) {
      console.error('Error fetching tier data:', error);
      setLocalTierData({ tier: 'free', monthly_analyses_used: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier) => {
    const tierInfo = getTierDisplayInfo(tier);
    return tierInfo.displayName;
  };

  const getRemainingAnalyses = () => {
    if (!localTierData) return 0;
    
    if (localTierData.tier === 'free') {
      // Use remaining count if provided, otherwise calculate from monthly_analyses_used
      if (localTierData.remaining !== undefined) {
        return localTierData.remaining;
      }
      return Math.max(0, 3 - (localTierData.monthly_analyses_used || 0));
    }
    return '∞';
  };

  const getIndicatorColor = () => {
    if (!localTierData) return 'bg-gray-100 text-gray-800';
    
    const tierInfo = getTierDisplayInfo(localTierData.tier);
    
    // Use tier-specific colors
    if (localTierData.tier !== 'free') {
      return tierInfo.color;
    }
    
    // For free tier, color based on remaining analyses
    const remaining = getRemainingAnalyses();
    if (remaining === 0) return 'bg-red-100 text-red-800';
    if (remaining === 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
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

  if (!localTierData) return null;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Tier Badge */}
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getIndicatorColor()}`}>
        {getTierDisplayName(localTierData.tier)}
      </div>

      {/* Remaining Analyses */}
      <div className="text-sm text-white hidden sm:block">
        <span className="font-medium">{getRemainingAnalyses()}</span>
        {localTierData.tier === 'free' ? ' left' : ''}
      </div>

      {/* Expiration Warning */}
      {localTierData.tier_expires_at && new Date(localTierData.tier_expires_at) < new Date() && (
        <div className="text-xs text-red-600 font-medium">
          Expired
        </div>
      )}
    </div>
  );
};

export default TierIndicator;