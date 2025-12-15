import React from 'react';

const TrustBadges = () => {
  const badges = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: '27',
      subtext: 'Critical Factors'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: '15s',
      subtext: 'Analysis'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      text: '100%',
      subtext: 'Privacy Safe'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
        </svg>
      ),
      text: 'No',
      subtext: 'Credit Card'
    }
  ];

  return (
    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 lg:gap-8">
      {badges.map((badge, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex-shrink-0">
            {badge.icon}
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold leading-tight">{badge.text}</span>
            <span className="text-xs md:text-sm opacity-90">{badge.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrustBadges;