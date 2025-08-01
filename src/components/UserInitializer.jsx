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

      // Add timeout promise with automatic fallback
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User initialization timeout - proceeding with defaults')), 5000)
      );

      // First check if user exists with timeout
      console.log('Checking if user exists in database...');
      const checkPromise = supabase
        .from('users')
        .select('id, email, tier, monthly_analyses_used')
        .eq('id', userId)
        .single();

      const { data: existingUser, error: checkError } = await Promise.race([checkPromise, timeoutPromise]);

      console.log('Database check result:', { existingUser, checkError });

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new users
        console.log('Database check error:', checkError);
        // If we can't check user existence due to 406 errors, just proceed with defaults
        if (checkError.message && checkError.message.includes('406')) {
          console.log('Database access issues (406), proceeding with default user data');
          setStatus('ready');
          onUserReady?.({ tier: 'free', monthly_analyses_used: 0 });
          return;
        }
        throw checkError;
      }

      if (existingUser) {
        console.log('User exists:', existingUser);
        setStatus('ready');
        onUserReady?.(existingUser);
      } else {
        console.log('User does not exist, creating...');
        setStatus('creating');

        // Create user in database with timeout
        const createPromise = supabase
          .from('users')
          .upsert({
            id: userId,
            email: userEmail,
            tier: 'free',
            monthly_analyses_used: 0,
            subscription_status: 'active'
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        const { data: newUser, error: createError } = await Promise.race([createPromise, timeoutPromise]);

        if (createError) {
          console.log('User creation error:', createError);
          // If user already exists (409 conflict), that's actually fine
          if (createError.message && (createError.message.includes('409') || createError.message.includes('duplicate'))) {
            console.log('User already exists, proceeding with default data');
            setStatus('ready');
            onUserReady?.({ tier: 'free', monthly_analyses_used: 0 });
            return;
          }
          throw createError;
        }

        console.log('User created:', newUser);
        setStatus('ready');
        onUserReady?.(newUser);
      }

    } catch (err) {
      console.error('User initialization error:', err);
      // Auto-fallback on timeout or database issues
      if (err.message.includes('timeout') || err.message.includes('406') || err.message.includes('PGRST')) {
        console.log('Auto-fallback: Proceeding with default user data due to database issues');
        setStatus('ready');
        onUserReady?.({ tier: 'free', monthly_analyses_used: 0 });
      } else {
        setError(err.message);
        setStatus('error');
      }
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
          <div className="mt-2 space-x-2">
            <button 
              onClick={initializeUser}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Try Again
            </button>
            <button 
              onClick={() => {
                console.log('Bypassing user initialization - proceeding with default data');
                setStatus('ready');
                onUserReady?.({ tier: 'free', monthly_analyses_used: 0 });
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              Skip & Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null; // User is ready, don't show anything
}

export default UserInitializer;