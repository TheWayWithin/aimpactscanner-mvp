// WaitlistCTA.jsx - Waitlist signup form component with database integration
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../lib/supabaseClient';

const WaitlistCTA = ({ tier, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoinWaitlist = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be signed in to join the waitlist');
      }

      console.log('📝 Joining waitlist for tier:', tier);

      // Call join_waitlist database function
      const { data, error } = await supabase.rpc('join_waitlist', {
        p_interested_tier: tier
      });

      if (error) throw error;

      console.log('✅ Waitlist join result:', data);

      setJoined(true);
      onSuccess?.(`You're on the ${tier.toUpperCase()} waitlist! We'll notify you when it launches.`);

    } catch (error) {
      console.error('❌ Waitlist join error:', error);
      onError?.(error.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tierInfo = {
    growth: {
      icon: '',
      name: 'Growth',
      color: 'green'
    },
    scale: {
      icon: '',
      name: 'Scale',
      color: 'purple'
    }
  };

  const info = tierInfo[tier] || tierInfo.growth;

  // Success state
  if (joined) {
    return (
      <section className="waitlist-cta-section py-12 px-5 md:py-20 md:px-10 bg-white text-center">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
            <div className="text-6xl mb-4">
              {info.icon}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-green-800 mb-4">
              You're on the {info.name} Waitlist!
            </h2>
            <p className="text-lg text-green-700 mb-6">
              We'll send you an email the moment {info.name} tier launches.
              You'll get early access and special early-bird pricing.
            </p>
            <button
              onClick={() => window.location.hash = 'dashboard'}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Join waitlist state
  return (
    <section className="waitlist-cta-section py-12 px-5 md:py-20 md:px-10 bg-white text-center">
      <div className="container max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
          Be First to Access {info.name} Features
        </h2>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Join our exclusive {info.name} tier waitlist. We'll notify you the moment
          advanced features launch - and you'll get first access with special
          early-bird pricing.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-6 bg-blue-50 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl"></span>
            <span className="text-sm md:text-base font-medium text-gray-800">
              First access when we launch
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl"></span>
            <span className="text-sm md:text-base font-medium text-gray-800">
              Lock in early-bird pricing
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl"></span>
            <span className="text-sm md:text-base font-medium text-gray-800">
              Help shape {info.name} tier features
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleJoinWaitlist}
          disabled={loading}
          className={`
            w-full md:w-auto px-8 py-4 text-lg font-semibold rounded-lg
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
            ${info.color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-signal hover:bg-signal'}
            text-white
          `}
          aria-label={`Join ${info.name} waitlist`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Joining waitlist...
            </span>
          ) : (
            `Join ${info.name} Waitlist (Free)`
          )}
        </button>

        <p className="mt-4 text-sm text-green-600 font-medium">
          No payment required. Stay on your current tier until {info.name} launches.
        </p>
      </div>
    </section>
  );
};

WaitlistCTA.propTypes = {
  tier: PropTypes.oneOf(['growth', 'scale']).isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func
};

export default WaitlistCTA;
