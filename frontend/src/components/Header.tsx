import React, { useState } from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center md:w-72">
          <h1 className="text-xl font-semibold text-indigo-600">DocuQuery</h1>
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
          <div className="relative">
            <button className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" className="h-8 w-8 rounded-full" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;