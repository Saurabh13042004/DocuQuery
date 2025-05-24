import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  File, FilePlus, Inbox, MessageSquare, Folder, Star, 
  Trash2, Settings, ChevronRight, ChevronDown, PlusCircle 
} from 'lucide-react';
import { usePdf } from '../context/PdfContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { documents } = usePdf();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'recent': true,
    'starred': false,
    'folders': false
  });

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-gray-200 bg-white">
      <div className="p-4">
        <button className="flex items-center justify-center w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150">
          <FilePlus className="h-5 w-5 mr-2" />
          <span className="font-medium">Upload PDF</span>
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-3 space-y-1">
          <li>
            <Link 
              to="/app" 
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                location.pathname === '/app' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Inbox className="h-5 w-5 mr-3 text-gray-400" />
              <span>Inbox</span>
            </Link>
          </li>
          <li>
            <button 
              onClick={() => toggleFolder('recent')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <File className="h-5 w-5 mr-3 text-gray-400" />
                <span>Recent Documents</span>
              </div>
              {expandedFolders.recent ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {expandedFolders.recent && (
              <ul className="pl-10 mt-1 space-y-1">
                {documents.slice(0, 5).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      to={`/app/chat/${doc.id}`}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        location.pathname === `/app/chat/${doc.id}`
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{doc.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleFolder('starred')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-3 text-gray-400" />
                <span>Starred</span>
              </div>
              {expandedFolders.starred ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {expandedFolders.starred && (
              <ul className="pl-10 mt-1 space-y-1">
                {documents.filter(doc => doc.starred).map((doc) => (
                  <li key={doc.id}>
                    <Link
                      to={`/app/chat/${doc.id}`}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        location.pathname === `/app/chat/${doc.id}`
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate">{doc.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => toggleFolder('folders')}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <div className="flex items-center">
                <Folder className="h-5 w-5 mr-3 text-gray-400" />
                <span>Folders</span>
              </div>
              {expandedFolders.folders ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
            
            {expandedFolders.folders && (
              <ul className="pl-10 mt-1 space-y-1">
                <li>
                  <Link
                    to="/app"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span>Work</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/app"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span>Personal</span>
                  </Link>
                </li>
                <li>
                  <button className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 rounded-md hover:bg-gray-100">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    <span>Add folder</span>
                  </button>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link
              to="/app"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <MessageSquare className="h-5 w-5 mr-3 text-gray-400" />
              <span>Chat History</span>
            </Link>
          </li>
          <li>
            <Link
              to="/app"
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <Trash2 className="h-5 w-5 mr-3 text-gray-400" />
              <span>Trash</span>
            </Link>
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100">
          <Settings className="h-5 w-5 mr-3 text-gray-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;