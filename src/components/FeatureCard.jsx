// FeatureCard.jsx - Reusable feature highlight card component
import React from 'react';
import PropTypes from 'prop-types';

const FeatureCard = ({ icon, title, description, color = 'blue' }) => {
  const colorClasses = {
    blue: 'border-blue-200 hover:border-blue-400 hover:shadow-blue-100',
    green: 'border-green-200 hover:border-green-400 hover:shadow-green-100',
    purple: 'border-mist hover:border-signal hover:shadow-signal/10',
    yellow: 'border-yellow-200 hover:border-yellow-400 hover:shadow-yellow-100',
    gray: 'border-gray-200 hover:border-gray-400 hover:shadow-gray-100'
  };

  return (
    <div
      className={`
        feature-card bg-white border-2 rounded-xl p-6 text-center
        transition-all duration-300 transform hover:-translate-y-1
        shadow-md hover:shadow-xl
        ${colorClasses[color] || colorClasses.blue}
      `}
    >
      <div className="feature-icon text-5xl mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {title}
      </h3>

      <p className="text-base text-gray-600 leading-normal">
        {description}
      </p>
    </div>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'yellow', 'gray'])
};

export default FeatureCard;
