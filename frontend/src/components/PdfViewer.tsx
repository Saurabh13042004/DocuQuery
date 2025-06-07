import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import { DocumentType } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  document: DocumentType;
  customPdfUrl?: string; // Add this prop to allow viewing edited PDFs
}

const PdfViewer: React.FC<PdfViewerProps> = ({ document, customPdfUrl }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [numPages, setNumPages] = useState(document.pageCount || 1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If customPdfUrl is provided, use it instead of the document's filePath
    if (customPdfUrl) {
      const baseUrl = 'http://127.0.0.1:8000';
      const url = customPdfUrl.startsWith('http') 
        ? customPdfUrl 
        : `${baseUrl}${customPdfUrl}`;
      
      setPdfUrl(url);
      // Reset to page 1 when loading a new PDF
      setCurrentPage(1);
    }
    else if (document.filePath) {
      // For development environment, filePath is a local path
      const baseUrl = 'http://127.0.0.1:8000';
      const url = document.filePath.startsWith('http')
        ? document.filePath
        : `${baseUrl}/pdfs/${document.filePath.split('/').pop()}`;

      setPdfUrl(url);
    }
  }, [document, customPdfUrl]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
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

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  return (
    <div className="flex h-full">
      {showThumbnails && (
        <div className="w-16 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
            <div
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`cursor-pointer p-1 m-1 border ${currentPage === page
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
              className={`p-1 rounded ${currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === numPages}
              className={`p-1 rounded ${currentPage === numPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-gray-700 hover:bg-gray-200"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-600">{zoom}%</span>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-gray-700 hover:bg-gray-200"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-1 rounded ${showThumbnails
                  ? 'bg-gray-200 text-gray-800'
                  : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Layers className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 p-4">
          {isLoading && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {pdfUrl && (
            <div
              style={{
                width: `${zoom}%`,
                maxWidth: '100%',
                position: 'relative'
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>}
                error={<div className="text-red-500">Failed to load PDF</div>}
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={zoom * 6.5}
                  className="shadow-lg"
                />
              </Document>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;