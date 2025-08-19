// Privacy Page Component - Uses Enzuzo integration for legal compliance
import React from 'react';
import { PrivacyPolicy } from '../privacy/enzuzo-integration.jsx';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12">
        <PrivacyPolicy />
      </div>
    </div>
  );
};

export default PrivacyPage;