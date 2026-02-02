'use client';

import { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onFileRemove?: () => void;
}

export default function FileUpload({ onFileUpload, onFileRemove }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!file.type.includes('pdf')) {
      return 'Please upload a PDF file only.';
    }
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

  useEffect(() => {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.style.pointerEvents = selectedFile ? 'none' : 'auto';
    }
  }, [selectedFile]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    if (onFileRemove) {
      onFileRemove();
    }
  }, [onFileRemove]);

  return (
    <div className="w-full">
      <Card
        className={`relative border-2 border-dashed p-8 text-center transition-colors bg-white ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : error
            ? 'border-red-400 bg-red-50'
            : selectedFile
            ? 'border-green-500 bg-green-50'
            : 'border-neutral-300 hover:border-neutral-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
            <div className="w-full">
              <Card className="relative z-20 p-6 bg-white border-neutral-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-lg truncate">{selectedFile.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="secondary" className="bg-neutral-200 text-neutral-700">PDF Document</Badge>
                      <span className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="blue"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const fileInput = document.getElementById('file-input') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                      title="Upload different file"
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="red"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearSelection();
                      }}
                      title="Remove file"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="py-4">
              <div className={`mb-6 ${isDragOver ? 'scale-110' : ''} transition-transform`}>
                <div className={`p-5 rounded-2xl ${isDragOver ? 'bg-blue-100' : 'bg-neutral-100'}`}>
                  <Upload className={`h-12 w-12 mx-auto ${isDragOver ? 'text-blue-600' : 'text-neutral-500'}`} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">
                    {isDragOver ? 'Drop your PDF here' : 'Upload your ERAS application'}
                  </h2>
                  <p className="text-muted-foreground">
                    Drag and drop your PDF file here, or{' '}
                    <label htmlFor="file-input" className="text-blue-600 hover:underline cursor-pointer font-medium">
                      browse files
                    </label>
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Badge variant="outline" className="border-neutral-300 text-neutral-600">PDF files only</Badge>
                  <Badge variant="outline" className="border-neutral-300 text-neutral-600">Max 4MB</Badge>
                  <Badge variant="outline" className="border-neutral-300 text-neutral-600">Secure processing</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-4 border-red-300 bg-red-50 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
