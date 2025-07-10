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
    const { url, userId } = await req.json()

    // --- NEW DEBUGGING LINE ---
    console.log(`Received request with userId: ${userId}`);

    const analysisId = crypto.randomUUID()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Immediately create the analysis record
    const { data: analysisData, error: analysisError } = await supabaseClient
      .from('analyses')
      .insert({
        id: analysisId,
        user_id: userId,
        url: url,
        status: 'in_progress',
      })
      .select()
      .single()

    if (analysisError) {
      throw new Error(`Failed to create analysis record: ${analysisError.message}`)
    }

    console.log(`Analysis record ${analysisId} created for URL: ${url}`);

    // --- REAL-TIME PROGRESS UPDATE ---
    const progressUpdate = {
      analysis_id: analysisId,
      message: "Analysis initiated. Launching browser...",
      progress_percentage: 5
    }

    await supabaseClient.from('analysis_progress').insert(progressUpdate)

    // --- PUPPETEER LOGIC STARTS HERE ---
    let browser = null;
    try {
        console.log("Launching Puppeteer browser...");
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--no-zygote", "--single-process"],
        });
        console.log("Browser launched successfully.");

        // --- REAL-TIME PROGRESS UPDATE ---
        await supabaseClient.from('analysis_progress').insert({
          analysis_id: analysisId,
          message: "Browser launched. Navigating to page...",
          progress_percentage: 10
        })

        // Placeholder for future logic
        const pageTitle = "Example Title (from Puppeteer)";
        const pageDescription = "Example Description (from Puppeteer)";


        // --- UPDATE FINAL ANALYSIS RECORD ---
        const { error: updateError } = await supabaseClient
        .from('analyses')
        .update({
          status: 'completed',
          analysis_duration: 10,
          framework_version: "MASTERY-AI v2.1",
          completed_at: new Date().toISOString()
        })
        .eq('id', analysisId)

        if (updateError) {
            console.error('Error updating analysis record:', updateError)
            throw new Error(`Failed to update analysis record: ${updateError.message}`)
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
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})