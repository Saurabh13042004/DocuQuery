import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft, Shield, Eye, Database, Lock } from 'lucide-react';
import Footer from '../components/Footer';

const PrivacyPolicy: React.FC = () => {
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
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Privacy Policy
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
            
            {/* Introduction */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <Eye className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Introduction</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                At DocuQuery, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our AI-powered document processing 
                service. Please read this privacy policy carefully. If you do not agree with the terms of 
                this privacy policy, please do not access the application.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <Database className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <p className="text-gray-600 mb-3">
                    We may collect personal information that you voluntarily provide to us when:
                  </p>
                  <ul className="list-disc pl-6 text-gray-600 space-y-2">
                    <li>Registering for an account</li>
                    <li>Uploading documents for processing</li>
                    <li>Contacting us for support</li>
                    <li>Subscribing to our newsletter</li>
                    <li>Participating in surveys or promotions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Data</h3>
                  <p className="text-gray-600">
                    When you upload documents to our service, we process and store the content to provide 
                    our AI-powered features. This may include text extraction, content analysis, and 
                    metadata generation. All document processing is performed with enterprise-grade security.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                  <p className="text-gray-600">
                    We automatically collect information about how you interact with our service, including 
                    features used, time spent, and interaction patterns. This helps us improve our service 
                    and user experience.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Information</h3>
                  <p className="text-gray-600">
                    We may collect technical information such as your IP address, browser type, device 
                    information, and operating system to ensure service compatibility and security.
                  </p>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Use Your Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Provision</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Process and analyze your documents</li>
                    <li>• Provide AI-powered editing and conversations</li>
                    <li>• Generate audiobooks from documents</li>
                    <li>• Sync with integrated cloud services</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Improvement</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Enhance AI model accuracy</li>
                    <li>• Improve user interface and experience</li>
                    <li>• Develop new features and capabilities</li>
                    <li>• Monitor service performance and reliability</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Information Sharing and Disclosure</h2>
              <p className="text-gray-600 mb-6">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following circumstances:
              </p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-6 py-2">
                  <h3 className="font-semibold text-gray-900">Service Providers</h3>
                  <p className="text-gray-600">
                    With trusted third-party services that help us operate our platform, such as cloud 
                    storage providers and analytics services.
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-6 py-2">
                  <h3 className="font-semibold text-gray-900">Legal Requirements</h3>
                  <p className="text-gray-600">
                    When required by law, court order, or government regulations, or to protect our 
                    rights and safety.
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-6 py-2">
                  <h3 className="font-semibold text-gray-900">Business Transfers</h3>
                  <p className="text-gray-600">
                    In connection with a merger, acquisition, or sale of assets, with proper notice 
                    to affected users.
                  </p>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 m-0">Data Security</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  We implement appropriate technical and organizational security measures to protect your 
                  information against unauthorized access, alteration, disclosure, or destruction:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Technical Measures</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• AES-256 encryption at rest</li>
                      <li>• TLS 1.3 for data in transit</li>
                      <li>• Multi-factor authentication</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Organizational Measures</h4>
                    <ul className="text-gray-600 space-y-1 text-sm">
                      <li>• Employee background checks</li>
                      <li>• Privacy training programs</li>
                      <li>• Access controls and monitoring</li>
                      <li>• Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your information for as long as necessary to provide our services and comply 
                with legal obligations:
              </p>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Account Information:</span>
                    <span className="text-gray-600"> Retained while your account is active plus 30 days after deletion</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Document Data:</span>
                    <span className="text-gray-600"> Deleted within 30 days of account termination</span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Usage Analytics:</span>
                    <span className="text-gray-600"> Aggregated data retained for service improvement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
              <p className="text-gray-600 mb-6">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Access & Portability</h3>
                  <p className="text-gray-600 text-sm">
                    Request a copy of your personal information and data portability in a structured format.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Correction</h3>
                  <p className="text-gray-600 text-sm">
                    Update or correct inaccurate personal information we hold about you.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Deletion</h3>
                  <p className="text-gray-600 text-sm">
                    Request deletion of your personal information, subject to legal requirements.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Processing Limitation</h3>
                  <p className="text-gray-600 text-sm">
                    Restrict or object to certain processing of your personal information.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-600 mb-4">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="space-y-2 text-gray-600">
                  <div><strong>Email:</strong> privacy@docuquery.com</div>
                  <div><strong>Address:</strong> 123 Market Street, Suite 456, San Francisco, CA 94105</div>
                  <div><strong>Phone:</strong> +1 (555) 123-4567</div>
                </div>
              </div>
            </div>

            {/* Updates */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Policy Updates</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            {/* Effective Date */}
            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                This Privacy Policy is effective as of September 29, 2025.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Questions About Privacy?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Our team is here to help you understand how we protect your data.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Contact Our Privacy Team
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;