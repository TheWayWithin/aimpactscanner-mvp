// User Fallback Utilities - Handle cases where database is unavailable
// This provides immediate fixes for production issues

// Set correct tier data in localStorage for known users
export const setKnownUserFallbackData = () => {
  // Known coffee tier user - Jamie
  const jamieUserId = 'e8fda207-946e-48dc-87c4-909cfde3f543';
  const jamieEmail = 'jamie.watters.mail@icloud.com';
  
  localStorage.setItem(`user_tier_${jamieUserId}`, 'coffee');
  localStorage.setItem(`user_email_${jamieUserId}`, jamieEmail);
  
  console.log('🔧 Set fallback data for known users');
};

// Get fallback data for a specific user
export const getUserFallbackData = (userId, email) => {
  // Known coffee tier users
  const knownCoffeeUsers = [
    'e8fda207-946e-48dc-87c4-909cfde3f543' // Jamie
  ];
  
  if (knownCoffeeUsers.includes(userId)) {
    return {
      tier: 'coffee',
      email: email,
      monthly_analyses_used: 0,
      subscription_status: 'active'
    };
  }
  
  // Check localStorage
  const localTier = localStorage.getItem(`user_tier_${userId}`);
  const localEmail = localStorage.getItem(`user_email_${userId}`);
  
  if (localTier) {
    return {
      tier: localTier,
      email: localEmail || email,
      monthly_analyses_used: 0,
      subscription_status: 'active'
    };
  }
  
  // Default fallback
  return {
    tier: 'free',
    email: email,
    monthly_analyses_used: 0,
    subscription_status: 'active'
  };
};

// Initialize fallback data on app start
export const initializeFallbackData = () => {
  setKnownUserFallbackData();
};