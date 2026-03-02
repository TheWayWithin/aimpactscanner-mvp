import React from 'react';

const variants = {
  primary: 'bg-signal text-white hover:bg-signal/90 focus:ring-signal/50',
  secondary: 'bg-mastery text-white hover:bg-mastery/90 focus:ring-mastery/50',
  ghost: 'bg-transparent text-signal hover:bg-signal/10 focus:ring-signal/50',
  outline: 'border-2 border-signal text-signal hover:bg-signal hover:text-white focus:ring-signal/50',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  return (
    <button
      className={`
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        font-semibold rounded-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
