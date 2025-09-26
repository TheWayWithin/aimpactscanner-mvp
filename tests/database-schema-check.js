// DATABASE SCHEMA CHECK
// Check what tables exist and their structure

async function checkDatabaseSchema() {
  console.log('🗄️ DATABASE SCHEMA INVESTIGATION');
  console.log('================================\n');
  
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  try {
    // Check if analyses table exists
    console.log('🔍 CHECKING ANALYSES TABLE');
    console.log('=========================');
    
    const analysesResponse = await fetch(`${SUPABASE_URL}/rest/v1/analyses?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    if (analysesResponse.ok) {
      console.log('✅ analyses table exists');
    } else {
      const error = await analysesResponse.json();
      console.log('❌ analyses table issue:', error.message);
    }
    
    // Check if analysis_factors table exists
    console.log('\n🔍 CHECKING ANALYSIS_FACTORS TABLE');
    console.log('=================================');
    
    const factorsResponse = await fetch(`${SUPABASE_URL}/rest/v1/analysis_factors?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    if (factorsResponse.ok) {
      console.log('✅ analysis_factors table exists');
    } else {
      const error = await factorsResponse.json();
      console.log('❌ analysis_factors table issue:', error.message);
    }
    
    // Try alternative table names that might exist
    console.log('\n🔍 CHECKING ALTERNATIVE TABLE NAMES');
    console.log('===================================');
    
    const alternativeNames = [
      'factors',
      'analysis_factor',
      'page_factors',
      'results',
      'analysis_results'
    ];
    
    for (const tableName of alternativeNames) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY
          }
        });
        
        if (response.ok) {
          console.log(`✅ Found table: ${tableName}`);
        } else {
          console.log(`❌ Table ${tableName} not found`);
        }
      } catch (e) {
        console.log(`❌ Table ${tableName} error: ${e.message}`);
      }
    }
    
    // Check what tables DO exist by trying to get schema info
    console.log('\n🔍 DISCOVERING EXISTING TABLES');
    console.log('==============================');
    
    // Query pg_tables to see what exists (using PostgREST)
    try {
      const schemaResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_schema_info`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (schemaResponse.ok) {
        const schema = await schemaResponse.json();
        console.log('Schema info:', schema);
      } else {
        console.log('❌ Could not retrieve schema info');
      }
    } catch (e) {
      console.log('❌ Schema query error:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

// Run the check
checkDatabaseSchema();