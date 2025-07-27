// Diagnostic Test Component for Edge Function debugging
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function DiagnosticTest({ session }) {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testSessionValidation = async () => {
    setLoading(true);
    setTestResult('Testing Session Validation...\n');
    
    try {
      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        setTestResult(prev => prev + `❌ Session Error: ${JSON.stringify(error)}\n`);
      } else if (!currentSession) {
        setTestResult(prev => prev + `❌ No active session found\n`);
      } else {
        setTestResult(prev => prev + `✅ Session valid:\n`);
        setTestResult(prev => prev + `  User ID: ${currentSession.user?.id}\n`);
        setTestResult(prev => prev + `  Email: ${currentSession.user?.email}\n`);
        setTestResult(prev => prev + `  Expires: ${new Date(currentSession.expires_at * 1000)}\n`);
      }
      
    } catch (err) {
      setTestResult(prev => prev + `❌ Session Exception: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testEdgeFunction = async () => {
    setLoading(true);
    setTestResult('Testing Edge Function...\n');
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Edge Function timeout after 15 seconds')), 15000)
    );
    
    try {
      // Log session info
      setTestResult(prev => prev + `Session User ID: ${session?.user?.id}\n`);
      setTestResult(prev => prev + `Session Email: ${session?.user?.email}\n`);
      
      // Test simple Edge Function call
      const testData = {
        url: 'https://example.com',
        analysisId: `test-${Date.now()}`,
        userId: session?.user?.id
      };
      
      setTestResult(prev => prev + `Calling Edge Function with data: ${JSON.stringify(testData)}\n`);
      
      const functionPromise = supabase.functions.invoke('analyze-page', {
        body: testData
      });
      
      const { data, error } = await Promise.race([functionPromise, timeoutPromise]);
      
      if (error) {
        setTestResult(prev => prev + `❌ Error: ${JSON.stringify(error)}\n`);
      } else {
        setTestResult(prev => prev + `✅ Success: ${JSON.stringify(data)}\n`);
      }
      
    } catch (err) {
      setTestResult(prev => prev + `❌ Exception: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseAccess = async () => {
    setLoading(true);
    setTestResult('Testing Database Access...\n');
    
    // Add timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout after 10 seconds')), 10000)
    );
    
    try {
      setTestResult(prev => prev + `Session User ID: ${session?.user?.id}\n`);
      setTestResult(prev => prev + `Session Email: ${session?.user?.email}\n`);
      
      // Test basic database query with timeout
      const queryPromise = supabase
        .from('users')
        .select('id, email, tier, monthly_analyses_used')
        .eq('id', session?.user?.id)
        .single();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      
      if (error) {
        setTestResult(prev => prev + `❌ DB Error: ${JSON.stringify(error)}\n`);
        
        // Try a simpler test - just check if we can connect
        setTestResult(prev => prev + `Trying simple connection test...\n`);
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
        
        if (testError) {
          setTestResult(prev => prev + `❌ Connection Test Failed: ${JSON.stringify(testError)}\n`);
        } else {
          setTestResult(prev => prev + `✅ Basic connection OK (found ${testData?.length || 0} users)\n`);
          setTestResult(prev => prev + `❌ But user-specific query failed - user may not exist in database\n`);
        }
      } else {
        setTestResult(prev => prev + `✅ DB Success: ${JSON.stringify(data)}\n`);
      }
      
    } catch (err) {
      setTestResult(prev => prev + `❌ DB Exception: ${err.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔧 Diagnostic Tests</h3>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={testSessionValidation}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Session
        </button>
        
        <button
          onClick={testDatabaseAccess}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Database
        </button>
        
        <button
          onClick={testEdgeFunction}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Edge Function
        </button>
      </div>
      
      {testResult && (
        <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </div>
  );
}

export default DiagnosticTest;