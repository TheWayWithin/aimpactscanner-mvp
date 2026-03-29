// ImagePlaceholders.jsx - Temporary placeholder components for images
// Replace these with actual images once received from designer

import React from 'react';

// Logo Component
export const Logo = ({ variant = 'primary', className = '' }) => {
  // TODO: Replace with actual logo
  return (
    <div className={`inline-flex items-center ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg mr-2"></div>
      <span className="text-xl font-bold text-gray-900">AImpactScanner</span>
    </div>
  );
};

// Hero Illustration
export const HeroIllustration = ({ className = '' }) => {
  // TODO: Replace with actual hero illustration
  return (
    <div className={`${className} bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl flex items-center justify-center`}>
      <div className="text-center p-8">
        <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full opacity-20"></div>
        <p className="text-gray-500 text-sm">Hero Illustration Placeholder</p>
      </div>
    </div>
  );
};

// Feature Icon Component
export const FeatureIcon = ({ type, className = '' }) => {
  const icons = {
    'ai-analysis': '',
    'competitive': '',
    'traffic': '',
    'monitoring': '⏰',
    'framework': '',
    'export': '📥',
    'education': '',
    'support': '🎧'
  };

  // TODO: Replace with actual SVG icons
  return (
    <div className={`w-16 h-16 bg-teal-50 rounded-lg flex items-center justify-center text-2xl ${className}`}>
      {icons[type] || '📌'}
    </div>
  );
};

// Tier Illustration Component
export const TierIllustration = ({ tier, className = '' }) => {
  const illustrations = {
    'free': '',
    'coffee': '',
    'professional': ''
  };

  // TODO: Replace with actual tier illustrations
  return (
    <div className={`w-32 h-32 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl flex items-center justify-center ${className}`}>
      <span className="text-4xl">{illustrations[tier] || '📦'}</span>
    </div>
  );
};

// Loading Animation Component
export const LoadingAnimation = ({ className = '' }) => {
  // TODO: Replace with Lottie animation or SVG animation
  return (
    <div className={`${className}`}>
      <div className="w-24 h-24 mx-auto">
        <div className="w-full h-full border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
};

// Trust Badge Component
export const TrustBadge = ({ type, className = '' }) => {
  const badges = {
    'ssl': 'SSL Secured',
    'privacy': 'Data Privacy',
    'guarantee': '✓ 30-Day Guarantee',
    'certified': 'MASTERY-AI'
  };

  // TODO: Replace with actual badge images
  return (
    <div className={`inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 ${className}`}>
      {badges[type] || '✓ Trusted'}
    </div>
  );
};

// Empty State Illustration
export const EmptyState = ({ type, className = '' }) => {
  const states = {
    'no-analysis': {
      emoji: '',
      text: 'No analysis yet'
    },
    'error': {
      emoji: '',
      text: 'Something went wrong'
    },
    'welcome': {
      emoji: '',
      text: 'Welcome!'
    }
  };

  const state = states[type] || states['welcome'];

  // TODO: Replace with actual illustrations
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4">{state.emoji}</div>
      <p className="text-gray-500">{state.text}</p>
    </div>
  );
};

// Success Animation Component
export const SuccessAnimation = ({ className = '' }) => {
  // TODO: Replace with animated SVG checkmark
  return (
    <div className={`${className}`}>
      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-3xl text-green-600">✓</span>
      </div>
    </div>
  );
};

export default {
  Logo,
  HeroIllustration,
  FeatureIcon,
  TierIllustration,
  LoadingAnimation,
  TrustBadge,
  EmptyState,
  SuccessAnimation
};