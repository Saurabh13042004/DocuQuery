import React, { useState, useEffect } from 'react';
import { 
  Loader, 
  Headphones, 
  Music, 
  Cloud, 
  RefreshCw, 
  FileText, 
  FileImage,
  Presentation,
  Sparkles,
  Shield,
  MessageCircle,
  Zap,
  TrendingUp,
  Calendar,
  CreditCard,
  Crown,
  BarChart3,
  Activity,
  RotateCcw
} from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { useSearch } from '../context/SearchContext';
import UploadModal from '../components/UploadModal';
import DashboardHeader from '../components/DashboardHeader';

import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


const Dashboard: React.FC = () => {
  const { documents, fetchUserDocuments } = usePdf();
  const { searchQuery, setSearchQuery } = useSearch();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showGoogleDriveAuth, setShowGoogleDriveAuth] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showAudiobookModal, setShowAudiobookModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();


  // Add to Dashboard.tsx, just after the initial useEffect
  useEffect(() => {
    if (location.state) {
      // Check if we should open the upload modal
      if (location.state.openUploadModal) {
        setShowUploadModal(true);
      }



      // Clear the location state after handling
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // Refresh documents when the component mounts
  useEffect(() => {
    fetchUserDocuments();
  }, []);





  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <DashboardHeader
        onUploadClick={() => setShowUploadModal(true)}
        searchQuery={searchQuery || ''}
        onSearchChange={(value) => setSearchQuery && setSearchQuery(value)}
        filterCategory={filterCategory}
        onFilterChange={setFilterCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {/* Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to DocuQuery
                </h1>
                <p className="text-muted-foreground">
                  Transform your documents with AI-powered chat, conversion, and integration tools
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{documents.length}</div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                </div>
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Chat & Edit Feature */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <MessageCircle className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Chat & Edit</CardTitle>
                    <p className="text-xs text-muted-foreground">AI-powered conversations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Interact with your PDFs using natural language and get intelligent responses.
                </p>
                <Button size="sm" className="w-full group-hover:shadow-md transition-shadow">
                  Start Chatting
                </Button>
              </CardContent>
            </Card>

            {/* PDF to Audiobook Feature */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50" onClick={() => setShowAudiobookModal(true)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                    <Headphones className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">PDF to Audio</CardTitle>
                    <p className="text-xs text-muted-foreground">Text-to-speech conversion</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Convert your documents into high-quality audiobooks with AI voices.
                </p>
                <Button size="sm" className="w-full group-hover:shadow-md transition-shadow">
                  <Music className="h-4 w-4 mr-2" />
                  Create Audiobook
                </Button>
              </CardContent>
            </Card>

            {/* Document Converter Feature */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50" onClick={() => setShowConvertModal(true)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-xl group-hover:bg-orange-500/20 transition-colors">
                    <RefreshCw className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Convert Docs</CardTitle>
                    <p className="text-xs text-muted-foreground">Multiple format support</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Convert between PDF, DOC, DOCX, TXT, PPT, and image formats.
                </p>
                <Button size="sm" className="w-full group-hover:shadow-md transition-shadow">
                  <Zap className="h-4 w-4 mr-2" />
                  Convert Now
                </Button>
              </CardContent>
            </Card>

            {/* Sync & Integrations Feature */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-primary/50" onClick={() => setShowGoogleDriveAuth(true)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                    <Cloud className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Sync & Import</CardTitle>
                    <p className="text-xs text-muted-foreground">Cloud integrations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with Google Drive, Dropbox, and other cloud platforms.
                </p>
                <Button size="sm" className="w-full group-hover:shadow-md transition-shadow">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Connect Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Dashboard Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{documents.length}</div>
                    <div className="text-sm text-muted-foreground">PDFs Uploaded</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
                    <div className="text-sm text-muted-foreground">Documents Edited</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
                    <div className="text-sm text-muted-foreground">Synced Files</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{documents.filter(d => d.starred).length}</div>
                    <div className="text-sm text-muted-foreground">Starred Docs</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Activity</span>
                    <span className="font-medium flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      2 days ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing & Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Usage & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    <span className="font-medium">Pro Plan</span>
                  </div>
                  <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>

                {/* Token Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">API Tokens Used</span>
                    <span className="font-medium">2,450 / 10,000</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '24.5%' }}></div>
                  </div>
                </div>

                {/* Storage Usage */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Storage Used</span>
                    <span className="font-medium">156 MB / 5 GB</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '3.1%' }}></div>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Next Billing</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Oct 29, 2025
                    </span>
                  </div>
                </div>

                {/* Upgrade Button */}
                <Button variant="outline" size="sm" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
      
      {showGoogleDriveAuth && (
        <GoogleDriveAuthModal onClose={() => setShowGoogleDriveAuth(false)} />
      )}
      
      {showConvertModal && (
        <ConvertDocumentModal onClose={() => setShowConvertModal(false)} />
      )}
      
      {showAudiobookModal && (
        <AudiobookModal onClose={() => setShowAudiobookModal(false)} />
      )}
    </div>
  );
};

// Google Drive Auth Modal Component
const GoogleDriveAuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleGoogleAuth = async () => {
    setIsConnecting(true);
    // Simulate Google OAuth flow
    setTimeout(() => {
      setIsConnecting(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-green-500" />
            Connect Google Drive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect your Google Drive to seamlessly sync and import your documents.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-sm">Secure Authentication</div>
                <div className="text-xs text-muted-foreground">OAuth 2.0 protected</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-sm">Auto Sync</div>
                <div className="text-xs text-muted-foreground">Real-time synchronization</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGoogleAuth} 
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4 mr-2" />
              )}
              {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Convert Document Modal Component
const ConvertDocumentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedFromFormat, setSelectedFromFormat] = useState<string>('pdf');
  const [selectedToFormat, setSelectedToFormat] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  
  const formats = [
    { id: 'pdf', name: 'PDF Document', icon: FileText, color: 'text-red-500' },
    { id: 'docx', name: 'Word Document', icon: FileText, color: 'text-blue-500' },
    { id: 'txt', name: 'Text File', icon: FileText, color: 'text-gray-500' },
    { id: 'pptx', name: 'PowerPoint', icon: Presentation, color: 'text-orange-500' },
    { id: 'jpg', name: 'Image (JPG)', icon: FileImage, color: 'text-green-500' },
    { id: 'png', name: 'Image (PNG)', icon: FileImage, color: 'text-purple-500' },
  ];

  const handleConvert = async () => {
    if (!selectedToFormat || selectedFromFormat === selectedToFormat) return;
    setIsConverting(true);
    // Simulate conversion process
    setTimeout(() => {
      setIsConverting(false);
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-orange-500" />
            Convert Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert between different document formats easily.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Format */}
            <div className="space-y-3">
              <div className="text-sm font-medium">From:</div>
              <div className="space-y-2">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={`from-${format.id}`}
                      onClick={() => setSelectedFromFormat(format.id)}
                      className={`w-full p-2 border rounded-lg text-left transition-colors ${
                        selectedFromFormat === format.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${format.color}`} />
                        <div className="text-xs font-medium">{format.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* To Format */}
            <div className="space-y-3">
              <div className="text-sm font-medium">To:</div>
              <div className="space-y-2">
                {formats.filter(f => f.id !== selectedFromFormat).map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={`to-${format.id}`}
                      onClick={() => setSelectedToFormat(format.id)}
                      className={`w-full p-2 border rounded-lg text-left transition-colors ${
                        selectedToFormat === format.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${format.color}`} />
                        <div className="text-xs font-medium">{format.name}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedFromFormat && selectedToFormat && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-center">
                Converting: <span className="font-medium">{formats.find(f => f.id === selectedFromFormat)?.name}</span> → <span className="font-medium">{formats.find(f => f.id === selectedToFormat)?.name}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleConvert} 
              disabled={!selectedToFormat || selectedFromFormat === selectedToFormat || isConverting}
              className="flex-1"
            >
              {isConverting ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isConverting ? 'Converting...' : 'Start Conversion'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Audiobook Modal Component
const AudiobookModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedVoice, setSelectedVoice] = useState('natural');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const voices = [
    { id: 'natural', name: 'Natural Voice', description: 'Human-like, clear pronunciation' },
    { id: 'professional', name: 'Professional', description: 'Business-ready, authoritative' },
    { id: 'casual', name: 'Casual', description: 'Friendly, conversational tone' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate audiobook generation
    setTimeout(() => {
      setIsGenerating(false);
      onClose();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-purple-500" />
            Create Audiobook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Convert your PDF to a high-quality audiobook with AI-powered voice synthesis.
          </p>
          <div className="space-y-3">
            <div className="text-sm font-medium">Select voice style:</div>
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`w-full p-3 border rounded-lg text-left transition-colors ${
                  selectedVoice === voice.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted'
                }`}
              >
                <div className="font-medium text-sm">{voice.name}</div>
                <div className="text-xs text-muted-foreground">{voice.description}</div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Music className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Audiobook'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;