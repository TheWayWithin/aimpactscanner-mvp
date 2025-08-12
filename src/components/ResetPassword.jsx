import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token in the URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken && type === 'recovery') {
      // We have a token - let's verify it by setting the session
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || ''
      }).then(({ error }) => {
        if (error) {
          console.error('Token validation error:', error);
          setError('Your reset link has expired or been used. Please request a new one.');
          setIsValidToken(false);
        } else {
          setIsValidToken(true);
          setMessage('Please enter your new password');
        }
      });
    } else if (window.location.hash.includes('access_token')) {
      // We have a token but it might not be a recovery type
      setError('This link may have already been used. Please request a new password reset link.');
    } else {
      // No token at all - show the request form
      setError('Enter your email to receive a password reset link.');
    }
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      setMessage('Password updated successfully! Redirecting to login...');
      
      // Redirect to main page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestNewLink = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(requestEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        // Handle rate limiting specifically
        if (error.message.includes('security purposes') || error.message.includes('429') || error.message.includes('rate')) {
          setError('Too many reset attempts. Please wait a minute before trying again.');
          // Set a timer to show when they can try again
          setTimeout(() => {
            setError('You can now request a new reset link.');
          }, 60000); // 1 minute
        } else {
          throw error;
        }
      } else {
        setRequestSent(true);
        setMessage('New password reset link sent! Check your email.');
      }
      
    } catch (error) {
      if (error.message.includes('security purposes')) {
        setError('Too many reset attempts. Please wait a minute before trying again.');
      } else {
        setError(error.message);
      }
    } finally {
      setRequestLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Password Reset</h2>
            <p className="text-red-600 mb-6">{error}</p>
            
            {!requestSent ? (
              <div>
                <p className="text-gray-600 mb-6">
                  Your reset link has expired. Request a new one below:
                </p>
                
                <form onSubmit={handleRequestNewLink} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      required
                      value={requestEmail}
                      onChange={(e) => setRequestEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {requestLoading ? 'Sending...' : 'Send New Reset Link'}
                  </button>
                </form>
                
                <div className="mt-6">
                  <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
                    Return to Home
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  {message}
                </div>
                <p className="text-gray-600 mb-4">
                  Please check your inbox for the new reset link.
                </p>
                <a href="/" className="inline-block text-blue-600 hover:text-blue-700">
                  Return to Home
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Reset Your Password
          </h2>
          
          {message && !error && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
              {message}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter new password"
                minLength="6"
              />
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm new password"
                minLength="6"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;