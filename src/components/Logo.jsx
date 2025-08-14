import React from 'react';

const Logo = ({ className = "h-8", showText = true, variant = 'primary' }) => {
  // Determine which logo to use based on variant
  const logoSrc = variant === 'white' 
    ? '/images/logos/logo-white-240x60-transparent.png'
    : '/images/logos/logo-primary-240x60-transparent.png';
  
  const squareLogoSrc = '/images/logos/logo-square-60x60-transparent.png';
  
  return (
    <div className="flex items-center gap-2">
      {showText ? (
        // Use the full horizontal logo when text is shown
        <img 
          src={logoSrc}
          alt="AImpactScanner Logo"
          className={className}
          style={{ height: 'auto', maxHeight: '60px' }}
        />
      ) : (
        // Use the square logo icon when text is hidden
        <img 
          src={squareLogoSrc}
          alt="AImpactScanner"
          className={className}
          style={{ height: 'auto', maxHeight: '60px' }}
        />
      )}
    </div>
  );
};

export default Logo;