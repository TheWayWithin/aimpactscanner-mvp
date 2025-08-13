import { useState, useEffect } from 'react';

// Custom hook for client-side usage tracking
export const useUsageTracking = (userEmail) => {
  const [usageData, setUsageData] = useState({
    monthlyUsed: 0,
    remaining: 3,
    resetDate: null,
    isUnlimited: false
  });

  const STORAGE_KEY = userEmail ? `usage_${userEmail}` : 'usage_anonymous';
  const FREE_TIER_LIMIT = 3;

  useEffect(() => {
    loadUsageData();
  }, [userEmail]);

  const loadUsageData = () => {
    try {
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
            remaining: FREE_TIER_LIMIT - (data.monthlyUsed || 0),
            resetDate: getMonthResetDate(),
            isUnlimited: data.isUnlimited || false
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
    const resetData = {
      monthlyUsed: 0,
      lastUpdated: new Date().toISOString(),
      isUnlimited: false
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
    
    setUsageData({
      monthlyUsed: 0,
      remaining: FREE_TIER_LIMIT,
      resetDate: getMonthResetDate(),
      isUnlimited: false
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
      isUnlimited: usageData.isUnlimited
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    setUsageData(prev => ({
      ...prev,
      monthlyUsed: newUsed,
      remaining: Math.max(0, FREE_TIER_LIMIT - newUsed)
    }));

    return true;
  };

  const setUnlimitedAccess = (unlimited = true) => {
    const updatedData = {
      monthlyUsed: usageData.monthlyUsed,
      lastUpdated: new Date().toISOString(),
      isUnlimited: unlimited
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    
    setUsageData(prev => ({
      ...prev,
      isUnlimited: unlimited,
      remaining: unlimited ? Infinity : Math.max(0, FREE_TIER_LIMIT - prev.monthlyUsed)
    }));
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
      isUnlimited: data.isUnlimited
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { canAnalyze: true, remaining: 3 };
  }
};