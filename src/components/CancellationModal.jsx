// CancellationModal.jsx - Cancellation confirmation with feedback collection
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const CancellationModal = ({ isOpen, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showRefundInfo, setShowRefundInfo] = useState(false);

  const cancellationReasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using it enough' },
    { value: 'missing_features', label: 'Missing features I need' },
    { value: 'technical_issues', label: 'Technical issues' },
    { value: 'found_alternative', label: 'Found a better alternative' },
    { value: 'temporary', label: 'Just need to pause temporarily' },
    { value: 'other', label: 'Other' }
  ];

  const handleCancel = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const { data, error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          reason,
          feedback,
          immediately: true
        }
      });

      if (cancelError) throw cancelError;

      if (data?.success) {
        // Show success message with refund info if applicable
        if (data.refund) {
          alert(`Subscription canceled successfully!\n\nRefund processed: $${data.refund.amount} ${data.refund.currency.toUpperCase()}\n\nThank you for trying AImpactScanner. We hope to see you again!`);
        } else if (data.eligibleForRefund) {
          alert(`Subscription canceled successfully!\n\nYou're eligible for our 30-day money-back guarantee. A refund will be processed shortly.\n\nThank you for trying AImpactScanner!`);
        } else {
          alert(`Subscription canceled successfully!\n\nYour access will continue until ${new Date(data.endsAt).toLocaleDateString()}.\n\nThank you for being a valued customer!`);
        }
        
        onSuccess?.();
        onClose();
        
        // Refresh the page to update UI
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error(data?.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Cancellation error:', err);
      setError(err.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cancel Your Subscription
          </h2>
          
          {/* 30-Day Guarantee Badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-green-900">30-Day Money Back Guarantee</p>
                <p className="text-sm text-green-700 mt-1">
                  If you're within 30 days of subscribing, you'll receive a full refund - no questions asked!
                </p>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            We're sorry to see you go! Your feedback helps us improve.
          </p>

          {/* Cancellation Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you canceling? (optional)
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            >
              <option value="">Select a reason...</option>
              {cancellationReasons.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Additional Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any additional feedback? (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="We'd love to hear how we can improve..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
          </div>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What happens when you cancel:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Immediate cancellation of your Coffee tier subscription</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>You'll be switched to the Free tier (3 analyses/month)</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>If within 30 days, you'll receive a full refund</span>
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>You can resubscribe anytime</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Cancel Subscription'}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Keep Subscription
            </button>
          </div>

          {/* Alternative Options */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-2">Need help instead?</p>
            <a 
              href="mailto:support@aimpactscanner.com"
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationModal;