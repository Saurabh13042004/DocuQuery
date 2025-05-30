import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="bg-indigo-100 p-4 rounded-full">
            {user?.avatar ? (
              <img src={user.avatar} alt="User avatar" className="h-16 w-16 rounded-full" />
            ) : (
              <User className="h-16 w-16 text-indigo-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{new Date(user?.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;