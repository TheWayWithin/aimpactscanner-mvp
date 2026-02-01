// Refactored App with extracted hooks
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import './App.css';

// Extracted hooks for state management
import { useAuth } from './hooks/useAuth';
import { useAnalysis } from './hooks/useAnalysis';
import { useRouting } from './hooks/useRouting';

// Analytics and Privacy  
import { GTMIntegration, useGTMTracking } from './analytics/gtm-integration.jsx';

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
import { PrivacyPolicy, TermsOfService } from './components/gdpr';
import ContactPage from './components/ContactPage.jsx';
import AboutPage from './components/AboutPage.jsx';
import Footer from './components/Footer.jsx';
import NavigationButtons from './components/NavigationButtons.jsx';
import { CookieConsent } from './components/gdpr';
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
  
  // GTM tracking hooks
  const tracking = useGTMTracking();
  
  // Shared refs for cross-cutting concerns
  const pendingAnalysisProcessed = useRef(false);
  const oauthCallbackProcessed = useRef(false);
  
  // Tab visibility tracking
  const tabVisibility = useTabVisibility();
  
  // Usage tracking hook (initialized early to provide canAnalyze function)
  const usageHook = useUsageTracking();
  
  // Actions ref for cross-cutting callbacks between hooks
  const actionsRef = useRef({});
  
  // Shared refs between hooks
  const sharedRefs = {
    pendingAnalysisProcessed,
    oauthCallbackProcessed
  };
  
  // Auth hook - manages session, user tier, and authentication state
  const authHook = useAuth({
    actionsRef,
    sharedRefs,
    tabVisibility
  });
  
  // Routing hook - manages currentView and navigation
  const routingHook = useRouting(authHook.session, authHook.sessionChecked);
  
  // Analysis hook - manages analysis state and operations
  const analysisHook = useAnalysis({
    session: authHook.session,
    userTier: authHook.userTier,
    navigate: routingHook.navigate,
    canAnalyze: usageHook.canAnalyze,
    incrementUsage: usageHook.incrementUsage,
    pendingAnalysisProcessed,
    tracking
  });
  
  // Populate actionsRef with callbacks from hooks
  useEffect(() => {
    actionsRef.current = {
      // Navigation callbacks
      navigate: routingHook.navigate,
      navigateInternal: routingHook.navigateInternal,
      getCurrentView: () => routingHook.currentView,
      
      // Usage tracking callbacks
      setUnlimitedAccess: usageHook.setUnlimitedAccess,
      
      // Analysis callbacks
      setAnalysisResults: analysisHook.setAnalysisResults,
      setCurrentUrl: analysisHook.setCurrentUrl,
      setCurrentAnalysisId: analysisHook.setCurrentAnalysisId,
      
      // Upgrade handler will be added below
      handleUpgrade: null
    };
  }, [routingHook, usageHook, analysisHook]);
  
  // Extract commonly used values
  const {
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
    signOut,
    handleUserReady
  } = authHook;
  
  const { currentView } = routingHook;
  
  const {
    currentUrl,
    currentAnalysisId,
    isAnalyzing,
    analysisResults,
    analysisError,
    pendingAnalysis,
    handleLandingAnalysis,
    handlePreviewAnalysisComplete,
    handleAnalysisComplete,
    setCurrentUrl,
    setAnalysisResults,
    setAnalysisError
  } = analysisHook;
  
  const { 
    usageData, 
    incrementUsage, 
    canAnalyze, 
    setUnlimitedAccess,
    resetMonthlyUsage
  } = usageHook;
  
  // PDF preloading optimization
  const shouldPreloadPDF = usePDFPreloadTrigger(currentView, userTier);
  const isPDFPreloaded = usePDFPreloader(shouldPreloadPDF, 3000);
  
  // Track page views when current view changes
  useEffect(() => {
    tracking.trackPageView(`/${currentView}`);
  }, [currentView, tracking]);

  // Global navigation handler for privacy policy links
  useEffect(() => {
    const handlePrivacyNavigation = () => {
      routingHook.navigate('privacy');
    };
    
    window.addEventListener('navigate-to-privacy', handlePrivacyNavigation);
    return () => window.removeEventListener('navigate-to-privacy', handlePrivacyNavigation);
  }, [routingHook]);

  // Handle initial URL from static hero
  useEffect(() => {
    if (initialUrl && !pendingAnalysisProcessed.current) {
      // Set the URL in the state for analysis
      analysisHook.setCurrentUrl(initialUrl);
      // Mark that we have a pending analysis from the static hero
      analysisHook.setPendingAnalysis({ url: initialUrl, fromStaticHero: true });
    }
  }, [initialUrl, analysisHook]);

  // Upgrade handler hooks
  const handleUpgradeSuccess = (message) => {
    // Track successful upgrade
    const newTier = message.includes('Coffee') ? 'coffee' : 'professional';
    const tierValue = newTier === 'coffee' ? 5 : 25; // Coffee: $5, Professional: $25
    tracking.trackUpgrade(userTier, newTier, tierValue);
    
    // Refresh user tier after successful upgrade
    if (session?.user?.id) {
      authHook.fetchUserTier(session.user.id, session.user.email);
    }
    
    // Show success message
    setShowWelcome(message);
  };

  const { handleUpgrade, isUpgrading, upgradeError } = useUpgrade({
    userTier,
    onSuccess: handleUpgradeSuccess,
    onError: (error) => {
      console.error('Upgrade error:', error);
      tracking.trackError('upgrade_failed', { tier: userTier, error: error.message });
    }
  });

  // Update actionsRef with upgrade handler
  useEffect(() => {
    actionsRef.current.handleUpgrade = handleUpgrade;
  }, [handleUpgrade]);
  
  // Show loading screen while auth is being checked
  if (isLoadingAuth || !sessionChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <ComponentLoader message="Initializing..." />
      </div>
    );
  }

  // Analysis helpers
  const handleAnalyze = useCallback(async (url) => {
    if (!canAnalyze()) {
      const tier = userTier || 'free';
      const usageInfo = usageData || { monthlyAnalysesUsed: 0 };
      const message = tier === 'free' 
        ? `You've used all ${usageInfo.monthlyLimit || 3} free analyses this month. Consider upgrading to Coffee tier ($5/month) for unlimited analyses.`
        : 'Analysis limit reached for your current tier.';
      
      tracking.trackFeatureUsage('analysis_limit_reached', { 
        tier, 
        monthlyUsage: usageInfo.monthlyAnalysesUsed,
        limit: usageInfo.monthlyLimit
      });
      
      alert(message);
      return;
    }

    try {
      tracking.trackAnalysisStart(url, userTier);
      await analysisHook.handleAnalysisSubmit(url);
      incrementUsage();
    } catch (error) {
      console.error('Analysis error:', error);
      tracking.trackError('analysis_failed', { url, error: error.message });
    }
  }, [canAnalyze, userTier, usageData, tracking, analysisHook, incrementUsage]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <Landing 
            onAnalysisSubmit={handleLandingAnalysis}
            isAnalyzing={isAnalyzing}
          />
        );

      case 'preview-analysis':
        return (
          <PreviewAnalysis
            url={currentUrl}
            analysisId={currentAnalysisId}
            onComplete={handlePreviewAnalysisComplete}
            onError={setAnalysisError}
          />
        );

      case 'preview-results':
        return (
          <PreviewResults
            url={currentUrl}
            analysisId={currentAnalysisId}
            analysisResults={analysisResults}
            onSignUp={() => routingHook.navigate('signup')}
            onLogin={() => routingHook.navigate('login')}
          />
        );

      case 'dashboard':
        if (!session?.user) {
          routingHook.navigate('landing');
          return null;
        }
        return (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <AuthenticatedHeader 
              userTier={userTier}
              usageData={usageData}
              showWelcome={showWelcome}
              setShowWelcome={setShowWelcome}
              onNavigate={routingHook.navigate}
              onSignOut={signOut}
            />
            
            <div className="mt-8">
              <URLInput 
                onAnalysisSubmit={handleAnalyze}
                isAnalyzing={isAnalyzing}
                canAnalyze={canAnalyze}
                userTier={userTier}
              />
            </div>
            
            {dashboardData && (
              <div className="mt-8">
                <Suspense fallback={<ComponentLoader message="Loading dashboard..." />}>
                  <SimpleAccountDashboard 
                    userData={dashboardData}
                    onNavigate={routingHook.navigate}
                  />
                </Suspense>
              </div>
            )}
          </div>
        );

      case 'results':
        return (
          <SimpleResultsDashboard 
            analysisResults={analysisResults}
            currentUrl={currentUrl}
            userTier={userTier}
            onNewAnalysis={() => routingHook.navigate('dashboard')}
            onUpgrade={handleUpgrade}
          />
        );

      case 'login':
        return (
          <Login 
            onSuccess={() => routingHook.navigate('dashboard')}
            onNavigateToSignup={() => routingHook.navigate('signup')}
          />
        );

      case 'signup':
      case 'register':
        return (
          <Suspense fallback={<ComponentLoader message="Loading registration..." />}>
            <RegistrationFlow
              onSuccess={() => routingHook.navigate('dashboard')}
              onNavigateToLogin={() => routingHook.navigate('login')}
              pendingAnalysis={pendingAnalysis}
            />
          </Suspense>
        );

      case 'history':
        return (
          <Suspense fallback={<ComponentLoader message="Loading history..." />}>
            <AnalysisHistory 
              onNavigate={routingHook.navigate}
              onAnalysisSelect={(url, results) => {
                setCurrentUrl(url);
                setAnalysisResults(results);
                routingHook.navigate('results');
              }}
            />
          </Suspense>
        );

      case 'account':
        return (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <AuthenticatedHeader 
              userTier={userTier}
              usageData={usageData}
              showWelcome={false}
              onNavigate={routingHook.navigate}
              onSignOut={signOut}
            />
            
            <div className="mt-8">
              <AccountDashboard 
                session={session}
                userTier={userTier}
                dashboardData={dashboardData}
                onUpgrade={handleUpgrade}
                onNavigate={routingHook.navigate}
                isUpgrading={isUpgrading}
              />
            </div>
          </div>
        );

      case 'privacy':
        return <PrivacyPolicy onNavigate={routingHook.navigate} isAuthenticated={!!session?.user} />;
      
      case 'terms':
        return <TermsOfService onNavigate={routingHook.navigate} isAuthenticated={!!session?.user} />;
      
      case 'contact':
        return <ContactPage onNavigate={routingHook.navigate} />;
      
      case 'about':
        return <AboutPage onNavigate={routingHook.navigate} />;

      case 'email-verification':
        return (
          <EmailVerificationPending 
            email={pendingVerificationEmail}
            onBack={() => routingHook.navigate('landing')}
          />
        );

      default:
        console.warn('Unknown view:', currentView);
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <CookieConsent 
        onConsent={(preferences) => {
          // Handle consent preferences for analytics integration
          console.log('GDPR consent updated:', preferences);
        }}
        privacyPolicyUrl="#privacy"
      />
      
      {session?.user && userReady && (
        <UserInitializer 
          session={session}
          onUserReady={handleUserReady}
        />
      )}
      
      <main className="flex-1">
        {renderCurrentView()}
      </main>
      
      <Footer onNavigate={routingHook.navigate} />
      
      <PerformanceOptimizer />
    </div>
  );
}

// Main App component
export default function App() {
  const [initialUrl, setInitialUrl] = useState(null);

  // Check for initial URL from static hero
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const heroUrl = urlParams.get('url');
    if (heroUrl) {
      setInitialUrl(heroUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <>
      <GTMIntegration />
      <AppContent initialUrl={initialUrl} />
    </>
  );
}