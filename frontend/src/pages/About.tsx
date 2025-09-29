import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Users, Target,
  ArrowLeft, Zap, Shield, Globe,
  Heart, Code, Lightbulb, Star
} from 'lucide-react';
import Footer from '../components/Footer';

const About: React.FC = () => {
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
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About <span className="text-blue-600">DocuQuery</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We're revolutionizing how people interact with documents through AI-powered 
            real-time editing, intelligent conversations, and seamless integrations.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                To eliminate the friction between humans and their documents. We believe that 
                interacting with documents should be as natural as having a conversation, 
                and editing should happen at the speed of thought.
              </p>
              <p className="text-lg text-gray-600">
                Our revolutionary AI doesn't just read your documents - it understands them, 
                converses about them, and can edit them in real-time based on your natural 
                language instructions.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Instant Editing</div>
                  <div className="text-sm text-gray-600">Real-time PDF changes</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Secure</div>
                  <div className="text-sm text-gray-600">Enterprise-grade security</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <Globe className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Global</div>
                  <div className="text-sm text-gray-600">100+ integrations</div>
                </div>
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
                  <div className="font-semibold text-gray-900">Loved</div>
                  <div className="text-sm text-gray-600">50K+ users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-xl text-gray-600">
              Born from frustration, built with passion.
            </p>
          </div>
          
          <div className="space-y-12">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">The Problem</h3>
                <p className="text-gray-600 leading-relaxed">
                  In 2024, our founders were spending countless hours manually editing PDFs, 
                  switching between multiple tools, and struggling to extract meaningful insights 
                  from complex documents. There had to be a better way.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">The Solution</h3>
                <p className="text-gray-600 leading-relaxed">
                  We envisioned an AI that could not only understand documents but actually 
                  edit them in real-time. After months of research and development, we created 
                  the first AI system capable of making precise document edits through natural 
                  language conversations.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">The Future</h3>
                <p className="text-gray-600 leading-relaxed">
                  Today, DocuQuery is trusted by over 50,000 users worldwide. We're continuously 
                  pushing the boundaries of what's possible with AI-powered document processing, 
                  with exciting features like collaborative editing and advanced automation 
                  coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation First</h3>
              <p className="text-gray-600">
                We constantly push the boundaries of what's possible with AI and document 
                processing technology.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">User-Centric</h3>
              <p className="text-gray-600">
                Every feature we build is designed with our users' needs and workflows 
                at the center.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Security & Privacy</h3>
              <p className="text-gray-600">
                We believe your documents are your private property and protect them 
                with enterprise-grade security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Team</h2>
            <p className="text-xl text-gray-600">
              Meet the passionate individuals behind DocuQuery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">SK</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Saurabh Kumar</h3>
              <p className="text-blue-600 font-medium mb-3">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                Former AI researcher with expertise in natural language processing 
                and document understanding systems.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">AS</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Alex Smith</h3>
              <p className="text-green-600 font-medium mb-3">CTO & Co-Founder</p>
              <p className="text-gray-600 text-sm">
                Full-stack engineer and machine learning expert with 10+ years 
                building scalable AI systems.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">MJ</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Maria Johnson</h3>
              <p className="text-purple-600 font-medium mb-3">Head of Product</p>
              <p className="text-gray-600 text-sm">
                Product strategist with extensive experience in SaaS platforms 
                and user experience design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to revolutionize your workflow?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are already experiencing the future of document processing.
          </p>
          <Link 
            to="/"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default About;