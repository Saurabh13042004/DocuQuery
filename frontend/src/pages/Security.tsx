import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Shield, Lock, Eye, 
  CheckCircle, AlertTriangle, Server, Users,
  Award, Zap, Globe
} from 'lucide-react';
import Footer from '../components/Footer';

const Security: React.FC = () => {
  const certifications = [
    {
      name: "SOC 2 Type II",
      description: "Annual third-party security audits",
      icon: Award,
      status: "Certified"
    },
    {
      name: "ISO 27001",
      description: "International security management standard",
      icon: Shield,
      status: "Compliant"
    },
    {
      name: "GDPR",
      description: "European data protection regulation",
      icon: Eye,
      status: "Compliant"
    },
    {
      name: "HIPAA",
      description: "Healthcare data protection standards",
      icon: Lock,
      status: "Ready"
    }
  ];

  const securityMeasures = [
    {
      category: "Data Encryption",
      icon: Lock,
      measures: [
        "AES-256 encryption for data at rest",
        "TLS 1.3 for data in transit",
        "End-to-end encryption for document processing",
        "Encrypted database connections and backups"
      ]
    },
    {
      category: "Access Control",
      icon: Users,
      measures: [
        "Multi-factor authentication (MFA) required",
        "Role-based access control (RBAC)",
        "Single sign-on (SSO) integration",
        "Regular access reviews and deprovisioning"
      ]
    },
    {
      category: "Infrastructure",
      icon: Server,
      measures: [
        "AWS enterprise-grade cloud infrastructure",
        "Redundant systems with 99.9% uptime SLA",
        "Automated security monitoring and alerting",
        "Regular vulnerability assessments and penetration testing"
      ]
    },
    {
      category: "Monitoring",
      icon: Eye,
      measures: [
        "24/7 security operations center (SOC)",
        "Real-time threat detection and response",
        "Comprehensive audit logging and retention",
        "Incident response and disaster recovery plans"
      ]
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
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Security & <span className="text-blue-600">Compliance</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade security measures protect your documents and data. 
            We maintain the highest standards of security, privacy, and compliance.
          </p>
        </div>
      </section>

      {/* Security Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security First Approach</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Security is built into every layer of our architecture. From data encryption 
              to access controls, we ensure your documents are protected at all times.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Encryption</h3>
              <p className="text-gray-600 text-sm">AES-256 encryption protects data at rest and in transit</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Control</h3>
              <p className="text-gray-600 text-sm">Multi-factor authentication and role-based permissions</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitoring</h3>
              <p className="text-gray-600 text-sm">24/7 security monitoring and threat detection</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance</h3>
              <p className="text-gray-600 text-sm">SOC 2, ISO 27001, and GDPR compliance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Certifications & Compliance</h2>
            <p className="text-lg text-gray-600">
              We maintain industry-leading certifications and compliance standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <cert.icon className="w-8 h-8 text-blue-600" />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cert.status === 'Certified' ? 'bg-green-100 text-green-800' :
                    cert.status === 'Compliant' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{cert.name}</h3>
                <p className="text-gray-600 text-sm">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Measures</h2>
            <p className="text-lg text-gray-600">
              Comprehensive security controls protect every aspect of our service.
            </p>
          </div>

          <div className="space-y-8">
            {securityMeasures.map((category, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <category.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {category.measures.map((measure, measureIndex) => (
                    <div key={measureIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{measure}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Incident Response</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our dedicated security team monitors threats 24/7 and follows established 
                incident response procedures to quickly identify, contain, and resolve security issues.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Detection & Analysis</h3>
                    <p className="text-gray-600 text-sm">Automated systems and security analysts identify potential threats</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Containment</h3>
                    <p className="text-gray-600 text-sm">Immediate action to isolate and prevent spread of security incidents</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recovery & Communication</h3>
                    <p className="text-gray-600 text-sm">Restore services and communicate with affected customers transparently</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 text-center">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">&lt; 15 min</div>
                  <div className="text-sm text-gray-600">Detection Time</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <Globe className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Monitoring</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">Expert</div>
                  <div className="text-sm text-gray-600">Security Team</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime SLA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Contact */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-800 mb-4">Report Security Issues</h3>
                <p className="text-red-700 mb-6">
                  If you discover a security vulnerability, please report it to us immediately. 
                  We take all security reports seriously and will investigate promptly.
                </p>
                <div className="space-y-2 text-red-700">
                  <div><strong>Security Email:</strong> security@docuquery.com</div>
                  <div><strong>PGP Key:</strong> Available on our website</div>
                  <div><strong>Response Time:</strong> Within 24 hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Questions About Security?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our security team is available to discuss our measures and compliance standards.
          </p>
          <Link 
            to="/contact"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact Security Team
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Security;