import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { DocumentType } from '../types';

interface PdfViewerProps {
  document: DocumentType;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ document }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < document.pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handleZoomIn = () => {
    if (zoom < 200) {
      setZoom(zoom + 10);
    }
  };
  
  const handleZoomOut = () => {
    if (zoom > 50) {
      setZoom(zoom - 10);
    }
  };
  
  return (
    <div className="flex h-full">
      {showThumbnails && (
        <div className="w-16 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          {Array.from({ length: document.pageCount }, (_, i) => i + 1).map((page) => (
            <div 
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`cursor-pointer p-1 m-1 border ${
                currentPage === page 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="aspect-[3/4] bg-white flex items-center justify-center text-xs text-gray-500">
                {page}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-1">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1 rounded ${
                currentPage === 1 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {document.pageCount}
            </span>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === document.pageCount}
              className={`p-1 rounded ${
                currentPage === document.pageCount 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className={`p-1 rounded ${
                zoom <= 50 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-700">{zoom}%</span>
            <button 
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className={`p-1 rounded ${
                zoom >= 200 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-1 rounded ml-2 ${
                showThumbnails 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4">
          <div 
            className="bg-white shadow-lg transition-all duration-200"
            style={{ 
              width: `${zoom}%`, 
              maxWidth: '100%',
              aspectRatio: '3/4',
              position: 'relative'
            }}
          >
            {/* In a real implementation, this would render the actual PDF content */}
            {document.previewUrl ? (
              <img 
                src={document.previewUrl} 
                alt={`Page ${currentPage} of ${document.name}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-400">Page {currentPage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;