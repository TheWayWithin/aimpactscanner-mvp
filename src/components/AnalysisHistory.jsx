import React, { useState, useEffect } from 'react';

const AnalysisHistory = () => {
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = localStorage.getItem('analysisHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by date, most recent first
        const sorted = parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistory(sorted);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your analysis history?')) {
      localStorage.removeItem('analysisHistory');
      setHistory([]);
    }
  };

  const deleteItem = (id) => {
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem('analysisHistory', JSON.stringify(updated));
    setHistory(updated);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center text-gray-700 hover:text-gray-900 transition-colors"
        >
          <svg className={`w-5 h-5 mr-2 transform transition-transform ${showHistory ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium">Recent Analyses ({history.length})</span>
        </button>
        
        {showHistory && history.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {showHistory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-md"
                      >
                        {item.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                      <span className={`ml-3 font-bold ${getScoreColor(item.score)}`}>
                        {item.score}/100
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{formatDate(item.date)}</span>
                      {item.factors && (
                        <span className="ml-3">
                          {item.factors} factors analyzed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center ml-4 space-x-2">
                    <button
                      onClick={() => window.location.href = `/analysis/${item.id}`}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Results"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function to add an analysis to history
export const addToHistory = (analysisData) => {
  try {
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    
    const newEntry = {
      id: analysisData.id || Date.now().toString(),
      url: analysisData.url,
      score: analysisData.score,
      date: analysisData.date || new Date().toISOString(),
      factors: analysisData.factors || 10
    };
    
    // Add to beginning of array
    history.unshift(newEntry);
    
    // Keep only last 20 entries
    const trimmed = history.slice(0, 20);
    
    localStorage.setItem('analysisHistory', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving to history:', error);
  }
};

export default AnalysisHistory;