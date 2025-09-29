import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Briefcase, MapPin, 
  Clock, DollarSign, Users, Zap, Heart,
  ArrowRight, Star, Award, Coffee
} from 'lucide-react';
import Footer from '../components/Footer';

const Careers: React.FC = () => {
  const openPositions = [
    {
      id: 1,
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "Remote / San Francisco",
      type: "Full-time",
      salary: "$150k - $200k",
      description: "Join our AI team to build the next generation of document processing technology.",
      requirements: ["5+ years in AI/ML", "Python, TensorFlow/PyTorch", "NLP experience", "PhD preferred"],
      featured: true
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "Remote / New York",
      type: "Full-time",
      salary: "$120k - $160k",
      description: "Design intuitive user experiences for our AI-powered document platform.",
      requirements: ["4+ years UX/UI design", "Figma, Sketch expertise", "SaaS experience", "User research skills"]
    },
    {
      id: 3,
      title: "Full-Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$130k - $170k",
      description: "Build scalable web applications and APIs for our document processing platform.",
      requirements: ["React, TypeScript", "Node.js, Python", "Cloud platforms", "3+ years experience"]
    },
    {
      id: 4,
      title: "Customer Success Manager",
      department: "Success",
      location: "Remote / Austin",
      type: "Full-time",
      salary: "$90k - $120k",
      description: "Help our customers achieve success with DocuQuery and drive product adoption.",
      requirements: ["2+ years customer success", "SaaS background", "Excellent communication", "Analytics mindset"]
    },
    {
      id: 5,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote / Los Angeles",
      type: "Full-time",
      salary: "$100k - $130k",
      description: "Drive growth through strategic marketing initiatives and brand development.",
      requirements: ["3+ years marketing", "B2B SaaS experience", "Content creation", "Analytics tools"]
    },
    {
      id: 6,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "$140k - $180k",
      description: "Build and maintain our cloud infrastructure and deployment pipelines.",
      requirements: ["AWS/Azure/GCP", "Kubernetes, Docker", "CI/CD pipelines", "Infrastructure as Code"]
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance plus wellness stipend"
    },
    {
      icon: Zap,
      title: "Flexible Work",
      description: "Remote-first culture with flexible hours and unlimited PTO"
    },
    {
      icon: Award,
      title: "Equity Package",
      description: "Competitive equity package in a fast-growing AI company"
    },
    {
      icon: Coffee,
      title: "Learning Budget",
      description: "$2,000 annual learning and development budget"
    },
    {
      icon: Users,
      title: "Team Events",
      description: "Regular team retreats and virtual social events"
    },
    {
      icon: Star,
      title: "Top Equipment",
      description: "Latest MacBook Pro, monitor, and home office setup"
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
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Join Our <span className="text-blue-600">Mission</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Help us revolutionize how people interact with documents. Build the future 
            of AI-powered document processing with a passionate, remote-first team.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>50+ employees</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Remote-first</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Fast growing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why DocuQuery Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Work at DocuQuery?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We're not just building software – we're creating the future of how 
                humans interact with documents. Our AI can edit PDFs in real-time 
                through natural language, something that was science fiction just 
                a few years ago.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Cutting-edge AI Technology</h3>
                    <p className="text-gray-600">Work with the latest in NLP, computer vision, and machine learning.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Impact at Scale</h3>
                    <p className="text-gray-600">Your work directly impacts 50,000+ users worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Growth Opportunity</h3>
                    <p className="text-gray-600">Join a fast-growing startup with unlimited career potential.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">99%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">$10M</div>
                <div className="text-gray-600">Series A Raised</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-6">
                <div className="text-3xl font-bold text-orange-600 mb-2">100+</div>
                <div className="text-gray-600">Integrations</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Benefits & Perks</h2>
            <p className="text-xl text-gray-600">
              We take care of our team so they can focus on building amazing things.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Open Positions</h2>
            <p className="text-xl text-gray-600">
              Find your next career opportunity with us.
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((position) => (
              <div 
                key={position.id} 
                className={`bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-shadow ${
                  position.featured ? 'border-blue-200 ring-2 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{position.title}</h3>
                      {position.featured && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{position.department}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{position.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{position.type}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>{position.salary}</span>
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{position.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {position.requirements.map((req, index) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 lg:mt-0 lg:ml-6">
                    <button className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center">
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Don't see a role that fits? We're always looking for exceptional talent.
            </p>
            <button className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors">
              Send Us Your Resume
            </button>
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Culture</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in creating an environment where everyone can do their best work 
              while maintaining a healthy work-life balance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Inclusive & Diverse</h3>
              <p className="text-gray-600">
                We celebrate different perspectives and backgrounds. Our diverse team 
                makes us stronger and more innovative.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Move Fast & Iterate</h3>
              <p className="text-gray-600">
                We ship early, learn fast, and iterate quickly. Your ideas can go from 
                concept to production in days, not months.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Collaborate & Support</h3>
              <p className="text-gray-600">
                We win together and support each other. Every team member's success 
                contributes to our collective achievement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join Us?</h2>
          <p className="text-xl mb-8 opacity-90">
            Be part of the team that's revolutionizing document processing with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
              View All Positions
            </button>
            <button className="border border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Learn About Our Culture
            </button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Careers;