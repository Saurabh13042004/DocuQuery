import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, FileText, Zap, Shield, ChevronRight, 
  FolderOpen, History, Trash2, ArrowRight, Check, 
  RefreshCw, ExternalLink, Mail, Upload, Search,
  Star, Download, Users, Globe, UserPlus, Lock,
  Settings, Eye, Edit3, Share2, Cloud, Database,
  Cpu, Brain, FileSpreadsheet, Presentation,
  BookOpen, Image, Video, Music, X, Plus
} from 'lucide-react';

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showBetaPopup, setShowBetaPopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setIsSubmitted(true);
      setEmail('');
      setName('');
      setTimeout(() => {
        setIsSubmitted(false);
        setShowBetaPopup(false);
      }, 3000);
    }
  };

  const handleJoinBeta = () => {
    setShowBetaPopup(true);
  };

  const handleFooterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Redirect to coming soon page
    window.location.href = '#coming-soon';
  };

  // Animated Dashboard Mockup Component
  const DashboardMockup = () => (
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>
        <div className="text-sm text-gray-500">DocuQuery Dashboard</div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">My Documents</h3>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
        
        {/* Document List */}
        <div className="space-y-3">
          {[
            { name: 'Project Proposal.pdf', size: '2.4 MB', status: 'processing', icon: FileText, color: 'text-red-600 bg-red-100' },
            { name: 'Financial Report.xlsx', size: '1.8 MB', status: 'ready', icon: FileSpreadsheet, color: 'text-green-600 bg-green-100' },
            { name: 'Presentation.pptx', size: '3.2 MB', status: 'ready', icon: Presentation, color: 'text-blue-600 bg-blue-100' },
            { name: 'Research Notes.docx', size: '1.1 MB', status: 'ready', icon: BookOpen, color: 'text-purple-600 bg-purple-100' }
          ].map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${doc.color} rounded-lg flex items-center justify-center`}>
                  <doc.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{doc.name}</div>
                  <div className="text-sm text-gray-500">{doc.size}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {doc.status === 'processing' ? (
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
                <MessageSquare className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
                <Edit3 className="w-4 h-4 text-gray-400 hover:text-indigo-600 cursor-pointer transition-colors" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Create New Document */}
        <div className="mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer">
          <div className="flex items-center justify-center space-x-2 text-gray-500 hover:text-indigo-600">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create new document from prompt</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Chat Interface Mockup
  const ChatMockup = () => (
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      <div className="bg-indigo-600 px-6 py-4 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium">Chat with Financial Report.xlsx</div>
            <div className="text-sm text-indigo-200">AI Assistant • Online</div>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4 h-80 overflow-hidden">
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
            <p className="text-sm text-gray-800">Edit the Q3 revenue section to show 25% growth instead</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
            <p className="text-sm">I've updated the Q3 revenue section to reflect 25% growth. The changes have been applied to cells B15-B18.</p>
          </div>
        </div>
        
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2 max-w-xs">
            <p className="text-sm text-gray-800">Can you suggest improvements for next quarter?</p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-medium">AI Suggestion</span>
            </div>
            <p className="text-sm">Based on the data, I suggest focusing on customer retention (currently 78%) and expanding the enterprise segment which shows 45% higher margins.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Folder Organization Mockup
  const FolderMockup = () => (
    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team Workspace</h3>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
              <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              <div className="w-6 h-6 bg-purple-500 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-sm text-gray-500">+5 members</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'Projects', count: 12, color: 'bg-blue-100 text-blue-600', access: 'Team Lead' },
            { name: 'Reports', count: 8, color: 'bg-green-100 text-green-600', access: 'All Members' },
            { name: 'Contracts', count: 15, color: 'bg-purple-100 text-purple-600', access: 'Admin Only' },
            { name: 'Research', count: 6, color: 'bg-orange-100 text-orange-600', access: 'Researchers' }
          ].map((folder, index) => (
            <div key={index} className="group p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 ${folder.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="text-xs text-gray-500">{folder.count} files</div>
              </div>
              <div className="font-medium text-gray-900 mb-1">{folder.name}</div>
              <div className="flex items-center text-xs text-gray-500">
                <Lock className="w-3 h-3 mr-1" />
                {folder.access}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Invite team members</span>
            </div>
            <button className="text-indigo-600 text-sm hover:text-indigo-700">Manage Access</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Integration Cards Component
  const IntegrationCard = ({ icon: Icon, name, description, status, delay }: any) => (
    <div 
      className="animate-fade-in-up opacity-0 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Icon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
      </div>
    </div>
  );

  // Beta Popup Component
  const BetaPopup = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Join Beta Program</h3>
          <button 
            onClick={() => setShowBetaPopup(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Join Beta
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Welcome to the beta!</h4>
            <p className="text-gray-600">We'll send you access details soon.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
        <div 
          className="absolute top-1/2 right-0 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-orange-400/10 rounded-full blur-3xl"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        />
      </div>

      {/* Coming Soon Banner */}
      <div className="relative z-40 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        <p className="relative text-sm font-medium">
          🚀 <span className="font-bold">Coming Soon</span> - Join our exclusive beta program and be first to experience the future
        </p>
      </div>

      {/* Fixed Navigation */}
      <nav className={`fixed top-12 left-0 right-0 z-30 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center group">
            <div className="bg-indigo-600 text-white p-2 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <FileText className="h-8 w-8" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">DocuQuery</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#integrations" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 relative group">
              Integrations
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 relative group">
              How It Works
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <a href="#beta" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors duration-200 relative group">
              Beta
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all duration-200 group-hover:w-full"></span>
            </a>
            <button 
              onClick={handleJoinBeta}
              className="px-6 py-2 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Join Beta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                <div className="inline-flex items-center bg-indigo-100 text-indigo-700 rounded-full px-4 py-2 mb-6 animate-bounce">
                  <Zap className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Powered by Google Gemini AI</span>
                </div>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                  The New Standard
                  <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    for Document Chat
                  </span>
                </h1>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed">
                  No more lengthy messages. No more reading endless documents.
                </p>
                <p className="text-lg text-gray-500 mb-8">
                  Chat with any document - PDFs, Word docs, Excel sheets, PowerPoints, notebooks, and more. Edit documents by simple queries, organize with team collaboration, and experience AI-powered document management like never before.
                </p>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleJoinBeta}
                    className="group px-8 py-4 rounded-full bg-indigo-600 text-white text-lg font-medium hover:bg-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    Join Beta
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                  <button className="px-8 py-4 rounded-full bg-white text-indigo-600 text-lg font-medium border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 md:pl-10">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-100 transform rotate-3 rounded-3xl animate-pulse"></div>
                  <div className="relative z-10 transform hover:scale-105 transition-transform duration-300">
                    <DashboardMockup />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-20 animate-bounce">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trusted By Section */}
      <section className="py-16 border-t border-b border-gray-100 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 font-medium">TRUSTED BY TEAMS AT</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['Google', 'Microsoft', 'Slack', 'Netflix', 'Spotify', 'Amazon'].map((company, index) => (
              <div key={company} className="animate-fade-in-up opacity-0" style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}>
                <div className="text-2xl font-bold text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer">
                  {company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center bg-blue-100 text-blue-700 rounded-full px-6 py-2 mb-8">
                <Cloud className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Enterprise-Grade Integrations</span>
              </div>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Powered by the best in class
              </h2>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <p className="text-xl text-gray-600 leading-relaxed">
                Built on Google's secure infrastructure with enterprise-grade privacy and AI capabilities
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <IntegrationCard 
              icon={Brain} 
              name="Google Gemini" 
              description="Advanced AI processing" 
              status="active" 
              delay={600}
            />
            <IntegrationCard 
              icon={Cloud} 
              name="Google Cloud" 
              description="Secure infrastructure" 
              status="active" 
              delay={700}
            />
            <IntegrationCard 
              icon={Globe} 
              name="Google Drive" 
              description="Document synchronization" 
              status="active" 
              delay={800}
            />
            <IntegrationCard 
              icon={Database} 
              name="AWS" 
              description="Scalable storage" 
              status="active" 
              delay={900}
            />
          </div>

          {/* Why Google Section */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Why Google?</h3>
                </div>
                <p className="text-lg text-gray-600 mb-6">
                  We chose Google's ecosystem for unmatched security, privacy, and AI capabilities. Your documents are protected by the same infrastructure that secures billions of users worldwide.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: Shield, text: "Enterprise-grade security and encryption" },
                    { icon: Lock, text: "GDPR compliant with zero data retention" },
                    { icon: Eye, text: "Complete transparency in data processing" },
                    { icon: Cpu, text: "Advanced AI with responsible development" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <item.icon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
                <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Brain className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Hybrid AI Feature</h4>
                    <p className="text-gray-600">
                      Our AI doesn't just answer questions - it proactively suggests improvements, identifies patterns, and recommends actions based on your document content.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      "Based on your quarterly reports, I notice a 15% increase in customer acquisition costs. Would you like me to analyze the marketing spend breakdown?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Highlight Section */}
      <section id="features" className="py-24 bg-gradient-to-br from-orange-500 to-red-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center bg-white/20 rounded-full px-6 py-2 mb-8">
                <span className="text-sm font-medium">Documents are inevitable. Confusion isn't.</span>
              </div>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                From chaos to clarity in seconds
              </h2>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <p className="text-xl opacity-90 leading-relaxed">
                DocuQuery transforms how you interact with any document type. No more endless scrolling, 
                no more searching through pages. Just ask, edit, and get instant, intelligent responses.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
              <div className="transform hover:scale-105 transition-transform duration-300">
                <ChatMockup />
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Universal Document Chat & Edit</h3>
                  </div>
                  <p className="opacity-90">Chat with PDFs, Word docs, Excel sheets, PowerPoints, notebooks, and more. Edit documents by simple queries without manually reading each line.</p>
                  <div className="flex items-center space-x-2 mt-3">
                    {[FileText, FileSpreadsheet, Presentation, BookOpen, Image].map((Icon, index) => (
                      <div key={index} className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                        <Icon className="w-3 h-3" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      <Plus className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Create Documents from Prompts</h3>
                  </div>
                  <p className="opacity-90">Generate new documents in any format by simple prompts. Create reports, presentations, spreadsheets, and more without starting from scratch.</p>
                </div>
              </div>
              
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '1200ms', animationFillMode: 'forwards' }}>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                      <Brain className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold">Hybrid AI Suggestions</h3>
                  </div>
                  <p className="opacity-90">AI proactively suggests improvements, identifies patterns, and recommends actions based on your document content.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Enhanced Organization Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-indigo-100 mb-8 mx-auto">
                <FolderOpen className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Organization that <span className="italic text-indigo-600">actually works</span>
              </h2>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <p className="text-xl text-gray-600 leading-relaxed">
                Keep your documents organized, accessible, and always ready for intelligent conversations with advanced team collaboration features.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-8">
                <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Team Collaboration</h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Create custom folders, organize by projects or teams, and manage access with role-based permissions. Keep your digital workspace clean, secure, and efficient.
                  </p>
                </div>
                
                <div className="space-y-6">
                  {[
                    { icon: FolderOpen, text: "Unlimited folders and subfolders", delay: '800ms' },
                    { icon: Upload, text: "Drag and drop document management", delay: '1000ms' },
                    { icon: Star, text: "Star important documents for quick access", delay: '1200ms' },
                    { icon: Users, text: "Invite team members with role-based access", delay: '1400ms' }
                  ].map((item, index) => (
                    <div key={index} className="animate-fade-in-up opacity-0" style={{ animationDelay: item.delay, animationFillMode: 'forwards' }}>
                      <div className="flex items-center group">
                        <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                          <item.icon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <p className="ml-4 text-gray-700 font-medium">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                <div className="relative transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-100 to-blue-100 transform -rotate-2 rounded-3xl"></div>
                  <div className="relative z-10">
                    <FolderMockup />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-blue-100 transform rotate-2 rounded-3xl"></div>
                <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Google Drive Integration</h3>
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-800">Syncing documents...</span>
                      </div>
                      <span className="text-xs text-green-600">24 files</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Auto-sync enabled</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">Real-time updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Seamless Google Drive Integration
                </h3>
                <p className="text-lg text-gray-600 mb-6">
                  Connect your Google Drive and automatically sync your documents. 
                  Access and chat with your files from anywhere, anytime.
                </p>
              </div>
              
              <div className="space-y-6">
                {[
                  { icon: RefreshCw, text: "Automatic document synchronization", delay: '400ms' },
                  { icon: ExternalLink, text: "Direct access to Google Drive files", delay: '600ms' },
                  { icon: Shield, text: "Secure, encrypted connections", delay: '800ms' },
                  { icon: Users, text: "Team collaboration features", delay: '1000ms' }
                ].map((item, index) => (
                  <div key={index} className="animate-fade-in-up opacity-0" style={{ animationDelay: item.delay, animationFillMode: 'forwards' }}>
                    <div className="flex items-center group">
                      <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-200">
                        <item.icon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <p className="ml-4 text-gray-700 font-medium">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Beta Section */}
      <section id="beta" className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
                <span className="text-sm font-medium">🎉 Limited Beta Access</span>
              </div>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Join the Future of Document Management
              </h2>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <p className="text-xl opacity-90 mb-12 leading-relaxed">
                Be among the first to experience DocuQuery. Help shape the future of how teams 
                interact with documents. Limited spots available for our exclusive beta program.
              </p>
            </div>
            
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
              <button
                onClick={handleJoinBeta}
                className="bg-white text-indigo-600 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Join Beta Program
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
              <div className="flex items-center mb-6">
                <div className="bg-indigo-600 text-white p-2 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="ml-3 text-xl font-bold">DocuQuery</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                The intelligent document assistant that transforms how you interact with any document type. 
                Powered by advanced AI for instant, accurate responses.
              </p>
              <div className="flex space-x-4">
                {['twitter', 'linkedin', 'github'].map((social, index) => (
                  <div key={social} className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                    <div className="w-5 h-5 bg-gray-400"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {[
              {
                title: 'Product',
                links: ['Features', 'Integrations', 'Pricing', 'Use Cases', 'Security', 'API'],
                delay: '200ms'
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Contact', 'Press'],
                delay: '400ms'
              },
              {
                title: 'Resources',
                links: ['Documentation', 'Help Center', 'Community', 'Status', 'Changelog'],
                delay: '600ms'
              }
            ].map((section, index) => (
              <div key={section.title} className="animate-fade-in-up opacity-0" style={{ animationDelay: section.delay, animationFillMode: 'forwards' }}>
                <h4 className="text-lg font-semibold mb-6">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#coming-soon" onClick={handleFooterClick} className="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} DocuQuery. All rights reserved. • Powered by Google Gemini
              </p>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
              <div className="flex space-x-6 text-sm">
                <a href="#coming-soon" onClick={handleFooterClick} className="text-gray-400 hover:text-white transition-colors duration-200">Privacy</a>
                <a href="#coming-soon" onClick={handleFooterClick} className="text-gray-400 hover:text-white transition-colors duration-200">Terms</a>
                <a href="#coming-soon" onClick={handleFooterClick} className="text-gray-400 hover:text-white transition-colors duration-200">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Beta Popup */}
      {showBetaPopup && <BetaPopup />}
      
      {/* Enhanced CSS Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.6s ease-out forwards;
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default App;