import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { File, FilePlus, Star, MoreVertical, Folder } from 'lucide-react';
import { usePdf } from '../context/PdfContext';
import UploadModal from '../components/UploadModal';

const Dashboard: React.FC = () => {
  const { documents } = usePdf();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Documents' },
    { id: 'recent', name: 'Recent' },
    { id: 'starred', name: 'Starred' },
    { id: 'shared', name: 'Shared with me' }
  ];

  const filteredDocuments = 
    filterCategory === 'all' ? documents :
    filterCategory === 'starred' ? documents.filter(doc => doc.starred) :
    filterCategory === 'recent' ? documents.slice(0, 5) :
    documents.filter(doc => doc.shared);

  return (
    <div className="container mx-auto px-4 py-6">
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} />}
      
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
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${
              filterCategory === category.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Empty state */}
      {documents.length === 0 && (
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
      {documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-dashed border-indigo-200 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-indigo-100 transition-all cursor-pointer"
            onClick={() => setShowUploadModal(true)}>
            <div className="bg-white p-3 rounded-full mb-4 shadow-sm">
              <FilePlus className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-indigo-700 font-medium">Upload New PDF</h3>
          </div>
          
          {filteredDocuments.map((doc) => (
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
                    <button className="p-1 text-gray-400 hover:text-yellow-500 focus:outline-none">
                      <Star className={`h-5 w-5 ${doc.starred ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none">
                      <MoreVertical className="h-5 w-5" />
                    </button>
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