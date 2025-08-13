import React from 'react';

const Logo = ({ className = "h-8", showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Logo Icon */}
      <svg 
        className={className}
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Circle */}
        <circle 
          cx="24" 
          cy="24" 
          r="20" 
          className="fill-blue-600"
        />
        
        {/* AI Scanner Icon */}
        <g className="text-white">
          {/* Scanner Frame */}
          <rect 
            x="12" 
            y="12" 
            width="24" 
            height="24" 
            rx="2" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
          />
          
          {/* Scan Lines */}
          <path 
            d="M12 20h24M12 28h24" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            opacity="0.6"
          />
          
          {/* AI Dot Pattern */}
          <circle cx="18" cy="24" r="2" fill="currentColor" />
          <circle cx="24" cy="24" r="2" fill="currentColor" />
          <circle cx="30" cy="24" r="2" fill="currentColor" />
          
          {/* Corner Brackets */}
          <path 
            d="M12 16v-4h4M36 12h-4v4M36 32v4h-4M12 36h4v-4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
        </g>
      </svg>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900 leading-tight">
            AImpact<span className="text-blue-600">Scanner</span>
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            AI Search Mastery
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;