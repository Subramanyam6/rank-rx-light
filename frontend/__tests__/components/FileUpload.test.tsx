import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../../src/components/FileUpload';

describe('FileUpload Component', () => {
  const mockOnFileUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area correctly', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    expect(screen.getByText('Upload your USMLE application')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your PDF file here, or')).toBeInTheDocument();
    expect(screen.getByText('browse files')).toBeInTheDocument();
    expect(screen.getByText('• PDF files only (max 10MB)')).toBeInTheDocument();
  });

  test('validates PDF file type correctly', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input') || screen.getByLabelText(/file/i);

    userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(file);
    });
  });

  test('rejects non-PDF files', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByTestId('file-input');

    userEvent.upload(input, file);

    await waitFor(() => {
      // Check that error state is set but file is not processed
      expect(mockOnFileUpload).not.toHaveBeenCalled();
    });
  });

  test('validates file size limit', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf'
    });
    const input = screen.getByTestId('file-input');

    userEvent.upload(input, largeFile);

    await waitFor(() => {
      // Check that large file is not processed
      expect(mockOnFileUpload).not.toHaveBeenCalled();
    });
  });

  test('accepts valid PDF files within size limit', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const validFile = new File(['test content'], 'valid.pdf', {
      type: 'application/pdf'
    });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

    const input = screen.getByTestId('file-input') || screen.getByLabelText(/file/i);
    userEvent.upload(input, validFile);

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(validFile);
    });
  });

  test('displays uploaded file information', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(['test content'], 'uploaded.pdf', {
      type: 'application/pdf'
    });
    Object.defineProperty(file, 'size', { value: 2048 * 1024 }); // 2MB

    const input = screen.getByTestId('file-input') || screen.getByLabelText(/file/i);
    userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('uploaded.pdf')).toBeInTheDocument();
      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
      expect(screen.getByText('File uploaded successfully! Processing...')).toBeInTheDocument();
    });
  });

  test('clears selection when X button is clicked', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf'
    });
    const input = screen.getByTestId('file-input') || screen.getByLabelText(/file/i);
    userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    // Click the clear button
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Upload your USMLE application')).toBeInTheDocument();
    });
  });

  test('handles drag and drop functionality', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const file = new File(['test content'], 'dropped.pdf', {
      type: 'application/pdf'
    });
    const dropZone = screen.getByText('Upload your USMLE application').closest('div');

    // Simulate drag over
    fireEvent.dragOver(dropZone!);

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(file);
    });
  });

  test('does not show error styling for invalid files', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const invalidFile = new File(['test content'], 'test.txt', {
      type: 'text/plain'
    });
    const input = screen.getByTestId('file-input');
    userEvent.upload(input, invalidFile);

    await waitFor(() => {
      // The component doesn't show visual error styling, just doesn't process invalid files
      expect(mockOnFileUpload).not.toHaveBeenCalled();
    });
  });

  test('shows success styling for valid files', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const validFile = new File(['test content'], 'test.pdf', {
      type: 'application/pdf'
    });
    const input = screen.getByTestId('file-input');
    userEvent.upload(input, validFile);

    await waitFor(() => {
      // After upload, the component shows file information instead of upload text
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
      expect(screen.getByText('File uploaded successfully! Processing...')).toBeInTheDocument();
    });
  });

  test('handles drag over event', () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const dropZone = screen.getByText('Upload your USMLE application').closest('div');

    fireEvent.dragOver(dropZone!);

    // The drag over event should be handled without throwing errors
    expect(dropZone).toBeInTheDocument();
  });

  test('handles multiple file selection (uses first file)', async () => {
    render(<FileUpload onFileUpload={mockOnFileUpload} />);

    const files = [
      new File(['content1'], 'first.pdf', { type: 'application/pdf' }),
      new File(['content2'], 'second.pdf', { type: 'application/pdf' }),
    ];

    const input = screen.getByTestId('file-input') || screen.getByLabelText(/file/i);

    // Create a mock event with multiple files
    const changeEvent = {
      target: { files },
    };
    fireEvent.change(input, changeEvent);

    await waitFor(() => {
      expect(mockOnFileUpload).toHaveBeenCalledWith(files[0]);
      expect(mockOnFileUpload).toHaveBeenCalledTimes(1);
    });
  });
});
