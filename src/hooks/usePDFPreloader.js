/**
 * PDF Preloader Hook
 * 
 * Intelligently preloads PDF libraries when users are likely to need them
 * Improves user experience by reducing wait time for PDF generation
 */

import { useEffect, useRef } from 'react';

// PDF library preloader with intelligent timing
export const usePDFPreloader = (shouldPreload = false, delay = 2000) => {
  const preloadedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!shouldPreload || preloadedRef.current) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Preload after a delay to not interfere with initial page load
    timeoutRef.current = setTimeout(async () => {
      try {
        console.log('🚀 Preloading PDF libraries in background...');
        
        // Import libraries without blocking
        await Promise.all([
          import('jspdf'),
          import('html2canvas')
        ]);
        
        preloadedRef.current = true;
        console.log('✅ PDF libraries preloaded successfully');
      } catch (error) {
        console.warn('⚠️ PDF preload failed (libraries will load on demand):', error);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldPreload, delay]);

  return preloadedRef.current;
};

// Hook to determine when PDF preloading would be beneficial
export const usePDFPreloadTrigger = (currentView, userTier) => {
  // Preload conditions:
  // 1. User is on results dashboard (likely to generate PDF)
  // 2. User has Coffee+ tier (has PDF access)
  // 3. User is on pricing page (might upgrade to PDF tier)
  
  const shouldPreload = 
    currentView === 'results' || 
    currentView === 'dashboard' ||
    (currentView === 'pricing' && userTier === 'free') ||
    userTier === 'coffee';

  return shouldPreload;
};

export default usePDFPreloader;