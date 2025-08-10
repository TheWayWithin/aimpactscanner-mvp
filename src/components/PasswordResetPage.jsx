// src/components/PasswordResetPage.jsx - Handle password reset from email link
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  hasNumber: /\d/,
  hasSpecial: /[!@#$%^&*(),.?":{}|<>]/,
  hasLower: /[a-z]/,
  hasUpper: /[A-Z]/
};

function PasswordResetPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

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

  // Check for password reset token in URL on component mount
  useEffect(() => {
    const checkResetToken = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set session with the tokens from the reset email
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            throw error;
          }

          setIsValidToken(true);
          showMessage('Please enter your new password below.', 'info');
        } else {
          throw new Error('Invalid or missing reset token');
        }
      } catch (error) {
        console.error('Password reset token error:', error);
        showMessage('Invalid or expired reset link. Please request a new password reset.', 'error');
        setIsValidToken(false);
      } finally {
        setCheckingToken(false);
      }
    };

    checkResetToken();
  }, []);

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

  const validateForm = () => {
    if (passwordStrength.score < 5) {
      showMessage('Please ensure your password meets all requirements.', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage('Passwords do not match.', 'error');
      return false;
    }

    return true;
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        throw error;
      }

      showMessage('Password updated successfully! You can now sign in with your new password.', 'success');
      
      // Redirect to login after success
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error) {
      console.error('Password update error:', error);
      
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.message.includes('same password')) {
        errorMessage = 'Your new password must be different from your current password.';
      } else if (error.message.includes('weak password')) {
        errorMessage = 'Password does not meet security requirements. Please ensure it meets all criteria shown below.';
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

  if (checkingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                 style={{ borderColor: 'var(--mastery-blue)' }}></div>
            <p className="font-secondary" style={{ color: 'var(--framework-black)' }}>
              Verifying reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
        <h1 className="text-center text-3xl font-primary font-bold mb-2" style={{ color: 'var(--framework-black)' }}>
          {isValidToken ? 'Set New Password' : 'Reset Link Invalid'}
        </h1>
        <p className="text-center font-secondary mb-8" style={{ color: 'var(--ai-silver)' }}>
          {isValidToken 
            ? 'Create a strong new password for your AImpactScanner account.'
            : 'This password reset link is invalid or has expired.'
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

        {isValidToken ? (
          <form onSubmit={handlePasswordUpdate} className="flex flex-col space-y-4">
            <div className="relative">
              <input
                className="w-full px-4 py-2 pr-10 border border-ai-silver rounded-md focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--innovation-teal)' }}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
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
                placeholder="Confirm your new password"
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

            <button
              type="submit"
              className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{ backgroundColor: 'var(--mastery-blue)' }}
              disabled={loading || passwordStrength.score < 5 || formData.password !== formData.confirmPassword}
            >
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <button
              className="w-full font-primary font-semibold py-2 rounded-md transition-colors duration-200 text-white"
              style={{ backgroundColor: 'var(--mastery-blue)' }}
              onClick={() => window.location.href = '/'}
            >
              Request New Reset Link
            </button>
          </div>
        )}

        <p className="text-center font-secondary text-xs mt-6" style={{ color: 'var(--ai-silver)' }}>
          Powered by the MASTERY-AI Framework v3.1.1 - Professional AI Search Optimization
        </p>
      </div>
    </div>
  );
}

export default PasswordResetPage;