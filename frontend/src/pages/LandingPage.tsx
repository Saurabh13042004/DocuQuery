import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, FileText, Shield, ArrowRight, 
  Check, Upload, Star, Users, Globe, 
  Headphones, Mail, Edit3,
  ChevronDown, ChevronUp, Zap, Lock, Play,
  Database, Brain, BookOpen
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Handle email submission
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DocuQuery</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#integrations" className="text-gray-600 hover:text-gray-900 transition-colors">Integrations</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#docs" className="text-gray-600 hover:text-gray-900 transition-colors">Docs</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
              <Link to="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* <div className="mb-8">
            <span className="text-blue-600 text-sm font-semibold tracking-wider uppercase">
              AI Document Processing
            </span>
          </div> */}
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Chat & <span className="text-blue-600 relative">
              Edit
              {/* <Edit3 className="w-8 h-8 text-blue-500 absolute -top-2 -right-10" /> */}
            </span>{' '}
            your documents instantly
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            The world's first AI that lets you <strong>edit PDFs while chatting</strong>. 
            Say "Change name from John to Adam" and watch it happen in 1-2 seconds. 
            Plus convert to audiobooks and integrate with your favorite tools.
          </p>
          
          {/* USP Highlight */}
          <div className="glassmorphism-card mx-auto mb-12 max-w-2xl p-6 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center space-x-4 text-gray-800">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold">Real-time PDF Editing</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="font-semibold">AI Conversations</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <Headphones className="w-5 h-5 text-purple-500" />
                <span className="font-semibold">Audio Generation</span>
              </div>
            </div>
          </div>

          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-16">
            <form onSubmit={handleSubmit} className="flex bg-gray-100 rounded-2xl p-2">
              <div className="flex-1 flex items-center px-4">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                Get Started
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-20 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
              Powerful Features
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              Features that you{' '}
              <span className="text-blue-400">📝</span>{' '}
              need.
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Transform documents that normally take hours to process, in minutes. 
              Real-time PDF editing while chatting. Document conversion in 2 minutes. 
              Cloud sync in 2 minutes. You get the idea.
            </p>
          </div>

          {/* Interactive Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {[
              { id: 0, icon: Upload, label: 'Upload Files' },
              { id: 1, icon: MessageSquare, label: 'AI Conversations' },
              { id: 2, icon: Shield, label: 'Data Protection' },
              { id: 3, icon: Headphones, label: 'Audio Generation' }
            ].map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`px-6 py-3 rounded-full flex items-center space-x-2 transition-all duration-300 ${
                  activeFeature === feature.id
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <feature.icon className="w-5 h-5" />
                <span>{feature.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic Feature Content */}
          <div className="glassmorphism-card bg-gray-800/50 backdrop-blur-md border border-gray-700/50 rounded-3xl p-8">
            {activeFeature === 0 && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Smart File Upload</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Drag and drop any document format. Our AI automatically processes PDFs, Word docs, 
                    PowerPoint presentations, and more. Advanced OCR for scanned documents.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Supports 50+ file formats</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Advanced OCR for scanned documents</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Batch upload up to 100 files</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="space-y-3">
                    {['Resume.pdf', 'Report.docx', 'Presentation.pptx'].map((file, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium">{file}</div>
                          <div className="text-sm text-gray-400">Processing...</div>
                        </div>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeFeature === 1 && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">AI Chat & Real-time Editing</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Our revolutionary AI doesn't just chat - it edits your PDFs in real-time. 
                    Ask to change names, dates, or any content and watch it happen instantly.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>Real-time PDF editing while chatting</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span>Advanced natural language processing</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                      <span>Instant document modifications</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm p-3 ml-8">
                      "Change the name from John to Adam in my resume"
                    </div>
                    <div className="bg-white/10 rounded-2xl rounded-br-sm p-3 mr-8">
                      ✨ Done! I've updated all instances of 'John' to 'Adam' in your resume. The changes are highlighted for your review.
                    </div>
                    <div className="bg-blue-500 text-white rounded-2xl rounded-bl-sm p-3 ml-8">
                      "Now update the phone number to +1-555-0123"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeature === 2 && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Your documents are protected with military-grade encryption. 
                    Zero-knowledge architecture ensures only you can access your content.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>AES-256 encryption at rest</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Zero-knowledge architecture</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>SOC 2 Type II compliant</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Lock className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="font-semibold">Encrypted</div>
                      <div className="text-sm text-gray-400">AES-256</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <div className="font-semibold">Protected</div>
                      <div className="text-sm text-gray-400">99.9% Uptime</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Database className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <div className="font-semibold">Backup</div>
                      <div className="text-sm text-gray-400">3x Redundancy</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="font-semibold">Compliant</div>
                      <div className="text-sm text-gray-400">SOC 2</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeFeature === 3 && (
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-6">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">AI-Powered Audiobooks</h3>
                  <p className="text-gray-300 text-lg mb-6">
                    Transform any document into a high-quality audiobook with natural-sounding AI voices. 
                    Perfect for learning on the go or accessibility needs.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>50+ natural AI voices</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Multiple languages supported</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Adjustable speed and tone</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="bg-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">Annual Report 2024.pdf</div>
                          <div className="text-sm text-gray-400">Converting to audiobook...</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Voice: Sarah (Professional)</span>
                        <span>Speed: 1.2x</span>
                      </div>
                      <div className="bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 rounded-full h-2" style={{ width: '75%' }}></div>
                      </div>
                      <div className="flex items-center justify-center space-x-4">
                        <Play className="w-8 h-8 text-orange-400" />
                        <span className="text-sm">3:42 / 15:30</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Better, together.
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Want to share your insights with your team? Well you might. 
                Fortunately DocuQuery supports that. Invite your colleagues or 
                team members to your workspace in seconds, then use 
                DocuQuery together.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                Join multiple teams with your account, have control over 
                different projects.
              </p>
              <a href="#docs" className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                See Documentation
                <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="bg-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  Invite People
                </h3>
                <p className="text-gray-600 mb-4">Invite your members to join your workspace</p>
                
                <div className="flex mb-4">
                  <input
                    type="email"
                    placeholder="Add email address"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-r-lg hover:bg-blue-700">
                    Send
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Members (2/10)</div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-700">L</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Lisa Klausson (You)</div>
                          <div className="text-xs text-gray-500">lisa@docuquery.com</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">O</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Oguz Yagiz Kara</div>
                          <div className="text-xs text-gray-500">oguz@docuquery.com</div>
                        </div>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Invite Sent
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">DocuQuery</span>
                </div>
                <span className="text-sm text-gray-500">docuquery.com</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 text-sm font-semibold tracking-wider uppercase">
              Integrations
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Works with your{' '}
              <span className="text-blue-600">favorite tools</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Seamlessly connect DocuQuery with the tools you already use. 
              One-click integration with popular cloud storage and productivity platforms.
            </p>
          </div>

          {/* Real Integration Logos */}
          <div className="relative">
            <div className="flex justify-center items-center flex-wrap gap-8 mb-12">
              {/* Google Drive */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png"
                  alt="Google Drive"
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* OneDrive */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2022/04/OneDrive-Symbol.png"
                  alt="OneDrive"
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* Atlassian */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://logos-world.net/wp-content/uploads/2023/03/Atlassian-Logo.png"
                  alt="Atlassian"
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* Zoho */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/ZOHO_logo_2023.svg/2560px-ZOHO_logo_2023.svg.png"
                  alt="Zoho"
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* AWS */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/2560px-Amazon_Web_Services_Logo.svg.png"
                  alt="Amazon Web Services"
                  className="w-12 h-12 object-contain"
                />
              </div>

              {/* Microsoft Azure */}
              <div className="w-24 h-24 bg-white shadow-lg rounded-2xl flex items-center justify-center hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/2048px-Microsoft_Azure.svg.png"
                  alt="Microsoft Azure"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>

            {/* Floating Animation */}
            <div className="absolute top-0 left-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-10 animate-float"></div>
            <div className="absolute top-8 right-1/4 w-12 h-12 bg-purple-500 rounded-full opacity-10 animate-float-delay"></div>
          </div>

          {/* Integration Features Grid */}
          <div className="glassmorphism-card bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Cloud Storage</h3>
                <p className="text-gray-600">Direct access to Google Drive, OneDrive, Dropbox, and more</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Team Collaboration</h3>
                <p className="text-gray-600">Seamless integration with Slack, Teams, and Atlassian tools</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2 text-lg">Productivity Suite</h3>
                <p className="text-gray-600">Connect with Office 365, G Suite, and Zoho Workplace</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <span className="text-blue-400 text-sm font-semibold tracking-wider uppercase">
              Let's Get Started!
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Intelligent Document Processing
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Create your account and start processing documents with AI. 
            Upload, chat, convert, and sync - it only takes 2 minutes to 
            setup your workspace.
          </p>

          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-2">
              <div className="flex-1 flex items-center px-4">
                <Mail className="w-5 h-5 text-gray-300 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-white text-gray-900 px-8 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
              >
                Get Started
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-blue-600 text-sm font-semibold tracking-wider uppercase">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-4 mb-6">
              Frequently asked questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "How does the real-time PDF editing work?",
                answer: "Our revolutionary AI doesn't just chat - it actually edits your PDFs in real-time. Simply ask to change names, dates, addresses, or any content and watch it happen instantly. For example, say 'Change the name from John to Adam' and see it updated in 1-2 seconds across your entire document."
              },
              {
                question: "What file formats are supported?",
                answer: "We support PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Excel (XLS/XLSX), text files, and most image formats with OCR capabilities. Our advanced AI can process over 50 different file types."
              },
              {
                question: "Is my data secure?",
                answer: "Yes, we use enterprise-grade AES-256 encryption and follow strict security protocols. Your documents are encrypted both in transit and at rest. We're SOC 2 Type II compliant with zero-knowledge architecture - only you can access your content."
              },
              {
                question: "Can I integrate with my existing tools?",
                answer: "Absolutely! DocuQuery integrates seamlessly with Google Drive, OneDrive, Dropbox, Atlassian tools, Slack, Microsoft Teams, Zoho Workplace, and many more. One-click integration gets you started in seconds."
              },
              {
                question: "How accurate is the AI and document conversion?",
                answer: "Our AI-powered processing achieves 99%+ accuracy for most document types, with advanced OCR for scanned documents. The real-time editing feature maintains formatting integrity while making precise content changes."
              },
              {
                question: "Can I convert documents to audiobooks?",
                answer: "Yes! Our AI can convert any document to high-quality audiobooks with 50+ natural-sounding voices in multiple languages. Perfect for learning on the go, accessibility needs, or when you prefer listening to reading."
              }
            ].map((faq, index) => (
              <div key={index} className="glassmorphism-card bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <div className="flex-shrink-0 ml-4">
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DocuQuery</span>
              </div>
              <p className="text-gray-400 text-sm">
                Intelligent document processing powered by AI. Chat, convert, and collaborate with your documents.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#integrations" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/gdpr" className="hover:text-white transition-colors">GDPR</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 DocuQuery. All rights reserved. Made with ❤️ for document lovers.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite 2s;
        }

        .animate-float-delay {
          animation: float 8s ease-in-out infinite 3s;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .glassmorphism-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }

        .glassmorphism-card:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }

        /* Grainy texture effect */
        .glassmorphism-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(255,255,255,.15) 1px, transparent 0);
          background-size: 20px 20px;
          opacity: 0.5;
          pointer-events: none;
          border-radius: inherit;
        }

        /* Enhanced gradient backgrounds */
        .gradient-bg {
          background: linear-gradient(135deg, 
            rgba(99, 102, 241, 0.1) 0%, 
            rgba(219, 234, 254, 0.1) 25%, 
            rgba(252, 231, 243, 0.1) 50%, 
            rgba(233, 213, 255, 0.1) 75%, 
            rgba(186, 230, 253, 0.1) 100%);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;