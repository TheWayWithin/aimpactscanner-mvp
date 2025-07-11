import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== EDGE FUNCTION START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
    
    const { url, userId, analysisId } = requestBody;
    
    console.log('Extracted parameters:');
    console.log('  - url:', url);
    console.log('  - userId:', userId);
    console.log('  - analysisId:', analysisId);
    
    // Validate required parameters
    if (!url) {
      console.error('Missing required parameter: url');
      throw new Error('Missing required parameter: url');
    }
    if (!userId) {
      console.error('Missing required parameter: userId');
      throw new Error('Missing required parameter: userId');
    }
    if (!analysisId) {
      console.error('Missing required parameter: analysisId');
      throw new Error('Missing required parameter: analysisId');
    }
    
    console.log('All parameters validated successfully');

    console.log('Creating Supabase client...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables:');
    console.log('  - SUPABASE_URL exists:', !!supabaseUrl);
    console.log('  - SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseKey);
    console.log('  - SUPABASE_URL value:', supabaseUrl);
    
    const supabaseClient = createClient(supabaseUrl ?? '', supabaseKey ?? '');
    console.log('Supabase client created successfully');

    // Update existing analysis record instead of creating new one
    console.log(`Updating existing analysis record with ID: ${analysisId}`);
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('analyses')
      .update({
        status: 'processing'
      })
      .eq('id', analysisId)
      .select()
      .single()

    console.log('Analysis update result:');
    console.log('  - data:', JSON.stringify(analysisData, null, 2));
    console.log('  - error:', analysisError);

    if (analysisError) {
      console.error('Failed to update analysis record:', analysisError);
      throw new Error(`Failed to update analysis record: ${analysisError.message}`);
    }

    console.log(`Analysis record ${analysisId} updated successfully for URL: ${url}`);

    // --- REAL-TIME PROGRESS UPDATE ---
    console.log('Inserting initial progress update...');
    const progressUpdate = {
      analysis_id: analysisId,
      stage: "Initializing",
      progress_percent: 5,
      message: "Analysis initiated. Launching browser...",
      educational_content: "Starting secure browser environment for analysis..."
    }

    const { data: progressData, error: progressError } = await supabaseClient
      .from('analysis_progress')
      .insert(progressUpdate)
      .select();
    
    console.log('Progress insert result:');
    console.log('  - data:', JSON.stringify(progressData, null, 2));
    console.log('  - error:', progressError);
    
    if (progressError) {
      console.error('Failed to insert progress update:', progressError);
      // Don't throw error here, just log it - progress updates shouldn't break the function
    } else {
      console.log('Initial progress update inserted successfully');
    }

    // --- PUPPETEER LOGIC STARTS HERE ---
    console.log('=== PUPPETEER SECTION START ===');
    let browser = null;
    try {
        console.log("Launching Puppeteer browser...");
        console.log("Browser launch options:", {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox", 
                "--no-zygote",
                "--single-process",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-features=TranslateUI",
                "--disable-ipc-flooding-protection"
            ]
        });
        
        browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox", 
                "--no-zygote",
                "--single-process",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-features=TranslateUI",
                "--disable-ipc-flooding-protection"
            ]
        });
        console.log("Browser launched successfully.");

        // --- REAL-TIME PROGRESS UPDATE ---
        console.log('Inserting browser launched progress update...');
        const { data: progressData2, error: progressError2 } = await supabaseClient
          .from('analysis_progress')
          .insert({
            analysis_id: analysisId,
            stage: "Browser Setup",
            progress_percent: 10,
            message: "Browser launched. Navigating to page...",
            educational_content: "Secure browser environment ready. Beginning page navigation..."
          })
          .select();
        
        console.log('Browser progress update result:');
        console.log('  - data:', JSON.stringify(progressData2, null, 2));
        console.log('  - error:', progressError2);

        // Simulate some work
        console.log('Starting page analysis simulation...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
        // Placeholder for future logic
        const pageTitle = "Example Title (from Puppeteer)";
        const pageDescription = "Example Description (from Puppeteer)";
        console.log('Analysis simulation completed');
        console.log('  - pageTitle:', pageTitle);
        console.log('  - pageDescription:', pageDescription);

        // --- UPDATE FINAL ANALYSIS RECORD ---
        console.log('Updating final analysis record...');
        const finalUpdateData = {
          status: 'completed',
          analysis_duration: 10,
          framework_version: "MASTERY-AI v2.1",
          completed_at: new Date().toISOString()
        };
        
        console.log('Final update data:', JSON.stringify(finalUpdateData, null, 2));
        
        const { data: finalData, error: updateError } = await supabaseClient
          .from('analyses')
          .update(finalUpdateData)
          .eq('id', analysisId)
          .select();

        console.log('Final analysis update result:');
        console.log('  - data:', JSON.stringify(finalData, null, 2));
        console.log('  - error:', updateError);

        if (updateError) {
            console.error('Error updating final analysis record:', updateError);
            throw new Error(`Failed to update analysis record: ${updateError.message}`);
        }
        
        console.log('Analysis completed successfully');

    } catch (puppeteerError) {
        console.error('=== PUPPETEER ERROR ===');
        console.error('Puppeteer error:', puppeteerError);
        console.error('Error stack:', puppeteerError.stack);
        throw puppeteerError;
    } finally {
        if (browser) {
            console.log("Closing browser...");
            try {
                await browser.close();
                console.log("Browser closed successfully.");
            } catch (closeError) {
                console.error("Error closing browser:", closeError);
            }
        } else {
            console.log("No browser to close.");
        }
    }
    
    console.log('=== PUPPETEER SECTION END ===');

    console.log('=== EDGE FUNCTION SUCCESS ===');
    console.log('Returning success response with analysisId:', analysisId);
    
    return new Response(JSON.stringify({ 
      success: true,
      analysisId: analysisId,
      message: 'Analysis completed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('=== EDGE FUNCTION ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})