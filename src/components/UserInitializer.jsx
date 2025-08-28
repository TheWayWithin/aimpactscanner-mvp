// User Initializer Component - Ensures user exists in database
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

function UserInitializer({ session, onUserReady }) {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  
  // Performance optimization: Prevent duplicate initialization
  const initializationAttempted = useRef(false);
  const currentUserId = useRef(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Performance optimization: Prevent duplicate initialization for same user
      if (currentUserId.current === session.user.id && initializationAttempted.current) {
        console.log('🔄 UserInitializer: Skipping duplicate initialization for user:', session.user.id);
        return;
      }
      
      currentUserId.current = session.user.id;
      initializationAttempted.current = true;
      initializeUser();
    }
  }, [session]);

  const initializeUser = async () => {
    try {
      setStatus('checking');
      const userId = session.user.id;
      const userEmail = session.user.email;

      console.log('🔧 UserInitializer: Starting initialization for user:', userId, userEmail);

      // Add timeout promise with automatic fallback - 3 seconds to handle 406 errors
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User initialization timeout - proceeding with defaults')), 3000)
      );

      // First check if user exists with timeout
      console.log('🔍 UserInitializer: Checking if user exists in database...');
      const checkPromise = supabase
        .from('users')
        .select('id, email, tier, monthly_analyses_used')
        .eq('id', userId)
        .single();

      const { data: existingUser, error: checkError } = await Promise.race([checkPromise, timeoutPromise]);

      console.log('📊 UserInitializer: Database check result:', { existingUser, checkError });

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new users
        console.log('Database check error:', checkError);
        // If we can't check user existence due to 406 errors, show error with skip option
        if (checkError.message && checkError.message.includes('406')) {
          console.log('Database access issues (406), showing skip option');
          setError('Database connection issue. You can still use the app.');
          setStatus('error');
          // Don't auto-proceed, let user click Skip & Continue
          return;
        }
        throw checkError;
      }

      if (existingUser) {
        console.log('✅ UserInitializer: User exists:', existingUser);
        
        // Store tier in localStorage for future fallback
        localStorage.setItem(`user_tier_${userId}`, existingUser.tier || 'free');
        localStorage.setItem(`user_email_${userId}`, existingUser.email || userEmail);
        
        setStatus('ready');
        onUserReady?.(existingUser);
      } else {
        console.log('🔧 UserInitializer: User does not exist in database');
        
        // Check user metadata for tier selection
        const userMetadata = session?.user?.user_metadata;
        const selectedTier = userMetadata?.selected_tier || userMetadata?.tier;
        
        console.log('🔍 UserInitializer: Checking user tier selection:', {
          selectedTier,
          userMetadata,
          createdAt: session?.user?.created_at
        });
        
        if (selectedTier === 'coffee' || selectedTier === 'growth' || selectedTier === 'scale') {
          console.log(`💎 UserInitializer: User selected ${selectedTier} tier - waiting for payment`);
          // Don't create database record - wait for Stripe webhook
          setStatus('ready');
          onUserReady?.({ tier: 'pending_payment', monthly_analyses_used: 0 });
          return;
        } else if (selectedTier === 'free') {
          console.log('🆓 UserInitializer: User selected Free tier - creating account');
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

          console.log('✅ UserInitializer: User created:', newUser);
          setStatus('ready');
          onUserReady?.(newUser);
        } else {
          // No tier selected - don't create user, needs tier selection
          console.log('⚠️ UserInitializer: No tier selected - user needs to complete registration');
          setStatus('ready');
          onUserReady?.({ tier: 'pending_registration', monthly_analyses_used: 0 });
        }
      }

    } catch (err) {
      console.error('❌ UserInitializer: User initialization error:', err);
      // Auto-fallback on timeout or database issues
      if (err.message.includes('timeout') || err.message.includes('406') || err.message.includes('PGRST')) {
        console.log('⚠️ UserInitializer: Auto-fallback - proceeding with fallback data due to database issues');
        
        // Check localStorage for tier data before defaulting to free
        const localTier = localStorage.getItem(`user_tier_${session.user.id}`) || 'free';
        const localEmail = localStorage.getItem(`user_email_${session.user.id}`) || session.user.email;
        console.log('📱 Using localStorage tier:', localTier, 'for', localEmail);
        
        setStatus('ready');
        onUserReady?.({ 
          tier: localTier, 
          email: localEmail,
          monthly_analyses_used: localTier === 'coffee' ? 0 : 0 
        });
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
          <span className="text-green-800">Welcome! You have 3 free analyses per month</span>
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
                console.log('⏭️ UserInitializer: Bypassing initialization - proceeding with fallback data');
                
                // Check localStorage for tier data
                const localTier = localStorage.getItem(`user_tier_${session.user.id}`) || 'free';
                const localEmail = localStorage.getItem(`user_email_${session.user.id}`) || session.user.email;
                console.log('📱 Using localStorage tier:', localTier, 'for', localEmail);
                
                setStatus('ready');
                onUserReady?.({ 
                  tier: localTier, 
                  email: localEmail,
                  monthly_analyses_used: localTier === 'coffee' ? 0 : 0 
                });
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