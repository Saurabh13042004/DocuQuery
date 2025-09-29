import React, { useState } from 'react';
import { 
  Cloud, 
  Settings, 
  Plus, 
  ExternalLink, 
  AlertCircle, 
  Bookmark,
  MessageCircle,
  Loader,
  Shield,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const IntegrationsPage: React.FC = () => {
  const [showGoogleDriveAuth, setShowGoogleDriveAuth] = useState(false);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Integrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect DocuQuery with your favorite tools and services
          </p>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Google Drive Integration */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Cloud className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Google Drive</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Available</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Sync and import documents directly from Google Drive with real-time synchronization.
            </p>
            <Button size="sm" onClick={() => setShowGoogleDriveAuth(true)} className="w-full">
              <Cloud className="h-4 w-4 mr-2" />
              Connect Drive
            </Button>
          </CardContent>
        </Card>

        {/* Dropbox Integration */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Cloud className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Dropbox</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-600">Coming Soon</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Sync documents with Dropbox cloud storage and manage files seamlessly.
            </p>
            <Button size="sm" disabled className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Under Development
            </Button>
          </CardContent>
        </Card>

        {/* OneDrive Integration */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Cloud className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">OneDrive</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-600">Coming Soon</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Connect with Microsoft OneDrive for seamless Office integration.
            </p>
            <Button size="sm" disabled className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Under Development
            </Button>
          </CardContent>
        </Card>

        {/* Notion Integration */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/10 rounded-lg">
                <Bookmark className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Notion</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-600">Coming Soon</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Import and sync documents from Notion pages and databases.
            </p>
            <Button size="sm" disabled className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Under Development
            </Button>
          </CardContent>
        </Card>

        {/* Slack Integration */}
        <Card className="hover:shadow-lg transition-shadow opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <MessageCircle className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">Slack</CardTitle>
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-orange-600">Coming Soon</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Share document insights and summaries directly to Slack channels.
            </p>
            <Button size="sm" disabled className="w-full">
              <AlertCircle className="h-4 w-4 mr-2" />
              Under Development
            </Button>
          </CardContent>
        </Card>

        {/* Add New Integration */}
        <Card className="hover:shadow-lg transition-shadow border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium text-foreground mb-1">Request Integration</div>
              <p className="text-xs text-muted-foreground mb-3">
                Need a specific integration? Let us know!
              </p>
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Drive Auth Modal */}
      {showGoogleDriveAuth && (
        <GoogleDriveAuthModal onClose={() => setShowGoogleDriveAuth(false)} />
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

export default IntegrationsPage;