import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Scale, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DocuQuery</span>
            </Link>
            
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Last updated: September 29, 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            
            {/* Agreement */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Agreement to Terms</h2>
              <div className="bg-blue-50 rounded-xl p-6 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using DocuQuery's AI-powered document processing service, you accept 
                  and agree to be bound by the terms and provision of this agreement. If you do not 
                  agree to abide by the above, please do not use this service.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Description</h2>
              <p className="text-gray-600 mb-6">
                DocuQuery provides an AI-powered document processing platform that enables users to:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-time PDF Editing</h3>
                    <p className="text-gray-600 text-sm">Edit documents through natural language commands</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Conversations</h3>
                    <p className="text-gray-600 text-sm">Chat with documents using advanced AI</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Document Conversion</h3>
                    <p className="text-gray-600 text-sm">Convert between multiple file formats</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Cloud Integration</h3>
                    <p className="text-gray-600 text-sm">Sync with popular cloud storage services</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Accounts */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Accounts</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Registration</h3>
                  <p className="text-gray-600">
                    You must provide accurate, current, and complete information during registration 
                    and keep your account information updated.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Security</h3>
                  <p className="text-gray-600">
                    You are responsible for maintaining the confidentiality of your account credentials 
                    and for all activities under your account.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Account Termination</h3>
                  <p className="text-gray-600">
                    We reserve the right to suspend or terminate accounts that violate these terms 
                    or engage in prohibited activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Acceptable Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Acceptable Use Policy</h2>
              <div className="bg-red-50 rounded-xl p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-red-800 mb-2">Prohibited Activities</h3>
                    <p className="text-red-700 mb-3">
                      You agree not to use our service for any unlawful or prohibited activities, including:
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Content Restrictions</h4>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>• Uploading illegal or copyrighted content</li>
                    <li>• Processing documents containing malware</li>
                    <li>• Sharing confidential information without authorization</li>
                    <li>• Creating or distributing harmful content</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Service Misuse</h4>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>• Attempting to reverse engineer our AI models</li>
                    <li>• Overloading our systems or infrastructure</li>
                    <li>• Sharing account credentials with unauthorized users</li>
                    <li>• Interfering with other users' service access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Intellectual Property Rights</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Our Property</h3>
                  <p className="text-gray-600">
                    The DocuQuery service, including but not limited to software, AI models, user interface, 
                    design, and documentation, is protected by copyright, trademark, and other intellectual 
                    property laws. You may not reproduce, modify, or distribute our proprietary content 
                    without explicit written permission.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Content</h3>
                  <p className="text-gray-600">
                    You retain ownership of all documents and content you upload to our service. By using 
                    DocuQuery, you grant us a limited license to process, store, and analyze your content 
                    solely to provide our services. We do not claim ownership of your content and will 
                    not use it for purposes other than service provision.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment and Billing</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Subscription Plans</h3>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>• Monthly and annual billing options available</li>
                      <li>• Automatic renewal unless cancelled</li>
                      <li>• Pro-rated charges for plan upgrades</li>
                      <li>• Usage-based pricing for enterprise plans</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Processing</h3>
                    <ul className="text-gray-600 space-y-2 text-sm">
                      <li>• Secure payment processing via Stripe</li>
                      <li>• Major credit cards and PayPal accepted</li>
                      <li>• Invoicing available for enterprise customers</li>
                      <li>• All prices exclude applicable taxes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Availability */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Availability</h2>
              <p className="text-gray-600 mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Scheduled Maintenance:</span>
                    <span className="text-gray-600"> We may perform maintenance with advance notice</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Emergency Downtime:</span>
                    <span className="text-gray-600"> Unplanned outages may occur for security or stability</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Service Updates:</span>
                    <span className="text-gray-600"> Features and functionality may change over time</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Limitation of Liability</h2>
              <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                <p className="text-gray-700 mb-4">
                  <strong>IMPORTANT LEGAL NOTICE:</strong> To the fullest extent permitted by law, 
                  DocuQuery shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation:
                </p>
                <ul className="text-gray-700 space-y-2 text-sm">
                  <li>• Loss of profits, data, use, or other intangible losses</li>
                  <li>• Damages resulting from unauthorized access to your account</li>
                  <li>• Errors or inaccuracies in AI-generated content or edits</li>
                  <li>• Service interruptions or technical failures</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Our total liability shall not exceed the amount paid by you for the service 
                  during the 12 months preceding the claim.
                </p>
              </div>
            </div>

            {/* Indemnification */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify and hold harmless DocuQuery, its officers, directors, employees, 
                and agents from any claims, damages, or expenses arising from your use of the service, 
                violation of these terms, or infringement of any third-party rights.
              </p>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Termination</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">By You</h3>
                  <p className="text-gray-600 text-sm">
                    You may terminate your account at any time through your account settings. 
                    Cancellation takes effect at the end of your current billing period.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">By Us</h3>
                  <p className="text-gray-600 text-sm">
                    We may terminate or suspend your account immediately for violations of these 
                    terms or other prohibited activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Governing Law</h2>
              <p className="text-gray-600">
                These terms shall be governed by and construed in accordance with the laws of the 
                State of California, without regard to conflict of law principles. Any disputes 
                shall be resolved in the federal or state courts located in San Francisco County, California.
              </p>
            </div>

            {/* Changes to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these terms at any time. We will notify users of 
                material changes via email or service notification. Your continued use of the 
                service after changes constitutes acceptance of the new terms.
              </p>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-gray-600">
                  <div><strong>Email:</strong> legal@docuquery.com</div>
                  <div><strong>Address:</strong> 123 Market Street, Suite 456, San Francisco, CA 94105</div>
                  <div><strong>Phone:</strong> +1 (555) 123-4567</div>
                </div>
              </div>
            </div>

            {/* Effective Date */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                These Terms of Service are effective as of September 29, 2025.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions About Our Terms?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our legal team is available to help clarify any questions you may have.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Contact Legal Team
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default TermsOfService;