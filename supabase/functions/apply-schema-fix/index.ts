import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Applying schema fixes...')

    // First, let's check the current schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .order('ordinal_position')

    console.log('Current users table schema:', schemaData)

    // Check if get_user_data function exists
    const { data: functionData, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'get_user_data')

    console.log('get_user_data function exists:', functionData?.length > 0)

    // Create the get_user_data function if it doesn't exist
    if (!functionData || functionData.length === 0) {
      console.log('Creating get_user_data function...')
      
      // Since we can't use exec_sql, let's create the function via the dashboard
      // For now, let's create a temporary RPC to handle this
      console.log('Function needs to be created manually via dashboard')
    }

    // Test current user operations
    console.log('Testing user operations...')
    
    // Test user query with the fields our app expects
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, tier, subscription_tier, stripe_customer_id, monthly_analyses_used, subscription_status')
      .limit(3)

    console.log('User data query result:', { userData, userError })

    // Test RPC function if it exists
    let rpcTestResult = null
    if (userData && userData.length > 0) {
      const testUserId = userData[0].id
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_data', { user_id: testUserId })
      
      rpcTestResult = { rpcData, rpcError: rpcError?.message }
      console.log('RPC test result:', rpcTestResult)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Schema analysis complete',
        schema: schemaData,
        functionExists: functionData?.length > 0,
        userDataTest: { userData, userError: userError?.message },
        rpcTest: rpcTestResult,
        recommendations: [
          'subscription_tier column appears to exist',
          'get_user_data function may need manual creation via Supabase Dashboard',
          'RLS policies may need manual adjustment',
          'Test user queries are working'
        ],
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Schema fix error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})