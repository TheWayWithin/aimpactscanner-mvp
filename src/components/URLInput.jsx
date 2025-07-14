import React, { useState } from 'react';

function URLInput({ onAnalyze, isAnalyzing = false }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Add https:// if no protocol is specified
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    if (!validateUrl(formattedUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    onAnalyze(formattedUrl);
  };

  const handleInputChange = (e) => {
    setUrl(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#0F172A' }}>
          AI Impact Analysis
        </h2>
        <p className="text-gray-600">
          Enter a URL to analyze its AI search optimization potential using the MASTERY-AI Framework
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Website URL
          </label>
          <div className="relative">
            <input
              id="url"
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://example.com or example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              style={{ 
                backgroundColor: '#FFFFFF',
                borderColor: error ? '#DC2626' : '#D1D5DB'
              }}
              disabled={isAnalyzing}
            />
            {url && !error && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isAnalyzing || !url.trim()}
          className="w-full py-3 px-6 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          style={{ 
            backgroundColor: 'var(--mastery-blue)', 
            color: 'var(--authority-white)',
            ':hover': { backgroundColor: 'var(--innovation-teal)' }
          }}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Start AI Analysis</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Examples */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium mb-2" style={{ color: '#374151' }}>
          Example URLs to try:
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'github.com',
            'wikipedia.org',
            'medium.com',
            'stackoverflow.com'
          ].map((example) => (
            <button
              key={example}
              onClick={() => setUrl(example)}
              className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: '#6B7280' }}
              disabled={isAnalyzing}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default URLInput;