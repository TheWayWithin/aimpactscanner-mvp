import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');
    
    // Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');
    
    // Check if analysis_progress table exists
    const { data: progressTest, error: progressError } = await supabase
      .from('analysis_progress')
      .select('id')
      .limit(1);
    
    // Check if analyses table exists
    const { data: analysesTest, error: analysesError } = await supabase
      .from('analyses')
      .select('id')
      .limit(1);
    
    // Check if analysis_factors table exists
    const { data: factorsTest, error: factorsError } = await supabase
      .from('analysis_factors')
      .select('id')
      .limit(1);
    
    const diagnosis = {
      tables: tables || [],
      tableErrors: {
        tablesError: tablesError?.message || null,
        progressError: progressError?.message || null,
        analysesError: analysesError?.message || null,
        factorsError: factorsError?.message || null
      },
      tableStatus: {
        analysis_progress: !progressError,
        analyses: !analysesError,
        analysis_factors: !factorsError
      }
    };
    
    return new Response(JSON.stringify({
      success: true,
      diagnosis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Diagnosis error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})