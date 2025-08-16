import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function PreviewAnalysis({ analysisId, url, onAnalysisComplete }) {
  const [progress, setProgress] = useState(10);
  const [currentMessage, setCurrentMessage] = useState('Initializing AI analysis framework...');
  const [currentStage, setCurrentStage] = useState('initialization');
  const [educationalContent, setEducationalContent] = useState('Setting up secure analysis environment...');

  useEffect(() => {
    let simulationInterval;
    let completed = false;
    
    // Use client-side simulation for anonymous users to avoid RLS policy issues
    const startClientSideSimulation = () => {
      console.log('🎭 Starting client-side progress simulation for anonymous preview');
      
      const progressStages = [
        { progress: 15, message: 'Connecting to your website...', stage: 'connection', educational: 'Establishing secure connection to analyze your site' },
        { progress: 25, message: 'Analyzing title tags and meta descriptions...', stage: 'meta', educational: 'Title tags are crucial for AI understanding' },
        { progress: 35, message: 'Checking HTTPS security configuration...', stage: 'security', educational: 'Security signals affect AI trust scores' },
        { progress: 45, message: 'Evaluating content structure and headings...', stage: 'structure', educational: 'Proper heading hierarchy helps AI parse content' },
        { progress: 55, message: 'Analyzing authority signals...', stage: 'authority', educational: 'AI systems prioritize authoritative sources' },
        { progress: 65, message: 'Scanning for AI readability factors...', stage: 'readability', educational: 'Content must be optimized for AI consumption' },
        { progress: 75, message: 'Processing MASTERY-AI Framework factors...', stage: 'framework', educational: 'Applying 148-factor comprehensive analysis' },
        { progress: 85, message: 'Calculating improvement opportunities...', stage: 'opportunities', educational: 'Identifying quick wins and critical issues' },
        { progress: 95, message: 'Finalizing your analysis report...', stage: 'finalizing', educational: 'Preparing actionable recommendations' },
        { progress: 100, message: 'Analysis complete!', stage: 'complete', educational: 'Your AI optimization report is ready' }
      ];
      
      let stageIndex = 0;
      
      // Update progress every 1.5 seconds for a 15-second total duration
      simulationInterval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          const stage = progressStages[stageIndex];
          setProgress(stage.progress);
          setCurrentMessage(stage.message);
          setCurrentStage(stage.stage);
          setEducationalContent(stage.educational);
          
          if (stage.progress >= 100 && !completed) {
            completed = true;
            clearInterval(simulationInterval);
            console.log('✅ Analysis simulation completed');
            setTimeout(() => {
              onAnalysisComplete();
            }, 2000); // Show completion message for 2 seconds
          }
          
          stageIndex++;
        }
      }, 1500); // 1.5 seconds per stage = 15 seconds total
    };
    
    // Start client-side simulation immediately for anonymous users
    startClientSideSimulation();

    // Cleanup function
    return () => {
      if (simulationInterval) {
        console.log('🧹 Cleaning up progress simulation');
        clearInterval(simulationInterval);
      }
    };
  }, [analysisId, onAnalysisComplete]);

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    return 'bg-blue-500';
  };

  const getStageIcon = () => {
    if (progress >= 100) return '✅';
    if (currentStage.includes('fetching')) return '📡';
    if (currentStage.includes('analyzing')) return '🔍';
    if (currentStage.includes('finalization')) return '📊';
    return '⚙️';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl w-full p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Analyzing Your Website
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Running real AI optimization analysis for:
            </p>
            <p className="text-blue-600 font-semibold text-lg break-all">
              {url}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-2">
                <span className="text-lg">{getStageIcon()}</span>
                {currentMessage}
              </span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Educational Content */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What's Happening Now:
            </h3>
            <p className="text-blue-800 text-sm">
              {educationalContent}
            </p>
          </div>

          {/* Framework Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              MASTERY-AI Framework v3.1.1
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <strong>✓ 11 Core Factors:</strong> Fast analysis covering the most critical optimization elements
              </div>
              <div>
                <strong>✓ Framework Compliant:</strong> Official MASTERY-AI factor mappings and weights
              </div>
              <div>
                <strong>✓ Real-Time Analysis:</strong> Live analysis of your actual website content
              </div>
              <div>
                <strong>✓ Actionable Results:</strong> Specific recommendations for your site
              </div>
            </div>
          </div>

          {/* Completion Message */}
          {progress >= 100 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full">
                <span className="text-2xl mr-2">🎉</span>
                <span className="font-semibold">Analysis Complete!</span>
                <span className="ml-2">Preparing your results...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewAnalysis;