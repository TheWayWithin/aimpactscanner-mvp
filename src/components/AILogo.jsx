import React from 'react';

const AILogo = ({ className = "h-16 md:h-24" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue rounded square background */}
      <rect 
        width="512" 
        height="512" 
        rx="110" 
        fill="#2563EB"
      />
      
      {/* Radar circles */}
      <circle 
        cx="256" 
        cy="256" 
        r="140" 
        stroke="white" 
        strokeWidth="16" 
        fill="none"
        opacity="0.4"
      />
      <circle 
        cx="256" 
        cy="256" 
        r="100" 
        stroke="white" 
        strokeWidth="16" 
        fill="none"
        opacity="0.6"
      />
      <circle 
        cx="256" 
        cy="256" 
        r="60" 
        stroke="white" 
        strokeWidth="16" 
        fill="none"
        opacity="0.8"
      />
      
      {/* AI text in center */}
      <text 
        x="256" 
        y="280" 
        fontSize="72" 
        fontWeight="bold" 
        fill="white" 
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        AI
      </text>
      
      {/* Radar sweep line */}
      <line 
        x1="256" 
        y1="256" 
        x2="396" 
        y2="256" 
        stroke="white" 
        strokeWidth="20"
        strokeLinecap="round"
      />
      
      {/* Radar sweep dot */}
      <circle 
        cx="396" 
        cy="256" 
        r="12" 
        fill="white"
      />
    </svg>
  );
};

export default AILogo;