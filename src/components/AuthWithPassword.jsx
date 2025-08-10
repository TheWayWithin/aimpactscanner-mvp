// src/components/AuthWithPassword.jsx - Modern Email/Password Authentication
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Password strength requirements
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
  hasLower: /[a-z]/,
  hasUpper: /[A-Z]/
};

function AuthWithPassword() {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
    agreeToTerms: false
  });

  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    requirements: {
      minLength: false,
      hasNumber: false,
      hasSpecial: false,
      hasLower: false,
      hasUpper: false
    }
  });

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Password strength calculation
  const calculatePasswordStrength = (password) => {
    const requirements = {
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasNumber: PASSWORD_REQUIREMENTS.hasNumber.test(password),
      hasSpecial: PASSWORD_REQUIREMENTS.hasSpecial.test(password),
      hasLower: PASSWORD_REQUIREMENTS.hasLower.test(password),
      hasUpper: PASSWORD_REQUIREMENTS.hasUpper.test(password)
    };

    const score = Object.values(requirements).filter(Boolean).length;
    
    return { score, requirements };
  };

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({
        score: 0,
        requirements: {
          minLength: false,
          hasNumber: false,
          hasSpecial: false,
          hasLower: false,
          hasUpper: false
        }
      });
    }
  }, [formData.password]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage('');
    setMessageType('');
  };

  // Validation functions
  const validateLoginForm = () => {
    if (!formData.email.trim()) {
      showMessage('Please enter your email address.', 'error');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      showMessage('Please enter a valid email address.', 'error');
      return false;
    }

    if (!formData.password) {
      showMessage('Please enter your password.', 'error');
      return false;
    }

    return true;
  };

  const validateRegisterForm = () => {
    if (!formData.email.trim()) {
      showMessage('Please enter your email address.', 'error');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      showMessage('Please enter a valid email address.', 'error');
      return false;
    }

    if (passwordStrength.score < 5) {
      showMessage('Please ensure your password meets all requirements.', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return false;
    }

    if (!formData.agreeToTerms) {
      showMessage('Please agree to the Terms of Service to continue.', 'error');
      return false;
    }

    return true;
  };

  const validateResetForm = () => {
    if (!formData.email.trim()) {
      showMessage('Please enter your email address.', 'error');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      showMessage('Please enter a valid email address.', 'error');
      return false;
    }

    return true;
  };

  // Authentication handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!validateLoginForm()) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            rememberMe: formData.rememberMe
          }
        }
      });

      if (error) {
        throw error;
      }

      showMessage('Successfully signed in! Welcome back to AImpactScanner.', 'success');
      
      // The App component will handle the redirect based on auth state change
      
    } catch (error) {
      console.error("AI Search Mastery Authentication Error:", error.message);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sign in failed. Please try again.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before signing in.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many sign in attempts. Please wait a few minutes before trying again.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!validateRegisterForm()) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            full_name: formData.email.split('@')[0], // Use email prefix as initial name
          }
        }
      });

      if (error) {
        throw error;
      }

      showMessage(
        'Registration successful! Please check your email for a confirmation link before signing in.',
        'success'
      );
      
      // Switch to login mode after successful registration
      setTimeout(() => {
        setMode('login');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '', agreeToTerms: false }));
      }, 3000);
      
    } catch (error) {
      console.error("AI Search Mastery Registration Error:", error.message);
      
      // Provide user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in or use a different email address.';
      } else if (error.message.includes('Password')) {
        errorMessage = 'Password does not meet requirements. Please ensure it meets all criteria shown below.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    clearMessage();

    if (!validateResetForm()) return;

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        formData.email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) {
        throw error;
      }

      showMessage(
        'Password reset email sent! Please check your inbox for instructions.',
        'success'
      );
      
      // Switch back to login after sending reset email
      setTimeout(() => {
        setMode('login');
      }, 3000);
      
    } catch (error) {
      console.error("AI Search Mastery Password Reset Error:", error.message);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.message.includes('not found')) {
        errorMessage = 'No account found with this email address. Please check your email or register for a new account.';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Get password strength color and text
  const getPasswordStrengthDisplay = () => {
    if (passwordStrength.score === 0) return { color: 'transparent', text: '' };
    if (passwordStrength.score <= 2) return { color: 'var(--error-red)', text: 'Weak' };
    if (passwordStrength.score <= 4) return { color: 'var(--innovation-teal)', text: 'Good' };
    return { color: 'var(--success-green)', text: 'Strong' };
  };

  const strengthDisplay = getPasswordStrengthDisplay();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
        <h1 className="text-center text-3xl font-primary font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
          {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
        </h1>
        <p className="text-center font-secondary mb-8" style={{ color: 'var(--ai-silver)' }}>
          {mode === 'login' 
            ? 'Access comprehensive AI optimization insights powered by the MASTERY-AI Framework v3.1.1.'
            : mode === 'register'
            ? 'Join thousands of professionals optimizing their content for AI search engines.'
            : 'Enter your email to receive password reset instructions.'
          }
        </p>

        {message && (
          <div className={`p-3 mb-4 rounded-md font-secondary text-sm text-white`} 
               style={{ 
                 backgroundColor: messageType === 'success' 
                   ? 'var(--success-green)' 
                   : messageType === 'error' 
                   ? 'var(--error-red)' 
                   : 'var(--innovation-teal)' 
               }}>
            {message}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col space-y-4">
            <input
              className="w-full px-4 py-2 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
              type="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />
            
            <div className="relative">
              <input
                className="w-full px-4 py-2 pr-10 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="text-sm" style={{ color: 'var(--ai-silver)' }}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  disabled={loading}
                />
                <span className="text-sm font-secondary" style={{ color: 'var(--framework-black)' }}>
                  Remember me
                </span>
              </label>
              
              <button
                type="button"
                className="text-sm font-secondary underline"
                style={{ color: 'var(--mastery-blue)' }}
                onClick={() => setMode('reset')}
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: 'var(--mastery-blue)' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center font-secondary text-sm mt-4" style={{ color: 'var(--ai-silver)' }}>
              Don't have an account?{' '}
              <button
                type="button"
                className="underline font-semibold"
                style={{ color: 'var(--mastery-blue)' }}
                onClick={() => setMode('register')}
                disabled={loading}
              >
                Create one here
              </button>
            </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col space-y-4">
            <input
              className="w-full px-4 py-2 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
              type="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />
            
            <div className="relative">
              <input
                className="w-full px-4 py-2 pr-10 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="text-sm" style={{ color: 'var(--ai-silver)' }}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </button>
            </div>

            {formData.password && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-secondary" style={{ color: 'var(--framework-black)' }}>
                    Password Strength:
                  </span>
                  <span className="text-xs font-secondary font-semibold" 
                        style={{ color: strengthDisplay.color }}>
                    {strengthDisplay.text}
                  </span>
                </div>
                <div className="space-y-1 text-xs font-secondary">
                  <div className={`flex items-center ${passwordStrength.requirements.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordStrength.requirements.minLength ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${passwordStrength.requirements.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordStrength.requirements.hasNumber ? '✓' : '○'}</span>
                    At least one number
                  </div>
                  <div className={`flex items-center ${passwordStrength.requirements.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordStrength.requirements.hasSpecial ? '✓' : '○'}</span>
                    At least one special character
                  </div>
                  <div className={`flex items-center ${passwordStrength.requirements.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordStrength.requirements.hasLower ? '✓' : '○'}</span>
                    At least one lowercase letter
                  </div>
                  <div className={`flex items-center ${passwordStrength.requirements.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="mr-2">{passwordStrength.requirements.hasUpper ? '✓' : '○'}</span>
                    At least one uppercase letter
                  </div>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                className="w-full px-4 py-2 pr-10 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <span className="text-sm" style={{ color: 'var(--ai-silver)' }}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </span>
              </button>
            </div>

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-red-600 font-secondary">
                Passwords do not match
              </p>
            )}

            <label className="flex items-start">
              <input
                type="checkbox"
                className="mr-2 mt-1"
                checked={formData.agreeToTerms}
                onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                disabled={loading}
                required
              />
              <span className="text-sm font-secondary" style={{ color: 'var(--framework-black)' }}>
                I agree to the{' '}
                <a href="/terms" className="underline" style={{ color: 'var(--mastery-blue)' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="underline" style={{ color: 'var(--mastery-blue)' }}>
                  Privacy Policy
                </a>
              </span>
            </label>

            <button
              type="submit"
              className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: 'var(--mastery-blue)' }}
              disabled={loading || passwordStrength.score < 5 || formData.password !== formData.confirmPassword || !formData.agreeToTerms}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center font-secondary text-sm mt-4" style={{ color: 'var(--ai-silver)' }}>
              Already have an account?{' '}
              <button
                type="button"
                className="underline font-semibold"
                style={{ color: 'var(--mastery-blue)' }}
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Sign in here
              </button>
            </p>
          </form>
        )}

        {mode === 'reset' && (
          <form onSubmit={handlePasswordReset} className="flex flex-col space-y-4">
            <input
              className="w-full px-4 py-2 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
              type="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />

            <button
              type="submit"
              className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: 'var(--mastery-blue)' }}
              disabled={loading}
            >
              {loading ? 'Sending reset email...' : 'Send Reset Email'}
            </button>

            <p className="text-center font-secondary text-sm mt-4" style={{ color: 'var(--ai-silver)' }}>
              Remember your password?{' '}
              <button
                type="button"
                className="underline font-semibold"
                style={{ color: 'var(--mastery-blue)' }}
                onClick={() => setMode('login')}
                disabled={loading}
              >
                Sign in here
              </button>
            </p>
          </form>
        )}

        <p className="text-center font-secondary text-xs mt-6" style={{ color: 'var(--ai-silver)' }}>
          Powered by the MASTERY-AI Framework v3.1.1 - Professional AI Search Optimization
        </p>
      </div>
    </div>
  );
}

export default AuthWithPassword;