import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Shield, Eye, Download, 
  Trash2, Edit3, CheckCircle, Globe, Lock,
  User, Database, AlertCircle
} from 'lucide-react';
import Footer from '../components/Footer';

const GDPR: React.FC = () => {
  const gdprRights = [
    {
      icon: Eye,
      title: "Right to Information",
      description: "Clear information about how we process your personal data",
      actions: ["Privacy policy transparency", "Processing purpose disclosure", "Data retention periods"]
    },
    {
      icon: User,
      title: "Right of Access",
      description: "Request a copy of your personal data we hold",
      actions: ["Data export functionality", "Account dashboard access", "Processing activity logs"]
    },
    {
      icon: Edit3,
      title: "Right to Rectification",
      description: "Correct inaccurate or incomplete personal data",
      actions: ["Profile editing tools", "Data correction requests", "Automated updates"]
    },
    {
      icon: Trash2,
      title: "Right to Erasure",
      description: "Request deletion of your personal data ('right to be forgotten')",
      actions: ["Account deletion", "Selective data removal", "Automated erasure schedules"]
    },
    {
      icon: Shield,
      title: "Right to Restrict Processing",
      description: "Limit how we process your personal data in certain circumstances",
      actions: ["Processing restrictions", "Data freezing options", "Limited access controls"]
    },
    {
      icon: Download,
      title: "Right to Data Portability",
      description: "Receive your data in a machine-readable format",
      actions: ["JSON/CSV export", "API access", "Direct transfers"]
    }
  ];

  const lawfulBases = [
    {
      basis: "Consent",
      description: "You have given clear consent for processing your personal data for specific purposes",
      examples: ["Newsletter subscriptions", "Marketing communications", "Optional feature usage"]
    },
    {
      basis: "Contract",
      description: "Processing is necessary for a contract you have with us",
      examples: ["Account management", "Service delivery", "Payment processing"]
    },
    {
      basis: "Legal Obligation",
      description: "Processing is necessary to comply with the law",
      examples: ["Tax records", "Audit requirements", "Regulatory compliance"]
    },
    {
      basis: "Legitimate Interest",
      description: "Processing is necessary for legitimate interests pursued by us",
      examples: ["Service improvement", "Fraud prevention", "System security"]
    }
  ];

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-blue-600">GDPR</span> Compliance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            DocuQuery is fully compliant with the General Data Protection Regulation (GDPR). 
            We respect your privacy rights and provide full transparency about data processing.
          </p>
        </div>
      </section>

      {/* GDPR Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Your Data Protection Rights</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Under GDPR, you have several important rights regarding your personal data. 
              We provide tools and processes to exercise these rights easily.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gdprRights.map((right, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <right.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{right.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{right.description}</p>
                <div className="space-y-2">
                  {right.actions.map((action, actionIndex) => (
                    <div key={actionIndex} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-600">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lawful Basis */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Lawful Basis for Processing</h2>
            <p className="text-lg text-gray-600">
              We only process your personal data when we have a lawful basis to do so under GDPR.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {lawfulBases.map((basis, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{basis.basis}</h3>
                <p className="text-gray-600 mb-4">{basis.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">Examples:</h4>
                  {basis.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-600 text-sm">{example}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Processing */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Process Your Data</h2>
            <p className="text-lg text-gray-600">
              Transparency is key to GDPR compliance. Here's how we handle your personal data.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Data We Collect</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-6 py-2">
                  <h4 className="font-semibold text-gray-900">Account Information</h4>
                  <p className="text-gray-600 text-sm">Name, email, password, profile settings</p>
                </div>
                <div className="border-l-4 border-green-500 pl-6 py-2">
                  <h4 className="font-semibold text-gray-900">Document Data</h4>
                  <p className="text-gray-600 text-sm">Uploaded files, processed content, AI interactions</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-6 py-2">
                  <h4 className="font-semibold text-gray-900">Usage Analytics</h4>
                  <p className="text-gray-600 text-sm">Feature usage, performance metrics, error logs</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-6 py-2">
                  <h4 className="font-semibold text-gray-900">Technical Data</h4>
                  <p className="text-gray-600 text-sm">IP address, browser info, device identifiers</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Processing Purposes</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Service Delivery</h4>
                  <p className="text-gray-600 text-sm">Provide AI document processing, chat functionality, and integrations</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Account Management</h4>
                  <p className="text-gray-600 text-sm">User authentication, billing, customer support</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Service Improvement</h4>
                  <p className="text-gray-600 text-sm">AI model training, feature development, bug fixes</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Security & Compliance</h4>
                  <p className="text-gray-600 text-sm">Fraud prevention, security monitoring, legal compliance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Protection Measures */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Data Protection Measures</h2>
            <p className="text-lg text-gray-600">
              We implement comprehensive technical and organizational measures to protect your data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Encryption</h3>
              <p className="text-gray-600 text-sm">AES-256 encryption for all data at rest and in transit</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Access Control</h3>
              <p className="text-gray-600 text-sm">Role-based access with multi-factor authentication</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <Database className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Data Minimization</h3>
              <p className="text-gray-600 text-sm">We only collect data necessary for service provision</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <Eye className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Audit Logging</h3>
              <p className="text-gray-600 text-sm">Comprehensive logging of all data processing activities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Exercise Your Rights */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Exercise Your Rights</h2>
            <p className="text-lg text-gray-600">
              You can exercise your GDPR rights through your account dashboard or by contacting us directly.
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Self-Service Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Download your data from account settings</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Update profile information anytime</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Delete account and all associated data</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-gray-700">Manage consent preferences</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Our DPO</h3>
                <p className="text-gray-700 mb-4">
                  For complex requests or questions about your rights, contact our Data Protection Officer:
                </p>
                <div className="space-y-2 text-gray-700">
                  <div><strong>Email:</strong> dpo@docuquery.com</div>
                  <div><strong>Response Time:</strong> Within 30 days</div>
                  <div><strong>Languages:</strong> English, German, French</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supervisory Authority */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-yellow-800 mb-4">Right to Lodge a Complaint</h3>
                <p className="text-yellow-700 mb-4">
                  If you believe we have not handled your personal data in accordance with GDPR, 
                  you have the right to lodge a complaint with a supervisory authority.
                </p>
                <div className="space-y-2 text-yellow-700">
                  <div><strong>EU Residents:</strong> Contact your local data protection authority</div>
                  <div><strong>UK Residents:</strong> Information Commissioner's Office (ICO)</div>
                  <div><strong>US/Other:</strong> Contact our DPO who will coordinate with appropriate authorities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Questions About GDPR?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our Data Protection Officer is here to help with any privacy-related questions.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact Our DPO
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default GDPR;