// User Initializer Component - Ensures user exists in database
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function UserInitializer({ session, onUserReady }) {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      initializeUser();
    }
  }, [session]);

  const initializeUser = async () => {
    try {
      setStatus('checking');
      const userId = session.user.id;
      const userEmail = session.user.email;

      console.log('Initializing user:', userId, userEmail);

      // First check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email, tier, monthly_analyses_used')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new users
        throw checkError;
      }

      if (existingUser) {
        console.log('User exists:', existingUser);
        setStatus('ready');
        onUserReady?.(existingUser);
      } else {
        console.log('User does not exist, creating...');
        setStatus('creating');

        // Create user in database
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: userEmail,
            tier: 'free',
            monthly_analyses_used: 0,
            subscription_status: 'active'
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        console.log('User created:', newUser);
        setStatus('ready');
        onUserReady?.(newUser);
      }

    } catch (err) {
      console.error('User initialization error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Initializing your account...</span>
        </div>
      </div>
    );
  }

  if (status === 'creating') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-3"></div>
          <span className="text-green-800">Setting up your free account...</span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="text-red-800">
          <div className="font-semibold">Account Setup Error</div>
          <div className="text-sm mt-1">{error}</div>
          <button 
            onClick={initializeUser}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null; // User is ready, don't show anything
}

export default UserInitializer;