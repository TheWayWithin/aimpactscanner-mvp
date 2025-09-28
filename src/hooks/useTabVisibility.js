import { useState, useEffect, useRef } from 'react';

export const useTabVisibility = () => {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [tabHiddenAt, setTabHiddenAt] = useState(null);
  const [tabVisibleAt, setTabVisibleAt] = useState(Date.now());
  const visibilityChangeCount = useRef(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      visibilityChangeCount.current++;
      
      console.log(`🔍 Tab visibility changed: ${isVisible ? 'VISIBLE' : 'HIDDEN'} (change #${visibilityChangeCount.current})`);
      
      if (isVisible) {
        const hiddenDuration = tabHiddenAt ? Date.now() - tabHiddenAt : 0;
        console.log(`⏱️ Tab was hidden for ${hiddenDuration}ms`);
        setTabVisibleAt(Date.now());
        setIsTabVisible(true);
      } else {
        setTabHiddenAt(Date.now());
        setIsTabVisible(false);
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window gained focus');
      if (!isTabVisible) {
        setIsTabVisible(true);
        setTabVisibleAt(Date.now());
      }
    };

    const handleBlur = () => {
      console.log('💨 Window lost focus');
      // Don't immediately mark as hidden on blur - wait for visibility change
      // This prevents false positives when clicking within the same tab
    };

    // Page Visibility API
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window focus/blur as backup
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Check initial state
    if (document.hidden) {
      console.log('🚀 Tab started in hidden state');
      setIsTabVisible(false);
      setTabHiddenAt(Date.now());
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [tabHiddenAt, isTabVisible]);

  return {
    isTabVisible,
    tabHiddenAt,
    tabVisibleAt,
    wasRecentlyHidden: () => {
      // Returns true if tab was hidden within last 2 seconds
      return tabHiddenAt && (Date.now() - tabHiddenAt) < 2000;
    },
    getHiddenDuration: () => {
      // Returns how long the tab was hidden in milliseconds
      if (!tabHiddenAt || isTabVisible) return 0;
      return Date.now() - tabHiddenAt;
    }
  };
};