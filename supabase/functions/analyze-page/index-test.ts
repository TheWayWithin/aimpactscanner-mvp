import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== MINIMAL TEST ANALYSIS START ===');
    
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
    
    // Insert a simple progress update
    const { error: progressError } = await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        stage: 'test',
        progress_percent: 50,
        message: 'Testing function...',
        educational_content: 'This is a test function to verify connectivity'
      });
    
    if (progressError) {
      console.error('Progress update error:', progressError);
      throw new Error(`Failed to insert progress: ${progressError.message}`);
    }
    
    console.log('Progress updated');
    
    // Insert a single test factor
    const { error: factorError } = await supabase
      .from('analysis_factors')
      .insert({
        analysis_id: analysisId,
        factor_id: 'TEST.1',
        factor_name: 'Test Factor',
        pillar: 'TEST',
        score: 85,
        confidence: 100,
        weight: 1.0,
        evidence: ['This is a test factor'],
        recommendations: ['No recommendations needed for test']
      });
    
    if (factorError) {
      console.error('Factor insert error:', factorError);
      throw new Error(`Failed to insert factor: ${factorError.message}`);
    }
    
    console.log('Test factor inserted');
    
    // Complete the analysis
    const { error: completionError } = await supabase
      .from('analyses')
      .update({ 
        status: 'completed',
        overall_score: 85,
        completed_at: new Date().toISOString()
      })
      .eq('id', analysisId);
    
    if (completionError) {
      console.error('Completion update error:', completionError);
      throw new Error(`Failed to complete analysis: ${completionError.message}`);
    }
    
    console.log('Analysis completed');
    
    // Final progress update
    await supabase
      .from('analysis_progress')
      .insert({
        analysis_id: analysisId,
        stage: 'complete',
        progress_percent: 100,
        message: 'Test analysis complete!',
        educational_content: 'Test analysis has been completed successfully'
      });
    
    console.log('=== MINIMAL TEST ANALYSIS COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test analysis completed successfully',
      analysisId,
      factors: 1,
      overall_score: 85,
      processing_time_ms: 100
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Test analysis error:', error);
    
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