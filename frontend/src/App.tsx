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
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route path="/app" element={
            <ProtectedRoute>
              <PdfProvider>
                <Layout />
              </PdfProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="chat/:id" element={<ChatView />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
