import React, { useState } from 'react';
import { analyzeSyncAnonymous } from '../lib/railwayApi';
import AILogo from './AILogo';

// 9-Step Homepage Sections (Audit v3 psychological journey)
import HeroSection from './landing/HeroSection';
import ProblemSection from './landing/ProblemSection';
import SolutionSection from './landing/SolutionSection';
import OutputSection from './landing/OutputSection';
import MethodologySection from './landing/MethodologySection';
import ProofSection from './landing/ProofSection';
import PriceSection from './landing/PriceSection';
import FitSection from './landing/FitSection';
import FinalCtaSection from './landing/FinalCtaSection';

function Landing({ onAnalysisComplete, onNavigate, isAuthenticated }) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (inputUrl) => {
    try {
      let urlToValidate = inputUrl.trim();
      if (!urlToValidate) return null;

      if (!urlToValidate.match(/^https?:\/\//)) {
        urlToValidate = 'https://' + urlToValidate;
      }

      const urlObj = new URL(urlToValidate);
      return urlObj.href;
    } catch {
      return null;
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    const validatedUrl = validateUrl(url);
    if (!validatedUrl) {
      setError('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);

    try {
      const analysisId = crypto.randomUUID();
      const tempUserId = 'temp_' + crypto.randomUUID();

      const analysisData = {
        analysisId,
        url: validatedUrl,
        tempUserId,
        timestamp: new Date().toISOString(),
        status: 'in_progress'
      };

      localStorage.setItem('landingAnalysisData', JSON.stringify(analysisData));
      localStorage.setItem('pendingAnalysisUrl', validatedUrl);
      localStorage.setItem('pendingAnalysisId', analysisId);

      // Start analysis via Railway backend
      console.log('Starting analysis from landing page:', { analysisId, url: validatedUrl, tempUserId });

      const data = await analyzeSyncAnonymous(validatedUrl);

      console.log('Analysis completed successfully:', data);

      if (data && data.success) {
        analysisData.status = 'completed';
        analysisData.results = {
          overall_score: data.overall_score,
          factors: data.factors || [],
          factors_count: data.factor_count || 0,
          pillars: data.pillars || null
        };
        localStorage.setItem('landingAnalysisData', JSON.stringify(analysisData));
      } else {
        console.warn('Analysis did not return success:', data);
      }

      onAnalysisComplete(validatedUrl, analysisId);

    } catch (err) {
      console.error('Error starting analysis:', err);
      setError(`Error starting analysis: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-mastery shadow-sm border-b border-mastery/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AILogo className="h-10 md:h-12" />
              <div>
                <div className="text-lg md:text-xl font-bold text-white">
                  AImpactScanner
                </div>
                <div className="text-xs text-white/70">
                  Part of AI Search Mastery
                </div>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => onNavigate('methodology')} className="text-white/80 hover:text-white text-sm font-medium transition-colors">Methodology</button>
              <button onClick={() => onNavigate('how-it-works')} className="text-white/80 hover:text-white text-sm font-medium transition-colors">How It Works</button>
              <button onClick={() => onNavigate('sample-report')} className="text-white/80 hover:text-white text-sm font-medium transition-colors">Sample Report</button>
              <button onClick={() => onNavigate('pricing')} className="text-white/80 hover:text-white text-sm font-medium transition-colors">Pricing</button>
              <button onClick={() => onNavigate('suite')} className="text-white/80 hover:text-white text-sm font-medium transition-colors">The Suite</button>
            </nav>

            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-4 py-2 bg-signal text-white font-medium rounded-lg hover:bg-signal/90 transition-colors text-sm"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 bg-clarity text-white font-medium rounded-lg hover:bg-clarity/90 transition-colors text-sm"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 9-Step Psychological Journey */}
      {/* Step 1: Hero - "Is this for me? What does it do?" */}
      <HeroSection
        url={url}
        setUrl={setUrl}
        isAnalyzing={isAnalyzing}
        error={error}
        onSubmit={handleAnalyze}
      />

      {/* Step 2: Problem - "Do they understand my specific problem?" */}
      <ProblemSection />

      {/* Step 3: Solution - "How does this actually work?" */}
      <SolutionSection onNavigate={onNavigate} />

      {/* Step 4: Output - "What do I actually get?" */}
      <OutputSection onNavigate={onNavigate} />

      {/* Step 5: Methodology - "Is this rigorous or just made up?" */}
      <MethodologySection onNavigate={onNavigate} />

      {/* Step 6: Proof - "Why should I believe you?" */}
      <ProofSection />

      {/* Step 7: Price - "Is the risk acceptable? What's the value?" */}
      <PriceSection onNavigate={onNavigate} />

      {/* Step 8: Fit - "Am I the right person for this?" */}
      <FitSection />

      {/* Step 9: Final CTA - "What should I do now?" */}
      <FinalCtaSection />
    </div>
  );
}

export default Landing;
