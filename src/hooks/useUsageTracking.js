import { useState, useEffect } from 'react';
import { getActualUserTier, hasFeatureAccess } from '../lib/tierUtils';
import { supabase } from '../lib/supabaseClient';

// Custom hook for client-side usage tracking
export const useUsageTracking = (userEmail) => {
  const [usageData, setUsageData] = useState({
    monthlyUsed: 0,
    remaining: 3,
    resetDate: null,
    isUnlimited: false,
    tier: 'free'
  });

  const STORAGE_KEY = userEmail ? `usage_${userEmail}` : 'usage_anonymous';
  const FREE_TIER_LIMIT = 3;

  useEffect(() => {
    loadUsageData();
  }, [userEmail]);

  const loadUsageData = async () => {
    let syncedTier = 'free'; // Initialize with default
    let syncedIsUnlimited = false;

    try {
      // Try database sync for authenticated users to get correct tier
      if (userEmail && userEmail !== 'anonymous') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const tierInfo = await getActualUserTier(user.id);

            // Update localStorage with correct tier from database
            if (tierInfo && tierInfo.tier) {
              // Don't sync 'pending_payment' as a tier - keep existing or use 'free'
              const effectiveTier = tierInfo.tier === 'pending_payment' ? 'coffee_pending' : tierInfo.tier;
              syncedTier = effectiveTier; // Capture for use after localStorage read
              const unlimited = ['coffee', 'growth', 'scale', 'professional', 'enterprise'].includes(tierInfo.tier);
              syncedIsUnlimited = unlimited; // Capture for use after localStorage read
              const stored = localStorage.getItem(STORAGE_KEY);
              const existingData = stored ? JSON.parse(stored) : {};

              const syncedData = {
                ...existingData,
                tier: effectiveTier,
                isUnlimited: unlimited,
                isPending: tierInfo.tier === 'pending_payment',
                lastSynced: new Date().toISOString(),
                monthlyUsed: existingData.monthlyUsed || 0,
                lastUpdated: existingData.lastUpdated || new Date().toISOString()
              };

              localStorage.setItem(STORAGE_KEY, JSON.stringify(syncedData));
              console.log(`Synced tier from database: ${effectiveTier} for ${userEmail}${tierInfo.tier === 'pending_payment' ? ' (pending payment)' : ''}`);
            }
          }
        } catch (dbError) {
          console.warn('Database tier sync failed, using localStorage fallback:', dbError);
        }
      }

      // Now load from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Check if we need to reset monthly usage
        const now = new Date();
        const storedDate = new Date(data.lastUpdated);

        if (now.getMonth() !== storedDate.getMonth() ||
            now.getFullYear() !== storedDate.getFullYear()) {
          // New month - reset usage
          resetMonthlyUsage();
        } else {
          setUsageData({
            monthlyUsed: data.monthlyUsed || 0,
            remaining: data.isUnlimited ? Infinity : Math.max(0, FREE_TIER_LIMIT - (data.monthlyUsed || 0)),
            resetDate: getMonthResetDate(),
            isUnlimited: syncedIsUnlimited, // Use database-synced value
            tier: syncedTier // Use database-synced tier, not localStorage fallback
          });
        }
      } else {
        // Initialize for new user
        resetMonthlyUsage();
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
      resetMonthlyUsage();
    }
  };

  const resetMonthlyUsage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existingTier = stored ? JSON.parse(stored).tier : 'free';
    
    const resetData = {
      monthlyUsed: 0,
      lastUpdated: new Date().toISOString(),
      isUnlimited: false,
      tier: existingTier
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
    
    setUsageData({
      monthlyUsed: 0,
      remaining: FREE_TIER_LIMIT,
      resetDate: getMonthResetDate(),
      isUnlimited: false,
      tier: existingTier
    });
  };

  const incrementUsage = () => {
    if (usageData.isUnlimited) {
      return true; // Unlimited users can always analyze
    }

    if (usageData.remaining <= 0) {
      return false; // Limit reached
    }

    const newUsed = usageData.monthlyUsed + 1;
    const updatedData = {
      monthlyUsed: newUsed,
      lastUpdated: new Date().toISOString(),
      isUnlimited: usageData.isUnlimited,
      tier: usageData.tier
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    setUsageData(prev => ({
      ...prev,
      monthlyUsed: newUsed,
      remaining: Math.max(0, FREE_TIER_LIMIT - newUsed)
    }));

    return true;
  };

  const setUnlimitedAccess = (unlimited = true, tier = null) => {
    const updatedData = {
      monthlyUsed: usageData.monthlyUsed,
      lastUpdated: new Date().toISOString(),
      isUnlimited: unlimited,
      tier: tier || usageData.tier
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    setUsageData(prev => ({
      ...prev,
      isUnlimited: unlimited,
      tier: tier || prev.tier,
      remaining: unlimited ? Infinity : Math.max(0, FREE_TIER_LIMIT - prev.monthlyUsed)
    }));
  };

  // New function to update user tier
  const setUserTier = (newTier) => {
    const unlimited = ['coffee', 'growth', 'scale', 'professional', 'enterprise'].includes(newTier);
    
    const updatedData = {
      monthlyUsed: usageData.monthlyUsed,
      lastUpdated: new Date().toISOString(),
      isUnlimited: unlimited,
      tier: newTier
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    setUsageData(prev => ({
      ...prev,
      tier: newTier,
      isUnlimited: unlimited,
      remaining: unlimited ? Infinity : Math.max(0, FREE_TIER_LIMIT - prev.monthlyUsed)
    }));
  };

  // Check if user has access to PDF export (Coffee tier and above)
  const hasPDFAccess = () => {
    console.log('[DEBUG] hasPDFAccess called with tier:', usageData.tier);
    const result = hasFeatureAccess(usageData.tier, 'pdf_export');
    console.log('[DEBUG] hasFeatureAccess returned:', result);
    return result;
  };

  const getMonthResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString();
  };

  const canAnalyze = () => {
    return usageData.isUnlimited || usageData.remaining > 0;
  };

  const getDaysUntilReset = () => {
    if (!usageData.resetDate) return 30;
    
    const now = new Date();
    const reset = new Date(usageData.resetDate);
    const diff = reset - now;
    
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return {
    usageData,
    incrementUsage,
    setUnlimitedAccess,
    setUserTier,
    hasPDFAccess,
    canAnalyze,
    getDaysUntilReset,
    resetMonthlyUsage
  };
};

// Utility function to check usage without React hook
export const checkUsageLimit = (userEmail) => {
  const STORAGE_KEY = userEmail ? `usage_${userEmail}` : 'usage_anonymous';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { canAnalyze: true, remaining: 3 };
    
    const data = JSON.parse(stored);
    
    // Check if month has reset
    const now = new Date();
    const storedDate = new Date(data.lastUpdated);
    
    if (now.getMonth() !== storedDate.getMonth() || 
        now.getFullYear() !== storedDate.getFullYear()) {
      return { canAnalyze: true, remaining: 3 };
    }
    
    const remaining = data.isUnlimited ? Infinity : Math.max(0, 3 - (data.monthlyUsed || 0));
    
    return {
      canAnalyze: data.isUnlimited || remaining > 0,
      remaining: remaining,
      isUnlimited: data.isUnlimited,
      tier: data.tier || 'free',
      hasPDFAccess: hasFeatureAccess(data.tier || 'free', 'pdf_export')
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { canAnalyze: true, remaining: 3 };
  }
};