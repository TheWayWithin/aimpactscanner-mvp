// Simplified Analysis Progress - works without database
import React, { useState, useEffect, useRef } from 'react';

function SimpleAnalysisProgress({ analysisId, url, onAnalysisComplete, error, onRetry }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing analysis...');
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRefs = useRef([]);

  // Clear all timeouts on unmount or error
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  // Stop progress animation when error occurs
  useEffect(() => {
    if (error) {
      console.log('❌ SimpleAnalysisProgress: Error received, stopping animation');
      timeoutRefs.current.forEach(clearTimeout);
    }
  }, [error]);

  useEffect(() => {
    if (error) return; // Don't start animation if there's already an error

    console.log('🔄 SimpleAnalysisProgress: Starting mock progress for', analysisId);

    // Simulate realistic progress since we can't read from database
    const progressSteps = [
      { percent: 10, message: 'Fetching webpage content...', delay: 1000 },
      { percent: 25, message: 'Analyzing HTML structure...', delay: 2000 },
      { percent: 40, message: 'Checking HTTPS and security factors...', delay: 1500 },
      { percent: 55, message: 'Evaluating meta tags and titles...', delay: 2000 },
      { percent: 70, message: 'Assessing content authority signals...', delay: 1500 },
      { percent: 85, message: 'Calculating AI readability scores...', delay: 2000 },
      { percent: 100, message: 'Analysis complete! Generating results...', delay: 1000 }
    ];

    let currentStep = 0;

    const runProgress = () => {
      if (currentStep < progressSteps.length) {
        const step = progressSteps[currentStep];

        const timeoutId = setTimeout(() => {
          setProgress(step.percent);
          setStatus(step.message);

          if (step.percent === 100) {
            setIsComplete(true);
            const completeTimeoutId = setTimeout(() => {
              console.log('✅ SimpleAnalysisProgress: Mock analysis completed');
              onAnalysisComplete?.();
            }, 1500);
            timeoutRefs.current.push(completeTimeoutId);
          }

          currentStep++;
          runProgress();
        }, step.delay);
        timeoutRefs.current.push(timeoutId);
      }
    };

    // Start progress simulation
    runProgress();

  }, [analysisId, onAnalysisComplete, error]);

  // If there's an error, show error state
  if (error) {
    return (
      <div className="analysis-progress-container max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {error.title || 'Analysis Failed'}
                </h2>
                <p className="text-gray-600 text-sm">{error.message}</p>
              </div>
            </div>
          </div>

          {/* URL that failed */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-red-900 mb-2">Could not analyze:</h3>
            <p className="text-red-800 text-sm break-all">{url}</p>
          </div>

          {/* Suggestions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Suggestions:</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Check if the URL is spelled correctly</li>
              <li>• Make sure the website is online and accessible</li>
              <li>• Try with the full URL including https://</li>
              <li>• Some sites may block automated analysis</li>
            </ul>
          </div>

          {/* Retry button */}
          <div className="text-center">
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Another URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-progress-container max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-800">
              AI Search Analysis in Progress
            </h2>
            <span className="text-sm text-gray-600">
              {progress}% complete
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Current Status */}
          <p className="text-gray-700 flex items-center">
            {!isComplete ? (
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="mr-3 h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {status}
          </p>
        </div>

        {/* Analysis Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Analyzing:</h3>
          <p className="text-blue-800 text-sm break-all">{url}</p>

          <div className="mt-3 text-xs text-blue-700">
            <p className="mb-1">• 27 critical factors: AI readiness + SEO foundation</p>
            <p>• Real-time evidence collection and scoring</p>
          </div>
        </div>

        {isComplete && (
          <div className="mt-4 text-center">
            <p className="text-green-600 font-medium">
              Analysis complete! Redirecting to results...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleAnalysisProgress;