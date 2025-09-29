// Utility functions for analysis history management
// Extracted from AnalysisHistory component to avoid bundle size issues

// Utility function to add an analysis to history (for localStorage fallback only)
// Note: For authenticated users, analyses are automatically saved to the database
export const addToHistory = (analysisData) => {
  try {
    console.log('📝 Adding analysis to localStorage history (fallback):', analysisData.url);
    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    
    const newEntry = {
      id: analysisData.id,
      url: analysisData.url,
      score: analysisData.score,
      date: analysisData.date || new Date().toISOString(),
      factors_count: analysisData.factors_count || 0,
      recommendations_count: analysisData.recommendations_count || 0,
      source: 'localStorage'
    };
    
    // Check if analysis already exists (avoid duplicates)
    const existingIndex = history.findIndex(item => item.id === newEntry.id);
    if (existingIndex !== -1) {
      console.log('📝 Analysis already exists in history, updating entry');
      history[existingIndex] = newEntry;
    } else {
      history.unshift(newEntry); // Add to beginning
      // Keep only last 50 analyses
      if (history.length > 50) {
        history.splice(50);
      }
    }
    
    localStorage.setItem('analysisHistory', JSON.stringify(history));
    console.log('✅ Analysis added to localStorage history');
  } catch (error) {
    console.error('❌ Failed to add analysis to localStorage history:', error);
  }
};

// Utility function to get analysis history from localStorage
export const getLocalHistory = () => {
  try {
    return JSON.parse(localStorage.getItem('analysisHistory') || '[]');
  } catch (error) {
    console.error('❌ Failed to get analysis history from localStorage:', error);
    return [];
  }
};

// Utility function to clear analysis history from localStorage
export const clearLocalHistory = () => {
  try {
    localStorage.removeItem('analysisHistory');
    console.log('🧹 Cleared analysis history from localStorage');
  } catch (error) {
    console.error('❌ Failed to clear analysis history from localStorage:', error);
  }
};