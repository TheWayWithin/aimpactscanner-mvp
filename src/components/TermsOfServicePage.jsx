// Terms of Service Page - Legal terms and conditions
import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">
              <strong>Effective Date:</strong> January 1, 2025<br />
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>
          
          <div className="prose prose-gray max-w-none space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using AImpactScanner.com ("Service"), operated by AI Search Mastery ("Company," "we," or "us"), 
                you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                AImpactScanner is an AI optimization analysis platform that evaluates websites for compatibility 
                with AI search engines and language models. Our service provides insights, recommendations, and 
                scoring based on the MASTERY-AI Framework for AI search optimization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="space-y-4">
                <p className="text-gray-700">To access certain features, you must create an account by providing:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Valid email address</li>
                  <li>Secure password</li>
                  <li>Acceptance of these terms and our Privacy Policy</li>
                </ul>
                <p className="text-gray-700">
                  You are responsible for maintaining the confidentiality of your account credentials and 
                  for all activities that occur under your account.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscription Plans and Billing</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Free Tier</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>3 website analyses per month</li>
                    <li>Basic analysis reports</li>
                    <li>No payment required</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Coffee Tier ($5/month)</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Unlimited website analyses</li>
                    <li>Detailed reports and recommendations</li>
                    <li>Priority support</li>
                    <li>Monthly billing through Stripe</li>
                  </ul>
                </div>
                
                <p className="text-gray-700">
                  Subscription fees are billed monthly in advance. You may cancel your subscription at any time 
                  through your account settings or by contacting support.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree NOT to use our service to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Analyze websites you do not own or have permission to analyze</li>
                <li>Submit malicious, illegal, or inappropriate content</li>
                <li>Attempt to reverse engineer or compromise our systems</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with other users' access to the service</li>
                <li>Use automated tools to abuse or overload our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service, including its original content, features, and functionality, is owned by 
                AI Search Mastery and is protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Content</h3>
                  <p className="text-gray-700">
                    You retain ownership of any website URLs and content you submit for analysis. 
                    By using our service, you grant us a limited license to analyze and process this information 
                    to provide our services.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Our Content</h3>
                  <p className="text-gray-700">
                    Analysis reports, scores, recommendations, and insights generated by our service remain 
                    our intellectual property, licensed to you for your business use.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
              <p className="text-gray-700">
                We strive to maintain high service availability but do not guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue the service with reasonable notice. 
                Planned maintenance will be communicated in advance when possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers and Limitations of Liability</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-semibold mb-2">Important Legal Disclaimers:</p>
                <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                  <li>Our analysis is based on publicly available information and AI model behavior patterns</li>
                  <li>Results are estimates and may not guarantee specific outcomes</li>
                  <li>AI search algorithms change frequently; our analysis reflects current understanding</li>
                  <li>We are not responsible for third-party content or external website issues</li>
                </ul>
              </div>
              
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AI SEARCH MASTERY SHALL NOT BE LIABLE FOR ANY 
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
                LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Refund Policy</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Free Tier:</strong> No charges, no refunds applicable</li>
                <li><strong>Coffee Tier:</strong> 30-day money-back guarantee for first-time subscribers</li>
                <li><strong>Refund Process:</strong> Contact support with your request and reason</li>
                <li><strong>Processing Time:</strong> Refunds processed within 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the service at our sole discretion, 
                without prior notice, for conduct that we believe violates these Terms or is harmful to 
                other users, us, or third parties.
              </p>
              <p className="text-gray-700">
                Upon termination, your right to use the service will cease immediately. You may also 
                delete your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                in which AI Search Mastery operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of significant 
                changes via email or through our service. Your continued use of the service after changes 
                constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700">
                Questions about these Terms of Service should be directed to:
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
              By using AImpactScanner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;