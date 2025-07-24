// AccountDashboard.jsx - Account and billing management component
// Shows subscription details, usage, and billing management

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AccountDashboard = ({ user, className = '' }) => {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAccountData();
    }
  }, [user]);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user account information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          tier,
          tier_expires_at,
          monthly_analyses_used,
          monthly_reset_date,
          subscription_status,
          stripe_customer_id,
          created_at
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Fetch recent analyses for usage stats
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('id, created_at, url, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (analysesError) {
        console.warn('Error fetching analyses:', analysesError);
      }

      setAccountData({
        user: userData,
        analyses: analysesData || []
      });
    } catch (error) {
      console.error('Error fetching account data:', error);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const getTierDisplayName = (tier) => {
    const tierNames = {
      'free': '🆓 Free',
      'coffee': '☕ Coffee',
      'professional': '💼 Professional',
      'enterprise': '🏢 Enterprise'
    };
    return tierNames[tier] || tier;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRemainingAnalyses = () => {
    if (!accountData?.user) return 0;
    
    if (accountData.user.tier === 'free') {
      return Math.max(0, 3 - (accountData.user.monthly_analyses_used || 0));
    }
    return 'Unlimited';
  };

  const isSubscriptionExpired = () => {
    if (!accountData?.user?.tier_expires_at) return false;
    return new Date(accountData.user.tier_expires_at) < new Date();
  };

  const getSubscriptionStatus = () => {
    if (!accountData?.user) return 'Unknown';
    
    const tier = accountData.user.tier;
    const status = accountData.user.subscription_status;
    
    if (tier === 'free') return 'Free Plan';
    if (isSubscriptionExpired()) return 'Expired';
    if (status === 'active') return 'Active';
    if (status === 'canceled') return 'Canceled';
    return status || 'Unknown';
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-red-600 text-sm">{error}</div>
          <button
            onClick={fetchAccountData}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!accountData) return null;

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Account Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium">
                    {formatDate(accountData.user.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer ID</span>
                  <span className="text-sm font-mono text-gray-500">
                    {accountData.user.stripe_customer_id 
                      ? `${accountData.user.stripe_customer_id.slice(0, 8)}...`
                      : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Subscription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Plan</span>
                  <span className="text-sm font-medium">
                    {getTierDisplayName(accountData.user.tier)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-medium ${
                    getSubscriptionStatus() === 'Active' ? 'text-green-600' :
                    getSubscriptionStatus() === 'Expired' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {getSubscriptionStatus()}
                  </span>
                </div>
                {accountData.user.tier_expires_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      {isSubscriptionExpired() ? 'Expired' : 'Expires'}
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(accountData.user.tier_expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Usage Statistics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {getRemainingAnalyses()}
              </div>
              <div className="text-sm text-gray-600">
                {accountData.user.tier === 'free' ? 'Remaining This Month' : 'Analyses Available'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {accountData.user.monthly_analyses_used || 0}
              </div>
              <div className="text-sm text-gray-600">Used This Month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {accountData.analyses.length}
              </div>
              <div className="text-sm text-gray-600">Total Analyses</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {accountData.analyses.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {accountData.analyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {analysis.url}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(analysis.created_at)}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      analysis.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : analysis.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Billing Actions */}
      {accountData.user.tier !== 'free' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Billing Management</h2>
          </div>
          <div className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Manage your subscription, update payment methods, and view billing history through Stripe.
              </p>
              <div className="space-x-4">
                <button
                  onClick={() => alert('Billing portal integration coming soon!')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Manage Billing
                </button>
                <button
                  onClick={() => alert('Download invoices feature coming soon!')}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Download Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDashboard;