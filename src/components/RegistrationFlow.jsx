// RegistrationFlow.jsx - Differentiated registration flows for paid vs free users
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUpgrade } from './UpgradeHandler';
import AuthWithPassword from './AuthWithPassword';
import TierSelection from './TierSelection';

const RegistrationFlow = ({ onRegistrationComplete }) => {
  const [currentStep, setCurrentStep] = useState('tier-selection'); // 'tier-selection', 'stripe-checkout', 'registration', 'email-verification', 'complete'
  const [selectedTier, setSelectedTier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');
  
  // State for handling interrupted flows
  const [pendingUserData, setPendingUserData] = useState(null);

  // No need for useUpgrade during registration flow - it's only for existing users

  useEffect(() => {
    // Check for pending tier selection from pricing page or teaser
    const pendingTier = sessionStorage.getItem('selectedTier');
    if (pendingTier) {
      setSelectedTier(pendingTier);
      sessionStorage.removeItem('selectedTier'); // Clean up
      
      if (pendingTier !== 'free') {
        // Paid tier selected - start with payment flow
        setCurrentStep('tier-confirmation');
      } else {
        // Free tier selected - go to registration
        setCurrentStep('registration');
      }
    }

    // Check for Stripe success/cancel returns
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      handleStripeReturn(sessionId);
    } else if (paymentStatus === 'cancelled') {
      handleStripeCancellation();
    }

    // Check for pending account creation after payment
    const pendingAccount = sessionStorage.getItem('pendingAccountAfterPayment');
    if (pendingAccount) {
      const accountData = JSON.parse(pendingAccount);
      setPendingUserData(accountData);
      setCustomerEmail(accountData.email || '');
      setCurrentStep('registration');
    }
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    
    // Auto-clear success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  const handleTierSelection = async (tierId) => {
    setSelectedTier(tierId);
    
    if (tierId === 'free') {
      // Free tier - go directly to registration
      setCurrentStep('registration');
      showMessage('Complete registration to start your free trial with 3 analyses per month.', 'info');
    } else {
      // Paid tier - confirm selection first
      setCurrentStep('tier-confirmation');
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedTier || selectedTier === 'free') return;
    
    try {
      setLoading(true);
      
      // Store payment intent for later account linking
      sessionStorage.setItem('pendingPayment', JSON.stringify({
        tier: selectedTier,
        timestamp: Date.now()
      }));
      
      // Redirect to Stripe checkout - payment will happen before account creation
      const checkoutUrl = await createStripeCheckoutSession(selectedTier);
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      showMessage(`Payment setup failed: ${error.message}`, 'error');
      setLoading(false);
    }
  };

  const createStripeCheckoutSession = async (tier) => {
    // Create checkout session with special registration flow URLs
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId: getPriceIdForTier(tier),
        tier: tier,
        mode: 'registration', // Special flag for registration flow
        successUrl: `${window.location.origin}/register?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/register?payment=cancelled&tier=${tier}`,
        allowPromotionCodes: true,
        customerCreation: 'always' // Always create customer record
      }
    });

    if (error) throw error;
    return data.url;
  };

  const getPriceIdForTier = (tier) => {
    const priceIds = {
      coffee: import.meta.env.VITE_STRIPE_COFFEE_PRICE_ID || 'price_coffee_tier_monthly',
      growth: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
      scale: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly',
      // Backward compatibility
      professional: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID || import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || 'price_growth_monthly',
      enterprise: import.meta.env.VITE_STRIPE_SCALE_PRICE_ID || import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_scale_monthly'
    };
    return priceIds[tier];
  };

  const handleStripeReturn = async (sessionId) => {
    try {
      setLoading(true);
      showMessage('Payment successful! Creating your account...', 'success');
      
      // Retrieve session details from Stripe
      const { data, error } = await supabase.functions.invoke('get-checkout-session', {
        body: { sessionId }
      });
      
      if (error) throw error;
      
      // Extract customer information
      const { customer_email, customer_name, tier, customer_id } = data;
      
      // Store payment information for account creation
      sessionStorage.setItem('pendingAccountAfterPayment', JSON.stringify({
        email: customer_email,
        name: customer_name,
        tier: tier,
        stripeCustomerId: customer_id,
        paymentSessionId: sessionId,
        skipEmailVerification: true // Payment validates email
      }));
      
      setPendingUserData({
        email: customer_email,
        name: customer_name,
        tier: tier,
        stripeCustomerId: customer_id,
        paymentSessionId: sessionId,
        skipEmailVerification: true
      });
      
      setCustomerEmail(customer_email);
      setSelectedTier(tier);
      setCurrentStep('registration');
      
    } catch (error) {
      console.error('Stripe return handling error:', error);
      showMessage(`Account setup failed: ${error.message}`, 'error');
      setCurrentStep('tier-selection');
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCancellation = () => {
    showMessage('Payment cancelled. You can try again or choose the free trial option.', 'info');
    setCurrentStep('tier-selection');
    
    // Clean up any pending data
    sessionStorage.removeItem('pendingPayment');
    sessionStorage.removeItem('pendingAccountAfterPayment');
  };

  // Payment success and error handlers are handled by handleStripeReturn

  const handleRegistrationSuccess = async (user) => {
    try {
      setLoading(true);
      
      if (pendingUserData && pendingUserData.stripeCustomerId) {
        // Link Stripe customer to Supabase user
        await linkStripeCustomer(user.id, pendingUserData);
      }
      
      // Clear pending data
      sessionStorage.removeItem('pendingAccountAfterPayment');
      sessionStorage.removeItem('pendingPayment');
      
      if (selectedTier === 'free') {
        showMessage('Registration successful! Welcome to AImpactScanner. You have 3 free analyses to get started.', 'success');
      } else {
        showMessage(`Registration successful! Welcome to AImpactScanner ${selectedTier} tier. Your subscription is active.`, 'success');
      }
      
      setCurrentStep('complete');
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        onRegistrationComplete?.(user, selectedTier);
      }, 2000);
      
    } catch (error) {
      console.error('Post-registration setup error:', error);
      showMessage(`Registration completed, but account setup had issues: ${error.message}`, 'error');
      // Still proceed to complete - user can fix account issues in dashboard
      setCurrentStep('complete');
      setTimeout(() => {
        onRegistrationComplete?.(user, selectedTier);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const linkStripeCustomer = async (userId, paymentData) => {
    // Update user record with Stripe customer information
    const { error } = await supabase
      .from('users')
      .update({
        stripe_customer_id: paymentData.stripeCustomerId,
        tier: paymentData.tier,
        analyses_limit: getTierAnalysesLimit(paymentData.tier),
        subscription_status: 'active'
      })
      .eq('id', userId);
      
    if (error) throw error;
  };

  const getTierAnalysesLimit = (tier) => {
    const limits = {
      free: 3,
      coffee: 999999, // Unlimited represented as large number
      professional: 999999,
      enterprise: 999999
    };
    return limits[tier] || 3;
  };

  const handleBackToTierSelection = () => {
    setCurrentStep('tier-selection');
    setSelectedTier(null);
    setMessage('');
    setMessageType('');
  };

  // Custom AuthWithPassword wrapper that handles the registration completion
  const RegistrationAuth = () => {
    const [authCompleted, setAuthCompleted] = useState(false);
    
    useEffect(() => {
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'SIGNED_UP') {
            if (session?.user && !authCompleted) {
              setAuthCompleted(true);
              await handleRegistrationSuccess(session.user);
            }
          }
        }
      );

      return () => subscription.unsubscribe();
    }, [authCompleted]);

    return (
      <div className="space-y-6">
        {/* Pre-fill email if available */}
        <AuthWithPassword 
          initialEmail={customerEmail}
          showTierInfo={true}
          selectedTier={selectedTier}
          skipEmailVerification={pendingUserData?.skipEmailVerification}
          defaultMode={selectedTier === 'free' ? 'register' : 'register'}
        />
        
        {selectedTier !== 'free' && (
          <div className="text-center">
            <button
              onClick={handleBackToTierSelection}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
              disabled={loading}
            >
              ← Change tier selection
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      {message && (
        <div className={`max-w-md w-full mb-6 p-4 rounded-lg text-white text-center`}
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

      {currentStep === 'tier-selection' && (
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your AImpactScanner Plan
            </h1>
            <p className="text-lg text-gray-600">
              Start your AI optimization journey. Upgrade anytime, cancel anytime.
            </p>
          </div>
          
          <TierSelection 
            currentTier="none"
            onUpgrade={handleTierSelection}
            showRegistrationFlow={true}
          />
        </div>
      )}

      {currentStep === 'tier-confirmation' && selectedTier && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Confirm Your Selection
          </h2>
          
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">
              {selectedTier === 'coffee' ? '☕' : selectedTier === 'professional' ? '💼' : '🏢'}
            </div>
            <h3 className="text-xl font-semibold capitalize text-gray-900">
              {selectedTier} Plan
            </h3>
            <p className="text-gray-600 mt-2">
              {selectedTier === 'coffee' && 'Perfect for individuals and small businesses'}
              {selectedTier === 'professional' && 'Complete analysis for growing businesses'}
              {selectedTier === 'enterprise' && 'Full-featured solution for teams'}
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleProceedToPayment}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Setting up payment...' : `Continue to Payment`}
            </button>
            
            <button
              onClick={handleBackToTierSelection}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              ← Change Plan
            </button>
            
            <div className="text-center">
              <button
                onClick={() => handleTierSelection('free')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={loading}
              >
                Or start with free trial (3 analyses/month)
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'registration' && (
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedTier === 'free' ? 'Start Your Free Trial' : 'Complete Your Registration'}
            </h2>
            <p className="text-gray-600">
              {selectedTier === 'free' 
                ? 'Get 3 free analyses to experience AImpactScanner'
                : `Your ${selectedTier} subscription is ready. Create your account to get started.`
              }
            </p>
          </div>
          
          <RegistrationAuth />
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8 border border-ai-silver text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to AImpactScanner!
          </h2>
          <p className="text-gray-600 mb-6">
            {selectedTier === 'free' 
              ? 'Your free trial is active. Start analyzing your content for AI optimization.'
              : `Your ${selectedTier} subscription is active. Enjoy unlimited analyses and advanced features.`
            }
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationFlow;