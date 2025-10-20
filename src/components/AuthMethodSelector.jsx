// AuthMethodSelector.jsx - OAuth-first authentication with Google, GitHub, and Magic Link
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabaseClient';

const AuthMethodSelector = ({ selectedTier, mode = 'signup', onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // DEBUG: Log immediately when component mounts
  useEffect(() => {
    console.log('🎯 AuthMethodSelector mounted');
    console.log('🎯 Props:', { selectedTier, mode });
  }, []);

  // Store context before OAuth redirect
  const storeAuthContext = () => {
    const context = {
      selectedTier,
      timestamp: Date.now(),
      mode,
      pendingAnalysisUrl: localStorage.getItem('pendingAnalysisUrl'),
      pendingAnalysisId: localStorage.getItem('pendingAnalysisId')
    };

    // FIX 3: Store with 7-day TTL (was 24 hours)
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem('authContext', JSON.stringify(context));
    localStorage.setItem('authContextExpiry', (Date.now() + ttl).toString());

    console.log('📦 Stored auth context:', context);
  };

  // Get redirect URL for OAuth
  // OAuth should redirect to #oauth-callback page which processes the session
  const getRedirectUrl = () => {
    // Redirect to oauth-callback hash route
    // Supabase appends tokens: #oauth-callback#access_token=xxx
    // But the OAuthCallback component will handle the session
    return `${window.location.origin}/#oauth-callback`;
  };

  // Handle Google OAuth
  const handleGoogleOAuth = async () => {
    try {
      setLoading(true);
      setLoadingMethod('google');

      // Store context before redirect
      storeAuthContext();

      console.log('🔵 Starting Google OAuth flow...');

      console.log('🔵 Calling Supabase signInWithOAuth for Google...');
      console.log('🔵 Redirect URL:', getRedirectUrl());

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Store metadata that will be available after OAuth
          data: {
            selected_tier: selectedTier,
            signup_source: 'oauth_google',
            auth_provider: 'google'
          }
        }
      });

      console.log('🔵 Supabase OAuth response:', { data, error });

      if (error) {
        console.error('❌ Supabase returned error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        throw error;
      }

      // OAuth redirect will happen automatically
      console.log('✅ Google OAuth initiated successfully!');
      console.log('✅ OAuth URL:', data?.url);
      console.log('✅ Redirecting to Google...');

    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      setLoading(false);
      setLoadingMethod(null);
      onError?.(error.message || 'Google OAuth failed. Please try again.');
    }
  };

  // Handle GitHub OAuth
  const handleGitHubOAuth = async () => {
    try {
      setLoading(true);
      setLoadingMethod('github');

      // Store context before redirect
      storeAuthContext();

      console.log('⚫ Starting GitHub OAuth flow...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: getRedirectUrl(),
          // Store metadata that will be available after OAuth
          data: {
            selected_tier: selectedTier,
            signup_source: 'oauth_github',
            auth_provider: 'github'
          }
        }
      });

      if (error) throw error;

      // OAuth redirect will happen automatically
      console.log('✅ GitHub OAuth initiated, redirecting...');

    } catch (error) {
      console.error('❌ GitHub OAuth error:', error);
      setLoading(false);
      setLoadingMethod(null);
      onError?.(error.message || 'GitHub OAuth failed. Please try again.');
    }
  };

  // Handle Magic Link
  const handleMagicLink = async (e) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      onError?.('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setLoadingMethod('magic_link');

      console.log('✉️ Sending magic link to:', email);

      // Store context before magic link
      storeAuthContext();

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: getRedirectUrl(),
          data: {
            selected_tier: selectedTier,
            signup_source: 'magic_link',
            auth_provider: 'magic_link'
          }
        }
      });

      if (error) throw error;

      console.log('✅ Magic link sent to:', email);
      setMagicLinkSent(true);
      onSuccess?.(`Magic link sent to ${email}. Check your email and click the link to continue.`);

    } catch (error) {
      console.error('❌ Magic link error:', error);
      setLoading(false);
      setLoadingMethod(null);
      onError?.(error.message || 'Failed to send magic link. Please try again.');
    }
  };

  // If magic link was sent, show success message
  if (magicLinkSent) {
    return (
      <div className="auth-method-selector">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Check Your Email!</h3>
          <p className="text-green-700 mb-4">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-green-600 mb-4">
            Click the link in your email to complete {mode === 'signup' ? 'signup' : 'login'}.
          </p>
          <button
            onClick={() => {
              setMagicLinkSent(false);
              setEmail('');
              setLoading(false);
              setLoadingMethod(null);
            }}
            className="text-green-700 hover:text-green-900 text-sm font-semibold underline"
          >
            ← Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-method-selector">
      {/* Google OAuth - Primary */}
      <button
        onClick={handleGoogleOAuth}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-blue-500 hover:bg-blue-50 rounded-lg font-semibold text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        aria-label="Continue with Google"
      >
        {loadingMethod === 'google' ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </>
        )}
      </button>

      {/* GitHub OAuth - Secondary */}
      <button
        onClick={handleGitHubOAuth}
        disabled={loading}
        className="w-full mt-3 flex items-center justify-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-900 border-2 border-gray-800 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Continue with GitHub"
      >
        {loadingMethod === 'github' ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Connecting to GitHub...</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Continue with GitHub</span>
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Magic Link Toggle/Form */}
      {!showMagicLink ? (
        <button
          onClick={() => setShowMagicLink(true)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-medium text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Continue with Email"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Continue with Email</span>
        </button>
      ) : (
        <form onSubmit={handleMagicLink} className="space-y-3">
          <div>
            <label htmlFor="magic-link-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="magic-link-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMethod === 'magic_link' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending magic link...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>Send Magic Link</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowMagicLink(false)}
            className="w-full text-sm text-gray-600 hover:text-gray-800 underline"
            disabled={loading}
          >
            ← Use OAuth instead
          </button>
        </form>
      )}

      {/* Info Text */}
      <p className="mt-4 text-xs text-center text-gray-500">
        {mode === 'signup' ? (
          <>By signing up, you agree to our Terms of Service and Privacy Policy</>
        ) : (
          <>Secure authentication via OAuth or passwordless magic link</>
        )}
      </p>
    </div>
  );
};

AuthMethodSelector.propTypes = {
  selectedTier: PropTypes.oneOf(['free', 'coffee', 'growth', 'scale', null]), // Allow null for OAuth-first signup
  mode: PropTypes.oneOf(['signup', 'login']),
  onSuccess: PropTypes.func,
  onError: PropTypes.func
};

export default AuthMethodSelector;
