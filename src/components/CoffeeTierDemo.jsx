// CoffeeTierDemo.jsx - Demo component showing Coffee tier integration
// Demonstrates tier selection, usage dashboard, and upgrade flow

import React, { useState, useEffect } from 'react';
import TierSelection from './TierSelection';
import UsageDashboard from './UsageDashboard';
import { useUpgrade } from './UpgradeHandler';
import { supabase } from '../lib/supabaseClient';

const CoffeeTierDemo = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showPricing, setShowPricing] = useState(false);

  // Initialize upgrade handler
  const { handleUpgrade, loading } = useUpgrade(
    user,
    (successMessage) => {
      setMessage(successMessage);
      setMessageType('success');
      setShowPricing(false);
      // Refresh user data
      fetchUser();
    },
    (errorMessage) => {
      setMessage(errorMessage);
      setMessageType('error');
    }
  );

  useEffect(() => {
    // Get current user
    fetchUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Get user tier information
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
        } else {
          setUser({ ...authUser, ...userData });
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleAuth = async (type) => {
    try {
      if (type === 'login') {
        // Demo login
        const { error } = await supabase.auth.signInWithPassword({
          email: 'demo@aimpactscanner.com',
          password: 'demo123456'
        });
        if (error) throw error;
      } else {
        // Demo signup
        const { error } = await supabase.auth.signUp({
          email: 'demo@aimpactscanner.com',
          password: 'demo123456'
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
      setMessageType('error');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Coffee Tier Demo</h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              messageType === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>
              {message}
            </div>
          )}
          
          <div className="space-y-4">
            <button
              onClick={() => handleAuth('login')}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Demo Login
            </button>
            <button
              onClick={() => handleAuth('signup')}
              className="w-full py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Demo Signup
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Demo credentials: demo@aimpactscanner.com / demo123456
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-bold text-gray-900">
              AImpactScanner - Coffee Tier Demo
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : messageType === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {messageType === 'success' && (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setMessage('')}
                  className="text-sm underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Usage Dashboard */}
          <div className="lg:col-span-1">
            <UsageDashboard 
              user={user} 
              onUpgrade={(tier) => {
                if (tier === 'coffee') {
                  handleUpgrade(tier);
                } else {
                  setShowPricing(true);
                }
              }}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Coffee Tier Features
              </h2>
              
              <div className="space-y-4 text-sm text-gray-600">
                <p>
                  <strong>Current Implementation Status:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>✅ Database schema with tier management</li>
                  <li>✅ TierManager class for access control</li>
                  <li>✅ Edge Function tier validation</li>
                  <li>✅ Usage tracking and analytics</li>
                  <li>✅ React UI components (TierSelection, UsageDashboard)</li>
                  <li>✅ Stripe checkout session creation</li>
                  <li>✅ Webhook handler for payment processing</li>
                  <li>🔄 Mock upgrade flow (development mode)</li>
                </ul>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-md">
                  <h3 className="font-medium text-blue-900 mb-2">Next Steps for Production:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>1. Configure Stripe products and pricing</li>
                    <li>2. Deploy Edge Functions to Supabase</li>
                    <li>3. Set up Stripe webhook endpoints</li>
                    <li>4. Add environment variables for Stripe keys</li>
                    <li>5. Test end-to-end payment flow</li>
                  </ul>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowPricing(!showPricing)}
                    className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {showPricing ? 'Hide' : 'Show'} Pricing
                  </button>
                  
                  {user.tier === 'free' && (
                    <button
                      onClick={() => handleUpgrade('coffee')}
                      disabled={loading}
                      className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : '☕ Try Coffee Tier (Mock)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier Selection */}
        {showPricing && (
          <div className="mt-8">
            <TierSelection
              currentTier={user.tier}
              onUpgrade={handleUpgrade}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoffeeTierDemo;