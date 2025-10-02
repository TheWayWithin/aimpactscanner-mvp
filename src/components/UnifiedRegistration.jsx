// UnifiedRegistration.jsx - Optimized registration flow biased towards paid tier
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUpgrade } from './UpgradeHandler';

const UnifiedRegistration = ({ onRegistrationComplete }) => {
  const [selectedTier, setSelectedTier] = useState('coffee'); // Default to paid tier
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Tier configurations
  const tiers = {
    coffee: {
      name: '☕ Coffee Plan',
      price: '$4.95/month',
      subtitle: 'Most Popular Choice',
      color: 'yellow',
      recommended: true
    },
    free: {
      name: 'Free Plan',
      price: '$0/month',
      subtitle: 'Limited Access',
      color: 'gray',
      recommended: false
    }
  };

  // Dynamic benefits based on selected tier
  const getBenefits = () => {
    if (selectedTier === 'coffee') {
      return {
        title: '☕ COFFEE Plan Benefits',
        benefits: [
          { icon: '✅', text: 'Unlimited AI-powered analysis', highlight: true },
          { icon: '✅', text: 'All 18 factors with detailed recommendations', highlight: true },
          { icon: '✅', text: 'Professional reports (no watermarks)', highlight: false },
          { icon: '✅', text: 'Export to PDF and share', highlight: false },
          { icon: '✅', text: 'Priority email support', highlight: false },
          { icon: '✅', text: 'Cancel anytime, no questions asked', highlight: false }
        ],
        value: 'Less than the price of a coffee per month!',
        cta: 'After signup, you\'ll be redirected to Stripe for payment ($4.95/month)'
      };
    } else {
      return {
        title: 'FREE Plan Limitations',
        benefits: [
          { icon: '⚠️', text: 'Only 3 analyses per month', highlight: false, warning: true },
          { icon: '❌', text: 'Basic recommendations only', highlight: false, strike: true },
          { icon: '❌', text: 'Watermarked results', highlight: false, strike: true },
          { icon: '❌', text: 'No export options', highlight: false, strike: true },
          { icon: '❌', text: 'Community support only', highlight: false, strike: true },
          { icon: '⚠️', text: 'Missing advanced AI insights', highlight: false, warning: true }
        ],
        value: 'You\'re missing out on comprehensive analysis',
        cta: 'Continue with limited free tier'
      };
    }
  };

  // Password validation function
  const validatePassword = (pass) => {
    let strength = 0;
    const checks = [
      pass.length >= 8,                    // Length check
      /[a-z]/.test(pass),                  // Lowercase check  
      /[A-Z]/.test(pass),                  // Uppercase check
      /\d/.test(pass),                     // Number check
      /[!@#$%^&*(),.?":{}|<>]/.test(pass) // Special character check
    ];
    
    strength = checks.filter(Boolean).length;
    setPasswordStrength(strength);
    return strength;
  };

  // Password strength indicator
  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 0:
      case 1: return { text: 'Very Weak', color: 'text-red-600' };
      case 2: return { text: 'Weak', color: 'text-orange-600' };
      case 3: return { text: 'Fair', color: 'text-yellow-600' };
      case 4: return { text: 'Good', color: 'text-blue-600' };
      case 5: return { text: 'Strong', color: 'text-green-600' };
      default: return { text: '', color: '' };
    }
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (newPassword) {
      validatePassword(newPassword);
    } else {
      setPasswordStrength(0);
    }
  };

  // Form validation
  const validateForm = () => {
    if (!email) {
      setMessage('Please enter your email address');
      setMessageType('error');
      return false;
    }

    if (!password) {
      setMessage('Please enter a password');
      setMessageType('error');
      return false;
    }

    if (passwordStrength < 3) {
      setMessage('Password must be stronger. Include uppercase, lowercase, numbers, and special characters.');
      setMessageType('error');
      return false;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('🔐 Starting password-based registration for:', email);
      
      // Store analysis data and tier for post-verification handling
      localStorage.setItem('selectedTier', selectedTier);
      localStorage.setItem('registrationEmail', email);
      
      // Create redirect URL to login page with verification flag
      const loginUrl = new URL('/login', window.location.origin);
      loginUrl.searchParams.set('verified', 'true');
      loginUrl.searchParams.set('tier', selectedTier);
      
      // Add analysis data if exists
      const pendingUrl = localStorage.getItem('pendingAnalysisUrl');
      const pendingId = localStorage.getItem('pendingAnalysisId');
      
      if (pendingUrl && pendingId) {
        loginUrl.searchParams.set('analysisUrl', pendingUrl);
        loginUrl.searchParams.set('analysisId', pendingId);
      }

      // Sign up with email and password (creates unconfirmed user)
      console.log('📧 DEBUG: Attempting signup with email:', email);
      console.log('🔗 DEBUG: Email redirect URL:', loginUrl.toString());
      console.log('📊 DEBUG: User metadata:', {
        tier: selectedTier,
        selected_tier: selectedTier,
        signup_source: 'unified-registration',
        full_name: email.split('@')[0]
      });
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: loginUrl.toString(),
          data: {
            tier: selectedTier,
            selected_tier: selectedTier,  // Add both for compatibility
            signup_source: 'unified-registration',
            full_name: email.split('@')[0] // Use email prefix as default name
          }
        }
      });
      
      console.log('📬 DEBUG: SignUp response:', {
        user: data?.user?.id,
        email_confirmed: data?.user?.email_confirmed_at,
        session: !!data?.session,
        error: error?.message
      });

      if (error) throw error;

      console.log('✅ Registration successful, user created:', data.user?.id);
      
      setShowEmailSent(true);
      setMessage(`Account created! Check ${email} for verification link.`);
      setMessageType('success');

    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        setMessage('Email already registered. Try signing in instead.');
      } else if (error.message.includes('Password')) {
        setMessage('Password requirements not met. Please try a stronger password.');
      } else {
        setMessage(error.message || 'Registration failed. Please try again.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const benefits = getBenefits();

  if (showEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-lg w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-4">Account Created Successfully!</h2>
          <p className="text-gray-600 mb-6">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Next Steps:</h3>
            <ol className="text-sm text-blue-700 text-left space-y-2">
              <li>1. 📧 Check your email for the verification link</li>
              <li>2. 🔗 Click the link to verify your email address</li>
              <li>3. 🔐 Sign in with your email and password</li>
              <li>4. 🎯 View your complete analysis results</li>
            </ol>
          </div>

          {selectedTier === 'coffee' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ☕ <strong>Coffee Plan Selected</strong><br />
                After signing in, you'll be redirected to secure Stripe checkout ($4.95/month)
              </p>
            </div>
          )}

          <div className="text-sm text-gray-500 mb-4">
            <p><strong>Your Account Details:</strong></p>
            <p>Email: {email}</p>
            <p>Plan: {selectedTier === 'coffee' ? 'Coffee Plan ($4.95/month)' : 'Free Plan'}</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-gray-500 mb-3">
              Didn't receive the email? Check your spam folder or
            </p>
            <button 
              onClick={() => setShowEmailSent(false)}
              className="text-blue-600 hover:underline text-sm font-semibold"
            >
              ← Try again with different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* Left side - Registration Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
            <p className="text-gray-600 mb-6">
              Join early adopters making their businesses AI-discoverable
            </p>

            {/* Tier Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Plan
              </label>
              
              <div className="space-y-3">
                {/* Coffee Tier - Pre-selected and highlighted */}
                <div 
                  onClick={() => setSelectedTier('coffee')}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedTier === 'coffee' 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {tiers.coffee.recommended && (
                    <div className="absolute -top-3 left-4 px-2 bg-yellow-400 text-xs font-bold rounded-full">
                      RECOMMENDED
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="tier"
                        value="coffee"
                        checked={selectedTier === 'coffee'}
                        onChange={() => setSelectedTier('coffee')}
                        className="mr-3 text-yellow-500 focus:ring-yellow-500"
                      />
                      <div>
                        <div className="font-semibold">{tiers.coffee.name}</div>
                        <div className="text-sm text-gray-600">{tiers.coffee.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-yellow-600">{tiers.coffee.price}</div>
                  </div>
                  <div className="mt-2 ml-6 text-sm text-gray-700">
                    Unlimited AI analysis, up to 200 pages
                  </div>
                  {selectedTier === 'coffee' && (
                    <div className="mt-2 ml-6 text-xs text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded">
                      ℹ️ After signup, you'll be redirected to Stripe for payment ($4.95/month)
                    </div>
                  )}
                </div>

                {/* Free Tier - De-emphasized */}
                <div 
                  onClick={() => setSelectedTier('free')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all opacity-75 ${
                    selectedTier === 'free' 
                      ? 'border-gray-400 bg-gray-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="tier"
                        value="free"
                        checked={selectedTier === 'free'}
                        onChange={() => setSelectedTier('free')}
                        className="mr-3 text-gray-500 focus:ring-gray-500"
                      />
                      <div>
                        <div className="font-semibold text-gray-700">{tiers.free.name}</div>
                        <div className="text-sm text-gray-500">{tiers.free.subtitle}</div>
                      </div>
                    </div>
                    <div className="text-lg text-gray-500">{tiers.free.price}</div>
                  </div>
                  <div className="mt-2 ml-6 text-sm text-gray-500">
                    3 free analyses per month, up to 20 pages
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSignUp}>
              {/* Email Input */}
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

              {/* Password Input */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Create a strong password"
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
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-semibold ${getPasswordStrengthText().color}`}>
                        {getPasswordStrengthText().text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 1 ? 'bg-red-500' :
                          passwordStrength === 2 ? 'bg-orange-500' :
                          passwordStrength === 3 ? 'bg-yellow-500' :
                          passwordStrength === 4 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Include uppercase, lowercase, numbers, and special characters
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                )}
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
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  selectedTier === 'coffee'
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : 
                 selectedTier === 'coffee' ? 'Create Account & Continue to Payment →' : 'Create Free Account'}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>

          {/* Right side - Dynamic Benefits */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6">{benefits.title}</h2>
            
            <ul className="space-y-3 mb-6">
              {benefits.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-xl mr-3">{benefit.icon}</span>
                  <span className={`flex-1 ${
                    benefit.highlight ? 'font-semibold text-gray-900' : 
                    benefit.warning ? 'text-orange-600' :
                    benefit.strike ? 'text-gray-400 line-through' : 
                    'text-gray-700'
                  }`}>
                    {benefit.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className={`p-4 rounded-lg mb-6 ${
              selectedTier === 'coffee' 
                ? 'bg-yellow-50 border border-yellow-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-semibold ${
                selectedTier === 'coffee' ? 'text-yellow-800' : 'text-red-800'
              }`}>
                {benefits.value}
              </p>
            </div>

            {/* Why Choose Section - Enhanced with OVERT, DRAMATIC, REAL messaging */}
            <div className="border-t pt-6">
              <h3 className="font-bold text-lg mb-4 text-red-600">⚠️ Don't Get Left Behind by AI!</h3>
              
              {/* Dramatic Difference - Us vs Them */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-red-800 mb-3">While Others Struggle, You'll Dominate:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    <span className="text-red-700"><strong>Basic SEO Tools:</strong> Ignore AI completely (your traffic dies)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-500 mr-2">❌</span>
                    <span className="text-red-700"><strong>AI Consultants:</strong> $5,000+ (you can't afford this)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-500 mr-2">✅</span>
                    <span className="text-green-700 font-semibold"><strong>AImpactScanner:</strong> Enterprise AI Analysis for $4.95/month</span>
                  </div>
                </div>
              </div>

              {/* Real Reasons to Believe */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-xl mr-2">💰</span>
                    <h4 className="font-bold text-green-800">30-Day Money Back Guarantee</h4>
                  </div>
                  <p className="text-sm text-green-700">Don't see improvements? Get every penny back. No questions asked.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">🔄</span>
                    <div>
                      <div className="font-medium">Cancel Anytime</div>
                      <div className="text-xs text-gray-600">No contracts, no BS, no hassle</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-purple-600 mr-2">👤</span>
                    <div>
                      <div className="font-medium">Direct Founder Access</div>
                      <div className="text-xs text-gray-600">I personally respond to emails</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-orange-600 mr-2">⚡</span>
                    <div>
                      <div className="font-medium">15-Second Results</div>
                      <div className="text-xs text-gray-600">No waiting, no complexity</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">🔍</span>
                    <div>
                      <div className="font-medium">100% Transparent</div>
                      <div className="text-xs text-gray-600">See exactly what we check</div>
                    </div>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 text-xl mr-2">🏆</span>
                    <h4 className="font-bold text-yellow-800">Early Adopters Winning Big</h4>
                  </div>
                  <p className="text-sm text-yellow-700 mb-2">Join 500+ smart founders who got ahead of AI before everyone else</p>
                  <p className="text-xs text-yellow-600 italic">"40%+ traffic increase in first month" - Real customer results</p>
                </div>

                {/* Urgency & Value */}
                <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-bold text-blue-800 mb-1">Less Than Your Daily Coffee</h4>
                  <p className="text-sm text-blue-700">While competitors spend $5,000+ on consultants, you get enterprise insights for $4.95/month</p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">⏰ Algorithm changes happen daily - don't wait</p>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-blue-600 mr-2">🔒</span>
                <div className="text-sm text-blue-800">
                  <div className="font-semibold">Secure & Private</div>
                  <div>Your data is encrypted and never shared. We only analyze public content.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRegistration;