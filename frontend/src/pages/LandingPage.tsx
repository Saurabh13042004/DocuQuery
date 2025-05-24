import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, FileText, Zap, Shield } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">DocuQuery</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition duration-150"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Chat with your PDFs using AI
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your documents and get instant answers. DocuQuery uses advanced AI to help you understand and analyze your PDFs faster than ever.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 rounded-lg bg-indigo-600 text-white text-lg font-medium hover:bg-indigo-700 transition duration-150 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Natural Conversations</h3>
            <p className="text-gray-600">Chat naturally with your documents and get accurate, contextual responses instantly.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Get answers in seconds, no matter how large your documents are.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600">Your documents are encrypted and never shared with third parties.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;