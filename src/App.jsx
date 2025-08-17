// New App with conversion-optimized flow
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

// New components for conversion flow
import Landing from './components/Landing';
import AnalysisPreview from './components/AnalysisPreview';
import PreviewAnalysis from './components/PreviewAnalysis';
import PreviewResults from './components/PreviewResults';

// Existing components
import AuthWithPassword from './components/AuthWithPassword';
import RegistrationFlow from './components/RegistrationFlow';
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

function App() {
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
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // Track if we've already processed the pending analysis to prevent duplicate processing
  const pendingAnalysisProcessed = useRef(false);

  // Usage tracking hook
  const { 
    usageData, 
    incrementUsage, 
    canAnalyze, 
    setUnlimitedAccess 
  } = useUsageTracking(session?.user?.email);

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
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setSession(session);
        fetchUserTier(session.user.id);
        
        // Check if there's a pending analysis from landing page
        const pendingUrl = sessionStorage.getItem('pendingAnalysisUrl');
        const pendingId = sessionStorage.getItem('pendingAnalysisId');
        const landingData = sessionStorage.getItem('landingAnalysisData');
        
        if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
          console.log('Found pending analysis, redirecting to results');
          pendingAnalysisProcessed.current = true; // Mark as processed
          
          try {
            const data = JSON.parse(landingData);
            setAnalysisResults(data.results);
            setCurrentUrl(pendingUrl);
            setCurrentAnalysisId(pendingId);
            setCurrentView('results');
            // Clear the pending data
            sessionStorage.removeItem('pendingAnalysisUrl');
            sessionStorage.removeItem('pendingAnalysisId');
            sessionStorage.removeItem('landingAnalysisData');
          } catch (error) {
            console.error('Error parsing pending analysis data:', error);
            setCurrentView('dashboard');
          }
        } else if (!pendingAnalysisProcessed.current) {
          setCurrentView('dashboard');
        }
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
        const pendingId = sessionStorage.getItem('pendingAnalysisId');
        const landingData = sessionStorage.getItem('landingAnalysisData');
        
        if (pendingUrl && pendingId && landingData && !pendingAnalysisProcessed.current) {
          console.log('Auth state changed, found pending analysis');
          pendingAnalysisProcessed.current = true; // Mark as processed to prevent duplicate handling
          
          try {
            const data = JSON.parse(landingData);
            setAnalysisResults(data.results);
            setCurrentUrl(pendingUrl);
            setCurrentAnalysisId(pendingId);
            setCurrentView('results');
            // Clear the pending data
            sessionStorage.removeItem('pendingAnalysisUrl');
            sessionStorage.removeItem('pendingAnalysisId');
            sessionStorage.removeItem('landingAnalysisData');
          } catch (error) {
            console.error('Error parsing pending analysis data:', error);
            setCurrentView('dashboard');
          }
        } else if (!pendingAnalysisProcessed.current) {
          // Only set dashboard if we haven't processed a pending analysis
          setCurrentView('dashboard');
        }
        // If we've already processed the pending analysis, don't change the view at all
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
        // Update unlimited access for Coffee tier
        if (data.tier === 'coffee') {
          setUnlimitedAccess(true);
        }
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
      // Need to register first - use new registration flow
      sessionStorage.setItem('selectedTier', tier);
      setCurrentView('registration-flow');
    } else {
      // Already logged in, go straight to payment
      if (tier === 'professional') {
        await handleUpgrade('professional');
      } else if (tier === 'starter') {
        await handleUpgrade('coffee'); // Map starter to coffee tier
      }
    }
  };

  // Handle free trial click from teaser
  const handleFreeTrialFromTeaser = () => {
    if (!session) {
      // For free tier, just show auth - no need for full registration flow
      // The auth state change handler will preserve the pending analysis
      setCurrentView('register');
    } else {
      // Already logged in, show full results
      setCurrentView('results');
    }
  };

  // Handle registration completion from registration flow
  const handleRegistrationComplete = (user, tier) => {
    console.log('Registration completed:', { user: user?.id, tier });
    // Check if there's a pending analysis from landing page
    const pendingUrl = sessionStorage.getItem('pendingAnalysisUrl');
    const pendingId = sessionStorage.getItem('pendingAnalysisId');
    const landingData = sessionStorage.getItem('landingAnalysisData');
    
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
        sessionStorage.removeItem('pendingAnalysisUrl');
        sessionStorage.removeItem('pendingAnalysisId');
        sessionStorage.removeItem('landingAnalysisData');
      } catch (error) {
        console.error('Error parsing landing analysis data:', error);
        setCurrentView('dashboard');
      }
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

    // Check usage limits for free tier
    if (userTier === 'free' && !canAnalyze()) {
      alert(`You've reached your monthly limit of 3 analyses. Upgrade to Coffee tier for unlimited analyses!`);
      setCurrentView('pricing');
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
        if (invokeError) {
          console.error('❌ Edge Function error:', invokeError);
          alert(`Analysis error: ${invokeError.message}`);
        } else {
          console.log('✅ Analysis completed:', data);
          // Store the real analysis results
          // Edge Function returns { success, overall_score, factors, etc }
          if (data && data.success) {
            setAnalysisResults({
              overall_score: data.overall_score,
              factors: data.factors || [],
              url: url,
              created_at: new Date().toISOString()
            });
          }
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
  if (currentView === 'preview-analysis') {
    return (
      <PreviewAnalysis
        url={currentUrl}
        analysisId={currentAnalysisId}
        onAnalysisComplete={handlePreviewAnalysisComplete}
      />
    );
  }

  if (currentView === 'preview-results') {
    return (
      <PreviewResults
        url={currentUrl}
        analysisId={currentAnalysisId}
        onUpgradeClick={handleUpgradeFromTeaser}
        onFreeTrialClick={handleFreeTrialFromTeaser}
      />
    );
  }

  if (currentView === 'teaser-results') {
    return (
      <AnalysisPreview
        url={currentUrl}
        analysisId={currentAnalysisId}
        onUpgradeClick={handleUpgradeFromTeaser}
        onFreeTrialClick={handleFreeTrialFromTeaser}
      />
    );
  }

  if (currentView === 'register') {
    return <AuthWithPassword />;
  }

  if (currentView === 'registration-flow') {
    return <RegistrationFlow onRegistrationComplete={handleRegistrationComplete} />;
  }

  // Show landing page for non-authenticated users by default
  if (!session) {
    if (currentView === 'landing' || currentView === 'dashboard' || currentView === 'input') {
      return <Landing onAnalysisComplete={handleLandingAnalysis} />;
    }
    // For any other view without session, show auth
    return <AuthWithPassword />;
  }

  // Authenticated views
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Consistent header across all authenticated pages */}
      <AuthenticatedHeader 
        session={session}
        userTier={userTier}
        usageData={usageData}
        onSignOut={() => supabase.auth.signOut()}
      />

      {/* Only show UserInitializer if we're not viewing results from a pending analysis */}
      {currentView !== 'results' && (
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

export default App;