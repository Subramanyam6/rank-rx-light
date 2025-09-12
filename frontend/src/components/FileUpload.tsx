'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove?: () => void;
}

export default function FileUpload({ onFileUpload, onFileRemove }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.includes('pdf')) {
      return 'Please upload a PDF file only.';
    }

    // Check file size (limit to 4MB for Vercel free tier)
    if (file.size > 4 * 1024 * 1024) {
      return 'File size must be less than 4MB.';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileUpload(file);
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const clearSelection = useCallback(() => {
    console.log('clearSelection called');
    setSelectedFile(null);
    setError(null);
    // Reset the file input to allow re-selecting the same file
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
      console.log('File input value reset');
    }
    if (onFileRemove) {
      console.log('Calling onFileRemove');
      onFileRemove();
    } else {
      console.log('onFileRemove not provided');
    }
  }, [onFileRemove]);

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ease-in-out transform ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
            : error
            ? 'border-red-300 bg-red-50'
            : selectedFile
            ? 'border-green-300 bg-green-50 shadow-md'
            : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {!selectedFile && (
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-input"
            data-testid="file-input"
          />
        )}
        {selectedFile && (
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
            id="file-input"
            data-testid="file-input"
          />
        )}

        <div className="flex flex-col items-center space-y-4">
          {selectedFile ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center space-x-4 p-6 bg-white rounded-xl border border-gray-200 shadow-lg">
                <div className="p-3 bg-green-100 rounded-full">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 text-lg">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('file-input')?.click();
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Upload different file"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Remove button clicked');
                      clearSelection();
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Remove file"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Upload Different File
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Remove File button clicked');
                    clearSelection();
                  }}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                  type="button"
                >
                  Remove File
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-4 duration-500">
              <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : 'scale-100'}`}>
                <Upload className={`h-16 w-16 transition-colors duration-300 ${
                  isDragOver ? 'text-blue-500 animate-bounce' : 'text-gray-400'
                }`} />
              </div>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {isDragOver ? 'Drop your PDF here' : 'Upload your USMLE application'}
                  </h2>
                  <p className="text-gray-600">
                    Drag and drop your PDF file here, or{' '}
                    <label
                      htmlFor="file-input"
                      className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium transition-colors duration-200"
                    >
                      browse files
                    </label>
                  </p>
                </div>
                <div className="flex justify-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>PDF files only</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Max 4MB</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Secure processing</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
