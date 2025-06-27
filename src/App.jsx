// src/App.jsx - Modified to correctly pass analysisId and userId to Edge Function
import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './lib/supabaseClient';

import Auth from './components/Auth';
import AnalysisProgress from './components/AnalysisProgress';

function App() {
  const [session, setSession] = useState(null);
  // Consistent ID for testing analysis. Note: this is the ID for the 'analyses' record.
  const testAnalysisId = "00000000-0000-0000-0000-000000000001";
  const testUrl = "https://www.example.com/ai-impact-test"; // URL to pass for analysis

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

  const startAnalysis = async () => {
    if (!session || !session.user) {
      console.error("User session not valid to start analysis.");
      alert("Please log in to start an analysis. Your session might have expired.");
      return;
    }

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

        // Create or ensure the analyses record exists in the 'analyses' table.
        // The Edge Function will only update this record later.
        const { error: upsertAnalysisError } = await supabase
            .from('analyses')
            .upsert({
                id: testAnalysisId,
                user_id: userId,
                url: testUrl,
                scores: { "overall": 0, "aiSearch": 0, "agentCompatibility": 0, "confidence": {} },
                factor_results: {},
                framework_version: 'MASTERY-AI v2.1 Enhanced Edition',
                status: 'pending' // Initial status
            }, { onConflict: 'id', ignoreDuplicates: true });

        if (upsertAnalysisError) {
            throw upsertAnalysisError;
        }
        console.log("Analyses record ensured (created or already existed) for user:", userId);

        // Call the deployed Supabase Edge Function to initiate the analysis.
        const { data, error: invokeError } = await supabase.functions.invoke('analyze-page', {
            body: {
                url: testUrl,
                analysisId: testAnalysisId, // CRITICAL FIX: Pass as 'analysisId'
                userId: userId // CRITICAL FIX: Pass as 'userId'
            }
        });

        if (invokeError) {
            throw invokeError;
        }
        console.log('Analysis initiated via Edge Function:', data);

    } catch (error) {
        console.error('Error starting analysis:', error);
        alert(`Error starting analysis: ${error.message}`);
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
        <AnalysisProgress analysisId={testAnalysisId} />

        <button
          onClick={startAnalysis}
          className="mt-4 font-primary font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--mastery-blue)', color: 'var(--authority-white)', '--hover-bg-color': 'var(--innovation-teal)' }}
        >
          Start New AI Scan (Test)
        </button>

        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 ml-4 font-primary font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity duration-200"
          style={{ backgroundColor: 'var(--innovation-teal)', color: 'var(--authority-white)' }}
        >
          Sign Out (Temporary)
        </button>
      </main>
      <footer className="brand-footer">
        <p>&copy; 2025 AI Search Mastery. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;