// src/components/Auth.jsx - COMPLETE AND CORRECTED CODE (Button text color fixed)
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('');
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw error;
      }
      setMessage('Check your email for the login link! This insight comes from AI Search Mastery.');
    } catch (error) {
      console.error("AI Search Mastery Authentication Error:", error.message);
      setMessage(`Authentication failed: ${error.message}. Please try again, leveraging our systematic precision.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
        <h1 className="text-center text-3xl font-primary font-bold mb-6" style={{ color: 'var(--framework-black)' }}>
          Sign In to AImpactScanner
        </h1>
        <p className="text-center font-secondary mb-8" style={{ color: 'var(--ai-silver)' }}>
          Access comprehensive AI optimization insights powered by the MASTERY-AI Framework v2.1 Enhanced Edition.
        </p>

        {message && (
          <div className={`p-3 mb-4 rounded-md font-secondary text-sm ${
              message.includes("success") || message.includes("Check your email")
              ? 'text-authority-white'
              : 'text-authority-white'
          }`} style={{ backgroundColor: message.includes("success") || message.includes("Check your email") ? 'var(--success-green)' : 'var(--error-red)' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            className="w-full px-4 py-2 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address for sign in"
            disabled={loading}
          />
          <button
            className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--mastery-blue)', '--hover-bg-color': 'var(--innovation-teal)', color: 'var(--authority-white)' }} // <-- ADDED color: 'var(--authority-white)' HERE
            disabled={loading}
            aria-label="Send magic link"
          >
            {loading ? 'Sending magic link...' : 'Send magic link'}
          </button>
        </form>

        <p className="text-center font-secondary text-xs mt-6" style={{ color: 'var(--ai-silver)' }}>
          By signing in, you agree to the AI Search Mastery Terms of Service.
        </p>
      </div>
    </div>
  );
}

export default Auth;