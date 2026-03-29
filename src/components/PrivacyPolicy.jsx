// src/components/PrivacyPolicy.jsx - Privacy Policy Page
import React from 'react';

function PrivacyPolicy() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-authority-white p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8 border border-ai-silver">
        <h1 className="text-3xl font-primary font-bold mb-6 text-center" style={{ color: 'var(--framework-black)' }}>
          Privacy Policy
        </h1>
        <p className="text-center font-primary mb-8" style={{ color: 'var(--ai-silver)' }}>
          AImpactScanner by AI Search Mastery
        </p>

        <div className="space-y-6 font-primary text-sm" style={{ color: 'var(--framework-black)' }}>
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly to us, such as when you create an account, make a purchase, 
              or contact us for support. This includes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Email address and password (encrypted)</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>URLs of websites you submit for analysis</li>
              <li>Usage data and analytics results</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Provide, maintain, and improve our service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Analyze website content you submit for optimization recommendations</li>
              <li>Monitor and analyze trends and usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
            <p className="mb-3">
              We do not sell, trade, or otherwise transfer your personal information to third parties except:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>With your explicit consent</li>
              <li>To service providers who assist in our operations (e.g., payment processing, hosting)</li>
              <li>To comply with legal obligations or protect our rights</li>
              <li>In connection with a business transfer or merger</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Storage and Security</h2>
            <p className="mb-3">
              We implement appropriate security measures to protect your personal information:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Data is encrypted in transit and at rest</li>
              <li>Passwords are hashed using industry-standard methods</li>
              <li>Access to personal data is limited to authorized personnel</li>
              <li>Regular security audits and updates are performed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Website Analysis Data</h2>
            <p className="mb-3">
              When you submit a website URL for analysis:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>We analyze publicly accessible content from that URL</li>
              <li>Analysis results are stored in your account</li>
              <li>We may use aggregated, anonymized data to improve our algorithms</li>
              <li>We do not access or store any private or password-protected content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking</h2>
            <p className="mb-3">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze usage patterns and improve our service</li>
              <li>Provide personalized experiences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Export your analysis data</li>
              <li>Opt out of marketing communications</li>
              <li>Request information about data we have collected</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
            <p className="mb-3">
              We retain your information for as long as your account is active or as needed to provide services. 
              When you delete your account, we will delete your personal information, though some data may be 
              retained for legal or business purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
            <p className="mb-3">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data during such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
            <p className="mb-3">
              Our service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to Privacy Policy</h2>
            <p className="mb-3">
              We may update this Privacy Policy periodically. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="mb-3">
              If you have questions about this Privacy Policy or our data practices, please contact us 
              through our support channels.
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

export default PrivacyPolicy;