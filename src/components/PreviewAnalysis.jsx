import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function PreviewAnalysis({ analysisId, url, onAnalysisComplete }) {
  const [progress, setProgress] = useState(10);
  const [currentMessage, setCurrentMessage] = useState('Initializing AI analysis framework...');
  const [currentStage, setCurrentStage] = useState('initialization');
  const [educationalContent, setEducationalContent] = useState('Setting up secure analysis environment...');

  useEffect(() => {
    let subscription;
    let fallbackInterval;
    let completed = false;

    const startProgressTracking = () => {
      console.log('🔄 Starting progress tracking for analysis:', analysisId);
      
      // Set up real-time subscription for progress updates
      subscription = supabase
        .channel(`analysis_progress_${analysisId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'analysis_progress',
          filter: `analysis_id=eq.${analysisId}`
        }, (payload) => {
          console.log('📊 Progress update received:', payload);
          
          if (payload.new) {
            setProgress(payload.new.progress_percent || 0);
            setCurrentMessage(payload.new.message || 'Processing...');
            setCurrentStage(payload.new.stage || 'processing');
            setEducationalContent(payload.new.educational_content || 'Analyzing your site...');
            
            // Check if analysis is complete
            if (payload.new.progress_percent >= 100) {
              if (!completed) {
                completed = true;
                console.log('✅ Analysis completed via subscription');
                setTimeout(() => {
                  onAnalysisComplete();
                }, 2500); // Show completion message for 2.5 seconds
              }
            }
          }
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ Real-time subscription failed, starting fallback polling');
            startFallbackPolling();
          }
        });

      // Start fallback polling as backup
      setTimeout(() => {
        if (!completed) {
          console.log('🔄 Starting backup polling for progress updates');
          startFallbackPolling();
        }
      }, 3000);
    };

    const startFallbackPolling = () => {
      if (fallbackInterval) return; // Already running
      
      fallbackInterval = setInterval(async () => {
        if (completed) {
          clearInterval(fallbackInterval);
          return;
        }
        
        try {
          const { data, error } = await supabase
            .from('analysis_progress')
            .select('*')
            .eq('analysis_id', analysisId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (data && !error) {
            console.log('📊 Fallback progress update:', data);
            setProgress(data.progress_percent || 0);
            setCurrentMessage(data.message || 'Processing...');
            setCurrentStage(data.stage || 'processing');
            setEducationalContent(data.educational_content || 'Analyzing your site...');
            
            if (data.progress_percent >= 100 && !completed) {
              completed = true;
              console.log('✅ Analysis completed via fallback polling');
              clearInterval(fallbackInterval);
              setTimeout(() => {
                onAnalysisComplete();
              }, 2500);
            }
          }
        } catch (error) {
          console.error('❌ Fallback polling error:', error);
        }
      }, 1000);
    };

    startProgressTracking();

    // Cleanup function
    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up progress subscription');
        subscription.unsubscribe();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
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