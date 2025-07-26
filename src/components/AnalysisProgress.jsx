AnalysisProgress// src/components/AnalysisProgress.jsx - COMPLETE AND CORRECTED CODE (Final Insight Box Border Fix)
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function AnalysisProgress({ analysisId, onAnalysisComplete }) {
  const [progress, setProgress] = useState(0);
  const [currentFactor, setCurrentFactor] = useState('Initializing analysis...');
  const [educationalTip, setEducationalTip] = useState('Launching secure browser environment...'); // Ensure initial tip for display
  const [isCompleted, setIsCompleted] = useState(false); // Track completion to prevent multiple triggers

  // Handle analysis completion with smooth transition
  const handleCompletion = (progressPercent) => {
    if (progressPercent === 100 && !isCompleted && onAnalysisComplete) {
      setIsCompleted(true);
      setCurrentFactor('Analysis Complete!');
      setEducationalTip('Great work! Your comprehensive analysis is ready. Redirecting to results dashboard...');
      
      console.log('🎉 Analysis reached 100% - preparing auto-navigation');
      
      // Add a brief delay for user to see completion state before auto-navigation
      setTimeout(() => {
        console.log('🔄 Auto-navigating to results dashboard');
        onAnalysisComplete();
      }, 2500); // 2.5 second delay for smooth UX
    }
  };

  useEffect(() => {
    if (!analysisId) {
      console.log('⚠️ No analysisId provided to AnalysisProgress');
      return;
    }

    console.log('🔄 AnalysisProgress: Setting up subscription for analysisId:', analysisId);
    setEducationalTip('Launching secure browser environment...'); // Set initial tip for visual feedback

    // First, check for any existing progress
    const checkExistingProgress = async () => {
      try {
        const { data: existingProgress, error } = await supabase
          .from('analysis_progress')
          .select('*')
          .eq('analysis_id', analysisId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (error) {
          console.error('❌ Error fetching existing progress:', error);
        } else if (existingProgress && existingProgress.length > 0) {
          const latest = existingProgress[0];
          console.log('📊 Found existing progress:', latest);
          console.log('📊 Progress fields:', {
            progress_percent: latest.progress_percent,
            stage: latest.stage,
            message: latest.message,
            educational_content: latest.educational_content
          });
          setProgress(latest.progress_percent || 0);
          setCurrentFactor(latest.message || latest.stage || 'Processing...');
          setEducationalTip(latest.educational_content || 'Analyzing...');
          
          // Check for completion on existing progress
          handleCompletion(latest.progress_percent);
        }
      } catch (error) {
        console.error('❌ Exception checking existing progress:', error);
      }
    };
    
    checkExistingProgress();

    // Subscribe to real-time changes on the analysis_progress table
    const channel = supabase
      .channel(`analysis_progress_${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Focus on INSERT events for new progress
          schema: 'public', 
          table: 'analysis_progress',
          filter: `analysis_id=eq.${analysisId}`,
        },
        (payload) => {
          console.log('📨 Received INSERT progress payload:', payload);
          const newProgress = payload.new;

          if (newProgress && typeof newProgress.progress_percent === 'number') {
            console.log(`📊 Real-time progress update: ${newProgress.progress_percent}% - ${newProgress.stage}`);
            setProgress(newProgress.progress_percent);
            const readableStage = newProgress.message || 
                                (newProgress.stage || 'Processing...').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setCurrentFactor(readableStage);
            setEducationalTip(newProgress.educational_content || 'Analyzing factor...');
            console.log("✅ Real-time progress update applied:", {
              progress: newProgress.progress_percent,
              stage: readableStage,
              tip: newProgress.educational_content
            });
            
            // Check for completion on real-time updates
            handleCompletion(newProgress.progress_percent);
          } else {
            console.warn('⚠️ Received invalid progress payload:', payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Also listen for updates
          schema: 'public',
          table: 'analysis_progress', 
          filter: `analysis_id=eq.${analysisId}`,
        },
        (payload) => {
          console.log('📨 Received UPDATE progress payload:', payload);
          // Handle updates the same way
          const newProgress = payload.new;
          if (newProgress && typeof newProgress.progress_percent === 'number') {
            setProgress(newProgress.progress_percent);
            const readableStage = newProgress.message || 
                                (newProgress.stage || 'Processing...').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            setCurrentFactor(readableStage);
            setEducationalTip(newProgress.educational_content || 'Analyzing factor...');
            console.log("✅ UPDATE progress applied:", newProgress.progress_percent + '%');
            
            // Check for completion on UPDATE events too
            handleCompletion(newProgress.progress_percent);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time progress updates');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Subscription closed - attempting to reconnect...');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error - please check RLS policies');
        }
      });

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId]);

  return (
    <div className="rounded-lg p-6 mb-6 shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #64748B' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-primary font-semibold" style={{ color: '#0F172A' }}>
          MASTERY-AI Framework Analysis
        </h3>
        <span className="font-primary text-sm" style={{ color: '#0891B2' }}>
          {progress}% Complete
        </span>
      </div>

      <div className="w-full rounded-full h-2 mb-4" style={{ backgroundColor: 'rgba(100, 116, 139, 0.2)' }}>
        <div 
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: '#0891B2' }}
        />
      </div>

      <div className="space-y-3">
        <p className="font-secondary" style={{ color: '#0F172A' }}>
          Currently analyzing: <span className="font-semibold">{currentFactor}</span>
        </p>

        {educationalTip && (
          // Framework Insight box - CRITICAL FIX: Add full border and then left-border override
          <div 
            className="p-4 rounded" 
            style={{ 
              backgroundColor: 'rgba(30, 58, 138, 0.05)', // Mastery Blue light background
              border: '1px solid #64748B', // AI Silver 1px border on all sides
              borderLeft: '4px solid #1E3A8A' // Mastery Blue 4px border only on the left, overrides the 1px
            }}
          >
            <h4 className="font-primary font-medium mb-2" style={{ color: '#1E3A8A' }}>
              Framework Insight
            </h4>
            <p className="font-secondary text-sm" style={{ color: '#0F172A' }}>
              {educationalTip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalysisProgress;