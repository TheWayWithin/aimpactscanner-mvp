// Login.jsx - Dedicated login component for returning users
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEmailSent, setShowEmailSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      setShowEmailSent(true);
      setMessage(`Check ${email} for your magic link to sign in`);
      setMessageType('success');
      
      // Call success handler if provided
      if (onLoginSuccess) {
        onLoginSuccess({ email });
      }

    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message || 'Login failed. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (showEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">📧</div>
          <h2 className="text-2xl font-bold mb-4">Check Your Email!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in your email to sign in to your account.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowEmailSent(false);
                setEmail('');
                setMessage('');
              }}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600"
            >
              Try Different Email
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
            <p className="text-gray-600">
              Sign in to access your AI-powered analysis dashboard
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message Display */}
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                messageType === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all bg-blue-600 hover:bg-blue-700 text-white ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Sending Magic Link...' : 'Send Magic Link to Sign In'}
            </button>

            <p className="mt-4 text-xs text-center text-gray-500">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button 
                  onClick={() => window.location.href = '/'}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Create one here
                </button>
              </p>
            </div>
            
            <div className="text-center pt-4 border-t border-gray-200">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Homepage
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">🔒</span>
              <div className="text-sm text-blue-800">
                <div className="font-semibold">Secure Magic Link Authentication</div>
                <div>No passwords to remember. Click the link in your email to sign in securely.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;