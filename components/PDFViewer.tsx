"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

interface PDFViewerProps {
  file: string;
  onError?: (error: Error) => void;
}

export default function PDFViewer({ file, onError }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Set up PDF.js worker with the correct version
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const handleError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. Please try again.');
    if (onError) {
      onError(error);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* PDF Controls */}
      <div className="flex items-center justify-between mb-4 bg-gray-100 p-2 rounded">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage <= 1}
            className="px-2 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(page => Math.min(numPages, page + 1))}
            disabled={currentPage >= numPages}
            className="px-2 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setScale(scale => Math.max(0.5, scale - 0.1))}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            Zoom Out
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(scale => Math.min(2, scale + 0.1))}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >
            Zoom In
          </button>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div className="flex justify-center">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={handleError}
          loading={
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
          className="border rounded"
        >
          {error ? (
            <div className="text-red-600 p-4">{error}</div>
          ) : (
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
              error={
                <div className="text-red-600 p-4">
                  Error loading page. Please try again.
                </div>
              }
            />
          )}
        </Document>
      </div>
    </div>
  );
} 