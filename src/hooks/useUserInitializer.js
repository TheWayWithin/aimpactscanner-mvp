import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserFallbackData, initializeFallbackData } from '../utils/userFallback';

export const useUserInitializer = (session) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Performance optimization: Prevent duplicate initialization
  const initializationAttempted = useRef(false);
  const currentUserId = useRef(null);
  const lastInitTime = useRef(0);

  useEffect(() => {
    if (session?.user?.id) {
      // Initialize fallback data for known users
      initializeFallbackData();
      
      // Skip if tab was recently switched (within 1 second)
      const timeSinceLastInit = Date.now() - lastInitTime.current;
      if (timeSinceLastInit < 1000) {
        console.log('🔄 useUserInitializer: Skipping - too soon after last init:', timeSinceLastInit + 'ms');
        return;
      }
      
      // Performance optimization: Prevent duplicate initialization for same user
      if (currentUserId.current === session.user.id && initializationAttempted.current) {
        console.log('🔄 useUserInitializer: Skipping duplicate initialization for user:', session.user.id);
        return;
      }
      
      currentUserId.current = session.user.id;
      initializationAttempted.current = true;
      lastInitTime.current = Date.now();
      initializeUser();
    }
  }, [session]);

  const initializeUser = async (retryCount = 0) => {
    try {
      setStatus('checking');
      setError(null);
      
      const userId = session.user.id;
      const userEmail = session.user.email;

      console.log('🔧 useUserInitializer: Starting initialization for user:', userId, userEmail, retryCount ? `(retry ${retryCount})` : '');

      // Quick fallback for known users if we have cached data
      const cachedTier = localStorage.getItem(`user_tier_${userId}`);
      if (cachedTier && retryCount === 0) {
        console.log('📱 Using cached tier data for quick initialization:', cachedTier);
        const cachedData = getUserFallbackData(userId, userEmail);
        setStatus('ready');
        setUserData(cachedData);
        return cachedData;
      }

      // Create a more robust timeout with proper cleanup
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 10000); // 10 second timeout

      try {
        // First check if user exists with proper error handling
        console.log('🔍 useUserInitializer: Checking if user exists in database...');
        
        // Create a Promise.race to ensure timeout works
        const queryPromise = supabase
          .from('users')
          .select('id, email, tier, monthly_analyses_used, subscription_status')
          .eq('id', userId)
          .abortSignal(controller.signal)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 5000);
        });
        
        const { data: existingUser, error: checkError } = await Promise.race([
          queryPromise,
          timeoutPromise.then(() => ({ data: null, error: new Error('Database query timeout') }))
        ]).catch(err => ({ data: null, error: err }));

        clearTimeout(timeoutId);

        console.log('📊 useUserInitializer: Database check result:', { existingUser, checkError });

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is expected for new users
          console.log('Database check error:', checkError);
          
          // Handle timeout specifically
          if (checkError.message && checkError.message.includes('timeout')) {
            console.log('⏱️ Database query timed out - using fallback');
            const fallbackData = getUserFallbackData(userId, userEmail);
            setStatus('ready');
            setUserData(fallbackData);
            return fallbackData;
          }
          
          // Handle specific error cases
          if (checkError.message && checkError.message.includes('406')) {
            throw new Error('Database connection issue (406). Please try again.');
          }
          
          throw checkError;
        }

        if (existingUser) {
          console.log('✅ useUserInitializer: User exists:', existingUser);
          
          // Store tier in localStorage for future fallback
          localStorage.setItem(`user_tier_${userId}`, existingUser.tier || 'free');
          localStorage.setItem(`user_email_${userId}`, existingUser.email || userEmail);
          
          setStatus('ready');
          setUserData(existingUser);
          return existingUser;
        } else {
          console.log('🔧 useUserInitializer: User does not exist in database');
          
          // Check user metadata for tier selection
          const userMetadata = session?.user?.user_metadata;
          const selectedTier = userMetadata?.selected_tier || userMetadata?.tier;
          
          console.log('🔍 useUserInitializer: Checking user tier selection:', {
            selectedTier,
            userMetadata,
            createdAt: session?.user?.created_at
          });
          
          if (selectedTier === 'coffee' || selectedTier === 'growth' || selectedTier === 'scale') {
            console.log(`💎 useUserInitializer: User selected ${selectedTier} tier - waiting for payment`);
            // Don't create database record - wait for Stripe webhook
            const pendingData = { tier: 'pending_payment', monthly_analyses_used: 0 };
            setStatus('ready');
            setUserData(pendingData);
            return pendingData;
          } else if (selectedTier === 'free') {
            console.log('🆓 useUserInitializer: User selected Free tier - creating account');
            setStatus('creating');
            
            // Create user in database
            const { data: newUser, error: createError } = await supabase
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

            if (createError) {
              console.log('User creation error:', createError);
              // If user already exists (409 conflict), that's actually fine
              if (createError.message && (createError.message.includes('409') || createError.message.includes('duplicate'))) {
                console.log('User already exists, proceeding with default data');
                const defaultData = { tier: 'free', monthly_analyses_used: 0 };
                setStatus('ready');
                setUserData(defaultData);
                return defaultData;
              }
              throw createError;
            }

            console.log('✅ useUserInitializer: User created:', newUser);
            setStatus('ready');
            setUserData(newUser);
            return newUser;
          } else {
            // No tier selected - don't create user, needs tier selection
            console.log('⚠️ useUserInitializer: No tier selected - user needs to complete registration');
            const registrationData = { tier: 'pending_registration', monthly_analyses_used: 0 };
            setStatus('ready');
            setUserData(registrationData);
            return registrationData;
          }
        }
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          throw new Error('User initialization timeout - proceeding with defaults');
        }
        throw timeoutError;
      }

    } catch (err) {
      console.error('❌ useUserInitializer: User initialization error:', err);
      
      // Retry logic for network/timeout issues (max 2 retries)
      if ((err.message.includes('timeout') || err.message.includes('network') || err.message.includes('fetch') || err.name === 'AbortError') && retryCount < 2) {
        console.log(`🔄 useUserInitializer: Retrying initialization (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => initializeUser(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      // Auto-fallback on timeout or database issues after retries
      if (err.message.includes('timeout') || err.message.includes('406') || err.message.includes('PGRST') || err.message.includes('network') || err.name === 'AbortError') {
        console.log('⚠️ useUserInitializer: Auto-fallback - proceeding with fallback data due to database issues');
        
        // Use smart fallback that knows about user tiers
        const fallbackData = getUserFallbackData(session.user.id, session.user.email);
        console.log('📱 Using smart fallback data:', fallbackData);
        
        setStatus('ready');
        setUserData(fallbackData);
        return fallbackData;
      } else {
        setError(err.message);
        setStatus('error');
        throw err;
      }
    }
  };

  const retry = () => {
    setError(null);
    initializeUser();
  };

  const skipWithFallback = () => {
    console.log('⏭️ useUserInitializer: Bypassing initialization - proceeding with fallback data');
    
    // Use smart fallback that knows about user tiers
    const fallbackData = getUserFallbackData(session.user.id, session.user.email);
    console.log('📱 Using smart fallback data:', fallbackData);
    
    setStatus('ready');
    setUserData(fallbackData);
    return fallbackData;
  };

  return {
    status,
    error,
    userData,
    retry,
    skipWithFallback,
    isReady: status === 'ready',
    isLoading: status === 'checking' || status === 'creating',
    hasError: status === 'error'
  };
};