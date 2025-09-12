'use client';

import { useState, useCallback, useEffect } from 'react';
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

  // Manage pointer events based on selectedFile state
  useEffect(() => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.style.pointerEvents = selectedFile ? 'none' : 'auto';
    }
  }, [selectedFile]);

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
        style={{ position: 'relative' }}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          id="file-input"
          data-testid="file-input"
        />

        <div className="flex flex-col items-center space-y-4">
          {selectedFile ? (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="group relative overflow-hidden bg-gradient-to-r from-white via-gray-50 to-white rounded-2xl border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 z-20">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 via-transparent to-green-50/20"></div>
                
                <div className="relative flex items-center space-x-6 p-8">
                  {/* File icon with enhanced styling */}
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                    <div className="relative p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl border border-green-200/50">
                      <FileText className="h-10 w-10 text-green-700" />
                    </div>
                  </div>

                  {/* File information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xl text-gray-900 truncate pr-4">{selectedFile.name}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            PDF Document
                          </span>
                          <span className="text-sm text-gray-600 font-medium">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons with enhanced styling */}
                  <div className="flex items-center space-x-3 relative z-30">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Upload button clicked');
                        const fileInput = document.getElementById('file-input') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                      className="group/btn relative p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg border border-blue-200/50"
                      title="Upload different file"
                      type="button"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl blur opacity-0 group-hover/btn:opacity-30 transition duration-300"></div>
                      <Upload className="relative h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Remove button clicked');
                        clearSelection();
                      }}
                      className="group/btn relative p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-lg border border-red-200/50"
                      title="Remove file"
                      type="button"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 to-red-600 rounded-xl blur opacity-0 group-hover/btn:opacity-30 transition duration-300"></div>
                      <X className="relative h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-top-4 duration-500">
              {/* Enhanced upload icon with glow effect */}
              <div className={`relative mb-8 transition-all duration-300 ${isDragOver ? 'scale-110' : 'scale-100'}`}>
                <div className={`absolute -inset-4 rounded-full transition-all duration-300 ${
                  isDragOver ? 'bg-blue-400/20 blur-xl' : 'bg-gray-200/10'
                }`}></div>
                <div className={`relative p-6 rounded-3xl transition-all duration-300 ${
                  isDragOver ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50 border-2 border-gray-200'
                }`}>
                  <Upload className={`h-16 w-16 mx-auto transition-all duration-300 ${
                    isDragOver ? 'text-blue-600 animate-bounce' : 'text-gray-500'
                  }`} />
                </div>
              </div>

              {/* Enhanced text content */}
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
                    {isDragOver ? 'Drop your PDF here' : 'Upload your ERAS application'}
                  </h2>
                  <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                    Drag and drop your PDF file here, or{' '}
                    <label
                      htmlFor="file-input"
                      className="text-blue-600 hover:text-blue-700 cursor-pointer font-semibold transition-all duration-200 hover:underline"
                    >
                      browse files
                    </label>
                  </p>
                </div>

                {/* Enhanced feature badges */}
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-green-700">PDF files only</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">Max 4MB</span>
                  </div>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-purple-700">Secure processing</span>
                  </div>
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
