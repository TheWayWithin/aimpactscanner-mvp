// New App with conversion-optimized flow
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import './App.css';
// Use Supabase facade for initial auth, loads full SDK only when needed
import { supabaseFacade as supabase } from './lib/supabaseFacade';
import { initializeFallbackData } from './utils/userFallback';

// Analytics and Privacy  
import { GTMIntegration, useGTMTracking } from './analytics/gtm-integration.jsx';
// import { EnzuzoIntegration } from './privacy/enzuzo-integration.jsx';

// New components for conversion flow
import Landing from './components/Landing';
import AnalysisPreview from './components/AnalysisPreview';
import PreviewAnalysis from './components/PreviewAnalysis';
import PreviewResults from './components/PreviewResults';

// Lazy-loaded heavy components for bundle optimization
const AnalysisHistory = React.lazy(() => import('./components/AnalysisHistory'));
const AuthWithPassword = React.lazy(() => import('./components/AuthWithPassword'));
const CoffeeTierSignup = React.lazy(() => import('./components/CoffeeTierSignup'));
const UnifiedRegistration = React.lazy(() => import('./components/UnifiedRegistration'));
const SimpleAccountDashboard = React.lazy(() => import('./components/SimpleAccountDashboard'));
const RegistrationFlow = React.lazy(() => import('./components/RegistrationFlow'));
const DiagnosticSignup = React.lazy(() => import('./pages/DiagnosticSignup'));

// Keep frequently used components as regular imports
import Login from './components/Login';
import SimpleAnalysisProgress from './components/SimpleAnalysisProgress';
import SimpleResultsDashboard from './components/SimpleResultsDashboard';
import URLInput from './components/URLInput';
import TierIndicator from './components/TierIndicator';
import TierSelection from './components/TierSelection';
import AccountDashboard from './components/AccountDashboard';
import EmailVerificationPending from './components/EmailVerificationPending';
import UserInitializer from './components/UserInitializer';
import { useUpgrade } from './components/UpgradeHandler';
import { useUsageTracking } from './hooks/useUsageTracking';
import { useTabVisibility } from './hooks/useTabVisibility';
import { usePDFPreloader, usePDFPreloadTrigger } from './hooks/usePDFPreloader';
import AuthenticatedHeader from './components/AuthenticatedHeader';
import AILogo from './components/AILogo';
import PrivacyPolicyPage from './components/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './components/TermsOfServicePage.jsx';
import ContactPage from './components/ContactPage.jsx';
import AboutPage from './components/AboutPage.jsx';
import Footer from './components/Footer.jsx';
import NavigationButtons from './components/NavigationButtons.jsx';
import SimpleConsentBanner from './components/SimpleConsentBanner.jsx'; // Optimized for LCP performance
import PerformanceOptimizer, { usePerformanceMonitoring } from './components/PerformanceOptimizer.jsx';

// Loading component for Suspense boundaries - Memoized for performance
const ComponentLoader = React.memo(({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
));

function AppContent({ initialUrl }) {
  // Initialize performance monitoring
  usePerformanceMonitoring();
  
  // Initialize fallback data for known users immediately
  useEffect(() => {
    initializeFallbackData();
  }, []);

  // Handle initial URL from static hero
  useEffect(() => {
    if (initialUrl && !pendingAnalysisProcessed.current) {
      // Set the URL in the state for analysis
      setCurrentUrl(initialUrl);
      // Mark that we have a pending analysis from the static hero
      setPendingAnalysis({ url: initialUrl, fromStaticHero: true });
    }
  }, [initialUrl]);

  const [session, setSession] = useState(null);
  const [currentView, setCurrentViewInternal] = useState('landing'); // Start with landing page
  
  // Wrapper for setCurrentView that manages browser history
  const setCurrentView = (view) => {
    if (view !== currentView) {
      // Push to browser history for navigation tracking
      window.history.pushState({ view }, '', `#${view}`);
      setCurrentViewInternal(view);
      // Scroll to top when changing views
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      // Force scroll with a small delay to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 100);
    }
  };
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [dashboardData, setDashboardData] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // GTM tracking hooks
  const {
    trackPageView,
    trackAnalysisStart,
    trackAnalysisComplete,
    trackSignup,
    trackUpgrade,
    trackFeatureUsage,
    trackError
  } = useGTMTracking();
  
  // Track if we've already processed the pending analysis to prevent duplicate processing
  const pendingAnalysisProcessed = useRef(false);

  // PDF preloading optimization
  const shouldPreloadPDF = usePDFPreloadTrigger(currentView, userTier);
  const isPDFPreloaded = usePDFPreloader(shouldPreloadPDF, 3000); // 3 second delay
  
  // Performance optimization: User data caching and deduplication
  const userDataCache = useRef(new Map());
  const fetchingUsers = useRef(new Set());
  const lastFetchTime = useRef(new Map());
  const CACHE_DURATION = 30000; // 30 seconds cache
  
  // Authentication state change debouncing
  const authStateChangeInProgress = useRef(false);
  const lastAuthStateChange = useRef(0);
  const AUTH_DEBOUNCE_DELAY = 500; // 500ms debounce

  // Usage tracking hook
  const { 
    usageData, 
    incrementUsage, 
    canAnalyze, 
    setUnlimitedAccess,
    resetMonthlyUsage
  } = useUsageTracking(session?.user?.email);

  // Tab visibility tracking
  const { isTabVisible, wasRecentlyHidden } = useTabVisibility();

  // Track page views when current view changes
  useEffect(() => {
    trackPageView(`/${currentView}`);
  }, [currentView]);

  // Global navigation handler for privacy policy links
  useEffect(() => {
    const handlePrivacyNavigation = () => {
      setCurrentView('privacy');
    };
    
    window.addEventListener('navigate-to-privacy', handlePrivacyNavigation);
    return () => window.removeEventListener('navigate-to-privacy', handlePrivacyNavigation);
  }, []);

  // Clear cache when user changes to prevent stale data
  useEffect(() => {
    if (session?.user?.id) {
      // Clear any cached data for different users
      const currentCachedUsers = Array.from(userDataCache.current.keys());
      if (currentCachedUsers.length > 0 && !currentCachedUsers.includes(session.user.id)) {
        console.log('🧹 Clearing user data cache for user change');
        userDataCache.current.clear();
        lastFetchTime.current.clear();
        fetchingUsers.current.clear();
      }
    }
  }, [session?.user?.id]);

  // Upgrade handler hooks
  const handleUpgradeSuccess = (message) => {
    // Track successful upgrade
    const newTier = message.includes('Coffee') ? 'coffee' : 'professional';
    const tierValue = newTier === 'coffee' ? 5 : 25; // Coffee: $5, Professional: $25
    trackUpgrade(userTier, newTier, tierValue);
    
    // Refresh user tier after successful upgrade
    if (session?.user?.id) {
      fetchUserTier(session.user.id, session.user.email);
    }
    // Continue with pending analysis if exists
    if (pendingAnalysis) {
      setCurrentView('results');
    }
  };

  const handleUpgradeError = (error) => {
    alert(`Upgrade failed: ${error}`);
  };

  const { handleUpgrade, loading: upgradeLoading } = useUpgrade(
    session?.user, 
    handleUpgradeSuccess, 
    handleUpgradeError
  );

  useEffect(() => {
    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setCurrentViewInternal(event.state.view);
        window.scrollTo(0, 0);
      } else {
        // Handle direct URL navigation or initial load
        const hash = window.location.hash.slice(1);

        // Check if hash contains OAuth tokens from Supabase
        if (hash && (hash.includes('access_token=') || hash.includes('refresh_token='))) {
          console.log('🔐 OAuth tokens detected in popstate, routing to oauth-callback');
          setCurrentViewInternal('oauth-callback');
          window.scrollTo(0, 0);
        } else if (hash) {
          setCurrentViewInternal(hash);
          window.scrollTo(0, 0);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Check initial URL
    const hash = window.location.hash.slice(1);

    // CRITICAL: Check if hash contains OAuth tokens from Supabase
    // OAuth tokens look like: access_token=xxx&expires_in=3600&refresh_token=xxx
    console.log('🔍 Initial URL hash:', hash);
    if (hash && (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('type=recovery'))) {
      console.log('🔐 OAuth/auth tokens detected in URL, routing to oauth-callback');
      setCurrentViewInternal('oauth-callback');
    } else if (hash) {
      console.log('📍 Setting view to:', hash);
      setCurrentViewInternal(hash);
    } else if (window.location.pathname === '/login') {
      setCurrentView('login');
      // Clear URL to prevent issues with navigation
      window.history.replaceState({}, document.title, '/#login');
    } else if (window.location.pathname === '/register') {
      setCurrentView('register');
      window.history.replaceState({}, document.title, '/#register');
    }
    
    // Set initial history state
    window.history.replaceState({ view: currentView }, '', `#${currentView}`);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);  // Only run once on mount
  
  useEffect(() => {
    // CRITICAL FIX: Show landing page immediately, check auth in background
    // This prevents the 17-second delay by not blocking render on auth check

    // DEBUG: Log everything about the URL on load
    console.log('🔍 App mounted - Full URL:', window.location.href);
    console.log('🔍 App mounted - Hash:', window.location.hash);
    console.log('🔍 App mounted - Hash.slice(1):', window.location.hash.slice(1));

    // Check URL path for login route
    if (window.location.pathname === '/login') {
      setCurrentView('login');
      // Clear URL to prevent issues with navigation
      window.history.replaceState({}, document.title, window.location.pathname);
      return; // Exit early for login page
    }
    
    // For all other routes, show landing page first, then check auth
    if (currentView === 'landing') {
      // Already on landing, just check auth in background
      checkAuthInBackground();
    } else {
      // Set to landing immediately for fast render
      setCurrentView('landing');
      // Then check auth
      checkAuthInBackground();
    }
  }, []);

  // Separate function to check auth without blocking render
  const checkAuthInBackground = async () => {
    try {
      // Use facade for lightweight auth check (5KB vs 29KB)
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setSession(session);
        console.log('🚀 Using Supabase facade for auth check');
        
        // Fetch user tier in background (non-blocking)
        fetchUserTier(session.user.id, session.user.email).catch(err => {
          console.warn('Failed to fetch user tier:', err);
          setUserTier('free'); // Fallback
        });
        
        // Check if there's a pending analysis from landing page
        const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
        const pendingId = localStorage.getItem('pendingAnalysisId');
        const landingData = localStorage.getItem('landingAnalysisData');
        
        if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
          console.log('✅ Initial session: Found pending analysis, redirecting to results');
          pendingAnalysisProcessed.current = true; // Mark as processed
          
          try {
            const data = JSON.parse(landingData);
            setAnalysisResults(data.results);
            setCurrentUrl(pendingUrl);
            setCurrentAnalysisId(pendingId);
            setCurrentView('results');
            // Clear the pending data
            localStorage.removeItem('pendingAnalysisUrl');
            localStorage.removeItem('pendingAnalysisId');
            localStorage.removeItem('landingAnalysisData');
          } catch (error) {
            console.error('Error parsing pending analysis data:', error);
            setCurrentView('dashboard');
          }
        } else if (!pendingAnalysisProcessed.current) {
          setCurrentView('dashboard');
        }
      }
      // If no session, landing page is already showing
    } catch (error) {
      console.warn('Background auth check failed:', error);
      // Landing page is already showing, so no need to change view
    }
  };

  // Separate useEffect for auth state listener to avoid blocking initial render
  useEffect(() => {
    // Listen for auth state changes with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentTime = Date.now();
      
      // CRITICAL FIX: Only skip processing if tab was recently hidden AND we're processing rapid changes
      // Don't block initial auth flows or legitimate login processes
      if (isTabVisible === false && wasRecentlyHidden && wasRecentlyHidden() && authStateChangeInProgress.current) {
        console.log('👁️ Tab recently hidden and auth change in progress - skipping to prevent duplicates');
        return;
      }
      
      // Debounce rapid auth state changes
      if (authStateChangeInProgress.current || (currentTime - lastAuthStateChange.current) < AUTH_DEBOUNCE_DELAY) {
        console.log('🔄 Debouncing auth state change - too soon after last change');
        return;
      }
      
      authStateChangeInProgress.current = true;
      lastAuthStateChange.current = currentTime;
      
      try {
        // Check if user email is verified
        const isEmailVerified = session?.user?.email_confirmed_at || session?.user?.confirmed_at;
        
        // If user just signed up and email is not verified, don't process
        if (session && !isEmailVerified) {
          console.log('⚠️ User email not verified, preventing auto-login');
          // Check if this is a fresh sign-up (not a returning unverified user)
          const pendingFreeTier = localStorage.getItem('pendingFreeTier');
          if (pendingFreeTier) {
            const data = JSON.parse(pendingFreeTier);
            // If this sign-up happened in the last 5 minutes, show email verification
            if (new Date() - new Date(data.timestamp) < 300000) {
              setPendingVerificationEmail(data.email);
              setCurrentView('email-verification');
              // Sign out to prevent access
              await supabase.auth.signOut();
              return;
            }
          }
        }
        
        setSession(session);
        if (session?.user?.id && isEmailVerified) {
        // PRIORITY 1: Check for pending analysis BEFORE database operations
        let pendingUrl = localStorage.getItem('pendingAnalysisUrl');
        let pendingId = localStorage.getItem('pendingAnalysisId');
        let landingData = localStorage.getItem('landingAnalysisData');
        
        // Fallback: Check URL parameters if localStorage is empty (magic link flow)
        if (!pendingUrl || !pendingId) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlFromParams = urlParams.get('analysisUrl');
          const idFromParams = urlParams.get('analysisId');
          const tierFromParams = urlParams.get('tier');
          
          if (urlFromParams && idFromParams) {
            console.log('🔧 Fallback: Found analysis data in URL parameters');
            pendingUrl = urlFromParams;
            pendingId = idFromParams;
            
            // Store back to localStorage for consistency
            localStorage.setItem('pendingAnalysisUrl', pendingUrl);
            localStorage.setItem('pendingAnalysisId', pendingId);
            
            if (tierFromParams) {
              localStorage.setItem('selectedTier', tierFromParams);
            }
            
            // Create minimal landing data for URL parameter flow
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
            
            // Clean up URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        
        // Check for pending analysis from landing page
        
        if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
          console.log('🎯 Auth state changed, found pending analysis - redirecting to results');
          pendingAnalysisProcessed.current = true; // Mark as processed to prevent duplicate handling
          
          try {
            const data = JSON.parse(landingData);
            setAnalysisResults(data.results);
            setCurrentUrl(pendingUrl);
            setCurrentAnalysisId(pendingId);
            
            // Check if user selected Coffee tier
            const selectedTier = localStorage.getItem('selectedTier');
            if (selectedTier === 'coffee') {
              // Trigger Stripe checkout for Coffee tier
              console.log('User selected Coffee tier, triggering payment flow');
              handleUpgrade('coffee');
            }
            
            setCurrentView('results');
            // Clear the pending data
            localStorage.removeItem('pendingAnalysisUrl');
            localStorage.removeItem('pendingAnalysisId');
            localStorage.removeItem('landingAnalysisData');
            localStorage.removeItem('selectedTier');
            
            // PRIORITY 2: Fetch user tier in background (non-blocking)
            fetchUserTier(session.user.id, session.user.email, session).catch(error => {
              console.warn('⚠️ Database error during pending analysis flow (non-blocking):', error);
              // Set default tier to prevent issues, but don't block the analysis flow
              setUserTier('free');
            });
            
            return; // Exit early - don't proceed to dashboard logic
          } catch (error) {
            console.error('❌ Error parsing pending analysis data:', error);
            // Even on error, try to fetch user data before falling back
            await fetchUserTier(session.user.id, session.user.email, session).catch(() => setUserTier('free'));
            setCurrentView('dashboard');
            return;
          }
        }
        
        // PRIORITY 3: No pending analysis - proceed with normal dashboard flow
        try {
          await fetchUserTier(session.user.id, session.user.email, session);
          // Only change view if we're currently on landing or login page
          // This prevents overriding the view set by handleLoginComplete
          if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
            console.log('🎯 Auth state change: navigating from', currentView, 'to dashboard');
            setCurrentView('dashboard');
          }
        } catch (error) {
          console.warn('⚠️ Database error during normal auth flow:', error);
          // Set default tier and proceed to dashboard
          setUserTier('free');
          // Only change view if we're currently on landing or login page
          if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
            console.log('🎯 Auth state change (error path): navigating from', currentView, 'to dashboard');
            setCurrentView('dashboard');
          }
        }
        } // Close if (session?.user?.id) block
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        // Set default tier and proceed to dashboard on any auth error
        setUserTier('free');
        // Only change view if we're currently on landing or login page
        if (!pendingAnalysisProcessed.current && (currentView === 'landing' || currentView === 'login')) {
          console.log('🎯 Auth state change (main error): navigating from', currentView, 'to dashboard');
          setCurrentView('dashboard');
        }
      } finally {
        // Reset auth state change flag
        authStateChangeInProgress.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserTier = async (userId, userEmail = null, userSession = null) => {
    // CRITICAL FIX: Only skip if tab was recently hidden AND we're making duplicate calls
    // Don't block initial auth flows or legitimate data fetching
    if (isTabVisible === false && wasRecentlyHidden && wasRecentlyHidden() && fetchingUsers.current.has(userId)) {
      console.log('👁️ Tab recently hidden and already fetching - skipping user tier fetch to prevent duplicates');
      return;
    }
    
    // Performance optimization: Prevent duplicate calls for same user
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
      if (localTier === 'coffee') {
        setUnlimitedAccess(true);
      }
    }
    
    // Check cache first
    const cacheKey = userId;
    const cachedData = userDataCache.current.get(cacheKey);
    const lastFetch = lastFetchTime.current.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      console.log('✅ Using cached user data for:', userId);
      setUserTier(cachedData.tier || localTier || 'free');
      setDashboardData(cachedData);
      
      // Update unlimited access for Coffee tier
      if (cachedData.tier === 'coffee') {
        setUnlimitedAccess(true);
      }
      return;
    }
    
    try {
      console.log('🔍 Fetching user tier for:', userId);
      
      // Mark as being fetched
      fetchingUsers.current.add(userId);
      
      // Try the RPC function first (more reliable for missing users)
      let { data, error } = await supabase.rpc('get_user_data', { user_id: userId });
      
      if (error) {
        console.warn('⚠️ RPC function failed, trying direct query:', error);
        
        // Fallback to direct query with error handling
        const result = await supabase
          .from('users')
          .select('*') // Select all columns to avoid 406 errors
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors on missing rows
        
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
        
        // Store tier in localStorage as backup
        localStorage.setItem(`user_tier_${userId}`, userData.tier || 'free');
        localStorage.setItem(`user_email_${userId}`, userData.email || session?.user?.email || '');
        
        // Cache the data
        userDataCache.current.set(cacheKey, userData);
        lastFetchTime.current.set(cacheKey, now);
        
        setUserTier(userData.tier || 'free');
        setDashboardData(userData);
        
        // Update unlimited access for Coffee tier
        if (userData.tier === 'coffee') {
          setUnlimitedAccess(true);
        }
      } else {
        console.warn('⚠️ No user data found for:', userId);
        
        // CRITICAL FIX: Check localStorage first before assuming new user
        const existingLocalTier = localStorage.getItem(`user_tier_${userId}`);
        if (existingLocalTier && existingLocalTier !== 'free') {
          console.log('🔧 Database query failed but found existing tier in localStorage:', existingLocalTier);
          console.log('📱 User is existing subscriber - keeping localStorage tier instead of treating as new user');
          // Don't override the tier - it was already set correctly from localStorage
          return;
        }
        
        // Use passed session or fall back to state session
        const currentSession = userSession || session;
        
        // Check if we're in a registration flow
        const pendingCoffeeTier = sessionStorage.getItem('pendingCoffeeTier');
        const needsTierSelection = localStorage.getItem('needs_tier_selection');
        const selectedTier = localStorage.getItem('selectedTier');
        
        // Check if this is a new sign-up (created within last 10 minutes)
        const createdAt = currentSession?.user?.created_at;
        const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
        const currentTime = new Date().getTime();
        const timeSinceCreation = currentTime - createdTime;
        const isNewSignup = createdAt && timeSinceCreation < 600000; // 10 minutes
        
        // Check if user metadata indicates they're from signup flow
        const isFromSignup = currentSession?.user?.user_metadata?.signup_source || 
                           currentSession?.user?.user_metadata?.selected_tier ||
                           currentSession?.user?.user_metadata?.tier;
        
        // Determine if this is a new user requiring tier selection
        
        if (pendingCoffeeTier || selectedTier === 'coffee') {
          console.log('☕ User selected Coffee tier - waiting for Stripe payment');
          // Don't create user yet - wait for Stripe webhook
          setUserTier('pending_payment');
          return;
        }
        
        // ALWAYS treat users without database records as needing tier selection
        // Unless they explicitly have metadata indicating their tier choice
        const metadataTier = currentSession?.user?.user_metadata?.selected_tier || 
                            currentSession?.user?.user_metadata?.tier;
        
        if (metadataTier === 'coffee') {
          console.log('☕ User selected Coffee tier in signup - waiting for Stripe payment');
          setUserTier('pending_payment');
          // Don't redirect, let them complete the payment flow
        } else if (metadataTier === 'free') {
          // Check if email is verified before creating account
          const isVerified = currentSession?.user?.email_confirmed_at || currentSession?.user?.confirmed_at;
          if (isVerified) {
            console.log('🆓 User selected Free tier and email verified - creating account');
            await createDefaultUser(userId, userEmail);
          } else {
            console.log('⚠️ User selected Free tier but email not verified - waiting for verification');
            setUserTier('pending_verification');
            // Don't create account until email is verified
          }
        } else if (isNewSignup || !createdAt) {
          // If they're new OR we can't determine their age, send to tier selection
          console.log('🆕 User needs tier selection (new or unknown age)');
          setUserTier('pending_registration');
          // Store flag to indicate they need tier selection
          localStorage.setItem('needs_tier_selection', 'true');
          // Don't redirect if already on register page
          if (currentView !== 'register' && currentView !== 'coffee-signup') {
            setCurrentView('coffee-signup'); // Send to coffee-signup by default
          }
        } else {
          // Only create as free tier if they're clearly an old user (>10 minutes)
          // AND have no tier metadata
          console.log('🔄 Legacy user (>10 min old) without tier selection - needs to choose tier');
          setUserTier('pending_registration');
          localStorage.setItem('needs_tier_selection', 'true');
          if (currentView !== 'register' && currentView !== 'coffee-signup') {
            setCurrentView('coffee-signup');
          }
        }
      }
    } catch (error) {
      console.error('❌ Could not fetch user tier:', error);
      // More detailed error logging for debugging 406 errors
      if (error.code) {
        console.error('Database error code:', error.code);
        console.error('Database error message:', error.message);
        console.error('Database error details:', error.details);
      }
      
      // Use localStorage tier if available, otherwise default to free
      const fallbackTier = localStorage.getItem(`user_tier_${userId}`) || 'free';
      console.log('⚠️ Using fallback tier:', fallbackTier);
      setUserTier(fallbackTier);
      if (fallbackTier === 'coffee') {
        setUnlimitedAccess(true);
      }
      // Don't throw - handle gracefully with defaults
    } finally {
      // Always remove from fetching set when done
      fetchingUsers.current.delete(userId);
    }
  };

  const createDefaultUser = async (userId, userEmail = null) => {
    try {
      console.log('🔧 Creating default user for:', userId, 'with email:', userEmail);
      
      // Use passed email or fallback to session
      const email = userEmail || session?.user?.email;
      if (!email) {
        console.error('❌ No email available for user creation. Session email:', session?.user?.email);
        throw new Error('No user email available');
      }

      // Note: subscription_tier has a database constraint that only allows 'free', 'pro', 'agency', 'enterprise'
      // We use 'tier' field for our custom tier names (free, coffee, growth, scale)
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          tier: 'free', // Our custom tier names
          subscription_tier: 'free', // Database constraint: must be 'free', 'pro', 'agency', or 'enterprise'
          monthly_analyses_used: 0,
          subscription_status: 'active' // Database constraint: must be 'active', 'canceled', 'past_due', or 'unpaid'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create default user:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('✅ Created default user:', data);
      setUserTier('free');
      setDashboardData(data);
    } catch (error) {
      console.error('❌ Error creating default user:', error);
      setUserTier('free');
    }
  };

  // Handle analysis from landing page (no auth)
  const handleLandingAnalysis = (url, analysisId) => {
    setCurrentUrl(url);
    setCurrentAnalysisId(analysisId);
    setPendingAnalysis({ url, analysisId });
    // Show real-time progress during analysis
    setCurrentView('preview-analysis');
  };

  // Handle analysis completion from preview
  const handlePreviewAnalysisComplete = () => {
    setCurrentView('preview-results');
  };

  // Handle upgrade click from teaser results
  const handleUpgradeFromTeaser = async (tier) => {
    if (!session) {
      // Need to register first - use unified registration with password
      localStorage.setItem('selectedTier', tier);
      setCurrentView('unified-registration');
    } else {
      // Already logged in, go straight to payment
      if (tier === 'professional') {
        await handleUpgrade('professional');
      } else if (tier === 'starter') {
        await handleUpgrade('coffee'); // Map starter to coffee tier
      }
    }
  };

  // Handle free trial click from teaser - now goes to unified registration
  const handleFreeTrialFromTeaser = () => {
    if (!session) {
      // Show unified registration with Coffee tier pre-selected
      setCurrentView('unified-registration');
    } else {
      // Already logged in, show full results
      setCurrentView('results');
    }
  };

  // Handle registration completion from registration flow
  const handleRegistrationComplete = (user, tier) => {
    console.log('Registration completed:', { user: user?.id, tier });
    
    // Track signup event
    trackSignup(tier);
    
    // Check if there's a pending analysis from landing page
    const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
    const pendingId = localStorage.getItem('pendingAnalysisId');
    const landingData = localStorage.getItem('landingAnalysisData');
    
    if (pendingUrl && pendingId && landingData) {
      console.log('Redirecting to results for completed landing analysis');
      // Parse the analysis data to pass to results
      try {
        const data = JSON.parse(landingData);
        setAnalysisResults(data.results);
        setCurrentUrl(pendingUrl);
        setCurrentAnalysisId(pendingId);
        setCurrentView('results');
        // Clear the pending data after successful processing
        localStorage.removeItem('pendingAnalysisUrl');
        localStorage.removeItem('pendingAnalysisId');
        localStorage.removeItem('landingAnalysisData');
      } catch (error) {
        console.error('Error parsing landing analysis data:', error);
        trackError('registration_redirect', error.message, 'registration-complete');
        setCurrentView('dashboard');
      }
    } else {
      setCurrentView('dashboard');
    }
  };

  // Handle login completion with smart routing
  const handleLoginComplete = (routingData) => {
    console.log('Login completed with routing data:', routingData);
    
    const { user, isNewUser, hasAnalysisData, tier } = routingData || {};
    
    // If no routing data provided, just go to dashboard
    if (!routingData) {
      console.log('🎯 No routing data provided → redirecting to dashboard');
      setCurrentView('dashboard');
      return;
    }
    
    // Smart routing based on user type and context
    if (isNewUser && hasAnalysisData) {
      // New verified users with analysis data → go to results
      console.log('🎯 New verified user with analysis data → redirecting to results');
      const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
      const pendingId = localStorage.getItem('pendingAnalysisId');
      const landingData = localStorage.getItem('landingAnalysisData');
      
      if (pendingUrl && pendingId && landingData) {
        try {
          const data = JSON.parse(landingData);
          setAnalysisResults(data.results);
          setCurrentUrl(pendingUrl);
          setCurrentAnalysisId(pendingId);
          setCurrentView('results');
          
          // Don't increment usage for the first analysis from landing page
          // This analysis was done before authentication and should be "free"
          // Usage counting starts from the second analysis (first authenticated one)
          console.log('📊 First analysis from landing page - not counting against usage');
          
          // Note: If we wanted to count it, we would call incrementUsage() here
          // But the current behavior is intentional - first analysis is free
          
          // Clear pending data
          localStorage.removeItem('pendingAnalysisUrl');
          localStorage.removeItem('pendingAnalysisId');
          localStorage.removeItem('landingAnalysisData');
        } catch (error) {
          console.error('Error parsing landing analysis data:', error);
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('dashboard');
      }
    } else if (isNewUser && !hasAnalysisData) {
      // New verified users without analysis data → go to dashboard with welcome
      console.log('🎯 New verified user without analysis data → redirecting to dashboard');
      setShowWelcome(true);
      setCurrentView('dashboard');
    } else {
      // Returning users → always go to dashboard
      console.log('🎯 Returning user → redirecting to dashboard');
      setCurrentView('dashboard');
    }
  };

  // Handle analysis complete (mock progress finished)
  const handleAnalysisComplete = () => {
    // Don't switch views here - let the real analysis complete first
    // The real analysis will switch to 'results' when it's done
    console.log('🔄 Mock analysis progress completed, waiting for real analysis...');
  };

  // Handle viewing an analysis from history
  const handleViewHistoryAnalysis = async (analysisId, url) => {
    console.log('📊 Viewing analysis from history:', { analysisId, url });
    
    try {
      // First try to fetch the analysis from database
      const { data: analysis, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      
      if (!error && analysis) {
        // Fetch the analysis factors
        const { data: factors, error: factorsError } = await supabase
          .from('analysis_factors')
          .select('*')
          .eq('analysis_id', analysisId);
        
        if (!factorsError && factors) {
          // Format the results to match expected structure
          const results = {
            overall_score: analysis.scores?.overall_score || 0,
            factors: factors || [],
            pillars: analysis.scores?.pillars || {},
            url: analysis.url,
            analysisId: analysisId,
            created_at: analysis.created_at
          };
          
          setAnalysisResults(results);
          setCurrentAnalysisId(analysisId);
          setCurrentUrl(url || analysis.url);
          setCurrentView('results');
        } else {
          console.error('Failed to load analysis factors:', factorsError);
          // Fall back to showing basic results from scores
          setAnalysisResults({
            overall_score: analysis.scores?.overall_score || 0,
            factors: [],
            url: url || analysis.url,
            analysisId: analysisId
          });
          setCurrentAnalysisId(analysisId);
          setCurrentUrl(url || analysis.url);
          setCurrentView('results');
        }
      } else {
        console.error('Failed to load analysis:', error);
        alert('Failed to load analysis results. The analysis may have been deleted.');
      }
    } catch (err) {
      console.error('Error loading analysis from history:', err);
      alert('Error loading analysis. Please try again.');
    }
  };

  // Start analysis (authenticated version)
  const startAnalysis = async (url) => {
    if (!session?.user) {
      // Redirect to landing for unauthenticated users
      setCurrentView('landing');
      return;
    }

    // Clear any previous errors
    setAnalysisError(null);

    // Check usage limits for free tier
    if (userTier === 'free' && !canAnalyze()) {
      setAnalysisError({
        title: 'Usage Limit Reached',
        message: 'You\'ve reached your monthly limit of 3 analyses. Upgrade to Coffee tier for unlimited analyses!',
        action: 'upgrade'
      });
      trackFeatureUsage('usage_limit_reached', 'analysis_blocked');
      setTimeout(() => setCurrentView('pricing'), 2000);
      return;
    }

    try {
      setIsAnalyzing(true);
      const userId = session.user.id;
      const userEmail = session.user.email;
      const analysisId = crypto.randomUUID();
      const startTime = Date.now();

      console.log('🚀 Starting analysis for URL:', url);
      trackAnalysisStart(url);
      
      setCurrentUrl(url);
      setCurrentAnalysisId(analysisId);

      // Try to create analysis record with timeout
      let dbInsertSuccess = false;
      try {
        const dbInsertPromise = supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: userId,
            url: url,
            status: 'processing',
            scores: {
              overall_score: 0,
              pillars: {},
              factors: {}
            },
            factor_results: {},
            framework_version: '3.1.1',
            analysis_duration: null,
            created_at: new Date().toISOString()
          });

        // Increased timeout to handle slower database connections
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database insert timeout')), 15000)
        );

        const { error: analysisError } = await Promise.race([
          dbInsertPromise,
          timeoutPromise
        ]).catch(err => ({ error: err }));

        if (analysisError) {
          console.log("⚠️ Could not create analysis record:", analysisError.message || analysisError);
          // Continue anyway - analysis can still work without DB record
        } else {
          dbInsertSuccess = true;
        }
      } catch (error) {
        console.log("⚠️ Analysis record creation failed:", error.message);
        // Continue anyway - analysis can still work without DB record
      }

      // Increment usage tracking for all users (even unlimited for display purposes)
      incrementUsage();

      // Switch to analysis view to show progress
      setCurrentView('analysis');

      // Call Edge Function with timeout
      let data, invokeError;
      try {
        const edgeFunctionPromise = supabase.functions.invoke('analyze-page', {
          body: {
            url: url,
            analysisId: analysisId,
            userId: userId
          }
        });

        const edgeTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout - please try again')), 30000) // 30 second timeout
        );

        const result = await Promise.race([
          edgeFunctionPromise,
          edgeTimeoutPromise
        ]).catch(err => ({ error: err }));

        if (result.error) {
          invokeError = result.error;
        } else {
          data = result.data;
          invokeError = result.error;
        }
      } catch (error) {
        invokeError = error;
      }
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      if (invokeError) {
        console.error('❌ Edge Function error:', invokeError);
        trackError('edge_function', invokeError.message || invokeError, 'analysis');
        
        // Set error state for display
        setAnalysisError({
          title: 'Analysis Failed',
          message: invokeError.message || 'The analysis service is temporarily unavailable. Please try again.',
          action: 'retry'
        });
        setCurrentView('input'); // Go back to input on error
      } else {
        console.log('✅ Analysis completed:', data);
        // Store the real analysis results
        if (data && data.success) {
          const results = {
            overall_score: data.overall_score,
            factors: data.factors || [],
            pillars: data.pillars || {},
            url: url,
            analysisId: analysisId,
            created_at: new Date().toISOString()
          };
          setAnalysisResults(results);
          trackAnalysisComplete(url, data.overall_score, duration);
          
          // Switch to results view once we have real data
          setCurrentView('results');
        } else {
          console.error('❌ Invalid analysis response:', data);
          setAnalysisError({
            title: 'Invalid Results',
            message: 'The analysis completed but returned invalid data. Please try again or contact support.',
            action: 'retry'
          });
          setCurrentView('input');
        }
      }

    } catch (error) {
      console.error('❌ Error starting analysis:', error);
      trackError('analysis_start', error.message, 'analysis');
      setAnalysisError({
        title: 'Analysis Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        action: 'retry'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Callback for UserInitializer - defined here to avoid hooks order issues
  const handleUserReady = useCallback((userData) => {
    setUserReady(true);
    // Update tier state if provided by UserInitializer (e.g., from localStorage fallback)
    if (userData?.tier) {
      console.log('📊 Setting user tier from UserInitializer:', userData.tier);
      setUserTier(userData.tier);
      if (userData.tier === 'coffee') {
        setUnlimitedAccess(true);
      }
    }
  }, [setUnlimitedAccess]);

  // Render based on current view
  if (currentView === 'preview-analysis') {
    return (
      <>
        <SimpleConsentBanner />
        <PreviewAnalysis
          url={currentUrl}
          analysisId={currentAnalysisId}
          onAnalysisComplete={handlePreviewAnalysisComplete}
        />
      </>
    );
  }

  if (currentView === 'preview-results') {
    return (
      <>
        <SimpleConsentBanner />
        <PreviewResults
          url={currentUrl}
          analysisId={currentAnalysisId}
          onUpgradeClick={handleUpgradeFromTeaser}
          onFreeTrialClick={handleFreeTrialFromTeaser}
        />
      </>
    );
  }

  if (currentView === 'teaser-results') {
    return (
      <>
        <SimpleConsentBanner />
        <AnalysisPreview
          url={currentUrl}
          analysisId={currentAnalysisId}
          onUpgradeClick={handleUpgradeFromTeaser}
          onFreeTrialClick={handleFreeTrialFromTeaser}
        />
      </>
    );
  }

  // Handle /signup route - OAuth-first signup (NO tier selection upfront)
  if (currentView === 'signup' || currentView === '/signup') {
    const Signup = React.lazy(() => import('./pages/Signup'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <Signup />
        </Suspense>
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading registration..." />}>
          <CoffeeTierSignup
            onRegistrationComplete={(user) => {
              setSession({ user });
              setCurrentView('dashboard');
            }}
            onNavigate={(view) => setCurrentView(view)}
            onShowEmailVerification={(email) => {
              setPendingVerificationEmail(email);
              setCurrentView('email-verification');
            }}
          />
        </Suspense>
      </>
    );
  }

  if (currentView === 'registration-flow') {
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading registration flow..." />}>
          <RegistrationFlow onRegistrationComplete={handleRegistrationComplete} />
        </Suspense>
      </>
    );
  }

  if (currentView === 'unified-registration') {
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading registration..." />}>
          <UnifiedRegistration onRegistrationComplete={handleRegistrationComplete} />
        </Suspense>
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        <SimpleConsentBanner />
        <Login onLoginSuccess={handleLoginComplete} />
      </>
    );
  }

  // OAuth callback view - handles OAuth and Magic Link redirects
  if (currentView === 'oauth-callback') {
    const OAuthCallback = React.lazy(() => import('./components/OAuthCallback'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Processing authentication..." />}>
          <OAuthCallback onNavigate={setCurrentView} />
        </Suspense>
      </>
    );
  }

  // Upsell pages - require authentication
  if (currentView === 'upsell-coffee') {
    const UpsellCoffee = React.lazy(() => import('./pages/UpsellCoffee'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <UpsellCoffee />
        </Suspense>
      </>
    );
  }

  if (currentView === 'upsell-growth') {
    const UpsellGrowth = React.lazy(() => import('./pages/UpsellGrowth'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <UpsellGrowth />
        </Suspense>
      </>
    );
  }

  if (currentView === 'upsell-scale') {
    const UpsellScale = React.lazy(() => import('./pages/UpsellScale'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <UpsellScale />
        </Suspense>
      </>
    );
  }

  if (currentView === 'welcome-scale') {
    const WelcomeScale = React.lazy(() => import('./pages/WelcomeScale'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <WelcomeScale />
        </Suspense>
      </>
    );
  }

  // Stripe Checkout Success - Payment confirmation page
  if (currentView === 'checkout-success') {
    const CheckoutSuccess = React.lazy(() => import('./pages/CheckoutSuccess'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Processing payment..." />}>
          <CheckoutSuccess />
        </Suspense>
      </>
    );
  }

  // Stripe Checkout Cancel - Payment cancelled page
  if (currentView === 'checkout-cancel') {
    const CheckoutCancel = React.lazy(() => import('./pages/CheckoutCancel'));
    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading..." />}>
          <CheckoutCancel />
        </Suspense>
      </>
    );
  }

  // Email verification pending view
  if (currentView === 'email-verification') {
    return (
      <>
        <SimpleConsentBanner />
        <EmailVerificationPending 
          email={pendingVerificationEmail || 'your email'}
          onNavigateToLogin={() => setCurrentView('login')}
          onResendEmail={() => {
            console.log('Resending verification email...');
          }}
        />
      </>
    );
  }

  // Diagnostic page (accessible in dev mode or with special param)
  if (currentView === 'diagnostic-signup') {
    // Only allow in development or with special URL param
    const isDev = import.meta.env.DEV;
    const urlParams = new URLSearchParams(window.location.search);
    const allowDiagnostic = isDev || urlParams.get('diagnostic') === 'true';

    if (!allowDiagnostic) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Diagnostic Mode Disabled</h1>
            <p className="text-gray-600">This page is only available in development mode.</p>
            <button
              onClick={() => setCurrentView('landing')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <SimpleConsentBanner />
        <Suspense fallback={<ComponentLoader message="Loading diagnostics..." />}>
          <DiagnosticSignup />
        </Suspense>
      </>
    );
  }

  // Handle privacy, terms, contact, and about pages (accessible without authentication)
  // These must be checked FIRST before any other views
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleConsentBanner />
        <PrivacyPolicyPage 
          onNavigate={setCurrentView} 
          isAuthenticated={!!session}
        />
        <Footer onNavigate={setCurrentView} />
      </div>
    );
  }
  
  if (currentView === 'terms') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleConsentBanner />
        <TermsOfServicePage 
          onNavigate={setCurrentView} 
          isAuthenticated={!!session}
        />
        <Footer onNavigate={setCurrentView} />
      </div>
    );
  }
  
  if (currentView === 'contact') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleConsentBanner />
        <ContactPage 
          onNavigate={setCurrentView} 
          isAuthenticated={!!session}
        />
        <Footer onNavigate={setCurrentView} />
      </div>
    );
  }
  
  if (currentView === 'about') {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleConsentBanner />
        <AboutPage 
          onNavigate={setCurrentView} 
          isAuthenticated={!!session}
        />
        <Footer onNavigate={setCurrentView} />
      </div>
    );
  }

  // Add pricing page accessibility for unauthenticated users
  if (currentView === 'pricing' && !session) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <SimpleConsentBanner />
        <div className="flex-grow">
          {/* Import NavigationButtons for non-authenticated pricing page */}
          <div className="bg-gradient-to-b from-blue-50 to-white pt-8">
            <NavigationButtons 
              currentView="pricing" 
              onNavigate={setCurrentView} 
              isAuthenticated={false}
            />
          </div>
          <TierSelection 
            currentTier="free"
            onUpgrade={(tier) => {
              // User selected tier from pricing page
              
              // Block Coming Soon tiers
              if (tier === 'growth' || tier === 'scale') {
                alert('This tier is coming soon! Please check back later or contact us for early access.');
                return;
              }
              
              localStorage.setItem('selectedTier', tier);
              if (tier === 'coffee') {
                setCurrentView('register');
              } else {
                setCurrentView('register');
              }
            }}
            showRegistrationFlow={false}
          />
        </div>
        <Footer onNavigate={setCurrentView} />
      </div>
    );
  }

  // Show landing page for non-authenticated users by default
  if (!session) {
    if (currentView === 'landing' || currentView === 'dashboard' || currentView === 'input') {
      return (
        <div className="min-h-screen flex flex-col">
          <SimpleConsentBanner />
          <div className="flex-grow">
            <Landing 
              onAnalysisComplete={handleLandingAnalysis}
              onNavigate={setCurrentView}
              isAuthenticated={!!session}
            />
          </div>
          <Footer onNavigate={setCurrentView} />
        </div>
      );
    }
    // Allow preview views without authentication
    if (currentView === 'preview-analysis' || currentView === 'preview-results') {
      // These views are handled below, continue to the view rendering logic
    } else {
      // For any other view without session, show auth
      return (
        <>
          <SimpleConsentBanner />
          <Suspense fallback={<ComponentLoader message="Loading authentication..." />}>
            <AuthWithPassword />
          </Suspense>
        </>
      );
    }
  }

  // Authenticated views
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Performance Optimizer - Critical path and Core Web Vitals optimization */}
      <PerformanceOptimizer />
      
      {/* Optimized GDPR Consent Banner - Non-blocking LCP performance */}
      <SimpleConsentBanner />
      
      {/* Consistent header across all authenticated pages */}
      <AuthenticatedHeader 
        session={session}
        userTier={userTier}
        usageData={usageData}
        onSignOut={async () => {
          // Track sign out
          trackFeatureUsage('authentication', 'sign_out');
          
          // Clear all cached data on sign out
          console.log('🧹 Clearing all user data cache on sign out');
          userDataCache.current.clear();
          lastFetchTime.current.clear();
          fetchingUsers.current.clear();
          pendingAnalysisProcessed.current = false;
          authStateChangeInProgress.current = false;
          
          // Clear all localStorage items related to the session
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
            // Clear any welcome dismissed flags for any user
            ...Object.keys(localStorage).filter(key => key.startsWith('welcome_dismissed_')),
            // Clear usage tracking for the user
            ...Object.keys(localStorage).filter(key => key.startsWith('usage_'))
          ];
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });
          
          // Clear Supabase auth session from localStorage
          const supabaseKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('sb-') || key.includes('supabase')
          );
          supabaseKeys.forEach(key => {
            localStorage.removeItem(key);
          });
          
          // Set state to login view before signing out
          setCurrentView('login');
          setSession(null);
          setUserTier('free');
          resetMonthlyUsage();
          
          // Sign out from Supabase
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Sign out error:', error);
          }
          
          // Clear ALL localStorage to ensure clean state
          localStorage.clear();
          sessionStorage.clear();
        }}
      />

      {/* Only show UserInitializer if we have a session and not viewing results from a pending analysis */}
      {/* Don't check isTabVisible here as it might prevent initial load */}
      {session && currentView !== 'results' && (
        <UserInitializer session={session} onUserReady={handleUserReady} />
      )}

      <main className="main-content">
        {/* Navigation tabs */}
        <div className="flex justify-center mb-8 space-x-4">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => setCurrentView('input')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'input' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔍 New Analysis
          </button>
          <button
            onClick={() => setCurrentView('pricing')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'pricing' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            💎 Upgrade
          </button>
          <button
            onClick={() => setCurrentView('account')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'account' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 Account
          </button>
        </div>

        {/* Content based on view */}
        {currentView === 'dashboard' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
              <p className="text-gray-600 mb-8">
                You have {userTier === 'free' ? usageData.remaining : 'unlimited'} analyses remaining this month.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-start">
                <button
                  onClick={() => setCurrentView('input')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 min-w-[200px]"
                >
                  Start New Analysis →
                </button>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setCurrentAnalysisId('demo-' + Date.now());
                      setCurrentUrl('example.com');
                      setAnalysisResults(null); // Ensure demo mode
                      setCurrentView('results');
                    }}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 min-w-[200px]"
                  >
                    📋 See Sample Report
                  </button>
                  <p className="text-xs text-gray-500 mt-1 max-w-48 text-center">
                    View a sample analysis to understand our framework and report format
                  </p>
                </div>
              </div>
          </div>
          <Suspense fallback={<ComponentLoader message="Loading analysis history..." />}>
            <AnalysisHistory onViewAnalysis={handleViewHistoryAnalysis} />
          </Suspense>
          </div>
        )}

        {currentView === 'input' && (
          <>
            {analysisError && (
              <div className="error-banner">
                <div className="error-icon">⚠️</div>
                <div className="error-content">
                  <h3>{analysisError.title}</h3>
                  <p>{analysisError.message}</p>
                </div>
                <button 
                  className="error-close"
                  onClick={() => setAnalysisError(null)}
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}
            <URLInput onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />
          </>
        )}

        {currentView === 'analysis' && currentAnalysisId && (
          <SimpleAnalysisProgress 
            analysisId={currentAnalysisId}
            url={currentUrl}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {currentView === 'results' && currentAnalysisId && (
          <SimpleResultsDashboard 
            analysisId={currentAnalysisId} 
            url={currentUrl}
            analysisData={analysisResults}
            userEmail={session?.user?.email}
          />
        )}

        {currentView === 'pricing' && (
          <TierSelection 
            currentTier={userTier} 
            onUpgrade={handleUpgrade} 
          />
        )}

        {currentView === 'account' && (
          <Suspense fallback={<ComponentLoader message="Loading account settings..." />}>
            <SimpleAccountDashboard user={session?.user} userTier={userTier} />
          </Suspense>
        )}


        {/* Privacy, Terms, Contact, and About pages are now handled above for both authenticated and non-authenticated users */}
      </main>

      <Footer onNavigate={setCurrentView} />
    </div>
  );
}

// Main App component with GTM and Enzuzo integration
function App({ initialUrl }) {
  // Handle initial URL from static hero interaction
  useEffect(() => {
    if (initialUrl) {
      // Store the initial URL for processing after React is ready
      window.__initialUrlFromStatic = initialUrl;
    }
  }, [initialUrl]);

  return (
    <>
      {/* Performance Optimizer - Critical path optimization */}
      <PerformanceOptimizer />
      
      {/* GTM Analytics Integration - Load on all pages */}
      <GTMIntegration />
      
      {/* Enzuzo GDPR Integration - Disabled during SimpleConsentBanner testing */}
      {/* <EnzuzoIntegration /> */}
      
      {/* Main app content */}
      <AppContent initialUrl={initialUrl} />
    </>
  );
}

export default App;