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

  try {
    console.log('=== REAL ANALYSIS PHASE A START ===');
    
    const requestBody = await req.json();
    const { url, userId, analysisId } = requestBody;
    
    console.log('Parameters:', { url, userId, analysisId });
    
    // Validate inputs
    if (!url || !analysisId) {
      throw new Error('Missing required parameters: url or analysisId');
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Supabase client created');
    
    // Initialize Analysis Engine with Circuit Breaker
    const analysisEngine = new AnalysisEngine();
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
    
    // Initial progress update
    await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        stage: 'initialization',
        progress_percent: 10,
        message: 'Starting Phase A analysis...',
        educational_content: 'Phase A provides instant analysis of 10 critical factors for AI search optimization'
      });
    
    // Create progress callback for real-time updates
    const progressCallback = async (stage: string, progress: number, message: string, educationalContent: string) => {
      try {
        await supabase
          .from('analysis_progress')
          .insert({
            analysis_id: analysisId,
            stage,
            progress_percent: progress,
            message,
            educational_content: educationalContent
          });
        console.log(`📊 Progress update: ${progress}% - ${stage}`);
      } catch (error) {
        console.error('Progress update error:', error);
        // Continue analysis even if progress update fails
      }
    };

    // Run real Phase A analysis with progress updates
    console.log('🔍 Starting real factor analysis...');
    const analysisResult = await analysisEngine.analyzeInstantFactors(url, progressCallback);
    
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`);
    }
    
    console.log(`✅ Analysis completed with ${analysisResult.factors.length} factors in ${analysisResult.processing_time_ms}ms`);
    
    // Progress update for factor analysis completion
    await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        stage: 'analysis',
        progress_percent: 70,
        message: `Analyzed ${analysisResult.factors.length} factors`,
        educational_content: 'Factor analysis complete. Now storing results and calculating final score.'
      });
    
    // Insert real factors into database
    console.log('💾 Storing factor results...');
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
        console.error(`Factor ${factor.factor_id} insert error:`, factorError);
        // Continue with other factors instead of failing completely
      } else {
        console.log(`✅ Factor ${factor.factor_id} stored successfully`);
      }
    }
    
    // Complete the analysis  
    const { error: completionError } = await supabase
      .from('analyses')
      .update({ 
        status: 'completed'
      })
      .eq('id', analysisId);
    
    if (completionError) {
      console.error('Completion update error:', completionError);
      throw new Error(`Failed to complete analysis: ${completionError.message}`);
    }
    
    console.log('Analysis completed successfully');
    
    // Final progress update
    await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        stage: 'complete',
        progress_percent: 100,
        message: `Phase A complete! Analyzed ${analysisResult.factors.length} factors`,
        educational_content: 'Analysis complete. Your site has been evaluated against key AI search optimization factors.'
      });
    
    console.log('=== REAL ANALYSIS PHASE A COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Phase A analysis completed successfully',
      analysisId,
      factors: analysisResult.factors.length,
      factor_count: analysisResult.factors.length,
      processing_time_ms: analysisResult.processing_time_ms
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
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