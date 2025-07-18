// src/App.jsx - Modified to correctly pass analysisId and userId to Edge Function
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

import Auth from './components/Auth';
import AnalysisProgress from './components/AnalysisProgress';
import ResultsDashboard from './components/ResultsDashboard';
import MockResultsDashboard from './components/MockResultsDashboard';
import URLInput from './components/URLInput';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('input'); // 'input', 'analysis', or 'results'
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Fetch the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes (e.g., login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Clean up subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

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

        // Call the deployed Supabase Edge Function to initiate the analysis.
        const { data, error: invokeError } = await supabase.functions.invoke('analyze-page', {
            body: {
                url: url,
                analysisId: analysisId, // Pass the generated analysis ID
                userId: userId // Pass the user ID
            }
        });

        if (invokeError) {
            throw invokeError;
        }
        console.log('Analysis initiated via Edge Function:', data);
        
        // Switch to analysis view to show progress
        setCurrentView('analysis');

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
      <header className="brand-header">
        <h1 className="brand-title">AImpactScanner</h1>
        <p className="brand-subtitle">by AI Search Mastery</p>
      </header>
      <main className="brand-main-content">
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
            onClick={() => setCurrentView('mock')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              currentView === 'mock' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Mock Results (Test)
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

        {currentView === 'mock' && (
          <MockResultsDashboard />
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
          <button
            onClick={() => supabase.auth.signOut()}
            className="font-primary font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity duration-200"
            style={{ backgroundColor: 'var(--innovation-teal)', color: 'var(--authority-white)' }}
          >
            Sign Out
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