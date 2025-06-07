import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { File, FilePlus, Star, MoreVertical, Folder, Loader, FolderPlus, Plus, Check } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import { useSearch } from '../context/SearchContext';
import UploadModal from '../components/UploadModal';
import { useLocation, useNavigate } from 'react-router-dom';


const Dashboard: React.FC = () => {
  const { documents, isLoading, fetchUserDocuments, updateDocument } = usePdf();
  const { searchQuery } = useSearch();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Available folders in the system
  const [folders, setFolders] = useState(['Work', 'Personal', 'Research', 'Archived']);
  const location = useLocation();
  const navigate = useNavigate();
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add to Dashboard.tsx, just after the initial useEffect
  useEffect(() => {
    if (location.state) {
      // Check if we should open the upload modal
      if (location.state.openUploadModal) {
        setShowUploadModal(true);
      }

      // Check if we should open the create folder modal
      if (location.state.createFolder) {
        setShowFolderModal(true);
      }

      // Clear the location state after handling
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  // Refresh documents when the component mounts
  useEffect(() => {
    fetchUserDocuments();
  }, []);

  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'recent', name: 'Recent' },
    { id: 'starred', name: 'Starred' },
    { id: 'shared', name: 'Shared with me' }
  ];

  // Toggle star status for a document
  const toggleStar = (docId: string, isStarred: boolean) => {
    updateDocument(docId, { starred: !isStarred });
  };

  // Move document to a folder
  const moveToFolder = (docId: string, folderName: string) => {
    updateDocument(docId, { folder: folderName });
    setActionMenuOpen(null);
  };

  // Create a new folder and move document to it
  const createNewFolder = () => {
    if (newFolderName.trim() === '') return;

    setFolders([...folders, newFolderName]);
    if (selectedDocumentId) {
      moveToFolder(selectedDocumentId, newFolderName);
    }
    setNewFolderName('');
    setShowFolderModal(false);
  };

  // Filter documents based on both category and search query
  const filteredDocuments = documents
    .filter(doc => {
      // Apply search filter if there's a query
      if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Apply category filter
      if (filterCategory === 'all') return true;
      if (filterCategory === 'starred') return doc.starred;
      if (filterCategory === 'recent') return true;
      if (filterCategory === 'shared') return doc.shared;
      return true;
    });

  // Apply additional sorting/limiting for 'recent' category
  const displayedDocuments =
    filterCategory === 'recent' ? filteredDocuments.slice(0, 5) : filteredDocuments;

  return (
    <div className="container mx-auto px-4 py-6">
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}

      {/* New Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Folder</h3>
            <div className="mb-4">
              <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter folder name"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewFolder}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">My Documents</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center justify-center py-2 px-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150"
        >
          <FilePlus className="h-5 w-5 mr-2" />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Category filters */}
      <div className="flex overflow-x-auto space-x-4 pb-4 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setFilterCategory(category.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${filterCategory === category.id
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading your documents...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-12 border border-gray-200">
          <div className="bg-indigo-100 p-4 rounded-full mb-4">
            <File className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 text-center mb-6">
            Upload your first PDF to start chatting and analyzing your documents.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center py-2 px-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition duration-150"
          >
            <FilePlus className="h-5 w-5 mr-2" />
            <span>Upload PDF</span>
          </button>
        </div>
      )}

      {/* Document grid */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-dashed border-indigo-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-indigo-100 transition-all cursor-pointer"
            onClick={() => setShowUploadModal(true)}>
            <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
              <FilePlus className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-indigo-700 font-medium">Upload New PDF</h3>
          </div>

          {displayedDocuments.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-2 rounded mr-3">
                      <File className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-0.5 line-clamp-1">{doc.name}</h3>
                      <p className="text-xs text-gray-500">Updated {doc.updatedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none"
                      onClick={() => toggleStar(doc.id, !!doc.starred)}
                    >
                      <Star className={`h-5 w-5 ${doc.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </button>
                    <div className="relative">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                        onClick={() => setActionMenuOpen(actionMenuOpen === doc.id ? null : doc.id)}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {/* Action dropdown menu */}
                      {actionMenuOpen === doc.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 py-1 border border-gray-200"
                        >
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          </div>

                          <div className="py-1">
                            <button
                              onClick={() => toggleStar(doc.id, !!doc.starred)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Star className={`h-4 w-4 mr-2 ${doc.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                              {doc.starred ? 'Remove from Starred' : 'Add to Starred'}
                            </button>
                          </div>

                          <div className="py-1 border-t border-gray-100">
                            <p className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Move to Folder
                            </p>
                            {folders.map((folder) => (
                              <button
                                key={folder}
                                onClick={() => moveToFolder(doc.id, folder)}
                                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Folder className="h-4 w-4 mr-2 text-gray-400" />
                                {folder}
                                {doc.folder === folder && <Check className="h-4 w-4 ml-2 text-green-500" />}
                              </button>
                            ))}
                            <button
                              onClick={() => {
                                setSelectedDocumentId(doc.id);
                                setShowFolderModal(true);
                              }}
                              className="flex w-full items-center px-4 py-2 text-sm text-indigo-600 hover:bg-gray-100"
                            >
                              <FolderPlus className="h-4 w-4 mr-2" />
                              Create New Folder
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-gray-500">
                    <Folder className="h-4 w-4 mr-1" />
                    <span>{doc.folder || 'Unsorted'}</span>
                  </div>
                  <Link
                    to={`/app/chat/${doc.id}`}
                    className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full hover:bg-indigo-100"
                  >
                    Chat
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;