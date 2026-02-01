import { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseFacade as supabase } from '../lib/supabaseFacade';
import { runAnalysis, useRailwayBackend, getRailwayApiUrl } from '../lib/railwayApi';

/**
 * Pillar definitions for score calculation
 */
const PILLAR_DEFINITIONS = {
  'AI': { name: 'AI Response Optimization & Citation', weight: 23.8 },
  'A': { name: 'Authority & Trust Signals', weight: 17.9 },
  'M': { name: 'Machine Readability & Technical Infrastructure', weight: 14.6 },
  'S': { name: 'Semantic Content Quality', weight: 13.9 },
  'E': { name: 'Engagement & User Experience', weight: 10.9 },
  'T': { name: 'Technical SEO & Foundation', weight: 8.9 },
  'R': { name: 'Reference Networks & Citations', weight: 5.9 },
  'Y': { name: 'Yield Optimization & Freshness', weight: 4.1 },
  'P': { name: 'Performance & Speed', weight: 5.0 }
};

/**
 * Calculate pillar scores from factor data
 */
export function calculatePillarScoresFromFactors(factors) {
  if (!factors || factors.length === 0) return {};

  const pillarGroups = {};

  factors.forEach(factor => {
    const pillarId = factor.pillar;
    if (!pillarId) return;
    if (!pillarGroups[pillarId]) {
      pillarGroups[pillarId] = { factors: [], totalScore: 0 };
    }
    pillarGroups[pillarId].factors.push(factor);
    pillarGroups[pillarId].totalScore += factor.score || 0;
  });

  const pillars = {};
  Object.keys(PILLAR_DEFINITIONS).forEach(pillarId => {
    const def = PILLAR_DEFINITIONS[pillarId];
    const group = pillarGroups[pillarId];

    if (group && group.factors.length > 0) {
      const avgScore = Math.round(group.totalScore / group.factors.length);
      pillars[pillarId] = {
        score: avgScore,
        weight: def.weight,
        factors: group.factors.length,
        name: def.name
      };
    } else {
      pillars[pillarId] = {
        score: 0,
        weight: def.weight,
        factors: 0,
        name: def.name
      };
    }
  });

  return pillars;
}

/**
 * useAnalysis - Analysis state management and operations
 * 
 * Manages URL input, analysis execution, results, and error state.
 * 
 * @param {object} config
 * @param {object} config.session - Current auth session
 * @param {string} config.userTier - Current user tier
 * @param {Function} config.navigate - Navigation function (setCurrentView)
 * @param {Function} config.canAnalyze - Check if user can analyze
 * @param {Function} config.incrementUsage - Increment usage counter
 * @param {React.MutableRefObject} config.pendingAnalysisProcessed - Shared ref
 * @param {object} config.tracking - GTM tracking functions
 */
export function useAnalysis({ session, userTier, navigate, canAnalyze, incrementUsage, pendingAnalysisProcessed, tracking }) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);

  // Handle analysis from landing page (no auth)
  const handleLandingAnalysis = useCallback((url, analysisId) => {
    setCurrentUrl(url);
    setCurrentAnalysisId(analysisId);
    setPendingAnalysis({ url, analysisId });
    navigate('preview-analysis');
  }, [navigate]);

  // Handle analysis completion from preview
  const handlePreviewAnalysisComplete = useCallback(() => {
    navigate('preview-results');
  }, [navigate]);

  // Handle analysis complete (mock progress finished)
  const handleAnalysisComplete = useCallback(() => {
    console.log('🔄 Mock analysis progress completed, waiting for real analysis...');
  }, []);

  // Handle viewing an analysis from history
  const handleViewHistoryAnalysis = useCallback(async (analysisId, url) => {
    console.log('📊 Viewing analysis from history:', { analysisId, url });

    try {
      const { data: analysis, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (!error && analysis) {
        const { data: factors, error: factorsError } = await supabase
          .from('analysis_factors')
          .select('*')
          .eq('analysis_id', analysisId);

        if (!factorsError && factors) {
          const storedPillars = analysis.scores?.pillars;
          const hasPillarScores = storedPillars && Object.keys(storedPillars).length > 0 &&
            Object.values(storedPillars).some(p => p?.score > 0);

          const pillars = hasPillarScores
            ? storedPillars
            : calculatePillarScoresFromFactors(factors);

          const results = {
            overall_score: analysis.scores?.overall_score || analysis.overall_score || 0,
            factors: factors || [],
            pillars: pillars,
            url: analysis.url,
            analysisId: analysisId,
            created_at: analysis.created_at
          };
          
          setAnalysisResults(results);
          setCurrentAnalysisId(analysisId);
          setCurrentUrl(url || analysis.url);
          navigate('results');
        } else {
          console.error('Failed to load analysis factors:', factorsError);
          setAnalysisResults({
            overall_score: analysis.scores?.overall_score || 0,
            factors: [],
            url: url || analysis.url,
            analysisId: analysisId
          });
          setCurrentAnalysisId(analysisId);
          setCurrentUrl(url || analysis.url);
          navigate('results');
        }
      } else {
        console.error('Failed to load analysis:', error);
        alert('Failed to load analysis results. The analysis may have been deleted.');
      }
    } catch (err) {
      console.error('Error loading analysis from history:', err);
      alert('Error loading analysis. Please try again.');
    }
  }, [navigate]);

  // Start analysis (authenticated version)
  const startAnalysis = useCallback(async (url) => {
    if (!session?.user) {
      navigate('landing');
      return;
    }

    setAnalysisError(null);

    if (userTier === 'free' && !canAnalyze()) {
      setAnalysisError({
        title: 'Usage Limit Reached',
        message: 'You\'ve reached your monthly limit of 3 analyses. Upgrade to Coffee tier for unlimited analyses!',
        action: 'upgrade'
      });
      if (tracking.trackFeatureUsage) tracking.trackFeatureUsage('usage_limit_reached', 'analysis_blocked');
      return;
    }

    try {
      setIsAnalyzing(true);
      const userId = session.user.id;
      const userEmail = session.user.email;
      const analysisId = crypto.randomUUID();
      const startTime = Date.now();

      console.log('🚀 Starting analysis for URL:', url);
      if (tracking.trackAnalysisStart) tracking.trackAnalysisStart(url);
      
      setCurrentUrl(url);
      setCurrentAnalysisId(analysisId);

      // Try to create analysis record
      let dbInsertSuccess = false;
      try {
        const dbInsertPromise = supabase
          .from('analyses')
          .insert({
            id: analysisId,
            user_id: userId,
            url: url,
            status: 'processing',
            scores: {
              overall_score: 0,
              pillars: {},
              factors: {}
            },
            factor_results: {},
            framework_version: '3.1.1',
            analysis_duration: null,
            created_at: new Date().toISOString()
          });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database insert timeout')), 15000)
        );

        const { error: insertError } = await Promise.race([
          dbInsertPromise,
          timeoutPromise
        ]).catch(err => ({ error: err }));

        if (insertError) {
          console.log("⚠️ Could not create analysis record:", insertError.message || insertError);
        } else {
          dbInsertSuccess = true;
        }
      } catch (error) {
        console.log("⚠️ Analysis record creation failed:", error.message);
      }

      // Increment usage tracking
      const usageAllowed = incrementUsage();
      if (!usageAllowed && userTier === 'free') {
        console.error('❌ Usage limit reached after pre-flight check');
        setAnalysisError({
          title: 'Usage Limit Reached',
          message: 'You\'ve reached your monthly limit of 3 analyses. Upgrade to Coffee tier for unlimited analyses!',
          action: 'upgrade'
        });
        setIsAnalyzing(false);
        if (tracking.trackFeatureUsage) tracking.trackFeatureUsage('usage_limit_reached', 'analysis_blocked_late');
        return;
      }

      navigate('analysis');

      // Choose backend
      const useRailway = useRailwayBackend();
      let data, invokeError;

      if (useRailway) {
        console.log(`🚂 Using Railway backend: ${getRailwayApiUrl()}`);
        try {
          const result = await runAnalysis(
            url,
            userId,
            analysisId,
            userTier,
            (progress) => {
              console.log(`📊 Analysis progress: ${progress.status} (attempt ${progress.attempts})`);
            }
          );
          data = result;
        } catch (error) {
          invokeError = error;
        }
      } else {
        console.log('⚡ Using Edge Function backend');
        try {
          const edgeFunctionPromise = supabase.functions.invoke('analyze-page', {
            body: { url, analysisId, userId }
          });

          const edgeTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Analysis timeout - please try again')), 45000)
          );

          const result = await Promise.race([
            edgeFunctionPromise,
            edgeTimeoutPromise
          ]).catch(err => ({ error: err }));

          if (result.error) {
            invokeError = result.error;
          } else {
            data = result.data;
            invokeError = result.error;
          }
        } catch (error) {
          invokeError = error;
        }
      }
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      if (invokeError) {
        const backendType = useRailway ? 'railway_backend' : 'edge_function';
        console.error(`❌ ${useRailway ? 'Railway' : 'Edge Function'} error:`, invokeError);
        if (tracking.trackError) tracking.trackError(backendType, invokeError.message || invokeError, 'analysis');

        let errorMessage = invokeError.message || 'The analysis service is temporarily unavailable. Please try again.';
        let errorTitle = 'Analysis Failed';

        if (errorMessage.includes('DOMAIN_NOT_FOUND') || errorMessage.includes('URL_UNREACHABLE')) {
          errorTitle = 'Website Not Found';
          errorMessage = 'The website could not be reached. Please check the URL is correct and the site is online.';
        } else if (errorMessage.includes('FETCH_TIMEOUT')) {
          errorTitle = 'Request Timeout';
          errorMessage = 'The website took too long to respond. Please try again later.';
        } else if (errorMessage.includes('non-2xx status')) {
          errorTitle = 'Analysis Error';
          errorMessage = 'We couldn\'t analyze this website. It may be blocking our scanner or have an invalid URL.';
        }

        setAnalysisError({ title: errorTitle, message: errorMessage, action: 'retry' });
      } else {
        console.log('✅ Analysis completed:', data);
        if (data && data.success) {
          const results = {
            overall_score: data.overall_score,
            factors: data.factors || [],
            pillars: data.pillars || {},
            url: url,
            analysisId: analysisId,
            created_at: new Date().toISOString()
          };
          setAnalysisResults(results);
          if (tracking.trackAnalysisComplete) tracking.trackAnalysisComplete(url, data.overall_score, duration);
          navigate('results');
        } else {
          console.error('❌ Invalid analysis response:', data);
          setAnalysisError({
            title: 'Invalid Results',
            message: 'The analysis completed but returned invalid data. Please try again or contact support.',
            action: 'retry'
          });
          navigate('input');
        }
      }

    } catch (error) {
      console.error('❌ Error starting analysis:', error);
      if (tracking.trackError) tracking.trackError('analysis_start', error.message, 'analysis');
      setAnalysisError({
        title: 'Analysis Error',
        message: error.message || 'An unexpected error occurred. Please try again.',
        action: 'retry'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [session, userTier, navigate, canAnalyze, incrementUsage, tracking]);

  return {
    currentUrl,
    setCurrentUrl,
    currentAnalysisId,
    setCurrentAnalysisId,
    isAnalyzing,
    analysisResults,
    setAnalysisResults,
    analysisError,
    setAnalysisError,
    pendingAnalysis,
    setPendingAnalysis,
    handleLandingAnalysis,
    handlePreviewAnalysisComplete,
    handleAnalysisComplete,
    handleViewHistoryAnalysis,
    startAnalysis,
  };
}
