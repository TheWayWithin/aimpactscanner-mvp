// OAuthCallback.jsx - Handles OAuth and Magic Link redirects
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabaseClient';
import {
  getAuthContext,
  clearAuthContext,
  getPostSignupDestination,
  getPostLoginDestination,
  getUserData
} from '../utils/authRouting';

const OAuthCallback = ({ onNavigate }) => {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing authentication...');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, [onNavigate]);

  const handleOAuthCallback = async () => {
    try {
      console.log('🔄 OAuthCallback component mounted - Processing OAuth callback...');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 Current hash:', window.location.hash);

      // Get the session from the URL (Supabase automatically handles this)
      // Add retry logic for OAuth session establishment
      let session = null;
      let sessionError = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!session && attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Attempt ${attempts} to retrieve OAuth session...`);
        
        const result = await supabase.auth.getSession();
        session = result.data?.session;
        sessionError = result.error;
        
        if (sessionError) {
          console.error(`❌ Session error on attempt ${attempts}:`, sessionError);
          throw sessionError;
        }
        
        if (!session && attempts < maxAttempts) {
          console.log(`⏳ No session on attempt ${attempts}, waiting 500ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!session) {
        console.error('❌ No session found after', maxAttempts, 'attempts');
        console.error('🔍 Current URL:', window.location.href);
        console.error('🔍 Current hash:', window.location.hash);
        throw new Error('OAuth session establishment failed. Please try signing in again.');
      }

      console.log('✅ Session retrieved:', session.user.id);

      // Clean up authentication tokens from URL for security
      const hasOAuthTokens = window.location.hash.includes('access_token=') || window.location.hash.includes('refresh_token=');
      const hasQueryTokens = window.location.search.includes('access_token=') || 
                            window.location.search.includes('token=') ||
                            window.location.search.includes('confirmation_url=');
      
      if (hasOAuthTokens || hasQueryTokens) {
        console.log('🧹 Cleaning authentication tokens from URL...');
        const cleanUrl = `${window.location.origin}${window.location.pathname}#oauth-callback`;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      // Retrieve auth context (tier selection, pending analysis)
      const authContext = getAuthContext();
      console.log('📦 Auth context:', authContext);

      // Check if user exists in database
      const userData = await getUserData(session.user.id);

      if (!userData) {
        // New user - check if they selected a tier
        console.log('🆕 New user detected...');

        const selectedTier = authContext?.selectedTier || session.user.user_metadata?.selected_tier || null;

        // If NO tier selected, redirect to tier selection page
        if (!selectedTier) {
          console.log('⚠️ No tier selected, redirecting to tier selection...');
          setMessage('Choose your plan...');

          // Store user session for tier selection page
          sessionStorage.setItem('newUserEmail', session.user.email);
          sessionStorage.setItem('newUserId', session.user.id);

          // Redirect to Coffee upsell page for tier selection
          if (onNavigate) {
            console.log('🔒 SECURITY: Using onNavigate callback for tier selection');
            onNavigate('upsell-coffee');
          } else {
            console.error('❌ SECURITY: No onNavigate callback - falling back to landing');
            window.location.hash = 'landing';
          }
          return;
        }

        // Tier selected - create user record
        setMessage('Setting up your account...');
        const authProvider = session.user.app_metadata?.provider || 'unknown';

        // Create user record in database
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            tier: selectedTier === 'free' ? 'free' : 'free', // Start everyone as free, upgrade via Stripe
            selected_tier: selectedTier,
            auth_provider: authProvider,
            is_first_login: true,
            signup_source: authContext?.mode === 'signup' ? 'oauth' : 'login',
            monthly_analyses_used: 0,
            subscription_status: selectedTier === 'free' ? 'active' : 'pending_payment'
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          // Try to continue anyway - user might already exist
          const retryUserData = await getUserData(session.user.id);
          if (retryUserData) {
            console.log('✅ User exists after retry, continuing...');
            await routeUser(retryUserData, session, authContext);
            return;
          }
          throw createError;
        }

        console.log('✅ User created:', newUser);
        await routeUser(newUser, session, authContext);

      } else {
        // Existing user - login
        console.log('👋 Existing user, routing to destination...');
        await routeUser(userData, session, authContext);
      }

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error object:', JSON.stringify(error, null, 2));

      setStatus('error');
      setError(error.message || 'Authentication failed. Please try again.');

      // DON'T auto-redirect - let user see the error
      console.log('⏸️ Auto-redirect DISABLED - error will stay visible for debugging');
      // setTimeout(() => {
      //   if (onNavigate) {
      //     onNavigate('unified-registration');
      //   } else {
      //     window.location.hash = 'unified-registration';
      //   }
      // }, 3000);
    }
  };

  const routeUser = async (userData, session, authContext) => {
    try {
      setMessage('Redirecting...');

      // Determine destination based on user state
      let destination;

      if (userData.is_first_login) {
        // First login after signup
        console.log('👋 First login, routing to post-signup destination');
        destination = getPostSignupDestination(session.user, authContext);
      } else {
        // Returning user
        console.log('🔄 Returning user, routing to post-login destination');
        destination = await getPostLoginDestination(userData, session);
      }

      // Clear auth context after use
      clearAuthContext();

      console.log('🚀 Routing to:', destination);

      // Map paths to view names
      const pathToView = {
        '/analyze': 'input',
        '/checkout': 'pricing', // For Stripe checkout
        '/dashboard': 'dashboard',
        '/upsell/coffee': 'upsell-coffee',
        '/upsell/growth': 'upsell-growth',
        '/upsell/scale': 'upsell-scale',
        '/welcome/scale': 'welcome-scale'
      };

      const viewName = pathToView[destination.path] || 'dashboard';

      // Store destination state in sessionStorage for retrieval by next component
      if (destination.state) {
        sessionStorage.setItem('routeState', JSON.stringify(destination.state));
      }

      // SECURITY: Always use onNavigate callback to ensure route protection is applied
      // NEVER directly manipulate window.location.hash as it bypasses security checks
      if (onNavigate) {
        console.log('🔒 SECURITY: Using onNavigate callback for protected route navigation');
        onNavigate(viewName);
      } else {
        console.error('❌ SECURITY: No onNavigate callback provided - cannot safely navigate to protected route');
        console.error('🚨 FALLBACK: Redirecting to dashboard');
        // Fallback to dashboard if no callback provided
        window.location.hash = 'dashboard';
      }

    } catch (error) {
      console.error('❌ Routing error:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        {status === 'processing' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {message}
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">
              Authentication Failed
            </h2>
            <p className="text-gray-700 mb-6">
              {error}
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to signup page...
            </p>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('unified-registration');
                } else {
                  // Public route - safe to use hash navigation
                  window.location.hash = 'unified-registration';
                }
              }}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Return to Signup
            </button>
          </>
        )}
      </div>
    </div>
  );
};

OAuthCallback.propTypes = {
  onNavigate: PropTypes.func
};

export default OAuthCallback;
