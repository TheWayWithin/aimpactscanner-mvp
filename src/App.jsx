// New App with conversion-optimized flow
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

// Analytics and Privacy  
import { GTMIntegration, useGTMTracking } from './analytics/gtm-integration.jsx';
// import { EnzuzoIntegration } from './privacy/enzuzo-integration.jsx';

// New components for conversion flow
import Landing from './components/Landing';
import AnalysisPreview from './components/AnalysisPreview';
import PreviewAnalysis from './components/PreviewAnalysis';
import PreviewResults from './components/PreviewResults';

// Existing components
import AuthWithPassword from './components/AuthWithPassword';
import RegistrationFlow from './components/RegistrationFlow';
import UnifiedRegistration from './components/UnifiedRegistration';
import Login from './components/Login';
import SimpleAnalysisProgress from './components/SimpleAnalysisProgress';
import SimpleResultsDashboard from './components/SimpleResultsDashboard';
import URLInput from './components/URLInput';
import TierIndicator from './components/TierIndicator';
import TierSelection from './components/TierSelection';
import AccountDashboard from './components/AccountDashboard';
import UserInitializer from './components/UserInitializer';
import AnalysisHistory from './components/AnalysisHistory';
import { useUpgrade } from './components/UpgradeHandler';
import { useUsageTracking } from './hooks/useUsageTracking';
import AuthenticatedHeader from './components/AuthenticatedHeader';
import AILogo from './components/AILogo';
import AnalyticsTestComponent from './components/AnalyticsTestComponent.jsx';
// import EnzuzoTestComponent from './components/EnzuzoTestComponent.jsx';
import PrivacyPolicyPage from './components/PrivacyPolicyPage.jsx';
import TermsOfServicePage from './components/TermsOfServicePage.jsx';
import ContactPage from './components/ContactPage.jsx';
import AboutPage from './components/AboutPage.jsx';
import PDFTestComponent from './components/PDFTestComponent.jsx'; // Phase 1: PDF library testing
import Footer from './components/Footer.jsx';
// import SimpleConsentBanner from './components/SimpleConsentBanner.jsx'; // Disabled - using Enzuzo via GTM

function AppContent() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentViewInternal] = useState('landing'); // Start with landing page
  
  // Wrapper for setCurrentView that manages browser history
  const setCurrentView = (view) => {
    if (view !== currentView) {
      // Push to browser history for navigation tracking
      window.history.pushState({ view }, '', `#${view}`);
      setCurrentViewInternal(view);
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
    setUnlimitedAccess 
  } = useUsageTracking(session?.user?.email);

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
      fetchUserTier(session.user.id);
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
      } else {
        // Handle direct URL navigation or initial load
        const hash = window.location.hash.slice(1);
        if (hash) {
          setCurrentViewInternal(hash);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Check initial URL
    const hash = window.location.hash.slice(1);
    if (hash) {
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
    // Check URL path for login route
    if (window.location.pathname === '/login') {
      setCurrentView('login');
      // Clear URL to prevent issues with navigation
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setSession(session);
        
        // Special handling for known coffee tier users
        if (session.user.email === 'jamie.watters.mail@icloud.com') {
          console.log('☕ Detected Jamie - setting Coffee tier');
          localStorage.setItem(`user_tier_${session.user.id}`, 'coffee');
          localStorage.setItem(`user_email_${session.user.id}`, session.user.email);
          setUserTier('coffee');
          setUnlimitedAccess(true);
        }
        
        fetchUserTier(session.user.id);
        
        // Check if there's a pending analysis from landing page
        const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
        const pendingId = localStorage.getItem('pendingAnalysisId');
        const landingData = localStorage.getItem('landingAnalysisData');
        
        console.log('🔍 INITIAL SESSION DEBUG:', {
          hasPendingUrl: !!pendingUrl,
          hasPendingId: !!pendingId,
          hasLandingData: !!landingData,
          alreadyProcessed: pendingAnalysisProcessed.current,
          pendingUrl: pendingUrl,
          pendingId: pendingId
        });
        
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
    });

    // Listen for auth state changes with debouncing
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentTime = Date.now();
      
      // Debounce rapid auth state changes
      if (authStateChangeInProgress.current || (currentTime - lastAuthStateChange.current) < AUTH_DEBOUNCE_DELAY) {
        console.log('🔄 Debouncing auth state change - too soon after last change');
        return;
      }
      
      authStateChangeInProgress.current = true;
      lastAuthStateChange.current = currentTime;
      
      try {
        setSession(session);
        if (session?.user?.id) {
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
        
        // Enhanced debugging for auth state change
        console.log('🔍 AUTH STATE DEBUG:', {
          hasPendingUrl: !!pendingUrl,
          hasPendingId: !!pendingId,
          hasLandingData: !!landingData,
          alreadyProcessed: pendingAnalysisProcessed.current,
          pendingUrl: pendingUrl,
          pendingId: pendingId,
          storageMethod: landingData?.includes('fromUrlParams') ? 'URL parameters' : 'localStorage'
        });
        
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
            fetchUserTier(session.user.id).catch(error => {
              console.warn('⚠️ Database error during pending analysis flow (non-blocking):', error);
              // Set default tier to prevent issues, but don't block the analysis flow
              setUserTier('free');
            });
            
            return; // Exit early - don't proceed to dashboard logic
          } catch (error) {
            console.error('❌ Error parsing pending analysis data:', error);
            // Even on error, try to fetch user data before falling back
            await fetchUserTier(session.user.id).catch(() => setUserTier('free'));
            setCurrentView('dashboard');
            return;
          }
        }
        
        // PRIORITY 3: No pending analysis - proceed with normal dashboard flow
        try {
          await fetchUserTier(session.user.id);
          if (!pendingAnalysisProcessed.current) {
            setCurrentView('dashboard');
          }
        } catch (error) {
          console.warn('⚠️ Database error during normal auth flow:', error);
          // Set default tier and proceed to dashboard
          setUserTier('free');
          if (!pendingAnalysisProcessed.current) {
            setCurrentView('dashboard');
          }
        }
        } // Close if (session?.user?.id) block
      } catch (error) {
        console.error('❌ Error in auth state change handler:', error);
        // Set default tier and proceed to dashboard on any auth error
        setUserTier('free');
        if (!pendingAnalysisProcessed.current) {
          setCurrentView('dashboard');
        }
      } finally {
        // Reset auth state change flag
        authStateChangeInProgress.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserTier = async (userId) => {
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
          .select('id, email, tier, stripe_customer_id, monthly_analyses_used, subscription_status')
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
        console.warn('⚠️ No user data found, creating default user');
        // Create user with defaults if they don't exist
        await createDefaultUser(userId);
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

  const createDefaultUser = async (userId) => {
    try {
      console.log('🔧 Creating default user for:', userId);
      
      // Get email from session
      const userEmail = session?.user?.email;
      if (!userEmail) {
        throw new Error('No user email available');
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          tier: 'free',
          subscription_tier: 'free',
          monthly_analyses_used: 0,
          subscription_status: 'inactive'
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
    
    const { user, isNewUser, hasAnalysisData, tier } = routingData;
    
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

  // Handle analysis complete
  const handleAnalysisComplete = () => {
    setCurrentView('results');
  };

  // Start analysis (authenticated version)
  const startAnalysis = async (url) => {
    if (!session?.user) {
      // Redirect to landing for unauthenticated users
      setCurrentView('landing');
      return;
    }

    // Check usage limits for free tier
    if (userTier === 'free' && !canAnalyze()) {
      alert(`You've reached your monthly limit of 3 analyses. Upgrade to Coffee tier for unlimited analyses!`);
      trackFeatureUsage('usage_limit_reached', 'analysis_blocked');
      setCurrentView('pricing');
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

      // Try to create analysis record
      try {
        const { error: analysisError } = await supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: userId,
            url: url,
            status: 'in_progress',
            overall_score: null,
            ai_score: null,
            authority_score: null,
            machine_readability_score: null,
            semantic_quality_score: null,
            engagement_score: null,
            topical_expertise_score: null,
            reference_networks_score: null,
            yield_optimization_score: null,
            framework_version: '3.1.1',
            analysis_duration: null,
            created_at: new Date().toISOString(),
            completed_at: null
          });

        if (analysisError) {
          console.log("⚠️ Could not create analysis record:", analysisError.message);
        }
      } catch (error) {
        console.log("⚠️ Analysis record creation failed:", error.message);
      }

      // Increment usage for free tier
      if (userTier === 'free') {
        console.log('Incrementing usage. Current:', usageData.remaining);
        incrementUsage();
        console.log('After increment:', usageData.remaining - 1);
      }

      // Switch to analysis view
      setCurrentView('analysis');

      // Call Edge Function
      supabase.functions.invoke('analyze-page', {
        body: {
          url: url,
          analysisId: analysisId,
          userId: userId
        }
      }).then(({ data, error: invokeError }) => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        if (invokeError) {
          console.error('❌ Edge Function error:', invokeError);
          trackError('edge_function', invokeError.message, 'analysis');
          alert(`Analysis error: ${invokeError.message}`);
        } else {
          console.log('✅ Analysis completed:', data);
          // Store the real analysis results
          // Edge Function returns { success, overall_score, factors, etc }
          if (data && data.success) {
            const results = {
              overall_score: data.overall_score,
              factors: data.factors || [],
              url: url,
              created_at: new Date().toISOString()
            };
            setAnalysisResults(results);
            trackAnalysisComplete(url, data.overall_score, duration);
          }
        }
      });

    } catch (error) {
      console.error('❌ Error starting analysis:', error);
      trackError('analysis_start', error.message, 'analysis');
      alert(`Error starting analysis: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render based on current view
  if (currentView === 'preview-analysis') {
    return (
      <>
        {/* <SimpleConsentBanner /> */}
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
        {/* <SimpleConsentBanner /> */}
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
        {/* <SimpleConsentBanner /> */}
        <AnalysisPreview
          url={currentUrl}
          analysisId={currentAnalysisId}
          onUpgradeClick={handleUpgradeFromTeaser}
          onFreeTrialClick={handleFreeTrialFromTeaser}
        />
      </>
    );
  }

  if (currentView === 'register') {
    return (
      <>
        {/* <SimpleConsentBanner /> */}
        <AuthWithPassword 
          defaultMode="register"
          onSuccess={() => setCurrentView('dashboard')}
        />
      </>
    );
  }

  if (currentView === 'registration-flow') {
    return (
      <>
        {/* <SimpleConsentBanner /> */}
        <RegistrationFlow onRegistrationComplete={handleRegistrationComplete} />
      </>
    );
  }

  if (currentView === 'unified-registration') {
    return (
      <>
        {/* <SimpleConsentBanner /> */}
        <UnifiedRegistration onRegistrationComplete={handleRegistrationComplete} />
      </>
    );
  }

  if (currentView === 'login') {
    return (
      <>
        {/* <SimpleConsentBanner /> */}
        <Login onLoginSuccess={handleLoginComplete} />
      </>
    );
  }

  // Show landing page for non-authenticated users by default
  if (!session) {
    if (currentView === 'landing' || currentView === 'dashboard' || currentView === 'input') {
      return (
        <div className="min-h-screen flex flex-col">
          {/* <SimpleConsentBanner /> */}
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
          {/* <SimpleConsentBanner /> */}
          <AuthWithPassword />
        </>
      );
    }
  }

  // Authenticated views
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Simple GDPR Consent Banner - Removed duplicate from authenticated section */}
      {/* <SimpleConsentBanner /> */}
      
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
          setUsageData({
            used: 0,
            remaining: 5,
            limit: 5,
            analysesThisMonth: []
          });
          
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
      {session && currentView !== 'results' && (
        <UserInitializer session={session} onUserReady={() => setUserReady(true)} />
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
          <button
            onClick={() => setCurrentView('analytics-test')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'analytics-test' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-200 text-red-700 hover:bg-red-300'
            }`}
          >
            🔬 Analytics Test
          </button>
          <button
            onClick={() => setCurrentView('pdf-test')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              currentView === 'pdf-test' 
                ? 'bg-orange-600 text-white' 
                : 'bg-orange-200 text-orange-700 hover:bg-orange-300'
            }`}
          >
            📄 PDF Test
          </button>
          {/* ENZUZO TEST BUTTON REMOVED - GDPR testing complete */}
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
          <AnalysisHistory />
          </div>
        )}

        {currentView === 'input' && (
          <URLInput onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />
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
          <AccountDashboard user={session?.user} />
        )}

        {currentView === 'analytics-test' && (
          <AnalyticsTestComponent />
        )}

        {currentView === 'pdf-test' && (
          <PDFTestComponent />
        )}

        {/* ENZUZO TEST COMPONENT REMOVED - GDPR testing complete */}

        {currentView === 'privacy' && (
          <PrivacyPolicyPage />
        )}

        {currentView === 'terms' && (
          <TermsOfServicePage />
        )}

        {currentView === 'contact' && (
          <ContactPage />
        )}

        {currentView === 'about' && (
          <AboutPage />
        )}
      </main>

      <Footer onNavigate={setCurrentView} />
    </div>
  );
}

// Main App component with GTM and Enzuzo integration
function App() {
  return (
    <>
      {/* GTM Analytics Integration - Load on all pages */}
      <GTMIntegration />
      
      {/* Enzuzo GDPR Integration - Disabled during SimpleConsentBanner testing */}
      {/* <EnzuzoIntegration /> */}
      
      {/* Main app content */}
      <AppContent />
    </>
  );
}

export default App;