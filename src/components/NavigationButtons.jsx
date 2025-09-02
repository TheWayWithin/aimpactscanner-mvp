import React from 'react';

const NavigationButtons = ({ currentView, onNavigate, isAuthenticated = false }) => {
  const handleNavigation = (view) => {
    if (!isAuthenticated && (view === 'dashboard' || view === 'input' || view === 'account')) {
      // For protected routes, redirect to login if not authenticated
      onNavigate('login');
    } else {
      onNavigate(view);
    }
  };

  return (
    <div className="flex justify-center mb-8 space-x-4">
      <button
        onClick={() => handleNavigation('dashboard')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          currentView === 'dashboard' 
            ? 'bg-blue-600 text-white' 
            : isAuthenticated
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
        }`}
        title={!isAuthenticated ? 'Sign in to access Dashboard' : 'Dashboard'}
      >
        🏠 Dashboard
      </button>
      <button
        onClick={() => handleNavigation('input')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          currentView === 'input' 
            ? 'bg-blue-600 text-white' 
            : isAuthenticated
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
        }`}
        title={!isAuthenticated ? 'Sign in to start analysis' : 'New Analysis'}
      >
        🔍 New Analysis
      </button>
      <button
        onClick={() => onNavigate('pricing')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          currentView === 'pricing' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        💎 Upgrade
      </button>
      <button
        onClick={() => handleNavigation('account')}
        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
          currentView === 'account' 
            ? 'bg-blue-600 text-white' 
            : isAuthenticated
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer'
        }`}
        title={!isAuthenticated ? 'Sign in to access Account' : 'Account'}
      >
        👤 Account
      </button>
    </div>
  );
};

export default NavigationButtons;