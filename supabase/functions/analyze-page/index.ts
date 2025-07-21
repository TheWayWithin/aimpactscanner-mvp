import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { TierManager } from './lib/TierManager.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== COFFEE TIER ANALYSIS START - VERSION 2025-07-21 ===');
    
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

    // Initialize tier manager and validate access
    const tierManager = new TierManager(supabase);
    const accessCheck = await tierManager.validateAnalysisAccess(userId);
    
    console.log('🔍 Tier access check:', accessCheck);
    
    // Return tier-specific response if access denied
    if (!accessCheck.allowed) {
      console.log('❌ Analysis blocked - tier limit reached');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: accessCheck.message,
          tier: accessCheck.tier,
          upgradeRequired: accessCheck.upgradeRequired,
          remainingAnalyses: accessCheck.remainingAnalyses,
          subscriptionExpired: accessCheck.subscriptionExpired
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ Analysis approved for ${accessCheck.tier} tier user - TierManager works!`);
    
    // Record usage analytics and increment counters (testing TierManager recordUsage)
    console.log('📊 Recording usage analytics...');
    await tierManager.recordUsage({
      userId: userId,
      analysisId: analysisId,
      tier: accessCheck.tier,
      analysisType: 'phase_a',
      processingTime: 1500, // Mock processing time
      success: true
    });
    
    console.log('=== TIERMANAGER TEST COMPLETE ===');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'TierManager test completed successfully - Coffee tier infrastructure working!',
      analysisId,
      tier: accessCheck.tier,
      remainingAnalyses: accessCheck.remainingAnalyses,
      timestamp: new Date().toISOString()
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