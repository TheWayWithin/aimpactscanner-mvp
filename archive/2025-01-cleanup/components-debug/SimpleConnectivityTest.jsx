// Simple Connectivity Test Component
import React, { useState } from 'react';

function SimpleConnectivityTest() {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBasicFetch = async () => {
    setLoading(true);
    setTestResult('Testing basic network connectivity...\n');
    
    try {
      // Test basic fetch to Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      setTestResult(prev => prev + `Supabase URL: ${supabaseUrl}\n`);
      setTestResult(prev => prev + `Anon Key: ${anonKey ? anonKey.substring(0, 20) + '...' : 'Missing'}\n`);
      
      // Test direct fetch to Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      setTestResult(prev => prev + `HTTP Status: ${response.status}\n`);
      setTestResult(prev => prev + `Response OK: ${response.ok}\n`);
      
      if (response.ok) {
        setTestResult(prev => prev + `✅ Basic connectivity working\n`);
      } else {
        setTestResult(prev => prev + `❌ HTTP Error: ${response.status} ${response.statusText}\n`);
      }
      
    } catch (error) {
      setTestResult(prev => prev + `❌ Network Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseImport = async () => {
    setLoading(true);
    setTestResult('Testing Supabase client import...\n');
    
    try {
      // Dynamic import to test if Supabase client loads
      const { supabase } = await import('../lib/supabaseClient');
      setTestResult(prev => prev + `✅ Supabase client imported successfully\n`);
      setTestResult(prev => prev + `Client URL: ${supabase.supabaseUrl}\n`);
      setTestResult(prev => prev + `Client Key: ${supabase.supabaseKey?.substring(0, 20)}...\n`);
      
    } catch (error) {
      setTestResult(prev => prev + `❌ Import Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2 text-orange-800">🔗 Connectivity Test</h3>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testSupabaseImport}
          disabled={loading}
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
        >
          Test Import
        </button>
        
        <button
          onClick={testBasicFetch}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          Test Fetch
        </button>
      </div>
      
      {testResult && (
        <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-48 whitespace-pre-wrap">
          {testResult}
        </pre>
      )}
    </div>
  );
}

export default SimpleConnectivityTest;