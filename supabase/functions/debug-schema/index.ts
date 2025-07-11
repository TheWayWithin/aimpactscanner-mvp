import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // This variable will hold the analysis ID for use in the final catch block.
  let analysisIdForErrorHandling = null;

  try {
    const { url, userId } = await req.json()
    console.log(`Received request with userId: ${userId}`);
    const analysisId = crypto.randomUUID()
    analysisIdForErrorHandling = analysisId; // Store it for error handling

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Immediately create the analysis record
    const { error: analysisError } = await supabaseClient
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userId,
        url: url,
        status: 'in_progress',
      })
    if (analysisError) {
      throw new Error(`Failed to create analysis record: ${analysisError.message}`)
    }
    
    console.log(`Analysis record ${analysisId} created for URL: ${url}`);
    
    await supabaseClient.from('analysis_progress').insert({
      analysis_id: analysisId,
      message: "Analysis initiated. Launching browser...",
      progress_percentage: 5
    })
    
    let browser = null;
    try {
        console.log("Launching Puppeteer browser...");
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--no-zygote", "--single-process"],
        });
        console.log("Browser launched successfully.");

        const page = await browser.newPage();
        
        await supabaseClient.from('analysis_progress').insert({
          analysis_id: analysisId,
          message: `Browser launched. Navigating to ${url}...`,
          progress_percentage: 10
        })

        // --- NEW: Dedicated try/catch block for navigation and scraping ---
        try {
          console.log(`Navigating to ${url} with a 30-second timeout...`);
          // --- MODIFIED: Increased timeout ---
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          console.log("Navigation successful.");

          console.log("Extracting page title and description...");
          const pageTitle = await page.title();
          const pageDescription = await page.$eval('meta[name="description"]', (element) => element.content)
            .catch(() => 'No meta description found.');
          console.log(`Extracted Title: ${pageTitle}`);

          const { error: updateError } = await supabaseClient
          .from('analyses')
          .update({
            status: 'completed',
            page_title: pageTitle,
            page_description: pageDescription,
            quick_wins: [],
            metadata: {},
            analysis_duration: 10,
            framework_version: "MASTERY-AI v2.1",
            framework_confidence_score: 0.95
          })
          .eq('id', analysisId)

          if (updateError) {
              throw new Error(`Failed to update analysis record: ${updateError.message}`)
          }
          console.log("Successfully updated analysis record with extracted data.");

        } catch (navError) {
          // --- NEW: Catch navigation/scraping specific errors ---
          console.error("A navigation or scraping error occurred:", navError.message);
          // Update the analysis record to reflect the specific error
          await supabaseClient
            .from('analyses')
            .update({
              status: 'error',
              error_details: `Failed during page navigation or scraping: ${navError.message}`
            })
            .eq('id', analysisId);
          // Re-throw the error to be caught by the main handler
          throw navError;
        }

    } finally {
        if (browser) {
            console.log("Closing browser.");
            await browser.close();
        }
    }

    return new Response(JSON.stringify({ analysisId: analysisId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // This is the main catch block for the entire function
    const supabaseForError = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    if (analysisIdForErrorHandling) {
      await supabaseForError
        .from('analyses')
        .update({ status: 'error', error_details: error.message })
        .eq('id', analysisIdForErrorHandling)
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})