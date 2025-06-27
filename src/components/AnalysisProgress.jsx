// src/components/AnalysisProgress.jsx - COMPLETE AND CORRECTED CODE (Embedded Style Tag for Diagnosis)
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function AnalysisProgress({ analysisId }) {
  const [progress, setProgress] = useState(0);
  const [currentFactor, setCurrentFactor] = useState('Initializing analysis...');
  const [educationalTip, setEducationalTip] = useState('Launching secure browser environment...'); // Ensure initial tip for display

  useEffect(() => {
    if (!analysisId) return;

    setEducationalTip('Launching secure browser environment...'); // Set initial tip for visual feedback

    // Subscribe to real-time changes on the analysis_progress table
    const channel = supabase
      .channel(`analysis_progress:${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE)
          schema: 'public',
          table: 'analysis_progress',
          filter: `analysis_id=eq.${analysisId}`, // Filter for this specific analysis
        },
        (payload) => {
          const newProgress = payload.new;
          if (newProgress) {
            setProgress(newProgress.progress_percentage);
            setCurrentFactor(newProgress.current_factor);
            setEducationalTip(newProgress.educational_content?.tip || ''); // Update tip from real-time
            console.log("Real-time progress update:", newProgress); // For debugging
          }
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [analysisId]);

  return (
    <div className="rounded-lg p-6 mb-6 shadow-md" style={{ backgroundColor: '#FFFFFF', border: '1px solid #64748B' }}>
      <style jsx="true">{` /* IMPORTANT: This is for DIAGNOSIS. Use jsx="true" or global */
        .analysis-progress-container-diagnostic {
          background-color: #FFFFFF !important;
          border: 1px solid #64748B !important;
        }
        .progress-bar-track-diagnostic {
          background-color: rgba(100, 116, 139, 0.2) !important;
        }
        .progress-bar-fill-diagnostic {
          background-color: #0891B2 !important;
        }
        .framework-insight-box-diagnostic {
          border-left: 4px solid #1E3A8A !important;
          background-color: rgba(30, 58, 138, 0.05) !important;
        }
        .framework-insight-title-diagnostic {
          color: #1E3A8A !important;
        }
        .framework-insight-text-diagnostic {
          color: #0F172A !important;
        }
        /* Text colors (also apply to elements outside these specific containers if needed) */
        .framework-black-text-diagnostic {
            color: #0F172A !important;
        }
        .innovation-teal-text-diagnostic {
            color: #0891B2 !important;
        }
      `}</style>

      <div className="rounded-lg p-6 mb-6 shadow-md analysis-progress-container-diagnostic"> {/* Use diagnostic class here */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-primary font-semibold framework-black-text-diagnostic"> {/* Use diagnostic class */}
            MASTERY-AI Framework Analysis
          </h3>
          <span className="font-primary text-sm innovation-teal-text-diagnostic"> {/* Use diagnostic class */}
            {progress}% Complete
          </span>
        </div>

        <div className="w-full rounded-full h-2 mb-4 progress-bar-track-diagnostic"> {/* Use diagnostic class */}
          <div 
            className="h-2 rounded-full transition-all duration-500 progress-bar-fill-diagnostic" // Use diagnostic class
            style={{ width: `${progress}%` }} // Width still dynamic
          />
        </div>

        <div className="space-y-3">
          <p className="font-secondary framework-black-text-diagnostic"> {/* Use diagnostic class */}
            Currently analyzing: <span className="font-semibold">{currentFactor}</span>
          </p>

          {educationalTip && (
            <div className="p-4 rounded framework-insight-box-diagnostic"> {/* Use diagnostic class */}
              <h4 className="font-primary font-medium mb-2 framework-insight-title-diagnostic"> {/* Use diagnostic class */}
                Framework Insight
              </h4>
              <p className="font-secondary text-sm framework-insight-text-diagnostic"> {/* Use diagnostic class */}
                {educationalTip}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisProgress;