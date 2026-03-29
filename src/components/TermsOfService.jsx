// src/components/TermsOfService.jsx - Terms of Service Page
import React from 'react';

function TermsOfService() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
        <h1 className="text-3xl font-primary font-bold mb-6 text-center" style={{ color: 'var(--framework-black)' }}>
          Terms of Service
        </h1>
        <p className="text-center font-primary mb-8" style={{ color: 'var(--ai-silver)' }}>
          AImpactScanner by AI Search Mastery
        </p>

        <div className="space-y-6 font-primary text-sm" style={{ color: 'var(--framework-black)' }}>
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="mb-3">
              By accessing and using AImpactScanner ("Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
            <p className="mb-3">
              AImpactScanner provides AI search optimization analysis based on the MASTERY-AI Framework v3.1.1. 
              The service analyzes websites and provides recommendations for improving AI search engine visibility.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="mb-3">
              You are responsible for safeguarding the password and for maintaining the confidentiality of your account. 
              You agree not to disclose your password to any third party and to take sole responsibility for activities 
              that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Usage Limits</h2>
            <p className="mb-3">
              Free tier users are limited to 3 analyses per month. Paid tier users receive unlimited analyses 
              subject to fair use policies. We reserve the right to suspend accounts that abuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment Terms</h2>
            <p className="mb-3">
              Paid subscriptions are billed monthly and automatically renewed. You may cancel your subscription 
              at any time. Refunds are not provided for partial months of service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="mb-3">
              The MASTERY-AI Framework and all analysis methodologies are proprietary to AI Search Mastery. 
              Analysis results provided to you are for your use, but the underlying algorithms and framework 
              remain our intellectual property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data and Privacy</h2>
            <p className="mb-3">
              We collect and process data in accordance with our Privacy Policy. We analyze publicly accessible 
              web pages you submit and store analysis results associated with your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
            <p className="mb-3">
              The analysis provided is for informational purposes only. We make no guarantees about the accuracy 
              of analysis results or improvements to your search engine rankings. Use of recommendations is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="mb-3">
              AI Search Mastery shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
            <p className="mb-3">
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
              posting. Your continued use of the service constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
            <p className="mb-3">
              For questions about these Terms of Service, please contact us through our support channels.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--ai-silver)' }}>
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 rounded-md font-semibold text-white transition-colors duration-200"
            style={{ backgroundColor: 'var(--mastery-blue)' }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;