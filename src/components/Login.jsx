// Login.jsx - Password-based login component for returning and verified users
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifiedUser, setIsVerifiedUser] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    // Check URL parameters for email verification and analysis data
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const tier = urlParams.get('tier');
    const analysisUrl = urlParams.get('analysisUrl');
    const analysisId = urlParams.get('analysisId');

    if (verified === 'true') {
      setIsVerifiedUser(true);
      setMessage('✅ Email verified successfully! Please sign in with your password to continue.');
      setMessageType('success');
      
      // Pre-fill email from localStorage if available
      const registrationEmail = localStorage.getItem('registrationEmail');
      if (registrationEmail) {
        setEmail(registrationEmail);
      }

      // Store analysis data if present
      if (analysisUrl && analysisId) {
        const data = { analysisUrl, analysisId, tier };
        setAnalysisData(data);
        console.log('📊 Analysis data found in URL parameters:', data);
      }

      // Clean up URL without refreshing page
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return;
    }

    if (!password) {
      setMessage('Please enter your password');
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
      console.log('🔐 Starting password authentication for:', email);

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) throw error;

      console.log('✅ Authentication successful for user:', data.user?.id);

      // Handle analysis data restoration for new verified users
      if (analysisData) {
        console.log('📊 Restoring analysis data for new user:', analysisData);
        localStorage.setItem('pendingAnalysisUrl', analysisData.analysisUrl);
        localStorage.setItem('pendingAnalysisId', analysisData.analysisId);
        localStorage.setItem('selectedTier', analysisData.tier);
        
        // Add analysis results data from localStorage if it exists
        const existingData = localStorage.getItem('landingAnalysisData');
        if (existingData) {
          console.log('📈 Found existing analysis data, user will see results');
        }
      }

      // Clean up registration data
      localStorage.removeItem('registrationEmail');

      // Call success handler with user data and routing info
      if (onLoginSuccess) {
        const routingData = {
          user: data.user,
          isNewUser: isVerifiedUser,
          hasAnalysisData: !!analysisData,
          tier: analysisData?.tier || 'free'
        };
        onLoginSuccess(routingData);
      }

      // Success message
      if (isVerifiedUser) {
        setMessage('Welcome! Redirecting to your analysis results...');
      } else {
        setMessage('Welcome back! Redirecting to your dashboard...');
      }
      setMessageType('success');

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Handle specific authentication errors
      if (error.message.includes('Invalid login credentials')) {
        setMessage('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        setMessage('Please check your email and click the verification link before signing in.');
      } else if (error.message.includes('Too many requests')) {
        setMessage('Too many login attempts. Please wait a moment and try again.');
      } else {
        setMessage(error.message || 'Login failed. Please try again.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };


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
            <div className="mb-4">
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

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
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
              {loading ? 'Signing in...' : 'Sign In'}
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
                <div className="font-semibold">Secure Authentication</div>
                <div>Your credentials are encrypted and protected. Sign in securely with your email and password.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;