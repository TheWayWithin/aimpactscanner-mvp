import { useState, useEffect, useRef, useCallback } from 'react';
import { isProtectedRoute, getUnauthenticatedRedirect, shouldPreserveIntent } from '../utils/routeConfig';

/**
 * Helper to check for magic link tokens in URL query parameters
 */
export const hasMagicLinkTokens = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('access_token') || 
         (urlParams.has('token') && urlParams.get('type') === 'magiclink') ||
         urlParams.has('confirmation_url');
};

/**
 * useRouting - Hash-based routing with route protection
 * 
 * Manages currentView state, browser history, popstate handling,
 * and security checks for protected routes.
 * 
 * @param {object} session - Current auth session (used for route protection)
 * @param {boolean} sessionChecked - Whether auth session has been verified
 */
export function useRouting(session, sessionChecked) {
  const [currentView, setCurrentViewState] = useState('landing');
  const currentViewRef = useRef('landing');

  // Refs for latest values (avoids stale closures in stable callbacks)
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const sessionCheckedRef = useRef(sessionChecked);
  sessionCheckedRef.current = sessionChecked;

  // Keep currentViewRef in sync
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const scrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 100);
  }, []);

  // Raw view setter without route protection
  const setCurrentViewInternal = useCallback((view) => {
    currentViewRef.current = view;
    setCurrentViewState(view);
  }, []);

  // Protected view setter with auth checks and history management
  const setCurrentView = useCallback((view) => {
    if (view === currentViewRef.current) return;

    // SECURITY: Check if route requires authentication
    if (isProtectedRoute(view)) {
      // Don't check auth if session check hasn't completed yet
      // EXCEPTION: checkout-success should never be deferred
      if (!sessionCheckedRef.current && view !== 'checkout-success') {
        console.log('⏳ SECURITY: Session check not complete - deferring navigation to:', view);
        localStorage.setItem('deferred_route', view);
        return;
      }

      const isAuthenticated = !!(sessionRef.current?.user?.id);

      if (!isAuthenticated) {
        console.log('🔒 SECURITY: Unauthorized access attempt to protected route:', view);
        console.log('🔄 SECURITY: Redirecting unauthenticated user to appropriate page');
        
        if (shouldPreserveIntent(view)) {
          localStorage.setItem('intended_route', view);
          console.log('💾 SECURITY: Stored intended route for post-auth redirect:', view);
        }
        
        const redirectRoute = getUnauthenticatedRedirect(view);
        console.log('📍 SECURITY: Redirecting to:', redirectRoute);
        view = redirectRoute;
      } else {
        console.log('✅ SECURITY: Authenticated user accessing protected route:', view);
      }
    }
    
    window.history.pushState({ view }, '', `#${view}`);
    setCurrentViewInternal(view);
    scrollToTop();
  }, [setCurrentViewInternal, scrollToTop]);

  // Handle browser back/forward and initial URL detection
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
      } else {
        const hash = window.location.hash.slice(1);

        if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
          console.log('🔐 OAuth tokens detected in popstate, routing to oauth-callback');
          setCurrentViewInternal('oauth-callback');
          window.scrollTo(0, 0);
        } else if (hasMagicLinkTokens()) {
          console.log('🔐 Magic Link tokens detected in popstate, routing to oauth-callback');
          setCurrentViewInternal('oauth-callback');
          window.scrollTo(0, 0);
        } else if (hash) {
          setCurrentView(hash);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Check initial URL
    const hash = window.location.hash.slice(1);

    console.log('🔍 APP INIT - Full URL:', window.location.href);
    console.log('🔍 APP INIT - Hash:', hash);
    console.log('🔍 APP INIT - Query params:', window.location.search);

    const hasOAuthTokens = hash && (hash.includes('access_token=') || hash.includes('refresh_token='));
    const hasMagicLink = hasMagicLinkTokens();
    const isOAuthReturn = hasOAuthTokens && !hash.includes('/');

    if (hasOAuthTokens || hasMagicLink || isOAuthReturn) {
      console.log('🔐 Authentication tokens detected, routing to oauth-callback');
      console.log('🔐 Token type:', { hasOAuthTokens, hasMagicLink, isOAuthReturn });
      setCurrentViewInternal('oauth-callback');
    } else if (hash && !hasOAuthTokens) {
      console.log('📍 INITIAL HASH DETECTED:', hash);
      localStorage.setItem('initial_route_pending', hash);
      console.log('🔒 SECURITY: Deferring route navigation until session check completes');
    } else if (window.location.pathname === '/login') {
      setCurrentView('login');
      window.history.replaceState({}, document.title, '/#login');
    } else if (window.location.pathname === '/register') {
      setCurrentView('register');
      window.history.replaceState({}, document.title, '/#register');
    }

    if (!hash || hasOAuthTokens) {
      window.history.replaceState({ view: currentViewRef.current }, '', `#${currentViewRef.current}`);
    }
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Global navigation handler for privacy policy links
  useEffect(() => {
    const handlePrivacyNavigation = () => {
      setCurrentView('privacy');
    };
    window.addEventListener('navigate-to-privacy', handlePrivacyNavigation);
    return () => window.removeEventListener('navigate-to-privacy', handlePrivacyNavigation);
  }, [setCurrentView]);

  return {
    currentView,
    setCurrentView,
    setCurrentViewInternal,
    currentViewRef,
  };
}
