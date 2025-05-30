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
            {/* Add a placeholder for the profile route */}
            <Route path="profile" element={<div className="p-8"><h1 className="text-2xl font-bold">Profile Page</h1><p className="mt-4">User profile page is under construction.</p></div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
