// Environment Variable Check Component
import React from 'react';

function EnvCheck() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2 text-red-800">🔧 Environment Check</h3>
      <div className="text-sm space-y-1">
        <div>
          <span className="font-medium">Supabase URL:</span> 
          <span className={supabaseUrl ? 'text-green-600' : 'text-red-600'}>
            {supabaseUrl ? '✅ Set' : '❌ Missing'}
          </span>
          {supabaseUrl && <span className="text-gray-500 ml-2">({supabaseUrl.substring(0, 30)}...)</span>}
        </div>
        <div>
          <span className="font-medium">Supabase Key:</span> 
          <span className={supabaseKey ? 'text-green-600' : 'text-red-600'}>
            {supabaseKey ? '✅ Set' : '❌ Missing'}
          </span>
          {supabaseKey && <span className="text-gray-500 ml-2">({supabaseKey.substring(0, 20)}...)</span>}
        </div>
        <div className="mt-2 text-xs text-gray-600">
          <strong>Note:</strong> If these are missing in production, check Netlify Environment Variables
        </div>
      </div>
    </div>
  );
}

export default EnvCheck;