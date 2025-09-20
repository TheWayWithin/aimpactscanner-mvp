// User Initializer Component - Ensures user exists in database
import React, { useEffect } from 'react';
import { useUserInitializer } from '../hooks/useUserInitializer';

function UserInitializer({ session, onUserReady }) {
  const { status, error, userData, retry, skipWithFallback, isReady } = useUserInitializer(session);

  // Call onUserReady when user data is available
  useEffect(() => {
    if (isReady && userData && onUserReady) {
      onUserReady(userData);
    }
  }, [isReady, userData, onUserReady]);


  if (status === 'checking') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Initializing your account...</span>
        </div>
      </div>
    );
  }

  if (status === 'creating') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-3"></div>
          <span className="text-green-800">Welcome! You have 3 free analyses per month</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="text-red-800">
          <div className="font-semibold">Account Setup Error</div>
          <div className="text-sm mt-1">{error}</div>
          <div className="mt-2 space-x-2">
            <button 
              onClick={retry}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
            <button 
              onClick={skipWithFallback}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Skip & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // User is ready, don't show anything
}

export default UserInitializer;