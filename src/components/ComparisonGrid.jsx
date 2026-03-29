// ComparisonGrid.jsx - Reusable tier comparison component
import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, XCircle } from 'lucide-react';

const ComparisonGrid = ({ currentTier, upgradeTier, benefits, limitations }) => {
  return (
    <section className="comparison-section py-12 px-5 md:py-20 md:px-10 bg-white">
      <div className="container max-w-screen-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          See What You're {upgradeTier ? 'Missing' : 'Getting'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Current Tier / Limitations */}
          {(currentTier || limitations) && (
            <div className="tier-card bg-white border-2 border-gray-200 rounded-xl p-6 md:p-8">
              <div className="card-header text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentTier?.icon} {currentTier?.name || 'FREE Plan'}
                </h3>
                <p className="text-xl font-semibold text-gray-600">
                  {currentTier?.price || '$0/month'}
                </p>
              </div>

              <ul className="space-y-3">
                {(limitations || currentTier?.limitations || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-base text-gray-700 leading-normal">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upgrade Tier / Benefits */}
          {(upgradeTier || benefits) && (
            <div className="tier-card bg-white border-2 border-yellow-400 rounded-xl p-6 md:p-8 relative shadow-lg transform md:scale-105">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-xs font-bold rounded-full text-gray-900 uppercase">
                Recommended
              </div>

              <div className="card-header text-center mb-6 mt-2">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {upgradeTier?.icon} {upgradeTier?.name || 'COFFEE Plan'}
                </h3>
                <p className="text-xl font-semibold text-yellow-600">
                  {upgradeTier?.price || '$4.95/month'}
                </p>
              </div>

              <ul className="space-y-3">
                {(benefits || upgradeTier?.benefits || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-base text-gray-700 leading-normal font-medium">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

ComparisonGrid.propTypes = {
  currentTier: PropTypes.shape({
    icon: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    limitations: PropTypes.arrayOf(PropTypes.string)
  }),
  upgradeTier: PropTypes.shape({
    icon: PropTypes.string,
    name: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    benefits: PropTypes.arrayOf(PropTypes.string)
  }),
  benefits: PropTypes.arrayOf(PropTypes.string),
  limitations: PropTypes.arrayOf(PropTypes.string)
};

export default ComparisonGrid;
