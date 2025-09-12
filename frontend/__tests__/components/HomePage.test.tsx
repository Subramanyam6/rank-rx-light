import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../../src/app/page';

// Mock the components
jest.mock('../../src/components/FileUpload', () => {
  return function MockFileUpload({ onFileUpload }: { onFileUpload: (file: File) => void }) {
    return (
      <div data-testid="file-upload">
        <input
          type="file"
          data-testid="file-input"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />
        <button data-testid="upload-trigger">Upload</button>
      </div>
    );
  };
});

jest.mock('../../src/components/ParsedDataDisplay', () => {
  return function MockParsedDataDisplay({ data }: { data: any }) {
    return <div data-testid="parsed-data">{JSON.stringify(data)}</div>;
  };
});

jest.mock('../../src/components/RankingDisplay', () => {
  return function MockRankingDisplay({ ranking }: { ranking: any }) {
    return <div data-testid="ranking-data">{JSON.stringify(ranking)}</div>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders page structure correctly', () => {
    render(<Home />);

    expect(screen.getByText('RankRx Light')).toBeInTheDocument();
    expect(screen.getByText('USMLE Application Ranking System')).toBeInTheDocument();
    expect(screen.getByText('Upload Your USMLE Application')).toBeInTheDocument();
    expect(screen.getByText('Easy Upload')).toBeInTheDocument();
    expect(screen.getByText('Smart Parsing')).toBeInTheDocument();
    expect(screen.getByText('Instant Ranking')).toBeInTheDocument();
  });

  test('handles successful file upload and processing', async () => {
    const mockParsedData = {
      file: 'test.pdf',
      visa: {
        authorized_to_work_us: 'Yes',
        current_work_authorization: 'H1B',
        visa_sponsorship_needed: 'No',
        visa_sponsorship_sought: null,
      },
      usmle: {
        step1: {
          present: true,
          passed: true,
          pass_date: '01/15/2023',
          score: '240',
          failures: 0,
        },
        step2_ck: {
          present: true,
          passed: true,
          pass_date: '03/20/2023',
          score: '250',
          failures: 0,
        },
      },
      ecfmg_status_report: {
        present: true,
        certified: 'Yes',
      },
    };

    const mockSyntheticData = [
      { ...mockParsedData, file: 'synthetic1.pdf' },
      { ...mockParsedData, file: 'synthetic2.pdf' },
    ];

    // Mock API response
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/parse-pdf.py') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParsedData),
        });
      } else if (url === '/synthetic_applicants.json') {
        return Promise.resolve({
          json: () => Promise.resolve(mockSyntheticData),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Home />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    userEvent.upload(fileInput, file);

    // Wait for upload to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parse-pdf.py', {
        method: 'POST',
        body: file,
      });
    });

    // Wait for parsing and ranking to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/synthetic_applicants.json');
    });

    // Check that results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-data')).toBeInTheDocument();
    });
  });

  test('handles upload errors gracefully', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    render(<Home />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Error: Upload failed')).toBeInTheDocument();
    });
  });

  test('shows loading states during processing', async () => {
    let resolveApiCall: (value: any) => void;
    const apiCallPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });

    (global.fetch as jest.Mock).mockImplementation(() => apiCallPromise);

    render(<Home />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    userEvent.upload(fileInput, file);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Uploading and analyzing your PDF...')).toBeInTheDocument();
    });

    // Resolve the API call
    resolveApiCall({
      ok: true,
      json: () => Promise.resolve({ file: 'test.pdf' }),
    });

    await waitFor(() => {
      expect(screen.queryByText('Uploading and analyzing your PDF...')).not.toBeInTheDocument();
    });
  });

  test('calculates ranking correctly', async () => {
    const mockParsedData = {
      file: 'test.pdf',
      visa: {
        authorized_to_work_us: 'Yes',
        current_work_authorization: 'H1B',
        visa_sponsorship_needed: 'No',
        visa_sponsorship_sought: null,
      },
      usmle: {
        step1: {
          present: true,
          passed: true,
          pass_date: '01/15/2023',
          score: '240',
          failures: 0,
        },
        step2_ck: {
          present: true,
          passed: true,
          pass_date: '03/20/2023',
          score: '250',
          failures: 0,
        },
      },
      ecfmg_status_report: {
        present: true,
        certified: 'Yes',
      },
    };

    // Mock API responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/parse-pdf.py') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParsedData),
        });
      } else if (url === '/synthetic_applicants.json') {
        return Promise.resolve({
          json: () => Promise.resolve([]),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Home />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByTestId('ranking-data')).toBeInTheDocument();
    });

    // The ranking should be calculated and displayed
    const rankingDisplay = screen.getByTestId('ranking-data');
    expect(rankingDisplay).toBeInTheDocument();
  });

  test('handles synthetic data loading errors', async () => {
    const mockParsedData = { file: 'test.pdf' };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/parse-pdf.py') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParsedData),
        });
      } else if (url === '/synthetic_applicants.json') {
        return Promise.reject(new Error('Failed to load synthetic data'));
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Home />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByTestId('file-input');

    userEvent.upload(fileInput, file);

    // Should still show parsed data even if ranking fails
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data')).toBeInTheDocument();
    });
  });
});
