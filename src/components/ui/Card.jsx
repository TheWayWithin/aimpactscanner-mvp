import React from 'react';

const Card = ({
  children,
  className = '',
  highlighted = false,
  ...props
}) => {
  return (
    <div
      className={`
        bg-white rounded-xl border
        ${highlighted ? 'border-signal shadow-lg' : 'border-mist shadow-sm'}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
