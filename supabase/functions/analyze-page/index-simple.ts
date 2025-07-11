import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== SIMPLE ANALYSIS START ===');
    
    const requestBody = await req.json();
    const { url, userId, analysisId } = requestBody;
    
    console.log('Parameters:', { url, userId, analysisId });
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
    
    // Update analysis status
    const { data: analysisData, error: analysisError } = await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysisId)
      .select()
      .single();
    
    if (analysisError) {
      console.error('Analysis update error:', analysisError);
      throw new Error(`Failed to update analysis: ${analysisError.message}`);
    }
    
    console.log('Analysis updated successfully');
    
    // Add progress updates
    const progressUpdates = [
      { stage: 'initialization', progress_percent: 10, message: 'Starting analysis...' },
      { stage: 'data_extraction', progress_percent: 30, message: 'Extracting page data...' },
      { stage: 'factor_analysis', progress_percent: 60, message: 'Analyzing factors...' },
      { stage: 'completion', progress_percent: 100, message: 'Analysis complete!' }
    ];
    
    for (const update of progressUpdates) {
      const { error: progressError } = await supabase
        .from('analysis_progress')
        .insert({
          analysis_id: analysisId,
          stage: update.stage,
          progress_percent: update.progress_percent,
          message: update.message,
          educational_content: `Learning: ${update.message}`
        });
      
      if (progressError) {
        console.error('Progress update error:', progressError);
      } else {
        console.log(`Progress: ${update.progress_percent}% - ${update.message}`);
      }
      
      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Mock factor results (Phase A - Instant factors)
    const mockFactors = [
      { factor_id: 'AI.1.1', factor_name: 'HTTPS Security', pillar: 'AI', score: 100, confidence: 100 },
      { factor_id: 'AI.1.2', factor_name: 'Title Optimization', pillar: 'AI', score: 85, confidence: 95 },
      { factor_id: 'AI.1.3', factor_name: 'Meta Description', pillar: 'AI', score: 75, confidence: 90 },
      { factor_id: 'A.2.1', factor_name: 'Author Information', pillar: 'Authority', score: 60, confidence: 80 },
      { factor_id: 'A.3.2', factor_name: 'Contact Information', pillar: 'Authority', score: 80, confidence: 85 }
    ];
    
    // Insert mock factor results
    for (const factor of mockFactors) {
      const { error: factorError } = await supabase
        .from('analysis_factors')
        .insert({
          analysis_id: analysisId,
          factor_id: factor.factor_id,
          factor_name: factor.factor_name,
          pillar: factor.pillar,
          phase: 'instant',
          score: factor.score,
          confidence: factor.confidence,
          weight: 1.0,
          evidence: [`Mock analysis for ${url}`],
          recommendations: ['This is a test recommendation'],
          processing_time_ms: 100
        });
      
      if (factorError) {
        console.error('Factor insert error:', factorError);
      }
    }
    
    // Update analysis as completed
    await supabase
      .from('analyses')
      .update({ 
        status: 'completed',
        overall_score: 80,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    console.log('=== ANALYSIS COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Analysis completed successfully',
      analysisId,
      factorsAnalyzed: mockFactors.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});