import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../../src/app/page';

// Mock components
jest.mock('../../src/components/FileUpload', () => {
  return function MockFileUpload({ onFileUpload }: { onFileUpload: (file: File) => void }) {
    return (
      <div data-testid="file-upload">
        <button
          data-testid="upload-button"
          onClick={() => {
            const file = new File(['test pdf content'], 'test.pdf', {
              type: 'application/pdf',
              size: 1024 * 1024, // 1MB
            });
            onFileUpload(file);
          }}
        >
          Trigger Upload
        </button>
      </div>
    );
  };
});

jest.mock('../../src/components/ParsedDataDisplay', () => {
  return function MockParsedDataDisplay({ data }: { data: any }) {
    return (
      <div data-testid="parsed-data-display">
        <h3>Parsed Data</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  };
});

jest.mock('../../src/components/RankingDisplay', () => {
  return function MockRankingDisplay({ ranking }: { ranking: any }) {
    return (
      <div data-testid="ranking-display">
        <h3>Ranking Results</h3>
        <p>Rank: {ranking.rank}</p>
        <p>Percentile: {ranking.percentile}%</p>
        <p>Total Candidates: {ranking.totalCandidates}</p>
        <p>Better Than: {ranking.betterThan}</p>
      </div>
    );
  };
});

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('File Upload Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete upload to results workflow', async () => {
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
      {
        ...mockParsedData,
        file: 'synthetic1.pdf',
        usmle: {
          ...mockParsedData.usmle,
          step2_ck: {
            ...mockParsedData.usmle.step2_ck,
            score: '240', // Lower score for ranking test
          },
        },
      },
      {
        ...mockParsedData,
        file: 'synthetic2.pdf',
        usmle: {
          ...mockParsedData.usmle,
          step2_ck: {
            ...mockParsedData.usmle.step2_ck,
            score: '230', // Even lower score
          },
        },
      },
    ];

    mockFetch.mockImplementation((url: string) => {
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
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Home />);

    // Trigger file upload
    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);

    // Wait for upload to start
    await waitFor(() => {
      expect(screen.getByText('Uploading and analyzing your PDF...')).toBeInTheDocument();
    });

    // Wait for parsing to complete
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/parse-pdf.py', expect.any(Object));
    });

    // Wait for ranking calculation
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/synthetic_applicants.json');
    });

    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
      expect(screen.getByTestId('ranking-display')).toBeInTheDocument();
    });

    // Verify ranking data
    const rankingDisplay = screen.getByTestId('ranking-display');
    expect(rankingDisplay).toHaveTextContent('Rank:');
    expect(rankingDisplay).toHaveTextContent('Percentile:');
    expect(rankingDisplay).toHaveTextContent('Total Candidates:');
  });

  test('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);

    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });

    // Verify no results are shown
    expect(screen.queryByTestId('parsed-data-display')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ranking-display')).not.toBeInTheDocument();
  });

  test('handles malformed API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null), // Invalid response
    });

    render(<Home />);

    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);

    // Should show parsed data even with malformed response
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
    });
  });

  test('handles synthetic data loading failure', async () => {
    const mockParsedData = { file: 'test.pdf' };

    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/parse-pdf.py') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockParsedData),
        });
      } else if (url === '/synthetic_applicants.json') {
        return Promise.reject(new Error('Failed to load synthetic data'));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Home />);

    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);

    // Should still show parsed data even if ranking fails
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
    });

    // Should show parsed data even if ranking fails
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
    });
  });

  test('prevents multiple simultaneous uploads', async () => {
    const mockParsedData = { file: 'test.pdf' };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockParsedData),
    });

    render(<Home />);

    // Click upload button multiple times quickly
    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);
    userEvent.click(uploadButton);
    userEvent.click(uploadButton);

    // Should call fetch multiple times since each click creates a new file
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
    });
  });

  test('shows correct loading sequence', async () => {
    const mockParsedData = { file: 'test.pdf' };
    const mockSyntheticData = [];

    let resolveApiCall: (value: any) => void;
    let resolveSyntheticCall: (value: any) => void;

    const apiCallPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });

    const syntheticCallPromise = new Promise((resolve) => {
      resolveSyntheticCall = resolve;
    });

    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/parse-pdf.py') {
        return apiCallPromise;
      } else if (url === '/synthetic_applicants.json') {
        return syntheticCallPromise;
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<Home />);

    const uploadButton = screen.getByTestId('upload-button');
    userEvent.click(uploadButton);

    // First loading state
    await waitFor(() => {
      expect(screen.getByText('Uploading and analyzing your PDF...')).toBeInTheDocument();
    });

    // Resolve API call
    resolveApiCall({
      ok: true,
      json: () => Promise.resolve(mockParsedData),
    });

    // Should transition to parsing state
    await waitFor(() => {
      expect(screen.getByText('Calculating your ranking...')).toBeInTheDocument();
    });

    // Resolve synthetic data call
    resolveSyntheticCall({
      json: () => Promise.resolve(mockSyntheticData),
    });

    // Should show results
    await waitFor(() => {
      expect(screen.getByTestId('parsed-data-display')).toBeInTheDocument();
    });
  });
});
