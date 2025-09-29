import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import ChatView from './pages/ChatView';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RecentPage from './pages/RecentPage';
import StarredPage from './pages/StarredPage';
import IntegrationsPage from './pages/IntegrationsPage';
import About from './pages/About';
import Blog from './pages/Blog';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Security from './pages/Security';
import GDPR from './pages/GDPR';
import { PdfProvider } from './context/PdfContext';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import ProtectedRoute from './ProtectedRoute';
import ProfilePage from './pages/ProfilePage';

// Placeholder pages for routes that aren't fully implemented yet

const FoldersPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Folders</h1>
    <p className="text-muted-foreground">Organize your documents into folders.</p>
  </div>
);

const ToolsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Tools</h1>
    <p className="text-muted-foreground">Document conversion and automation tools.</p>
  </div>
);

const ChatHistoryPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Chat History</h1>
    <p className="text-muted-foreground">View your conversation history with all documents.</p>
  </div>
);

const TrashPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Trash</h1>
    <p className="text-muted-foreground">Documents moved to trash appear here. They will be permanently deleted after 30 days.</p>
  </div>
);

const SettingsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <h2 className="text-lg font-medium mb-4">Application Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-primary" />
            <span className="text-sm text-foreground">Enable dark mode</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-primary" defaultChecked />
            <span className="text-sm text-foreground">Show document previews</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-primary" defaultChecked />
            <span className="text-sm text-foreground">Send email notifications</span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Company Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/security" element={<Security />} />
          <Route path="/gdpr" element={<GDPR />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <PdfProvider>
                <SearchProvider>
                  <Layout />
                </SearchProvider>
              </PdfProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="recent" element={<RecentPage />} />
            <Route path="starred" element={<StarredPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="folders" element={<FoldersPage />} />
            <Route path="chat/:id" element={<ChatView />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="chat-history" element={<ChatHistoryPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
