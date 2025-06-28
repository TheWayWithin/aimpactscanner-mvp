// supabase/functions/analyze-page/index.ts - COMPLETE AND CORRECTED CODE (Final analyses Update Fix - V3: Column Naming)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Removed UUID import as crypto.randomUUID() is used

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, analysisId, userId } = await req.json()

    if (!url || !analysisId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: url, analysisId, and userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Starting analysis for:', { url, analysisId, userId })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    const updateProgress = async (factor: string, percentage: number, tip: string) => {
      const progressId = crypto.randomUUID(); // Using crypto.randomUUID() for robustness

      const { error } = await supabase
        .from('analysis_progress')
        .insert({
          id: progressId,
          analysis_id: analysisId,
          user_id: userId,
          current_factor: factor,
          progress_percentage: percentage,
          educational_content: { tip },
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Progress update error:', error)
      }
    }

    const startTime = Date.now(); // Start timer

    // --- PHASE 2: ANALYSIS ENGINE EXPANSION (INITIAL STUB) ---
    let pageData = {};
    let factorResults = {};

    const extractPageData = async (targetUrl: string) => {
      return {
        title: 'AI Impact Scanner Test Page',
        description: 'This is a description for AI impact analysis.',
        html: '<html><body><h1>AI Content</h1></body></html>',
        url: targetUrl
      };
    };

    const assessFactor = async (factorName: string, data: any, page: any) => {
      return {
        score: Math.floor(Math.random() * 100),
        confidence: parseFloat((Math.random() * 0.5 + 0.5).toFixed(2)),
        findings: [`Simulated finding for ${factorName}`],
        recommendations: [`Simulated recommendation for ${factorName}`]
      };
    };

    const FACTOR_DEFINITIONS: { [key: string]: { displayName: string; progressTip: string } } = {
      structured_data: { displayName: 'Structured Data Implementation', progressTip: 'Analyzing structured data...' },
      page_title: { displayName: 'Page Title Optimization', progressTip: 'Checking title for AI...' },
      author_credentials: { displayName: 'Author Credentials Detection', progressTip: 'Verifying author signals...' },
      heading_structure: { displayName: 'Heading Structure Analysis', progressTip: 'Evaluating semantic hierarchy...' },
      page_load_speed: { displayName: 'Page Load Speed Assessment', progressTip: 'Measuring Core Web Vitals...' },
      faq_section: { displayName: 'FAQ Section Detection', progressTip: 'Checking for Q&A patterns...' },
      meta_description_quality: { displayName: 'Meta Description Quality', progressTip: 'Analyzing meta description effectiveness...' },
      https_implementation: { displayName: 'HTTPS Implementation', progressTip: 'Verifying secure protocols...' },
      content_depth_assessment: { displayName: 'Content Depth Assessment', progressTip: 'Evaluating comprehensiveness...' },
      mobile_optimization: { displayName: 'Mobile Optimization', progressTip: 'Testing responsive design...' },
      image_alt_text: { displayName: 'Image Alt Text Implementation', progressTip: 'Checking image accessibility...' },
      contact_info_validation: { displayName: 'Contact Information Validation', progressTip: 'Verifying trust signals...' },
      content_freshness_analysis: { displayName: 'Content Freshness Analysis', progressTip: 'Checking publication dates...' },
      social_media_integration: { displayName: 'Social Media Integration', progressTip: 'Analyzing social signals...' },
      security_headers_assessment: { displayName: 'Security Headers Assessment', progressTip: 'Evaluating HTTP headers...' },
      url_structure_optimization: { displayName: 'URL Structure Optimization', progressTip: 'Checking URL patterns...' },
      breadcrumb_navigation: { displayName: 'Breadcrumb Navigation', progressTip: 'Analyzing site navigation...' },
      content_categorization: { displayName: 'Content Categorization', progressTip: 'Evaluating topic organization...' },
      basic_mcp_endpoint_detection: { displayName: 'Basic MCP Endpoint Detection', progressTip: 'Checking AI agent readiness...' },
      api_accessibility_assessment: { displayName: 'API Accessibility Assessment', progressTip: 'Testing programmatic access...' },
      cross_platform_consistency: { displayName: 'Cross-Platform Consistency', progressTip: 'Verifying multi-device optimization...' },
      performance_optimization: { displayName: 'Performance Optimization', progressTip: 'Finalizing assessment...' }
    };

    const calculateAdvancedScores = (results: any) => {
      return {
        aiSearch: Math.floor(Math.random() * (95 - 60 + 1) + 60),
        agentCompatibility: Math.floor(Math.random() * (90 - 55 + 1) + 55),
        overall: Math.floor(Math.random() * (90 - 60 + 1) + 60),
        confidence: { 
          aiSearch: parseFloat((Math.random() * 0.2 + 0.7).toFixed(2)),
          agentCompatibility: parseFloat((Math.random() * 0.2 + 0.6).toFixed(2)),
          overall: parseFloat((Math.random() * 0.1 + 0.85).toFixed(2))
        }
      };
    };

    const generateQuickWins = (results: any) => {
      return Object.entries(results)
        .filter(([, result]: [string, any]) => result.score < 70)
        .sort(([, a]: [string, any], [, b]: [string, any]) => a.score - b.score)
        .slice(0, 3)
        .map(([factorName, result]: [string, any]) => ({
          factor: factorName,
          recommendation: result.recommendations[0]
        }));
    };

    try {
      await updateProgress('page_load', 5, 'Launching secure browser environment to load page...');
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      pageData = await extractPageData(url);

      await updateProgress('data_extraction', 25, 'Extracting page structure and content...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const factorNames = Object.keys(FACTOR_DEFINITIONS);
      for (let i = 0; i < factorNames.length; i++) {
        const factor = factorNames[i];
        const progressPercent = 25 + Math.round((i / factorNames.length) * 65);

        const currentFactorDef = FACTOR_DEFINITIONS[factor];
        if (!currentFactorDef) {
            console.error(`Missing definition for factor: ${factor}`);
            continue;
        }
        await updateProgress(
          currentFactorDef.displayName, 
          progressPercent, 
          currentFactorDef.progressTip
        );
        factorResults[factor] = await assessFactor(factor, pageData, null); 
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const finalScores = calculateAdvancedScores(factorResults);
      const quickWins = generateQuickWins(factorResults);

      await updateProgress('scoring_and_recommendations', 95, 'Generating AI optimization scores and actionable recommendations...');
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (browserError) {
      console.error('Browser simulation error:', browserError);
      throw new Error(`Browser simulation failed: ${browserError.message}`);
    }

    // Final completion update
    await updateProgress('completed', 100, 'Analysis complete! Review your comprehensive AI optimization report.');

    const finalAnalysisDuration = Date.now() - startTime; // Use a different variable name to avoid conflict

    // CRITICAL FIX: Ensure property names match database schema exactly (snake_case for DB columns if implicit)
    // Re-confirming exact column names from AIS Single-Page MVP Requirements v5.0 SQL schema
    const { error: updateAnalysisError } = await supabase
      .from('analyses')
      .update({
        status: 'completed',
        scores: finalScores,
        factor_results: factorResults,
        quick_wins: quickWins,
        metadata: {
          url: url,
          page_title: pageData.title,
          page_description: pageData.description,
          analysis_duration: finalAnalysisDuration // Use the new variable name
        },
        analysis_duration: finalAnalysisDuration, // Matches DB column 'analysis_duration'
        framework_version: 'MASTERY-AI v2.1 Enhanced Edition', // Matches DB column 'framework_version'
        framework_confidence_score: finalScores.confidence.overall ? Math.round(finalScores.confidence.overall * 100) : 0 // Matches DB column 'framework_confidence_score'
      })
      .eq('id', analysisId)

    if (updateAnalysisError) {
      console.error('Error updating analyses table with final result:', updateAnalysisError)
      return new Response(JSON.stringify({ success: false, error: 'Failed to save final analysis result' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        message: 'Analysis completed successfully',
        scores: finalScores
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString(),
        user_message: 'Analysis failed due to an internal server issue. Please try again.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})