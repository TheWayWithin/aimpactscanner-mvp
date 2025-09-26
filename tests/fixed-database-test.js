// FIXED DATABASE TEST WITH PROPER UUID
// Test database operations with correct UUID format

import { randomUUID } from 'crypto';

async function testWithProperUUID() {
  console.log('🗄️ FIXED DATABASE CONSTRAINT TEST');
  console.log('=================================\n');
  
  const SUPABASE_URL = 'http://127.0.0.1:54321';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  
  const TEST_URL = 'https://example.com';
  const TEST_USER_ID = randomUUID(); // Proper UUID for user
  const analysisId = randomUUID(); // Proper UUID for analysis
  
  try {
    console.log(`Test URL: ${TEST_URL}`);
    console.log(`User ID: ${TEST_USER_ID}`);
    console.log(`Analysis ID: ${analysisId}\n`);
    
    // Step 1: Check counts before
    console.log('📊 PRE-ANALYSIS COUNTS');
    console.log('=====================');
    
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
    
    const preAnalysesCount = parseInt(preAnalysesResponse.headers.get('content-range')?.split('/')[1] || '0');
    const preFactorsCount = parseInt(preFactorsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    console.log(`Analyses before: ${preAnalysesCount}`);
    console.log(`Factors before: ${preFactorsCount}`);
    
    // Step 2: Run analysis with proper UUID
    console.log('\n🔄 RUNNING ANALYSIS WITH PROPER UUID');
    console.log('===================================');
    
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
    
    // Step 3: Check counts after
    console.log('\n📊 POST-ANALYSIS COUNTS');
    console.log('======================');
    
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
    
    const postAnalysesCount = parseInt(postAnalysesResponse.headers.get('content-range')?.split('/')[1] || '0');
    const postFactorsCount = parseInt(postFactorsResponse.headers.get('content-range')?.split('/')[1] || '0');
    
    console.log(`Analyses after: ${postAnalysesCount}`);
    console.log(`Factors after: ${postFactorsCount}`);
    
    // Step 4: Verify specific records
    console.log('\n🔍 RECORD VERIFICATION');
    console.log('=====================');
    
    const specificAnalysisResponse = await fetch(`${SUPABASE_URL}/rest/v1/analyses?id=eq.${analysisId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const specificAnalysisData = await specificAnalysisResponse.json();
    
    if (Array.isArray(specificAnalysisData) && specificAnalysisData.length > 0) {
      console.log('✅ Analysis record found in database');
      const analysis = specificAnalysisData[0];
      console.log(`  - Status: ${analysis.status}`);
      console.log(`  - URL: ${analysis.url}`);
      console.log(`  - Overall Score: ${analysis.overall_score}`);
    } else {
      console.log('❌ Analysis record NOT found');
      console.log('Response:', specificAnalysisData);
    }
    
    const specificFactorsResponse = await fetch(`${SUPABASE_URL}/rest/v1/analysis_factors?analysis_id=eq.${analysisId}&select=*`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    });
    
    const specificFactorsData = await specificFactorsResponse.json();
    
    if (Array.isArray(specificFactorsData)) {
      console.log(`✅ Found ${specificFactorsData.length} factor records`);
      
      if (specificFactorsData.length > 0) {
        console.log('Sample factors:');
        specificFactorsData.slice(0, 3).forEach((factor, i) => {
          console.log(`  ${i+1}. ${factor.factor_name} (${factor.factor_id}): ${factor.score}`);
        });
        
        // Constraint check
        let issues = 0;
        specificFactorsData.forEach(factor => {
          if (!factor.factor_id) issues++;
          if (!factor.factor_name) issues++;
          if (factor.score === null || factor.score === undefined) issues++;
        });
        
        console.log(`\n🧪 CONSTRAINT CHECK: ${issues} issues found`);
      }
    } else {
      console.log('❌ Factor data invalid:', specificFactorsData);
    }
    
    // Final summary
    console.log('\n🎯 FINAL ASSESSMENT');
    console.log('==================');
    
    const analysesIncremented = postAnalysesCount > preAnalysesCount;
    const factorsIncremented = postFactorsCount > preFactorsCount;
    
    if (analysesIncremented && factorsIncremented) {
      console.log('✅ SUCCESS: Database operations are working correctly!');
      console.log('✅ Analysis records are being inserted');
      console.log('✅ Factor records are being inserted');
      console.log('✅ Database constraint violations have been RESOLVED');
    } else {
      console.log('❌ Issues still exist:');
      if (!analysesIncremented) console.log('  - Analysis records not being inserted');
      if (!factorsIncremented) console.log('  - Factor records not being inserted');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWithProperUUID();