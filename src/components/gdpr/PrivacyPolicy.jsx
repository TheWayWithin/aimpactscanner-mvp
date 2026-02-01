import React from 'react';
import NavigationButtons from '../NavigationButtons';

// Default data for AImpactScanner
const DEFAULT_DATA = [
  { type: 'Email address', purpose: 'Account creation and communication', retention: 'Until account deletion' },
  { type: 'Website URLs', purpose: 'AI search analysis', retention: '12 months' },
  { type: 'Usage data', purpose: 'Service improvement and analytics', retention: '24 months' },
  { type: 'Payment information', purpose: 'Processing transactions (handled by Stripe)', retention: 'Per Stripe retention policy' },
];

const DEFAULT_THIRD_PARTIES = [
  { name: 'Stripe', purpose: 'Payment processing', privacyUrl: 'https://stripe.com/privacy' },
  { name: 'Netlify', purpose: 'Website hosting', privacyUrl: 'https://www.netlify.com/privacy/' },
  { name: 'Supabase', purpose: 'Authentication and database', privacyUrl: 'https://supabase.com/privacy' },
  { name: 'OpenAI', purpose: 'AI Analysis', privacyUrl: 'https://openai.com/privacy' },
  { name: 'Railway', purpose: 'Backend hosting', privacyUrl: 'https://railway.app/legal/privacy' },
];

export function PrivacyPolicy({
  companyName = 'AImpactScanner',
  websiteUrl = 'https://aimpactscanner.com',
  contactEmail = 'jamie@aimpactscanner.com',
  lastUpdated = 'February 1, 2026',
  effectiveDate = 'January 1, 2025',
  jurisdiction = 'State of New York, United States',
  dataCollected = DEFAULT_DATA,
  thirdParties = DEFAULT_THIRD_PARTIES,
  dpoEmail,
  allowsAccountDeletion = true,
  usesCookies = true,
  minimumAge = 16,
  additionalSections = [],
  className = '',
  onNavigate,
  isAuthenticated,
}) {
  const Section = ({ title, children }) => (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      {/* Navigation */}
      <NavigationButtons 
        currentView="privacy" 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />
      
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> {lastUpdated}<br />
            <strong>Effective date:</strong> {effectiveDate}
          </p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <Section title="1. Introduction">
              <p>
                {companyName} ("we", "us", or "our") operates{' '}
                <a href={websiteUrl} className="text-blue-600 underline">{websiteUrl}</a>.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you visit our website and use our AI optimization analysis services.
              </p>
              <p>
                We are committed to protecting your privacy and handling your data in an open and transparent manner.
                This policy complies with the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA),
                and other applicable privacy laws.
              </p>
            </Section>

            {/* Information We Collect */}
            <Section title="2. Information We Collect">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Data Type</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Purpose</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataCollected.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 border-t border-gray-200">{item.type}</td>
                        <td className="px-4 py-2 border-t border-gray-200">{item.purpose}</td>
                        <td className="px-4 py-2 border-t border-gray-200">{item.retention}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">Technical Information</h3>
              <p>We automatically collect certain technical information when you visit our website:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>IP address and general location</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent</li>
                <li>Referral sources</li>
              </ul>
            </Section>

            {/* How We Use Your Information */}
            <Section title="3. How We Use Your Information">
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Service Provision:</strong> To provide and maintain our AI search optimization analysis services</li>
                <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
                <li><strong>Communication:</strong> To send you service-related notifications, updates, and marketing communications (with your consent)</li>
                <li><strong>Improvement:</strong> To analyze usage patterns and improve our services</li>
                <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                <li><strong>Security:</strong> To protect against fraud, abuse, and security threats</li>
              </ul>
            </Section>

            {/* Legal Basis for Processing */}
            <Section title="4. Legal Basis for Processing (GDPR)">
              <p>We process your personal data based on the following legal grounds:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Contract:</strong> Processing necessary for providing our services to you</li>
                <li><strong>Legitimate Interest:</strong> For business operations, security, and service improvement</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
                <li><strong>Legal Obligation:</strong> For compliance with applicable laws</li>
              </ul>
            </Section>

            {/* Third-Party Services */}
            <Section title="5. Third-Party Services">
              <p>We share information with trusted third-party service providers who help us operate our business:</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Service Provider</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Purpose</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Privacy Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thirdParties.map((party, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 border-t border-gray-200">{party.name}</td>
                        <td className="px-4 py-2 border-t border-gray-200">{party.purpose}</td>
                        <td className="px-4 py-2 border-t border-gray-200">
                          {party.privacyUrl ? (
                            <a href={party.privacyUrl} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                              View Policy
                            </a>
                          ) : (
                            'Not applicable'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Your Rights */}
            <Section title="6. Your Privacy Rights">
              <p>Under GDPR and other privacy laws, you have the following rights:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten")</li>
                <li><strong>Restriction:</strong> Request limitation of processing in certain circumstances</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests or direct marketing</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for consent-based processing</li>
              </ul>
              
              {allowsAccountDeletion && (
                <p className="mt-4">
                  <strong>Account Deletion:</strong> You can delete your account and associated data through your account settings
                  or by contacting us at {contactEmail}.
                </p>
              )}
            </Section>

            {/* Cookies */}
            {usesCookies && (
              <Section title="7. Cookies and Tracking">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience on our website.
                  Our cookie consent banner allows you to control which types of cookies we use:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Necessary Cookies:</strong> Essential for website functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                  <li><strong>Marketing Cookies:</strong> Used for advertising and personalization</li>
                  <li><strong>Functional Cookies:</strong> Enable enhanced features and personalization</li>
                </ul>
                <p>You can change your cookie preferences at any time through your browser settings or our cookie banner.</p>
              </Section>
            )}

            {/* Data Security */}
            <Section title="8. Data Security">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
              </ul>
            </Section>

            {/* International Transfers */}
            <Section title="9. International Data Transfers">
              <p>
                Your data may be transferred to and processed in countries outside your jurisdiction, including the United States.
                We ensure appropriate safeguards are in place for such transfers, including:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>EU Standard Contractual Clauses</li>
                <li>Adequacy decisions by relevant authorities</li>
                <li>Privacy Shield certification (where applicable)</li>
              </ul>
            </Section>

            {/* Children's Privacy */}
            <Section title="10. Children's Privacy">
              <p>
                Our services are not intended for individuals under the age of {minimumAge}. We do not knowingly collect
                personal information from children under {minimumAge}. If we become aware that we have collected personal
                information from a child under {minimumAge}, we will take steps to delete such information.
              </p>
            </Section>

            {/* Changes to This Policy */}
            <Section title="11. Changes to This Privacy Policy">
              <p>
                We may update this Privacy Policy from time to time. When we make changes, we will:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Update the "Last Updated" date at the top of this policy</li>
                <li>Notify you of significant changes via email or website notice</li>
                <li>For material changes, obtain your consent where required by law</li>
              </ul>
            </Section>

            {/* Contact Information */}
            <Section title="12. Contact Information">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Email:</strong> {contactEmail}</p>
                <p><strong>Website:</strong> {websiteUrl}</p>
                {dpoEmail && (
                  <p><strong>Data Protection Officer:</strong> {dpoEmail}</p>
                )}
                <p><strong>Jurisdiction:</strong> {jurisdiction}</p>
              </div>
              
              <p className="mt-4">
                For GDPR-related requests, please include "GDPR Request" in your email subject line and specify
                the nature of your request (access, deletion, correction, etc.).
              </p>
            </Section>

            {/* Additional Sections */}
            {additionalSections.map((section, index) => (
              <Section key={index} title={section.title}>
                <div dangerouslySetInnerHTML={{ __html: section.content }} />
              </Section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;