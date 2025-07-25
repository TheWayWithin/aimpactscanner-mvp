// src/App.jsx - Modified to correctly pass analysisId and userId to Edge Function
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

import Auth from './components/Auth';
import AnalysisProgress from './components/AnalysisProgress';
import ResultsDashboard from './components/ResultsDashboard';
import URLInput from './components/URLInput';
import TierIndicator from './components/TierIndicator';
import TierSelection from './components/TierSelection';
import AccountDashboard from './components/AccountDashboard';
import { useUpgrade } from './components/UpgradeHandler';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('input'); // 'input', 'analysis', or 'results'
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [userTier, setUserTier] = useState('free');

  // Upgrade handler hooks
  const handleUpgradeSuccess = (message) => {
    setUpgradeMessage(message);
    setTimeout(() => setUpgradeMessage(''), 5000);
    // Refresh user tier after successful upgrade
    if (session?.user?.id) {
      fetchUserTier(session.user.id);
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
    // Fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserTier(session.user.id);
      }
    });

    // Listen for auth state changes (e.g., login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserTier(session.user.id);
      } else {
        setUserTier('free');
      }
    });

    // Clean up subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  // Fetch user tier from database
  const fetchUserTier = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('tier')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('User not found in database, defaulting to free tier');
        setUserTier('free');
      } else {
        setUserTier(data.tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
      setUserTier('free');
    }
  };

  const startAnalysis = async (url) => {
    if (!session || !session.user) {
      console.error("User session not valid to start analysis.");
      alert("Please log in to start an analysis. Your session might have expired.");
      return;
    }

    if (!url) {
      console.error("No URL provided for analysis");
      alert("Please provide a URL to analyze");
      return;
    }

    setIsAnalyzing(true);
    setCurrentUrl(url);

    try {
        const userId = session.user.id;
        const userEmail = session.user.email;

        // Ensure the logged-in user exists in the public.users table (for RLS/FK)
        const { error: upsertUserError } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email: userEmail,
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (upsertUserError) {
            throw upsertUserError;
        }
        console.log("Logged-in user ensured in public.users table:", userId);

        // Check if user has reached their free tier limit
        const { data: userData, error: userDataError } = await supabase
            .from('users')
            .select('tier, monthly_analyses_used')
            .eq('id', userId)
            .single();

        if (!userDataError && userData) {
            const isFreeTier = userData.tier === 'free' || !userData.tier;
            const analysesUsed = userData.monthly_analyses_used || 0;
            
            if (isFreeTier && analysesUsed >= 3) {
                // User has hit their limit - show upgrade prompt
                setIsAnalyzing(false);
                const upgradeConfirm = confirm(
                    "You've reached your free analysis limit (3 per month).\n\n" +
                    "Upgrade to Coffee Tier ($5/month) for unlimited analyses?\n\n" +
                    "Click OK to view pricing options, or Cancel to return."
                );
                
                if (upgradeConfirm) {
                    setCurrentView('pricing');
                }
                return;
            }
        }

        // Generate a unique analysis ID
        const analysisId = crypto.randomUUID();
        setCurrentAnalysisId(analysisId);

        // Create the analyses record in the 'analyses' table.
        // The Edge Function will update this record later.
        const { error: upsertAnalysisError } = await supabase
            .from('analyses')
            .insert({
                id: analysisId,
                user_id: userId,
                url: url,
                status: 'pending', // Initial status
                scores: {}, // Add empty scores object to satisfy database constraint
                factor_results: [] // Add empty factor results array to satisfy database constraint
            });

        if (upsertAnalysisError) {
            console.error("Analysis insert error details:", upsertAnalysisError);
            console.error("Analysis insert error message:", upsertAnalysisError.message);
            console.error("Analysis insert error code:", upsertAnalysisError.code);
            throw upsertAnalysisError;
        }
        console.log("Analyses record ensured (created or already existed) for user:", userId);

        // Switch to analysis view IMMEDIATELY to show progress
        setCurrentView('analysis');

        // Call the deployed Supabase Edge Function to initiate the analysis (non-blocking)
        // Don't await this so the UI can show progress in real-time
        supabase.functions.invoke('analyze-page', {
            body: {
                url: url,
                analysisId: analysisId, // Pass the generated analysis ID
                userId: userId // Pass the user ID
            }
        }).then(({ data, error: invokeError }) => {
            if (invokeError) {
                console.error('Edge Function error:', invokeError);
                alert(`Analysis error: ${invokeError.message}`);
            } else {
                console.log('Analysis completed via Edge Function:', data);
                console.log('Analysis Response Details:', JSON.stringify(data, null, 2));
                
                // Log success message (no popup needed - real-time progress shows completion)
                if (data && data.success) {
                    console.log(`✅ Analysis completed! Tier: ${data.tier}, Remaining: ${data.remainingAnalyses}`);
                } else {
                    console.log('Analysis completed, but response format unexpected. Check console for details.');
                }
            }
        }).catch(error => {
            console.error('Analysis error:', error);
            alert(`Error during analysis: ${error.message}`);
        });

    } catch (error) {
        console.error('Error starting analysis:', error);
        alert(`Error starting analysis: ${error.message}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const setupDatabase = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('setup-tables');
      if (error) {
        console.error('Database setup error:', error);
        alert('Database setup failed: ' + error.message);
      } else {
        console.log('Database setup successful:', data);
        alert('Database setup completed successfully!');
      }
    } catch (error) {
      console.error('Database setup error:', error);
      alert('Database setup failed: ' + error.message);
    }
  };

  const diagnoseDatabase = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-db');
      if (error) {
        console.error('Database diagnosis error:', error);
        alert('Database diagnosis failed: ' + error.message);
      } else {
        console.log('Database diagnosis:', data);
        alert('Database diagnosis completed! Check console for details.');
      }
    } catch (error) {
      console.error('Database diagnosis error:', error);
      alert('Database diagnosis failed: ' + error.message);
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="aimpactscanner-app-container">
      <header className="brand-header flex justify-between items-center">
        <div>
          <h1 className="brand-title">AImpactScanner</h1>
          <p className="brand-subtitle">by AI Search Mastery</p>
        </div>
        <div className="flex items-center space-x-4">
          <TierIndicator user={session?.user} onUpgrade={handleUpgrade} />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="brand-main-content">
        {/* Success Message */}
        {upgradeMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800 font-medium">{upgradeMessage}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setCurrentView('input')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'input' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New Analysis
          </button>
          <button
            onClick={() => setCurrentView('analysis')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'analysis' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!currentAnalysisId}
          >
            Analysis Progress
          </button>
          <button
            onClick={() => setCurrentView('results')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'results' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={!currentAnalysisId}
          >
            Results Dashboard
          </button>
          <button
            onClick={() => setCurrentView('pricing')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'pricing' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ☕ Pricing
          </button>
          <button
            onClick={() => setCurrentView('account')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'account' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            👤 Account
          </button>
        </div>

        {/* Content */}
        {currentView === 'input' && (
          <URLInput onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />
        )}

        {currentView === 'analysis' && currentAnalysisId && (
          <div>
            <AnalysisProgress analysisId={currentAnalysisId} />
            {currentUrl && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Analyzing:</span> {currentUrl}
                </p>
              </div>
            )}
          </div>
        )}

        {currentView === 'results' && currentAnalysisId && (
          <ResultsDashboard analysisId={currentAnalysisId} />
        )}

        {currentView === 'pricing' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Plan
              </h2>
              <p className="text-gray-600">
                Upgrade to unlock unlimited analyses and advanced features
              </p>
            </div>
            <TierSelection 
              currentTier={userTier} 
              onUpgrade={handleUpgrade} 
            />
          </div>
        )}

        {currentView === 'account' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Your Account
              </h2>
              <p className="text-gray-600">
                Manage your subscription, view usage, and update account settings
              </p>
            </div>
            <AccountDashboard user={session?.user} />
          </div>
        )}

        <div className="mt-6 flex space-x-2">
          <button
            onClick={diagnoseDatabase}
            className="font-primary font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity duration-200"
            style={{ backgroundColor: 'var(--mastery-blue)', color: 'var(--authority-white)' }}
          >
            Check Database
          </button>
          <button
            onClick={setupDatabase}
            className="font-primary font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity duration-200"
            style={{ backgroundColor: 'var(--framework-black)', color: 'var(--authority-white)' }}
          >
            Setup Database
          </button>
        </div>
      </main>
      <footer className="brand-footer">
        <p>&copy; 2025 AI Search Mastery. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;