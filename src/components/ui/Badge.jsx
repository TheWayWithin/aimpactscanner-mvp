import React from 'react';

const colorMap = {
  signal: 'bg-signal/10 text-signal',
  clarity: 'bg-clarity/10 text-clarity',
  amber: 'bg-amber/10 text-amber',
  mastery: 'bg-mastery/10 text-mastery',
  success: 'bg-green-50 text-green-700',
  muted: 'bg-cloud text-slate',
};

const Badge = ({
  children,
  color = 'signal',
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${colorMap[color] || colorMap.signal}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
