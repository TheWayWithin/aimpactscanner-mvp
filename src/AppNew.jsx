// New App with conversion-optimized flow
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

// New components for conversion flow
import Landing from './components/Landing';
import TeaserResults from './components/TeaserResults';

// Existing components
import Auth from './components/Auth';
import RegistrationFlow from './components/RegistrationFlow';
import SimpleAnalysisProgress from './components/SimpleAnalysisProgress';
import SimpleResultsDashboard from './components/SimpleResultsDashboard';
import URLInput from './components/URLInput';
import TierIndicator from './components/TierIndicator';
import TierSelection from './components/TierSelection';
import AccountDashboard from './components/AccountDashboard';
import UserInitializer from './components/UserInitializer';
// import { useUpgrade } from './components/UpgradeHandler';
import { useUpgradeDebug as useUpgrade } from './components/UpgradeHandlerDebug'; // Temporary debug

function AppNew() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // Start with landing page
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userTier, setUserTier] = useState('free');
  const [dashboardData, setDashboardData] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userReady, setUserReady] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);

  // Upgrade handler hooks
  const handleUpgradeSuccess = (message) => {
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
    // Check URL parameters first (for Stripe returns)
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      // Payment successful - show success message
      console.log('Payment successful! Session ID:', sessionId);
      setCurrentView('payment-success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // After showing success, redirect to dashboard
      setTimeout(() => {
        setCurrentView('dashboard');
      }, 3000);
      return;
    } else if (paymentStatus === 'cancelled') {
      // Payment cancelled
      console.log('Payment cancelled');
      setCurrentView('landing');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setSession(session);
        fetchUserTier(session.user.id);
        // If user is already logged in, skip landing
        setCurrentView('dashboard');
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserTier(session.user.id);
        // After login, check if there's a pending analysis
        const pendingUrl = sessionStorage.getItem('pendingAnalysisUrl');
        if (pendingUrl) {
          setCurrentView('results');
        } else {
          setCurrentView('dashboard');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserTier = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tier, stripe_customer_id, monthly_analyses_used')
        .eq('id', userId)
        .single();

      if (data) {
        setUserTier(data.tier || 'free');
        setDashboardData(data);
      }
    } catch (error) {
      console.log('Could not fetch user tier:', error);
      setUserTier('free');
    }
  };

  // Handle analysis from landing page (no auth)
  const handleLandingAnalysis = (url, analysisId) => {
    setCurrentUrl(url);
    setCurrentAnalysisId(analysisId);
    setPendingAnalysis({ url, analysisId });
    setCurrentView('teaser-results');
  };

  // Handle upgrade click from teaser results
  const handleUpgradeFromTeaser = async (tier) => {
    // Map starter to coffee since that's our actual tier name
    const actualTier = tier === 'starter' ? 'coffee' : tier;
    
    if (!session) {
      // Need to register first - use new registration flow
      sessionStorage.setItem('selectedTier', actualTier);
      setCurrentView('registration-flow');
    } else {
      // Already logged in, go straight to payment
      await handleUpgrade(actualTier);
    }
  };

  // Handle free trial click from teaser
  const handleFreeTrialFromTeaser = () => {
    if (!session) {
      sessionStorage.setItem('selectedTier', 'free');
      setCurrentView('registration-flow');
    } else {
      // Already logged in, show full results
      setCurrentView('results');
    }
  };

  // Handle registration completion from registration flow
  const handleRegistrationComplete = (user, tier) => {
    console.log('Registration completed:', { user: user?.id, tier });
    // The auth state change will handle the redirect to dashboard
    // Just clear any pending analysis URL if needed
    const pendingUrl = sessionStorage.getItem('pendingAnalysisUrl');
    if (pendingUrl) {
      setCurrentView('results');
    } else {
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

    try {
      setIsAnalyzing(true);
      const userId = session.user.id;
      const userEmail = session.user.email;
      const analysisId = crypto.randomUUID();

      console.log('🚀 Starting analysis for URL:', url);
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
            created_at: new Date().toISOString()
          });

        if (analysisError) {
          console.log("⚠️ Could not create analysis record:", analysisError.message);
        }
      } catch (error) {
        console.log("⚠️ Analysis record creation failed:", error.message);
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
        if (invokeError) {
          console.error('❌ Edge Function error:', invokeError);
          alert(`Analysis error: ${invokeError.message}`);
        } else {
          console.log('✅ Analysis completed:', data);
        }
      });

    } catch (error) {
      console.error('❌ Error starting analysis:', error);
      alert(`Error starting analysis: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render based on current view
  if (currentView === 'landing' && !session) {
    return <Landing onAnalysisComplete={handleLandingAnalysis} />;
  }

  if (currentView === 'teaser-results') {
    return (
      <TeaserResults
        url={currentUrl}
        analysisId={currentAnalysisId}
        onUpgradeClick={handleUpgradeFromTeaser}
        onFreeTrialClick={handleFreeTrialFromTeaser}
      />
    );
  }

  if (currentView === 'register') {
    return <Auth />;
  }

  if (currentView === 'registration-flow') {
    return <RegistrationFlow onRegistrationComplete={handleRegistrationComplete} />;
  }
  
  if (currentView === 'payment-success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Welcome to the Coffee Tier! Your subscription is now active.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Authenticated views
  return (
    <div className="app-container">
      {/* Header with user info */}
      <header className="brand-header">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">AImpactScanner</h1>
          <div className="flex items-center gap-4">
            <TierIndicator tier={userTier} />
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Temporarily disabled due to 406 RLS issues
      <UserInitializer user={session?.user} onReady={() => setUserReady(true)} />
      */}

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
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-gray-600 mb-8">
              You have {userTier === 'free' ? (3 - (dashboardData?.monthly_analyses_used || 0)) : 'unlimited'} analyses remaining this month.
            </p>
            <button
              onClick={() => setCurrentView('input')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              Start New Analysis →
            </button>
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
      </main>

      <footer className="brand-footer">
        <p>&copy; 2025 AI Search Mastery. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AppNew;