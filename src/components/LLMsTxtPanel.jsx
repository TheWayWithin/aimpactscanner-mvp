import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * LLMsTxtPanel - Generate LLMs.txt files for AI search engine optimization
 *
 * Tier Requirements:
 * - Free/Coffee: Upgrade prompt shown
 * - Growth: 25 generations/month limit
 * - Scale: Unlimited generations
 */
const LLMsTxtPanel = ({ analysisUrl, userTier, onUpgrade }) => {
  // State management
  const [status, setStatus] = useState('idle'); // idle, analyzing, generating, completed, error, limit_exceeded
  const [analysisId, setAnalysisId] = useState(null);
  const [downloadData, setDownloadData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [usageStats, setUsageStats] = useState(null);
  const [progressMessage, setProgressMessage] = useState('');

  // Tier configuration
  const isEligible = userTier === 'growth' || userTier === 'scale';
  const TIER_LIMITS = {
    growth: 25,
    scale: -1 // unlimited
  };

  // Fetch usage stats on mount for eligible users
  useEffect(() => {
    if (isEligible) {
      fetchUsageStats();
    }
  }, [isEligible]);

  const fetchUsageStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-llmstxt?action=usage', {
        method: 'GET',
      });

      if (error) {
        console.error('Error fetching usage stats:', error);
        return;
      }

      setUsageStats(data);
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  }, []);

  const handleGenerate = async () => {
    if (!isEligible) {
      if (onUpgrade) onUpgrade();
      return;
    }

    // Check usage limits for Growth tier
    if (userTier === 'growth' && usageStats) {
      if (usageStats.used >= TIER_LIMITS.growth) {
        setStatus('limit_exceeded');
        setErrorMessage(`You've reached your monthly limit of ${TIER_LIMITS.growth} LLMs.txt generations. Upgrade to Scale tier for unlimited access.`);
        return;
      }
    }

    try {
      setStatus('analyzing');
      setProgressMessage('Analyzing website structure...');
      setErrorMessage('');

      // Start analysis
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke('generate-llmstxt?action=analyze', {
        body: { url: analysisUrl },
      });

      if (analyzeError) {
        throw new Error(analyzeError.message || 'Failed to start analysis');
      }

      // Check for error response
      if (analyzeData?.error) {
        if (analyzeData.error === 'Usage limit exceeded') {
          setStatus('limit_exceeded');
          setErrorMessage(analyzeData.message);
          return;
        }
        if (analyzeData.error === 'Upgrade required') {
          setStatus('idle');
          if (onUpgrade) onUpgrade();
          return;
        }
        throw new Error(analyzeData.error);
      }

      if (!analyzeData?.id) {
        throw new Error('No analysis ID returned');
      }

      const newAnalysisId = analyzeData.id;
      setAnalysisId(newAnalysisId);

      // Poll for analysis completion
      await pollAnalysisStatus(newAnalysisId);

    } catch (error) {
      console.error('Error generating LLMs.txt:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to generate LLMs.txt file. Please try again.');
    }
  };

  const pollAnalysisStatus = async (id) => {
    const maxAttempts = 60; // 60 seconds max (polling every second)
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(`generate-llmstxt?action=status&id=${id}`, {
          method: 'GET',
        });

        if (error) throw error;

        setProgressMessage(`Analyzing website... ${Math.round((attempts / maxAttempts) * 100)}%`);

        if (data?.status === 'completed') {
          setStatus('generating');
          setProgressMessage('Generating LLMs.txt file...');
          await generateFile(id);
          return;
        }

        if (data?.status === 'failed') {
          throw new Error(data.error || 'Analysis failed');
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 1000);
        } else {
          throw new Error('Analysis timeout. Please try again.');
        }
      } catch (error) {
        console.error('Error checking analysis status:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Analysis failed. Please try again.');
      }
    };

    await checkStatus();
  };

  const generateFile = async (id) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-llmstxt?action=generate', {
        body: { analysisId: id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Store the download data
      setDownloadData({
        id: data.id,
        content: data.content, // If the API returns content directly
      });
      setStatus('completed');
      setProgressMessage('LLMs.txt file ready for download!');

      // Refresh usage stats
      await fetchUsageStats();

    } catch (error) {
      console.error('Error generating file:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to generate file. Please try again.');
    }
  };

  const handleDownload = async () => {
    if (!downloadData?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke(`generate-llmstxt?action=download&id=${downloadData.id}`, {
        method: 'GET',
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'llms.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setErrorMessage('Failed to download file. Please try again.');
    }
  };

  const resetPanel = () => {
    setStatus('idle');
    setAnalysisId(null);
    setDownloadData(null);
    setErrorMessage('');
    setProgressMessage('');
  };

  // Render usage stats for Growth tier
  const renderUsageStats = () => {
    if (!usageStats || userTier === 'scale') return null;

    const { used, limit, remaining } = usageStats;
    if (limit === -1) return null; // Unlimited

    const percentage = Math.min((used / limit) * 100, 100);

    return (
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: '#475569' }}>Monthly Usage</span>
          <span className="text-sm font-semibold" style={{ color: '#7C3AED' }}>
            {used} / {limit}
          </span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E2E8F0' }}>
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage >= 80 ? '#EF4444' : '#7C3AED'
            }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin="0"
            aria-valuemax={limit}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#64748B' }}>
          {remaining > 0
            ? `${remaining} generation${remaining !== 1 ? 's' : ''} remaining this month`
            : 'Monthly limit reached'
          }
        </p>
      </div>
    );
  };

  // Render upgrade prompt for ineligible users
  const renderUpgradePrompt = () => (
    <div className="text-center py-6">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12" style={{ color: '#94A3B8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-2" style={{ color: '#0F172A' }}>Upgrade to Generate LLMs.txt</h3>
      <p className="text-sm mb-4" style={{ color: '#64748B' }}>
        Generate SEO-optimized LLMs.txt files for better AI discovery. Available on Growth ($17.95/mo) and Scale ($29.95/mo) tiers.
      </p>
      <button
        onClick={() => onUpgrade && onUpgrade()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ backgroundColor: '#7C3AED' }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#6D28D9'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#7C3AED'}
        aria-label="Upgrade to access LLMs.txt generation"
      >
        Upgrade Now
      </button>
    </div>
  );

  // Render main content for eligible users
  const renderContent = () => {
    if (!isEligible) {
      return renderUpgradePrompt();
    }

    return (
      <div>
        {renderUsageStats()}

        {/* Analyzing State */}
        {status === 'analyzing' && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3" style={{ borderColor: '#2563EB' }} aria-hidden="true"></div>
              <p className="text-sm" style={{ color: '#1E40AF' }}>{progressMessage}</p>
            </div>
          </div>
        )}

        {/* Generating State */}
        {status === 'generating' && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3" style={{ borderColor: '#2563EB' }} aria-hidden="true"></div>
              <p className="text-sm" style={{ color: '#1E40AF' }}>{progressMessage}</p>
            </div>
          </div>
        )}

        {/* Completed State */}
        {status === 'completed' && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-3" style={{ color: '#16A34A' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm" style={{ color: '#166534' }}>{progressMessage}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && errorMessage && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }} role="alert">
            <div className="flex">
              <svg className="h-5 w-5 mr-3" style={{ color: '#DC2626' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm" style={{ color: '#991B1B' }}>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Limit Exceeded State */}
        {status === 'limit_exceeded' && errorMessage && (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }} role="alert">
            <div className="flex">
              <svg className="h-5 w-5 mr-3" style={{ color: '#D97706' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm" style={{ color: '#92400E' }}>{errorMessage}</p>
                <button
                  onClick={() => onUpgrade && onUpgrade()}
                  className="mt-2 text-sm font-medium underline"
                  style={{ color: '#78350F' }}
                >
                  Upgrade to Scale Tier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {status === 'idle' && (
            <button
              onClick={handleGenerate}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: '#7C3AED' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#6D28D9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#7C3AED'}
              aria-label="Generate LLMs.txt file"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate LLMs.txt
            </button>
          )}

          {status === 'completed' && (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#16A34A' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#15803D'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#16A34A'}
                aria-label="Download LLMs.txt file"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </button>
              <button
                onClick={resetPanel}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: 'white' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                aria-label="Generate another file"
              >
                Generate Another
              </button>
            </>
          )}

          {(status === 'error' || status === 'limit_exceeded') && (
            <button
              onClick={resetPanel}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ borderColor: '#D1D5DB', color: '#374151', backgroundColor: 'white' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              aria-label="Try again"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="flex">
            <svg className="h-5 w-5 mr-2" style={{ color: '#2563EB' }} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm" style={{ color: '#1E40AF' }}>
              <p className="font-medium mb-1">About LLMs.txt</p>
              <p>This file helps AI search engines like ChatGPT, Claude, and Perplexity discover and understand your website's content, improving visibility in AI-powered search results.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg p-6 shadow" style={{ backgroundColor: 'white' }} role="region" aria-label="LLMs.txt Generation Panel">
      <div className="mb-4">
        <h2 className="text-xl font-semibold" style={{ color: '#0F172A' }}>
          LLMs.txt Generation
          {userTier === 'growth' && <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>Growth</span>}
          {userTier === 'scale' && <span className="ml-2 text-xs font-normal px-2 py-1 rounded-full" style={{ backgroundColor: '#DCFCE7', color: '#16A34A' }}>Scale</span>}
        </h2>
        <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
          Generate an optimized LLMs.txt file for {analysisUrl ? new URL(analysisUrl).hostname : 'your website'}
        </p>
      </div>

      {renderContent()}
    </div>
  );
};

export default LLMsTxtPanel;
