import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AnalysisEngine } from './lib/AnalysisEngine.ts'
import { CircuitBreaker } from './lib/CircuitBreaker.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let requestBody: any;
  let url: string;
  let userId: string;
  let analysisId: string;
  
  try {
    console.log('=== REAL FACTOR ANALYSIS START ===');
    
    requestBody = await req.json();
    ({ url, userId, analysisId } = requestBody);
    
    console.log('Parameters:', { url, userId, analysisId });
    
    // Validate inputs
    if (!url || !analysisId) {
      throw new Error('Missing required parameters: url or analysisId');
    }
    
    // userId can be null for test purposes
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
    
    // Initialize analysis components
    const engine = new AnalysisEngine();
    const circuitBreaker = new CircuitBreaker();
    
    // Update analysis status to processing
    const { error: statusError } = await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId);
    
    if (statusError) {
      console.error('Status update error:', statusError);
      throw new Error(`Failed to update analysis status: ${statusError.message}`);
    }
    
    console.log('Analysis status updated to processing');
    
    // Progress tracking helper
    const updateProgress = async (stage: string, percent: number, message: string) => {
      const { error: progressError } = await supabase
        .from('analysis_progress')
        .insert({
          analysis_id: analysisId,
          stage,
          progress_percent: percent,
          message,
          educational_content: getEducationalContent(stage)
        });
      
      if (progressError) {
        console.error('Progress update error:', progressError);
      } else {
        console.log(`Progress: ${percent}% - ${message}`);
      }
    };
    
    // Start analysis with progress updates
    await updateProgress('initialization', 5, 'Initializing analysis engine...');
    
    // Phase A: Instant Analysis
    console.log('🚀 Starting Phase A instant analysis...');
    await updateProgress('instant_analysis', 20, 'Analyzing critical factors...');
    
    const analysisResult = await engine.analyzeInstantFactors(url);
    
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }
    
    console.log(`✅ Phase A completed: ${analysisResult.factors.length} factors analyzed`);
    await updateProgress('instant_complete', 50, 'Instant analysis complete!');
    
    // Insert factor results into database
    for (const factor of analysisResult.factors) {
      const { error: factorError } = await supabase
        .from('analysis_factors')
        .insert({
          analysis_id: analysisId,
          factor_id: factor.factor_id,
          factor_name: factor.factor_name,
          pillar: factor.pillar,
          score: factor.score,
          confidence: factor.confidence,
          weight: factor.weight,
          evidence: factor.evidence,
          recommendations: factor.recommendations
        });
      
      if (factorError) {
        console.error('Factor insert error:', factorError);
      } else {
        console.log(`✅ Factor ${factor.factor_id} saved`);
      }
    }
    
    // Update analysis as completed
    await updateProgress('finalization', 90, 'Finalizing results...');
    
    const { error: completionError } = await supabase
      .from('analyses')
      .update({ 
        status: 'completed',
        overall_score: analysisResult.overall_score,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    if (completionError) {
      console.error('Completion update error:', completionError);
    }
    
    await updateProgress('complete', 100, 'Analysis complete!');
    
    // Get circuit breaker states for monitoring
    const circuitStates = circuitBreaker.getCircuitStates();
    
    console.log('=== REAL FACTOR ANALYSIS COMPLETE ===');
    console.log(`Total processing time: ${analysisResult.processing_time_ms}ms`);
    console.log(`Overall score: ${analysisResult.overall_score}`);
    console.log(`Factors analyzed: ${analysisResult.factors.length}`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Real factor analysis completed successfully',
      analysisId,
      factors: analysisResult.factors.length,
      overall_score: analysisResult.overall_score,
      processing_time_ms: analysisResult.processing_time_ms,
      circuit_states: circuitStates
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Try to update analysis status to failed using already parsed request body
    try {
      if (analysisId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
        
        await supabase
          .from('analyses')
          .update({ 
            status: 'failed',
            completed_at: new Date().toISOString()
          })
          .eq('id', analysisId);
      }
    } catch (updateError) {
      console.error('Failed to update analysis status:', updateError);
    }
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Educational content for progress updates
function getEducationalContent(stage: string): string {
  const content: Record<string, string> = {
    'initialization': 'Setting up analysis engine with circuit breaker protection...',
    'instant_analysis': 'Analyzing critical AI optimization factors that impact search visibility...',
    'instant_complete': 'Phase A complete! Critical factors analyzed for immediate insights.',
    'finalization': 'Saving results and calculating overall optimization score...',
    'complete': 'Analysis complete! Review your factor scores and recommendations.'
  };
  
  return content[stage] || 'Processing AI optimization analysis...';
}