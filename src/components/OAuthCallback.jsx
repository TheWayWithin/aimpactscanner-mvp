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

      // PHASE 2 FIX: Check if user is truly new vs existing with timing issue
      const authUser = session.user;
      const accountAge = Date.now() - new Date(authUser.created_at).getTime();
      const isNewUser = accountAge < 60000; // Less than 1 minute old = new user

      console.log('🔍 User account age:', accountAge + 'ms', isNewUser ? '(NEW USER)' : '(EXISTING USER)');

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

      // PHASE 2 FIX: Check if user exists in database with retry logic for existing users
      let userData = await getUserData(session.user.id);

      // If no userData found but user is NOT new, retry up to 3 times
      if (!userData && !isNewUser) {
        console.log('⚠️ Existing user but no userData found - retrying...');

        for (let retryAttempt = 1; retryAttempt <= 3; retryAttempt++) {
          console.log(`🔄 getUserData retry attempt ${retryAttempt}/3...`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

          userData = await getUserData(session.user.id);

          if (userData) {
            console.log(`✅ getUserData succeeded on retry ${retryAttempt}`);
            break;
          }
        }

        if (!userData) {
          console.error('❌ getUserData failed after 3 retries - database trigger may have failed');
          console.error('🔍 This should not happen for existing users. Possible database issue.');
        }
      }

      // PHASE 2 FIX: Differentiate truly new users from existing users with timing issues
      if (!userData && isNewUser) {
        // Truly NEW user - proceed with signup flow
        console.log('🆕 NEW USER detected (account age < 1 min)');

        // Get tier from authContext (Phase 1 implementation)
        const selectedTier = authContext?.selectedTier || session.user.user_metadata?.selected_tier || null;

        // PHASE 3 FIX: Require explicit tier selection
        if (!selectedTier) {
          console.log('⚠️ No tier selected, redirecting to tier selection...');
          setMessage('Choose your plan...');

          // Store user session for tier selection page
          sessionStorage.setItem('newUserEmail', session.user.email);
          sessionStorage.setItem('newUserId', session.user.id);

          // Redirect to tier selection (upsell-coffee page)
          if (onNavigate) {
            console.log('🔒 SECURITY: Using onNavigate callback for tier selection');
            onNavigate('upsell-coffee');
          } else {
            console.error('❌ SECURITY: No onNavigate callback - falling back to dashboard');
            window.location.hash = 'dashboard';
          }
          return;
        }

        // PHASE 3 FIX: Create account with selected tier (NO AUTO-FREE!)
        setMessage('Setting up your account...');
        const authProvider = session.user.app_metadata?.provider || 'unknown';

        // Create user record with SELECTED tier (not auto-free)
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            tier: selectedTier, // PHASE 3 FIX: Use actual selected tier
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

        console.log('✅ User created with tier:', selectedTier);
        await routeUser(newUser, session, authContext);

      } else if (!userData && !isNewUser) {
        // PHASE 2 FIX: Existing user but getUserData failed even after retries
        console.error('🚨 CRITICAL: Existing user (age > 1 min) but no database record found');
        console.error('🔍 Account created:', authUser.created_at);
        console.error('🔍 This indicates a database trigger failure or RLS issue');

        // Don't create duplicate - show error
        throw new Error('Account verification failed. Please contact support if this persists.');

      } else {
        // Existing user with userData found - proceed with login flow
        console.log('👋 Existing user login, userData found');
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
      console.log('🔄 routeUser CALLED');
      console.log('📊 userData:', userData);
      console.log('📊 is_first_login:', userData.is_first_login);
      console.log('📊 authContext:', authContext);

      setMessage('Redirecting...');

      // Determine destination based on user state
      let destination;

      if (userData.is_first_login) {
        // First login after signup
        console.log('👋 First login, routing to post-signup destination');
        destination = getPostSignupDestination(session.user, authContext);
        console.log('📍 getPostSignupDestination returned:', destination);
      } else {
        // Returning user
        console.log('🔄 Returning user, routing to post-login destination');
        destination = await getPostLoginDestination(userData, session);
        console.log('📍 getPostLoginDestination returned:', destination);
      }

      // Clear auth context after use
      clearAuthContext();

      console.log('🚀 Final destination object:', JSON.stringify(destination, null, 2));
      console.log('🚀 Destination path:', destination.path);

      // Map paths to view names
      const pathToView = {
        '/analyze': 'input',
        '/checkout': 'pricing', // For Stripe checkout
        '/dashboard': 'dashboard',
        '/upsell/coffee': 'dashboard', // FIX: Send to dashboard instead of upsell page
        '/upsell/growth': 'dashboard', // FIX: Send to dashboard instead of upsell page
        '/upsell/scale': 'dashboard', // FIX: Send to dashboard instead of upsell page
        '/welcome/scale': 'dashboard' // FIX: Send to dashboard instead of welcome page
      };

      const viewName = pathToView[destination.path] || 'dashboard';

      console.log('🗺️ Path mapping:', destination.path, '→', viewName);
      console.log('🗺️ Final viewName to navigate to:', viewName);

      // Store destination state in sessionStorage for retrieval by next component
      if (destination.state) {
        sessionStorage.setItem('routeState', JSON.stringify(destination.state));
        console.log('💾 Stored routeState in sessionStorage:', destination.state);
      }

      // SECURITY: Always use onNavigate callback to ensure route protection is applied
      // NEVER directly manipulate window.location.hash as it bypasses security checks
      if (onNavigate) {
        console.log('🔒 SECURITY: Using onNavigate callback for protected route navigation');
        console.log('🔒 Calling onNavigate with viewName:', viewName);
        console.log('🔒 onNavigate is typeof:', typeof onNavigate);
        onNavigate(viewName);
        console.log('✅ onNavigate completed, should now be at view:', viewName);
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
