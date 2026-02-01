import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseFacade as supabase } from '../lib/supabaseFacade';
import { shouldPreserveIntent } from '../utils/routeConfig';
import { hasMagicLinkTokens } from './useRouting';

/**
 * useAuth - Authentication state management
 * 
 * Manages session, user tier, auth state changes, and user data fetching.
 * Uses actionsRef pattern for cross-cutting concerns (navigation, analysis state).
 * 
 * @param {object} config
 * @param {React.MutableRefObject} config.actionsRef - Ref containing cross-cutting callbacks
 * @param {object} config.sharedRefs - Shared refs { pendingAnalysisProcessed, oauthCallbackProcessed }
 * @param {object} config.tabVisibility - { isTabVisible, wasRecentlyHidden }
 */
export function useAuth({ actionsRef, sharedRefs, tabVisibility }) {
  const { pendingAnalysisProcessed, oauthCallbackProcessed } = sharedRefs;
  const { isTabVisible, wasRecentlyHidden } = tabVisibility;

  // Auth state
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [dashboardData, setDashboardData] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

  // Performance optimization: User data caching
  const userDataCache = useRef(new Map());
  const fetchingUsers = useRef(new Set());
  const lastFetchTime = useRef(new Map());
  const CACHE_DURATION = 30000;
  
  // Auth state change debouncing
  const authStateChangeInProgress = useRef(false);
  const lastAuthStateChange = useRef(0);
  const AUTH_DEBOUNCE_DELAY = 500;

  // Clear cache when user changes
  useEffect(() => {
    if (session?.user?.id) {
      const currentCachedUsers = Array.from(userDataCache.current.keys());
      if (currentCachedUsers.length > 0 && !currentCachedUsers.includes(session.user.id)) {
        console.log('🧹 Clearing user data cache for user change');
        userDataCache.current.clear();
        lastFetchTime.current.clear();
        fetchingUsers.current.clear();
      }
    }
  }, [session?.user?.id]);

  // Fetch user tier from database
  const fetchUserTier = useCallback(async (userId, userEmail = null, userSession = null) => {
    const actions = actionsRef.current;

    if (isTabVisible === false && wasRecentlyHidden && wasRecentlyHidden() && fetchingUsers.current.has(userId)) {
      console.log('👁️ Tab recently hidden and already fetching - skipping user tier fetch');
      return;
    }
    
    if (fetchingUsers.current.has(userId)) {
      console.log('🔄 Already fetching user tier for:', userId, '- skipping duplicate call');
      return;
    }
    
    // Check localStorage first for backup tier data
    const localTier = localStorage.getItem(`user_tier_${userId}`);
    const localEmail = localStorage.getItem(`user_email_${userId}`);
    if (localTier) {
      console.log('📱 Found local tier data:', localTier, 'for user:', localEmail);
      setUserTier(localTier);
      if (localTier === 'coffee' && actions.setUnlimitedAccess) {
        actions.setUnlimitedAccess(true);
      }
    }
    
    // Check cache
    const cacheKey = userId;
    const cachedData = userDataCache.current.get(cacheKey);
    const lastFetch = lastFetchTime.current.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log('✅ Using cached user data for:', userId);
      setUserTier(cachedData.tier || localTier || 'free');
      setDashboardData(cachedData);
      if (cachedData.tier === 'coffee' && actions.setUnlimitedAccess) {
        actions.setUnlimitedAccess(true);
      }
      return;
    }
    
    try {
      console.log('🔍 Fetching user tier for:', userId);
      fetchingUsers.current.add(userId);

      const real = await supabase.loadRealSupabase ? await supabase.loadRealSupabase() : supabase;
      let { data, error } = await real.rpc('get_user_data', { user_id: userId });

      if (error) {
        console.warn('⚠️ RPC function failed, trying direct query:', error);
        const result = await real
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        data = result.data ? [result.data] : null;
        error = result.error;
      }

      if (error) {
        console.error('❌ Database query failed with error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const userData = Array.isArray(data) ? data[0] : data;
        console.log('✅ User data fetched successfully:', userData);
        
        localStorage.setItem(`user_tier_${userId}`, userData.tier || 'free');
        localStorage.setItem(`user_email_${userId}`, userData.email || session?.user?.email || '');
        
        userDataCache.current.set(cacheKey, userData);
        lastFetchTime.current.set(cacheKey, now);
        
        setUserTier(userData.tier || 'free');
        setDashboardData(userData);
        
        if (userData.tier === 'coffee' && actions.setUnlimitedAccess) {
          actions.setUnlimitedAccess(true);
        }
      } else {
        console.warn('⚠️ No user data found for:', userId);
        
        const existingLocalTier = localStorage.getItem(`user_tier_${userId}`);
        if (existingLocalTier && existingLocalTier !== 'free') {
          console.log('🔧 Database query failed but found existing tier in localStorage:', existingLocalTier);
          return;
        }
        
        const currentSession = userSession || session;
        const pendingCoffeeTier = sessionStorage.getItem('pendingCoffeeTier');
        const needsTierSelection = localStorage.getItem('needs_tier_selection');
        const selectedTier = localStorage.getItem('selectedTier');
        
        const createdAt = currentSession?.user?.created_at;
        const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
        const currentTime = new Date().getTime();
        const timeSinceCreation = currentTime - createdTime;
        const isNewSignup = createdAt && timeSinceCreation < 600000;
        
        const metadataTier = currentSession?.user?.user_metadata?.selected_tier || 
                            currentSession?.user?.user_metadata?.tier;
        
        if (pendingCoffeeTier || selectedTier === 'coffee') {
          console.log('☕ User selected Coffee tier - waiting for Stripe payment');
          setUserTier('pending_payment');
          return;
        }
        
        if (metadataTier === 'coffee') {
          console.log('☕ User selected Coffee tier in signup - waiting for Stripe payment');
          setUserTier('pending_payment');
        } else if (metadataTier === 'free') {
          const isVerified = currentSession?.user?.email_confirmed_at || currentSession?.user?.confirmed_at;
          if (isVerified) {
            console.log('🆓 User selected Free tier and email verified - creating account');
            await createDefaultUser(userId, userEmail);
          } else {
            console.log('⚠️ User selected Free tier but email not verified');
            setUserTier('pending_verification');
          }
        } else if (isNewSignup || !createdAt) {
          console.log('🆕 User needs tier selection (new or unknown age)');
          setUserTier('pending_registration');
          localStorage.setItem('needs_tier_selection', 'true');
          const currentView = actions.getCurrentView ? actions.getCurrentView() : '';
          if (currentView !== 'register' && currentView !== 'signup') {
            if (actions.navigate) actions.navigate('signup');
          }
        } else {
          console.log('🔄 Legacy user without tier selection - needs to choose tier');
          setUserTier('pending_registration');
          localStorage.setItem('needs_tier_selection', 'true');
          const currentView = actions.getCurrentView ? actions.getCurrentView() : '';
          if (currentView !== 'register' && currentView !== 'signup') {
            if (actions.navigate) actions.navigate('signup');
          }
        }
      }
    } catch (error) {
      console.error('❌ Could not fetch user tier:', error);
      if (error.code) {
        console.error('Database error code:', error.code);
        console.error('Database error message:', error.message);
        console.error('Database error details:', error.details);
      }
      
      const fallbackTier = localStorage.getItem(`user_tier_${userId}`) || 'free';
      console.log('⚠️ Using fallback tier:', fallbackTier);
      setUserTier(fallbackTier);
      if (fallbackTier === 'coffee' && actions.setUnlimitedAccess) {
        actions.setUnlimitedAccess(true);
      }
    } finally {
      fetchingUsers.current.delete(userId);
    }
  }, [session, isTabVisible, wasRecentlyHidden, actionsRef]);

  // Create default user in database
  const createDefaultUser = useCallback(async (userId, userEmail = null) => {
    try {
      console.log('🔧 Creating default user for:', userId, 'with email:', userEmail);
      
      const email = userEmail || session?.user?.email;
      if (!email) {
        console.error('❌ No email available for user creation.');
        throw new Error('No user email available');
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          tier: 'free',
          subscription_tier: 'free',
          monthly_analyses_used: 0,
          subscription_status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create default user:', error);
        return;
      }

      console.log('✅ Created default user:', data);
      setUserTier('free');
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Error creating default user:', error);
      setUserTier('free');
    }
  }, [session]);

  // Check for existing session on app load
  const checkAuthInBackground = useCallback(async () => {
    try {
      console.log('🔄 Starting session restoration check...');
      setIsLoadingAuth(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const real = await supabase.loadRealSupabase ? await supabase.loadRealSupabase() : supabase;
      const { data: { session: restoredSession }, error } = await real.auth.getSession();
      
      console.log('🔍 Session restoration result:', {
        hasSession: !!restoredSession,
        hasUser: !!restoredSession?.user,
        userEmail: restoredSession?.user?.email,
        expiresAt: restoredSession?.expires_at,
        error: error?.message
      });
      
      if (error) {
        console.warn('⚠️ Session restoration error:', error);
        setSession(null);
        setSessionChecked(true);
        setIsLoadingAuth(false);
        return;
      }
      
      if (restoredSession && restoredSession.user) {
        const now = Math.floor(Date.now() / 1000);
        if (restoredSession.expires_at && restoredSession.expires_at > now) {
          console.log('✅ Valid session restored, setting auth state');
          setSession(restoredSession);

          fetchUserTier(restoredSession.user.id, restoredSession.user.email).catch(err => {
            console.warn('Failed to fetch user tier:', err);
            setUserTier('free');
          });

          // Wait for session state to propagate before navigation
          setTimeout(() => {
            const actions = actionsRef.current;
            const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
            const pendingId = localStorage.getItem('pendingAnalysisId');
            const landingData = localStorage.getItem('landingAnalysisData');

            if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
              console.log('✅ Initial session: Found pending analysis, redirecting to results');
              pendingAnalysisProcessed.current = true;

              try {
                const data = JSON.parse(landingData);
                if (actions.setAnalysisResults) actions.setAnalysisResults(data.results);
                if (actions.setCurrentUrl) actions.setCurrentUrl(pendingUrl);
                if (actions.setCurrentAnalysisId) actions.setCurrentAnalysisId(pendingId);
                if (actions.navigate) actions.navigate('results');
                localStorage.removeItem('pendingAnalysisUrl');
                localStorage.removeItem('pendingAnalysisId');
                localStorage.removeItem('landingAnalysisData');
              } catch (parseError) {
                console.error('Error parsing pending analysis data:', parseError);
                if (actions.navigate) actions.navigate('dashboard');
              }
            } else if (!pendingAnalysisProcessed.current) {
              const intendedRoute = localStorage.getItem('intended_route');
              if (intendedRoute && shouldPreserveIntent(intendedRoute)) {
                console.log('🎯 Restoring intended route after session restoration:', intendedRoute);
                localStorage.removeItem('intended_route');
                if (actions.navigate) actions.navigate(intendedRoute);
              } else {
                if (actions.navigate) actions.navigate('dashboard');
              }
            }
          }, 100);
        } else {
          console.warn('⚠️ Session expired, clearing auth state');
          setSession(null);
          await real.auth.signOut();
        }
      } else {
        console.log('📝 No session found, user needs to authenticate');
        setSession(null);
      }
      
      setSessionChecked(true);

      // Process deferred routes
      const processDeferredRoutes = () => {
        const actions = actionsRef.current;
        const pendingRoute = localStorage.getItem('initial_route_pending');
        const deferredRoute = localStorage.getItem('deferred_route');
        const currentHash = window.location.hash.slice(1);

        if (pendingRoute === 'checkout-success' || deferredRoute === 'checkout-success' || currentHash === 'checkout-success') {
          console.log('🔒 SECURITY: User on checkout-success, preserving route');
          localStorage.removeItem('initial_route_pending');
          localStorage.removeItem('deferred_route');
          if (actions.navigate) actions.navigate('checkout-success');
        } else if (deferredRoute) {
          console.log('🔒 SECURITY: Processing deferred route after session check:', deferredRoute);
          localStorage.removeItem('deferred_route');
          if (actions.navigate) actions.navigate(deferredRoute);
        } else if (pendingRoute) {
          console.log('🔒 SECURITY: Processing initial pending route:', pendingRoute);
          localStorage.removeItem('initial_route_pending');
          if (actions.navigate) actions.navigate(pendingRoute);
        }
      };

      processDeferredRoutes();
    } catch (error) {
      console.warn('⚠️ Session restoration failed:', error);
      setSession(null);
      setSessionChecked(true);

      // Process deferred routes even on error
      const actions = actionsRef.current;
      const pendingRoute = localStorage.getItem('initial_route_pending');
      const deferredRoute = localStorage.getItem('deferred_route');
      const currentHash = window.location.hash.slice(1);

      if (pendingRoute === 'checkout-success' || deferredRoute === 'checkout-success' || currentHash === 'checkout-success') {
        localStorage.removeItem('initial_route_pending');
        localStorage.removeItem('deferred_route');
        if (actions.navigate) actions.navigate('checkout-success');
      } else if (deferredRoute) {
        localStorage.removeItem('deferred_route');
        if (actions.navigate) actions.navigate(deferredRoute);
      } else if (pendingRoute) {
        localStorage.removeItem('initial_route_pending');
        if (actions.navigate) actions.navigate(pendingRoute);
      }
    } finally {
      setIsLoadingAuth(false);
    }
  }, [fetchUserTier, actionsRef, pendingAnalysisProcessed]);

  // App initialization - check for existing session
  useEffect(() => {
    console.log('🚀 App initializing with session persistence...');

    if (window.location.pathname === '/login') {
      const actions = actionsRef.current;
      if (actions.navigate) actions.navigate('login');
      setSessionChecked(true);
      setIsLoadingAuth(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    const hash = window.location.hash.slice(1);
    const hasOAuthTokens = hash && (hash.includes('access_token=') || hash.includes('refresh_token='));
    const hasMagicLink = hasMagicLinkTokens();
    const isOAuthReturn = hasOAuthTokens && !hash.includes('/');
    
    if (hasOAuthTokens || hasMagicLink || isOAuthReturn) {
      console.log('🔐 Authentication tokens detected, routing to oauth-callback');
      const actions = actionsRef.current;
      if (actions.navigateInternal) actions.navigateInternal('oauth-callback');
      setSessionChecked(true);
      setIsLoadingAuth(false);
      return;
    }
    
    console.log('⏳ Checking for existing session before rendering...');
    checkAuthInBackground();
  }, []);

  // Enhanced auth state listener
  useEffect(() => {
    console.log('🔧 Setting up enhanced onAuthStateChange listener...');

    let subscription;

    const setupAuthListener = async () => {
      const {
        data: { subscription: sub },
      } = await supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('🔐 Auth state changed:', event, newSession?.user?.email);
        const actions = actionsRef.current;

        // Handle initial session restoration
        if (event === 'INITIAL_SESSION') {
          console.log('🔄 INITIAL_SESSION detected:', { hasSession: !!newSession });

          if (newSession && !sessionChecked) {
            console.log('✅ Session restored from storage on app load');
            setSession(newSession);
            setSessionChecked(true);
            setIsLoadingAuth(false);

            fetchUserTier(newSession.user.id, newSession.user.email).catch(err => {
              console.warn('Failed to fetch user tier for restored session:', err);
              setUserTier('free');
            });

            const urlHash = window.location.hash.slice(1);
            if (urlHash === 'oauth-callback' || urlHash.startsWith('oauth-callback')) {
              console.log('📍 OAuth callback in URL - skipping auto-navigation');
              return;
            }

            const intendedRoute = localStorage.getItem('intended_route');
            if (intendedRoute && shouldPreserveIntent(intendedRoute)) {
              console.log('🎯 Restoring intended route:', intendedRoute);
              localStorage.removeItem('intended_route');
              if (actions.navigate) actions.navigate(intendedRoute);
            } else {
              if (actions.navigate) actions.navigate('dashboard');
            }
          } else if (!newSession && !sessionChecked) {
            console.log('📝 No session available on initial load');
            setSession(null);
            setSessionChecked(true);
            setIsLoadingAuth(false);
          }
          return;
        }
        
        // Handle sign in
        if (event === 'SIGNED_IN' && newSession) {
          console.log('✅ SIGNED_IN event detected');
          const currentView = actions.getCurrentView ? actions.getCurrentView() : '';

          if (currentView !== 'oauth-callback' && !oauthCallbackProcessed.current) {
            console.log('✅ SIGNED_IN event - routing to oauth-callback');
            setSession(newSession);
            setSessionChecked(true);
            setIsLoadingAuth(false);
            if (actions.navigateInternal) actions.navigateInternal('oauth-callback');
            window.location.hash = 'oauth-callback';
            return;
          } else {
            console.log('✅ SIGNED_IN event - already processed, skipping redirect');
            setSession(newSession);
            setSessionChecked(true);
            setIsLoadingAuth(false);
            return;
          }
        }

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setSession(null);
          setSessionChecked(true);
          setIsLoadingAuth(false);
          if (actions.navigateInternal) actions.navigateInternal('landing');
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('🔄 Token refreshed, updating session');
          setSession(newSession);
          return;
        }

        const currentTime = Date.now();

        if (isTabVisible === false && wasRecentlyHidden && wasRecentlyHidden() && authStateChangeInProgress.current) {
          console.log('👁️ Tab recently hidden and auth change in progress - skipping');
          return;
        }
        
        if (authStateChangeInProgress.current || (currentTime - lastAuthStateChange.current) < AUTH_DEBOUNCE_DELAY) {
          console.log('🔄 Debouncing auth state change');
          return;
        }
        
        authStateChangeInProgress.current = true;
        lastAuthStateChange.current = currentTime;
        
        try {
          const isEmailVerified = newSession?.user?.email_confirmed_at || newSession?.user?.confirmed_at;
          
          if (newSession && !isEmailVerified) {
            console.log('⚠️ User email not verified, preventing auto-login');
            const pendingFreeTier = localStorage.getItem('pendingFreeTier');
            if (pendingFreeTier) {
              const data = JSON.parse(pendingFreeTier);
              if (new Date() - new Date(data.timestamp) < 300000) {
                setPendingVerificationEmail(data.email);
                if (actions.navigate) actions.navigate('email-verification');
                await supabase.auth.signOut();
                return;
              }
            }
          }
          
          setSession(newSession);
          if (newSession?.user?.id && isEmailVerified) {
            // Check for pending analysis
            let pendingUrl = localStorage.getItem('pendingAnalysisUrl');
            let pendingId = localStorage.getItem('pendingAnalysisId');
            let landingData = localStorage.getItem('landingAnalysisData');
            
            // Fallback: Check URL parameters (magic link flow)
            if (!pendingUrl || !pendingId) {
              const urlParams = new URLSearchParams(window.location.search);
              const urlFromParams = urlParams.get('analysisUrl');
              const idFromParams = urlParams.get('analysisId');
              const tierFromParams = urlParams.get('tier');
              
              if (urlFromParams && idFromParams) {
                console.log('🔧 Fallback: Found analysis data in URL parameters');
                pendingUrl = urlFromParams;
                pendingId = idFromParams;
                localStorage.setItem('pendingAnalysisUrl', pendingUrl);
                localStorage.setItem('pendingAnalysisId', pendingId);
                if (tierFromParams) localStorage.setItem('selectedTier', tierFromParams);
                
                if (!landingData) {
                  const minimalData = {
                    analysisId: pendingId,
                    url: pendingUrl,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    fromUrlParams: true
                  };
                  landingData = JSON.stringify(minimalData);
                  localStorage.setItem('landingAnalysisData', landingData);
                }
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
            
            if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
              console.log('🎯 Auth state changed, found pending analysis - redirecting to results');
              pendingAnalysisProcessed.current = true;
              
              try {
                const data = JSON.parse(landingData);
                if (actions.setAnalysisResults) actions.setAnalysisResults(data.results);
                if (actions.setCurrentUrl) actions.setCurrentUrl(pendingUrl);
                if (actions.setCurrentAnalysisId) actions.setCurrentAnalysisId(pendingId);
                
                const selectedTier = localStorage.getItem('selectedTier');
                if (selectedTier === 'coffee' && actions.handleUpgrade) {
                  console.log('User selected Coffee tier, triggering payment flow');
                  actions.handleUpgrade('coffee');
                }
                
                if (actions.navigate) actions.navigate('results');
                localStorage.removeItem('pendingAnalysisUrl');
                localStorage.removeItem('pendingAnalysisId');
                localStorage.removeItem('landingAnalysisData');
                localStorage.removeItem('selectedTier');
                
                fetchUserTier(newSession.user.id, newSession.user.email, newSession).catch(error => {
                  console.warn('⚠️ Database error during pending analysis flow:', error);
                  setUserTier('free');
                });
                
                return;
              } catch (parseError) {
                console.error('❌ Error parsing pending analysis data:', parseError);
                await fetchUserTier(newSession.user.id, newSession.user.email, newSession).catch(() => setUserTier('free'));
                if (actions.navigate) actions.navigate('dashboard');
                return;
              }
            }
            
            // No pending analysis - normal dashboard flow
            try {
              await fetchUserTier(newSession.user.id, newSession.user.email, newSession);
              const currentView = actions.getCurrentView ? actions.getCurrentView() : '';
              if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
                console.log('🎯 Auth state change: navigating to dashboard');
                if (actions.navigate) actions.navigate('dashboard');
              }
            } catch (fetchError) {
              console.warn('⚠️ Database error during normal auth flow:', fetchError);
              setUserTier('free');
              const currentView = actions.getCurrentView ? actions.getCurrentView() : '';
              if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
                if (actions.navigate) actions.navigate('dashboard');
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in auth state change handler:', error);
          setUserTier('free');
          const currentView = actions.getCurrentView ? actions.getCurrentView() : '';
          if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
            if (actions.navigate) actions.navigate('dashboard');
          }
        } finally {
          authStateChangeInProgress.current = false;
        }
      });
      
      subscription = sub;
    };

    setupAuthListener().catch(console.error);

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Check for tier refresh flag after payment
  useEffect(() => {
    if (!session?.user?.id) return;

    const tierRefreshNeeded = sessionStorage.getItem('tier_refresh_needed');
    if (tierRefreshNeeded === 'true') {
      console.log('💳 Tier refresh requested after payment');
      const userId = session.user.id;
      userDataCache.current.delete(userId);
      lastFetchTime.current.delete(userId);

      fetchUserTier(userId, session.user.email, session).then(() => {
        console.log('✅ Tier refreshed after payment');
        sessionStorage.removeItem('tier_refresh_needed');
        sessionStorage.removeItem('tier_refresh_timestamp');
      }).catch(err => {
        console.error('❌ Failed to refresh tier after payment:', err);
      });
    }
  }, [session?.user?.id]);

  // Sign out function
  const signOut = useCallback(async () => {
    console.log('🧹 Clearing all user data cache on sign out');
    userDataCache.current.clear();
    lastFetchTime.current.clear();
    fetchingUsers.current.clear();
    pendingAnalysisProcessed.current = false;
    authStateChangeInProgress.current = false;
    
    const keysToRemove = [
      'pendingAnalysisUrl',
      'pendingAnalysisId',
      'landingAnalysisData',
      'selectedTier',
      'registrationEmail',
      'analysisHistory',
      'user-tier',
      'cookie-consent',
      'usageTracking',
      ...Object.keys(localStorage).filter(key => key.startsWith('welcome_dismissed_')),
      ...Object.keys(localStorage).filter(key => key.startsWith('usage_'))
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    const supabaseKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    supabaseKeys.forEach(key => localStorage.removeItem(key));
    
    setSession(null);
    setUserTier('free');
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    
    localStorage.clear();
    sessionStorage.clear();
  }, [pendingAnalysisProcessed]);

  // UserInitializer callback
  const handleUserReady = useCallback((userData) => {
    setUserReady(true);
    if (userData?.tier) {
      console.log('📊 Setting user tier from UserInitializer:', userData.tier);
      setUserTier(userData.tier);
      if (userData.tier === 'coffee') {
        const actions = actionsRef.current;
        if (actions.setUnlimitedAccess) actions.setUnlimitedAccess(true);
      }
    }
  }, [actionsRef]);

  return {
    session,
    isLoadingAuth,
    sessionChecked,
    userTier,
    dashboardData,
    showWelcome,
    setShowWelcome,
    userReady,
    pendingVerificationEmail,
    setPendingVerificationEmail,
    fetchUserTier,
    signOut,
    handleUserReady,
    setUserTier,
  };
}
