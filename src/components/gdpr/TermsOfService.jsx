import React from 'react';
import NavigationButtons from '../NavigationButtons';

const DEFAULT_PRICING_TIERS = [
  { name: 'Free', price: '$0/month', features: ['3 analyses per month', 'Basic reports', 'Email support'] },
  { name: 'Coffee', price: '$5/month', features: ['Unlimited analyses', 'Detailed reports', 'Priority support', 'PDF exports'] },
];

export function TermsOfService({
  companyName = 'AImpactScanner',
  websiteUrl = 'https://aimpactscanner.com',
  contactEmail = 'jamie@aimpactscanner.com',
  lastUpdated = 'February 1, 2026',
  effectiveDate = 'January 1, 2025',
  jurisdiction = 'State of New York, United States',
  serviceDescription = 'an AI search optimization and analysis platform',
  hasPaidPlans = true,
  pricingTiers = DEFAULT_PRICING_TIERS,
  refundPolicy = 'We offer a 14-day money-back guarantee for all paid subscriptions.',
  liabilityCap = 'the amount you paid us in the 12 months preceding the incident',
  hasUserContent = true,
  hasApiAccess = true,
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
        currentView="terms" 
        onNavigate={onNavigate} 
        isAuthenticated={isAuthenticated} 
      />
      
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">
            <strong>Last updated:</strong> {lastUpdated}<br />
            <strong>Effective date:</strong> {effectiveDate}
          </p>

          <div className="prose prose-gray max-w-none space-y-8">
            {/* Introduction */}
            <Section title="1. Agreement to Terms">
              <p>
                These Terms of Service ("Terms") govern your use of {companyName}, {serviceDescription}, 
                operated by {companyName} ("we", "us", or "our") and available at{' '}
                <a href={websiteUrl} className="text-blue-600 underline">{websiteUrl}</a> ("Service").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any 
                part of these terms, then you may not access the Service.
              </p>
            </Section>

            {/* Service Description */}
            <Section title="2. Description of Service">
              <p>
                {companyName} provides {serviceDescription} that analyzes websites for AI search optimization.
                Our service includes:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Website analysis for AI search visibility</li>
                <li>Optimization recommendations</li>
                <li>Performance scoring and reporting</li>
                <li>User dashboard and analytics</li>
                {hasApiAccess && <li>API access for developers</li>}
              </ul>
            </Section>

            {/* User Accounts */}
            <Section title="3. User Accounts">
              <p>
                When you create an account with us, you must provide accurate, complete, and current information.
                You are responsible for safeguarding your account and all activities that occur under your account.
              </p>
              <p>
                You must immediately notify us of any unauthorized use of your account or any other breach of security.
                We will not be liable for any loss or damage from your failure to comply with this obligation.
              </p>
            </Section>

            {/* Acceptable Use */}
            <Section title="4. Acceptable Use">
              <p>You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Transmit, or procure the sending of, any advertising or promotional material without our consent</li>
                <li>Impersonate or attempt to impersonate the Company, employees, other users, or any other person</li>
                <li>Engage in any conduct that restricts or inhibits anyone's use of the Service</li>
                <li>Use the Service to analyze illegal content or websites</li>
                <li>Attempt to interfere with, compromise, or reverse engineer the Service</li>
                <li>Use automated scripts or bots to access the Service beyond normal usage</li>
              </ul>
            </Section>

            {hasUserContent && (
              <Section title="5. User Content">
                <p>
                  Our Service may allow you to submit, post, or upload content, including website URLs for analysis
                  ("User Content"). You retain ownership of your User Content, but you grant us a license to use it
                  as necessary to provide our Service.
                </p>
                <p>You represent and warrant that your User Content:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Does not violate any third-party rights</li>
                  <li>Does not contain illegal or harmful material</li>
                  <li>Complies with applicable laws and regulations</li>
                </ul>
                <p>
                  We reserve the right to remove any User Content that violates these Terms or that we deem
                  inappropriate in our sole discretion.
                </p>
              </Section>
            )}

            {/* Subscription and Payments */}
            {hasPaidPlans && (
              <Section title="6. Subscription and Payments">
                <p>Our Service offers multiple subscription tiers:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Plan</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Price</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-900">Features</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricingTiers.map((tier, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 border-t border-gray-200">{tier.name}</td>
                          <td className="px-4 py-2 border-t border-gray-200">{tier.price}</td>
                          <td className="px-4 py-2 border-t border-gray-200">
                            <ul className="list-disc list-inside text-sm">
                              {tier.features.map((feature, i) => (
                                <li key={i}>{feature}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <p className="mt-4">
                  <strong>Payment Terms:</strong> Subscription fees are billed in advance on a monthly basis.
                  All fees are non-refundable except as expressly stated in our refund policy.
                </p>
                
                <p>
                  <strong>Refund Policy:</strong> {refundPolicy}
                </p>
                
                <p>
                  <strong>Price Changes:</strong> We may modify subscription fees with 30 days' notice.
                  Changes will take effect at the next billing cycle.
                </p>
              </Section>
            )}

            {/* Service Availability */}
            <Section title="7. Service Availability">
              <p>
                We strive to maintain high service availability but do not guarantee uninterrupted access.
                The Service may be temporarily unavailable for maintenance, updates, or due to technical issues.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with
                reasonable notice to users.
              </p>
            </Section>

            {/* Intellectual Property */}
            <Section title="8. Intellectual Property Rights">
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive
                property of {companyName} and its licensors. The Service is protected by copyright, trademark,
                and other laws.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of our Service without our express
                written permission.
              </p>
            </Section>

            {hasApiAccess && (
              <Section title="9. API Access">
                <p>
                  If you use our API, you agree to additional terms governing API usage, including rate limits
                  and usage quotas. API access may be subject to separate fees and restrictions.
                </p>
                <p>API users must:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Respect rate limits and usage quotas</li>
                  <li>Include proper attribution when required</li>
                  <li>Not resell or redistribute API access</li>
                  <li>Comply with all applicable terms and policies</li>
                </ul>
              </Section>
            )}

            {/* Privacy */}
            <Section title="10. Privacy">
              <p>
                Your privacy is important to us. Please see our{' '}
                <button 
                  onClick={() => onNavigate && onNavigate('privacy')}
                  className="text-blue-600 underline"
                >
                  Privacy Policy
                </button>
                , which explains how we collect, use, and protect your information when you use our Service.
              </p>
            </Section>

            {/* Disclaimers */}
            <Section title="11. Disclaimers">
              <p>
                The information on this Service is provided on an "as is" basis. We disclaim all warranties of any kind,
                whether express or implied, including but not limited to implied warranties of merchantability,
                fitness for a particular purpose, and non-infringement.
              </p>
              <p>
                We do not guarantee that:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>The Service will meet your specific requirements</li>
                <li>The Service will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from using the Service will be accurate or reliable</li>
                <li>Any errors in the Service will be corrected</li>
              </ul>
            </Section>

            {/* Limitation of Liability */}
            <Section title="12. Limitation of Liability">
              <p>
                In no event shall {companyName}, its directors, employees, or agents be liable for any indirect,
                incidental, special, consequential, or punitive damages, including loss of profits, data, use,
                goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability to you for all claims arising from these Terms or the Service shall not exceed {liabilityCap}.
              </p>
            </Section>

            {/* Termination */}
            <Section title="13. Termination">
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for any reason, including breach of these Terms.
              </p>
              <p>
                Upon termination, your right to use the Service will cease immediately. If you wish to terminate your
                account, you may discontinue using the Service or contact us for account deletion.
              </p>
            </Section>

            {/* Governing Law */}
            <Section title="14. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of {jurisdiction},
                without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising from these Terms or your use of the Service will be resolved in the courts
                of {jurisdiction}.
              </p>
            </Section>

            {/* Changes to Terms */}
            <Section title="15. Changes to Terms">
              <p>
                We reserve the right to modify these Terms at any time. If we make material changes, we will
                notify you by email or through a notice on our Service.
              </p>
              <p>
                Your continued use of the Service after changes become effective constitutes acceptance of the
                new Terms.
              </p>
            </Section>

            {/* Contact Information */}
            <Section title="16. Contact Information">
              <p>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Email:</strong> {contactEmail}</p>
                <p><strong>Website:</strong> {websiteUrl}</p>
                <p><strong>Jurisdiction:</strong> {jurisdiction}</p>
              </div>
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

export default TermsOfService;