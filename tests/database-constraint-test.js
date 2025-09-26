// DATABASE CONSTRAINT VIOLATION TEST
// Check if analyses and analysis_factors are being inserted properly

async function testDatabaseOperations() {
  console.log('🗄️ DATABASE CONSTRAINT VIOLATION TEST');
  console.log('====================================\n');
  
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const TEST_URL = 'https://example.com';
  const TEST_USER_ID = 'test-db-constraints';
  const analysisId = `db-test-${Date.now()}`;
  
  try {
    // Step 1: Check database counts before analysis
    console.log('📊 PRE-ANALYSIS DATABASE STATE');
    console.log('==============================');
    
    const preAnalysesResponse = await fetch(`${SUPABASE_URL}/rest/v1/analyses?select=count`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'count=exact'
      }
    });
    
    const preFactorsResponse = await fetch(`${SUPABASE_URL}/rest/v1/analysis_factors?select=count`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'count=exact'
      }
    });
    
    const preAnalysesCount = preAnalysesResponse.headers.get('content-range')?.split('/')[1] || 'unknown';
    const preFactorsCount = preFactorsResponse.headers.get('content-range')?.split('/')[1] || 'unknown';
    
    console.log(`Analyses before: ${preAnalysesCount}`);
    console.log(`Factors before: ${preFactorsCount}\n`);
    
    // Step 2: Run analysis
    console.log('🔄 RUNNING ANALYSIS');
    console.log('==================');
    console.log(`URL: ${TEST_URL}`);
    console.log(`Analysis ID: ${analysisId}\n`);
    
    const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        url: TEST_URL,
        userId: TEST_USER_ID,
        analysisId: analysisId
      })
    });
    
    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error('❌ Analysis failed:', errorText);
      return;
    }
    
    const analysisResult = await analysisResponse.json();
    console.log(`✅ Analysis completed with ${analysisResult.factors?.length || 0} factors`);
    
    // Step 3: Check database counts after analysis
    console.log('\n📊 POST-ANALYSIS DATABASE STATE');
    console.log('===============================');
    
    const postAnalysesResponse = await fetch(`${SUPABASE_URL}/rest/v1/analyses?select=count`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'count=exact'
      }
    });
    
    const postFactorsResponse = await fetch(`${SUPABASE_URL}/rest/v1/analysis_factors?select=count`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Prefer': 'count=exact'
      }
    });
    
    const postAnalysesCount = postAnalysesResponse.headers.get('content-range')?.split('/')[1] || 'unknown';
    const postFactorsCount = postFactorsResponse.headers.get('content-range')?.split('/')[1] || 'unknown';
    
    console.log(`Analyses after: ${postAnalysesCount}`);
    console.log(`Factors after: ${postFactorsCount}`);
    
    // Step 4: Verify specific analysis record
    console.log('\n🔍 RECORD VERIFICATION');
    console.log('=====================');
    
    const specificAnalysisResponse = await fetch(`${SUPABASE_URL}/rest/v1/analyses?id=eq.${analysisId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const specificAnalysisData = await specificAnalysisResponse.json();
    
    if (specificAnalysisData.length > 0) {
      console.log('✅ Analysis record found in database');
      const analysis = specificAnalysisData[0];
      console.log(`  - Status: ${analysis.status}`);
      console.log(`  - URL: ${analysis.url}`);
      console.log(`  - Overall Score: ${analysis.overall_score}`);
      console.log(`  - Created: ${analysis.created_at}`);
    } else {
      console.log('❌ Analysis record NOT found in database');
    }
    
    // Step 5: Verify factor records
    const specificFactorsResponse = await fetch(`${SUPABASE_URL}/rest/v1/analysis_factors?analysis_id=eq.${analysisId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const specificFactorsData = await specificFactorsResponse.json();
    
    console.log(`✅ Found ${Array.isArray(specificFactorsData) ? specificFactorsData.length : 'unknown'} factor records for this analysis`);
    
    if (Array.isArray(specificFactorsData) && specificFactorsData.length > 0) {
      console.log('Sample factors:');
      specificFactorsData.slice(0, 3).forEach((factor, i) => {
        console.log(`  ${i+1}. ${factor.factor_name} (${factor.factor_id}): ${factor.score}`);
      });
    } else {
      console.log('❌ No factor records found or invalid response format');
      console.log('Factor response:', specificFactorsData);
    }
    
    // Step 6: Database constraint check
    console.log('\n🧪 CONSTRAINT VIOLATION CHECK');
    console.log('============================');
    
    let constraintIssues = 0;
    
    // Check for missing required fields
    if (Array.isArray(specificFactorsData)) {
      specificFactorsData.forEach(factor => {
        if (!factor.factor_id) {
          console.log('❌ CONSTRAINT ISSUE: Factor missing factor_id');
          constraintIssues++;
        }
        if (!factor.factor_name) {
          console.log('❌ CONSTRAINT ISSUE: Factor missing factor_name');
          constraintIssues++;
        }
        if (factor.score === null || factor.score === undefined) {
          console.log('❌ CONSTRAINT ISSUE: Factor missing score');
          constraintIssues++;
        }
      });
    } else {
      console.log('❌ Cannot check constraints - factor data is not an array');
      constraintIssues = 1;
    }
    
    // Final assessment
    console.log('\n🎯 DATABASE TEST RESULTS');
    console.log('=======================');
    
    const analysesIncremented = parseInt(postAnalysesCount) > parseInt(preAnalysesCount);
    const factorsIncremented = parseInt(postFactorsCount) > parseInt(preFactorsCount);
    
    if (analysesIncremented && factorsIncremented && constraintIssues === 0) {
      console.log('✅ SUCCESS: Database operations working correctly');
      console.log('✅ Analysis records are being inserted properly');
      console.log('✅ Factor records are being inserted properly'); 
      console.log('✅ No constraint violations detected');
      console.log('✅ The database constraint issue appears to be RESOLVED');
    } else {
      console.log('❌ ISSUES DETECTED:');
      if (!analysesIncremented) console.log('  - Analysis record not inserted');
      if (!factorsIncremented) console.log('  - Factor records not inserted');
      if (constraintIssues > 0) console.log(`  - ${constraintIssues} constraint violations found`);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

// Run the test
testDatabaseOperations();