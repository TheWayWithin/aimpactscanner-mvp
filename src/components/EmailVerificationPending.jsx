// EmailVerificationPending.jsx - Shows after sign-up to inform about email verification
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AILogo from './AILogo';

const EmailVerificationPending = ({ email, onResendEmail, onNavigateToLogin }) => {
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Sign out the user to prevent auto-login before verification
    const signOutUser = async () => {
      await supabase.auth.signOut();
      console.log('User signed out - awaiting email verification');
    };
    signOutUser();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (resendDisabled) return;
    
    setResending(true);
    setResendMessage('');
    
    try {
      // Resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login?verified=true`
        }
      });

      if (error) throw error;

      setResendMessage('✅ Verification email resent successfully!');
      setResendDisabled(true);
      setCountdown(60); // Disable for 60 seconds
    } catch (error) {
      console.error('Error resending email:', error);
      setResendMessage('❌ Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <AILogo className="h-12 w-auto" />
          </div>

          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email!
          </h1>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification link to:
            <br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Open your email inbox</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Find the email from AImpactScanner</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Click the verification link</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">4.</span>
                <span>Sign in with your email and password</span>
              </li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> The verification link will expire in 24 hours. 
              Check your spam/junk folder if you don't see the email in your inbox.
            </p>
          </div>

          {/* Resend Message */}
          {resendMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              resendMessage.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={resending || resendDisabled}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                resending || resendDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {resending ? 'Resending...' : 
               resendDisabled ? `Resend in ${countdown}s` : 
               'Resend Verification Email'}
            </button>

            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            >
              Go to Sign In
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-6 text-xs text-gray-500">
            Having trouble? Contact support at support@aimpactscanner.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPending;