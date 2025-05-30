import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Settings, User, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useSearch();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center md:w-72">
          <Link to="/app" className="flex items-center">
            <h1 className="text-xl font-semibold text-indigo-600">DocuQuery</h1>
          </Link>
        </div>

        <div className="hidden md:flex md:flex-1 items-center justify-center px-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Bell className="h-5 w-5" />
          </button>
          <button className="p-1.5 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Settings className="h-5 w-5" />
          </button>
          <div className="relative" ref={userMenuRef}>
            <button
              className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" className="h-8 w-8 rounded-full" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>

            {/* User dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link
                  to="/app/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </Link>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;