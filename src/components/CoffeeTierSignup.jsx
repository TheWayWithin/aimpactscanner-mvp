// CoffeeTierSignup.jsx - Conversion-optimized signup page focused on Coffee tier
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// useUpgrade removed - we create checkout session directly after sign-up
import AILogo from './AILogo';

const CoffeeTierSignup = ({ onRegistrationComplete, onNavigate }) => {
  const [selectedTier, setSelectedTier] = useState('coffee'); // Default to Coffee tier
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Don't use the hook here since we don't have a user yet
  // We'll create our own upgrade function that works with the newly created user

  // Password strength calculation
  const calculatePasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength();

  const validateForm = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return false;
    }

    if (passwordStrength < 3) {
      setMessage('Password must be stronger. Include uppercase, lowercase, and numbers.');
      setMessageType('error');
      return false;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      return false;
    }

    if (!agreeToTerms) {
      setMessage('Please agree to the Terms of Service');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      // Create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            selected_tier: selectedTier,
            tier: selectedTier,  // Add both for compatibility
            signup_source: 'coffee-tier-signup'
          }
        }
      });

      if (authError) throw authError;

      // If Coffee tier selected, redirect to Stripe checkout
      if (selectedTier === 'coffee' && authData?.user) {
        setMessage('Account created! Redirecting to secure payment...');
        setMessageType('success');
        
        // Store user data for post-payment flow
        sessionStorage.setItem('pendingCoffeeTier', JSON.stringify({
          userId: authData.user.id,
          email: email.trim().toLowerCase(),
          tier: 'coffee'
        }));

        // Initiate Stripe checkout with the newly created user
        setTimeout(async () => {
          console.log('Initiating Stripe checkout for Coffee tier...');
          try {
            // Create checkout session directly
            const priceId = import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_coffee_tier_monthly';
            
            // For new sign-ups, don't pass userId since they don't exist in DB yet
            // The Edge Function will handle this as a registration flow
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
              body: {
                priceId,
                tier: 'coffee',
                mode: 'registration', // Important: Tell the function this is a new sign-up
                // Don't pass userId for registration flow - user doesn't exist in DB yet
                successUrl: `${window.location.origin}/upgrade-success?tier=coffee&authId=${authData.user.id}`,
                cancelUrl: `${window.location.origin}/pricing`
              }
            });
            
            if (error) {
              console.error('Failed to create checkout session:', error);
              setMessage('Failed to redirect to payment. Please try upgrading from your dashboard.');
              setMessageType('error');
              return;
            }
            
            if (data?.url) {
              console.log('Redirecting to Stripe:', data.url);
              window.location.href = data.url;
            } else if (data?.sessionId) {
              console.log('Redirecting to Stripe with session ID:', data.sessionId);
              window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
            } else {
              console.error('No redirect URL or session ID received');
              setMessage('Payment redirect failed. Please try upgrading from your dashboard.');
              setMessageType('error');
            }
          } catch (err) {
            console.error('Stripe checkout error:', err);
            setMessage('Unable to process payment. Please try upgrading from your dashboard.');
            setMessageType('error');
          }
        }, 1500);
      } else {
        // Free tier - Show email verification message
        console.log('Free tier sign-up completed, user needs to verify email');
        setMessage('✅ Account created! Please check your email to verify your account.');
        setMessageType('success');
        
        // Store sign-up data for after verification
        localStorage.setItem('pendingFreeTier', JSON.stringify({
          userId: authData.user.id,
          email: email.trim().toLowerCase(),
          tier: 'free',
          timestamp: new Date().toISOString()
        }));
        
        // Show extended message about email verification
        setTimeout(() => {
          setMessage(`📧 We've sent a verification link to ${email}. Please check your inbox (and spam folder) to complete sign-up.`);
          // Don't auto-redirect - let user see the message
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message?.includes('already registered')) {
        setMessage('This email is already registered. Please sign in instead.');
        setMessageType('error');
      } else {
        setMessage(error.message || 'Signup failed. Please try again.');
        setMessageType('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const tierOptions = [
    { 
      id: 'coffee', 
      label: '☕ COFFEE - Unlimited analyses ($4.95/month)',
      recommended: true 
    },
    { 
      id: 'growth', 
      label: '🚀 GROWTH - Advanced features ($29/month)',
      recommended: false,
      comingSoon: true
    },
    { 
      id: 'scale', 
      label: '📈 SCALE - Enterprise features ($99/month)',
      recommended: false,
      comingSoon: true
    },
    { 
      id: 'free', 
      label: '🆓 FREE - 3 analyses/month ($0/month)',
      recommended: false 
    }
  ];

  // Dynamic benefits based on selected tier
  const getBenefits = () => {
    if (selectedTier === 'coffee') {
      return {
        title: '☕ COFFEE Plan Benefits',
        items: [
          { icon: '✅', text: 'Unlimited AI-powered analyses per month', highlight: true },
          { icon: '✅', text: '10 MASTERY-AI Framework factors (Phase A)', highlight: true },
          { icon: '✅', text: 'Professional PDF reports (no watermarks)', highlight: false },
          { icon: '✅', text: 'Clean, exportable results dashboard', highlight: false },
          { icon: '✅', text: 'Educational content & recommendations', highlight: false },
          { icon: '✅', text: 'Email support', highlight: false },
          { icon: '✅', text: '30-day money-back guarantee', highlight: false }
        ]
      };
    } else if (selectedTier === 'growth') {
      return {
        title: '🚀 GROWTH Plan Benefits',
        items: [
          { icon: '✅', text: 'Everything in Coffee Plan', highlight: false },
          { icon: '✅', text: '22 total factors (Phase A + Phase B)', highlight: true },
          { icon: '✅', text: 'Advanced PDF reports with deeper insights', highlight: true },
          { icon: '✅', text: 'AI Remediation Planner', highlight: true },
          { icon: '✅', text: 'Progress tracking dashboard', highlight: false },
          { icon: '✅', text: 'Priority support', highlight: false },
          { icon: '🔜', text: 'Coming soon!', highlight: false }
        ]
      };
    } else if (selectedTier === 'scale') {
      return {
        title: '📈 SCALE Plan Benefits',
        items: [
          { icon: '✅', text: 'Everything in Growth Plan', highlight: false },
          { icon: '✅', text: 'API access for automation', highlight: true },
          { icon: '✅', text: 'White-label PDF reports', highlight: true },
          { icon: '✅', text: 'Team collaboration features', highlight: true },
          { icon: '✅', text: 'Custom reporting', highlight: false },
          { icon: '✅', text: 'Webhook integrations', highlight: false },
          { icon: '✅', text: 'Dedicated support', highlight: false },
          { icon: '🔜', text: 'Coming soon!', highlight: false }
        ]
      };
    } else {
      return {
        title: '🆓 FREE Plan Limitations',
        items: [
          { icon: '⚠️', text: 'Only 3 analyses per month', warning: true },
          { icon: '❌', text: 'Basic recommendations only', strike: true },
          { icon: '❌', text: 'Phase A factors only', strike: true },
          { icon: '❌', text: 'Web-only results (no PDF export)', strike: true },
          { icon: '❌', text: 'Community support only', strike: true },
          { icon: '❌', text: 'No advanced AI insights', strike: true }
        ]
      };
    }
  };

  const benefits = getBenefits();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AILogo className="h-16 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="mt-2 text-gray-600">Join early adopters making their businesses AI-discoverable</p>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Column - Form */}
            <div className="lg:w-1/2 p-8 lg:p-12">
              <form onSubmit={handleSignUp} className="space-y-6">
                {/* Tier Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Your Plan
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    {tierOptions.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                  
                  {selectedTier === 'coffee' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-green-600 font-semibold">✓ SMART CHOICE!</span>
                        <span className="ml-2 text-sm text-green-700">
                          Unlimited analyses + 30-day guarantee + cancel instantly
                        </span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        After signup, secure Stripe payment ($4.95/month)
                      </p>
                    </div>
                  )}
                  
                  {(selectedTier === 'growth' || selectedTier === 'scale') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-blue-600 font-semibold">🔜 COMING SOON</span>
                        <span className="ml-2 text-sm text-blue-700">
                          Advanced features in development
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Start with Coffee tier, upgrade when available
                      </p>
                    </div>
                  )}
                  
                  {selectedTier === 'free' && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-orange-600 font-semibold">⚠️ LIMITED ACCESS</span>
                        <span className="ml-2 text-sm text-orange-700">
                          Only 3 analyses per month
                        </span>
                      </div>
                      <p className="text-xs text-orange-600 mt-1">
                        Consider Coffee tier for unlimited analyses
                      </p>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <span className="text-gray-500 text-sm">
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </span>
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              passwordStrength === 0 ? 'w-0' :
                              passwordStrength === 1 ? 'w-1/5 bg-red-500' :
                              passwordStrength === 2 ? 'w-2/5 bg-orange-500' :
                              passwordStrength === 3 ? 'w-3/5 bg-yellow-500' :
                              passwordStrength === 4 ? 'w-4/5 bg-blue-500' :
                              'w-full bg-green-500'
                            }`}
                          />
                        </div>
                        <span className={`text-xs ${
                          passwordStrength < 3 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {passwordStrength === 0 ? '' :
                           passwordStrength < 3 ? 'Weak' :
                           passwordStrength < 5 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <span className="text-gray-500 text-sm">
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 mt-1"
                    disabled={loading}
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    By creating an account, you agree to our{' '}
                    <a href="/terms" className="text-blue-600 hover:text-blue-700">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-700">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Error/Success Message */}
                {message && (
                  <div className={`p-3 rounded-lg text-sm ${
                    messageType === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {message}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !agreeToTerms || passwordStrength < 3 || (selectedTier === 'growth' || selectedTier === 'scale')}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    loading || !agreeToTerms || passwordStrength < 3 || (selectedTier === 'growth' || selectedTier === 'scale')
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Creating Account...' : 
                   (selectedTier === 'growth' || selectedTier === 'scale') ? 'Coming Soon' :
                   selectedTier === 'coffee' ? 'Create Account → ' : 'Create Free Account'}
                </button>

                {/* Sign In Link */}
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate?.('login')}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>

            {/* Right Column - Benefits */}
            <div className="lg:w-1/2 bg-gray-50 p-8 lg:p-12 border-l border-gray-200">
              {/* Benefits Section */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  {benefits.title}
                </h3>
                <div className="space-y-3">
                  {benefits.items.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-start ${
                        item.warning ? 'text-orange-600' :
                        item.strike ? 'text-gray-400' :
                        item.highlight ? 'text-green-600 font-semibold' :
                        'text-gray-700'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className={item.strike ? 'line-through' : ''}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Reversal Section */}
              <div className="border-t border-gray-300 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  🛡️ ZERO RISK - We Remove ALL Your Fears
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      💰 30-Day Money Back Guarantee
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Don't like the results? Get every penny back. No questions asked. No hoops to jump through.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      ⚡ Cancel Instantly Anytime
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      🏆 Results in 24 Hours or Refund
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      See dramatic improvements within 24 hours or get a full refund immediately.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      🚀 Outperform Competitors or Refund
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      We find 3x more pages than competitors or you get your money back. Guaranteed.
                    </p>
                  </div>
                </div>

                {/* Bottom Trust Badge */}
                <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <span className="mr-2">✅</span>
                    <span className="font-semibold">Built by Expert Solopreneur</span>
                    <span className="mx-2">•</span>
                    <span className="mr-2">✅</span>
                    <span className="font-semibold">Not VC-Funded BS</span>
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600 mt-2">
                    <span className="mr-2">✅</span>
                    <span className="font-semibold">Real Results for Real Businesses</span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  🔒 Secure & Private
                </h4>
                <p className="text-sm text-blue-800 mt-1">
                  Your data is encrypted and never shared. We only analyze public content and generate files you control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeTierSignup;