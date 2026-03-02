import React from 'react';

const bgMap = {
  white: 'bg-white',
  cloud: 'bg-cloud',
  mist: 'bg-mist',
  mastery: 'bg-mastery',
  gradient: 'bg-gradient-to-br from-mastery to-clarity',
};

const SectionWrapper = ({
  children,
  bg = 'white',
  id,
  className = '',
  narrow = false,
  ...props
}) => {
  return (
    <section
      id={id}
      className={`
        py-16 md:py-24 px-4 sm:px-6 lg:px-8
        ${bgMap[bg] || bgMap.white}
        ${className}
      `.trim()}
      {...props}
    >
      <div className={`mx-auto ${narrow ? 'max-w-4xl' : 'max-w-7xl'}`}>
        {children}
      </div>
    </section>
  );
};

export default SectionWrapper;
