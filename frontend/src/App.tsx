import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ChatView from './pages/ChatView';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { PdfProvider } from './context/PdfContext';
import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import ProtectedRoute from './ProtectedRoute';
import ProfilePage from './pages/ProfilePage';

// Placeholder pages for new routes
const ChatHistoryPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Chat History</h1>
    <p className="text-gray-600">View your conversation history with all documents.</p>
  </div>
);

const TrashPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Trash</h1>
    <p className="text-gray-600">Documents moved to trash appear here. They will be permanently deleted after 30 days.</p>
  </div>
);

const SettingsPage = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold mb-4">Settings</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium mb-4">Application Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-indigo-600" />
            <span className="text-sm text-gray-700">Enable dark mode</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-indigo-600" defaultChecked />
            <span className="text-sm text-gray-700">Show document previews</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4 rounded text-indigo-600" defaultChecked />
            <span className="text-sm text-gray-700">Send email notifications</span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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
            <Route path="chat/:id" element={<ChatView />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="chat-history" element={<ChatHistoryPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
