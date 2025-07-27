// Diagnostic Test Component for Edge Function debugging
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function DiagnosticTest({ session }) {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testEdgeFunction = async () => {
    setLoading(true);
    setTestResult('Testing Edge Function...\n');
    
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
      
      const { data, error } = await supabase.functions.invoke('analyze-page', {
        body: testData
      });
      
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
    
    try {
      // Test basic database query
      const { data, error } = await supabase
        .from('users')
        .select('id, email, tier')
        .eq('id', session?.user?.id)
        .single();
      
      if (error) {
        setTestResult(prev => prev + `❌ DB Error: ${JSON.stringify(error)}\n`);
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