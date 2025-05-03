import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './LandingPage';
import App from './App';
import LoginPage from './pages/Login';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path='/login' element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default AppRouter;
