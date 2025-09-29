import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { DocumentType } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  document: DocumentType;
  customPdfUrl?: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ document, customPdfUrl }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [numPages, setNumPages] = useState(document.pageCount || 1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [fitToWidth, setFitToWidth] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track container width for responsive sizing
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 32;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate responsive page width
  const calculatePageWidth = useCallback(() => {
    if (!containerWidth) return 600;
    
    if (fitToWidth) {
      return Math.min(containerWidth * 0.95, containerWidth - 20);
    } else {
      return Math.min((containerWidth * zoom) / 100, containerWidth * 2);
    }
  }, [containerWidth, zoom, fitToWidth]);

  useEffect(() => {
    if (customPdfUrl) {
      const baseUrl = 'http://127.0.0.1:8000';
      const url = customPdfUrl.startsWith('http') 
        ? customPdfUrl 
        : `${baseUrl}${customPdfUrl}`;
      
      setPdfUrl(url);
      setCurrentPage(1);
    }
    else if (document.filePath) {
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
    setFitToWidth(false);
    if (zoom < 200) {
      setZoom(zoom + 25);
    }
  };

  const handleZoomOut = () => {
    setFitToWidth(false);
    if (zoom > 50) {
      setZoom(zoom - 25);
    }
  };

  const handleFitToWidth = () => {
    setFitToWidth(true);
    setZoom(100);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* PDF Toolbar */}
      <div className="bg-background shadow-sm border-b">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-md transition-colors ${
                currentPage === 1
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground min-w-[60px] text-center">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === numPages}
              className={`p-1.5 rounded-md transition-colors ${
                currentPage === numPages
                  ? 'text-muted-foreground cursor-not-allowed'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handleFitToWidth}
              className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                fitToWidth
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              Fit
            </button>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50 && !fitToWidth}
              className="p-1.5 rounded-md text-foreground hover:bg-muted transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-muted-foreground min-w-[45px] text-center">
              {fitToWidth ? 'Auto' : `${zoom}%`}
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200 && !fitToWidth}
              className="p-1.5 rounded-md text-foreground hover:bg-muted transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/10"
      >
        <div className="min-h-full flex items-start justify-center py-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          )}

          {pdfUrl && (
            <div className="w-full max-w-full flex justify-center px-2">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                }
                error={
                  <div className="text-destructive text-center py-8">
                    <p className="text-sm">Failed to load PDF</p>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  width={calculatePageWidth()}
                  className="shadow-md border border-border rounded-lg bg-background max-w-full"
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