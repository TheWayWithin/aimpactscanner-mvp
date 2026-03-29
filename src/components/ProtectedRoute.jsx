import React, { useEffect } from 'react';

/**
 * ProtectedRoute component - Guards access to authenticated-only routes
 * 
 * This component prevents unauthorized access to protected features by:
 * - Checking authentication state before rendering protected content
 * - Redirecting unauthenticated users to login/landing page  
 * - Preserving route intention for post-auth redirect
 * - Handling loading states gracefully
 * 
 * SECURITY: This component is critical for preventing unauthorized access
 * to dashboard, analysis, and account features.
 */
const ProtectedRoute = ({ 
  children, 
  session, 
  onRedirect, 
  redirectTo = 'landing',
  requireAuth = true,
  loadingComponent = null 
}) => {
  // Check if user is authenticated
  const isAuthenticated = !!(session?.user?.id);
  
  useEffect(() => {
    if (requireAuth && !isAuthenticated) {
      console.log('🔒 ProtectedRoute: Unauthorized access attempt detected');
      console.log('🔄 ProtectedRoute: Redirecting to:', redirectTo);
      
      // Redirect to appropriate page for unauthenticated users
      if (onRedirect) {
        onRedirect(redirectTo);
      }
    }
  }, [requireAuth, isAuthenticated, redirectTo, onRedirect]);

  // Show loading state while auth is being determined
  if (requireAuth && session === null) {
    return loadingComponent || (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render content
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to access this feature.</p>
          <button
            onClick={() => onRedirect && onRedirect('login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated or auth is not required - render protected content
  return children;
};

export default ProtectedRoute;