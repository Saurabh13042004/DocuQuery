import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, PageContainer, PageHeader } from './components/app/ui';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import Dashboard from './pages/Dashboard';
import ChatView from './pages/ChatView';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
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
import PlansPage from './pages/PlansPage';
import TeamPage from './pages/TeamPage';

// Routes that exist for old links but have no feature behind them yet.
const ComingSoon = ({ title }: { title: string }) => (
  <PageContainer>
    <PageHeader kicker="On the index" title={title} />
    <EmptyState
      icon={<Hourglass className="h-6 w-6" />}
      title="Not filed yet"
      description={`${title} is on the roadmap. Understand and Edit are live today.`}
      action={
        <Button asChild>
          <Link to="/app">Back to dashboard</Link>
        </Button>
      }
    />
  </PageContainer>
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
          
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
            <Route path="folders" element={<ComingSoon title="Folders" />} />
            <Route path="chat/:id" element={<ChatView />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="chat-history" element={<ComingSoon title="Chat history" />} />
            <Route path="tools" element={<ComingSoon title="Tools" />} />
            <Route path="trash" element={<ComingSoon title="Trash" />} />
            <Route path="settings" element={<Navigate to="/app/profile" replace />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="team" element={<TeamPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
