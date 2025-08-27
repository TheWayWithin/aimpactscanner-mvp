// Privacy Policy Page - Professional legal document
import React, { useEffect } from 'react';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              <strong>Effective Date:</strong> January 1, 2025<br />
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                AI Search Mastery ("we," "our," or "us") operates AImpactScanner.com. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you visit our 
                website and use our AI optimization analysis services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Email address (for account creation and service delivery)</li>
                    <li>Website URLs you submit for analysis</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Usage data and service interaction metrics</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>IP address and browser information</li>
                    <li>Device type and operating system</li>
                    <li>Website usage patterns and analytics data</li>
                    <li>Performance and error tracking data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and maintain our AI optimization analysis services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send service-related communications and updates</li>
                <li>Analyze and improve our services and user experience</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties, 
                except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Service Providers:</strong> Trusted partners who assist in operating our website and services</li>
                <li><strong>Payment Processing:</strong> Stripe for secure payment processing</li>
                <li><strong>Analytics:</strong> Google Analytics for website usage analysis (anonymized data)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction. 
                This includes encryption, secure data transmission, and regular security assessments.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information only for as long as necessary to provide our services 
                and fulfill the purposes outlined in this Privacy Policy. Account data is retained until 
                account deletion, while analysis results may be kept for service improvement purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate or incomplete personal data</li>
                <li>Delete your personal data ("right to be forgotten")</li>
                <li>Restrict or object to the processing of your personal data</li>
                <li>Data portability (receive your data in a structured format)</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your experience and analyze website usage:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for basic website functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can control cookie preferences through your browser settings or our cookie consent banner.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your country of 
                residence. We ensure appropriate safeguards are in place to protect your personal information 
                in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page with an updated "Last Updated" date. Your 
                continued use of our services after any changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>AI Search Mastery</strong><br />
                  General Information: info@aisearchmastery.com<br />
                  Customer Support: support@aisearchmastery.com<br />
                  Website: <a href="https://aimpactscanner.com" className="text-blue-600 hover:underline">https://aimpactscanner.com</a>
                </p>
              </div>
            </section>

          </div>
          
          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              This privacy policy is designed to comply with GDPR, CCPA, and other applicable privacy regulations.
              For specific legal questions, please consult with a qualified legal professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;