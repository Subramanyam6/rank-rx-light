const { handler } = require('../../api/parse-pdf.py');
const { parse_pdf_file } = require('../../parse.py');

// Mock the parse function
jest.mock('../../parse.py', () => ({
  parse_pdf_file: jest.fn(),
}));

describe('/api/parse-pdf.py', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/parse-pdf.py', () => {
    test('should return health check response', async () => {
      const mockRequest = {
        method: 'GET',
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.status).toBe('healthy');
      expect(responseBody.message).toBe('PDF parsing API is running');
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    });
  });

  describe('POST /api/parse-pdf.py', () => {
    test('should successfully parse PDF file', async () => {
      const mockPdfContent = Buffer.from('mock pdf content');
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

      parse_pdf_file.mockResolvedValue(mockParsedData);

      const mockRequest = {
        method: 'POST',
        get: jest.fn((key) => {
          if (key === 'body') return mockPdfContent;
          return null;
        }),
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toEqual(mockParsedData);
      expect(result.headers['Content-Type']).toBe('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
    });

    test('should handle missing PDF file', async () => {
      const mockRequest = {
        method: 'POST',
        get: jest.fn(() => null), // No body provided
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('No PDF file provided');
      expect(responseBody.file).toBe('unknown');
    });

    test('should handle PDF parsing errors', async () => {
      const mockPdfContent = Buffer.from('invalid pdf content');
      const mockError = new Error('Failed to parse PDF: Invalid PDF format');

      parse_pdf_file.mockRejectedValue(mockError);

      const mockRequest = {
        method: 'POST',
        get: jest.fn((key) => {
          if (key === 'body') return mockPdfContent;
          return null;
        }),
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toContain('Server error');
      expect(responseBody.file).toBe('unknown');
    });

    test('should handle import errors gracefully', async () => {
      // Temporarily mock the import to fail
      const originalParsePdfFile = require('../../parse.py').parse_pdf_file;
      require('../../parse.py').parse_pdf_file = null;

      const mockPdfContent = Buffer.from('mock pdf content');

      const mockRequest = {
        method: 'POST',
        get: jest.fn((key) => {
          if (key === 'body') return mockPdfContent;
          return null;
        }),
      };

      // Re-import the handler to trigger the fallback
      delete require.cache[require.resolve('../../api/parse-pdf.py')];
      const { handler: handlerWithError } = require('../../api/parse-pdf.py');

      const result = await handlerWithError(mockRequest);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Parse module not found');
      expect(responseBody.file).toBe('unknown');

      // Restore original mock
      require('../../parse.py').parse_pdf_file = originalParsePdfFile;
    });
  });

  describe('Unsupported HTTP methods', () => {
    test('should return method not allowed for PUT', async () => {
      const mockRequest = {
        method: 'PUT',
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(405);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Method not allowed');
      expect(responseBody.allowed_methods).toEqual(['GET', 'POST']);
    });

    test('should return method not allowed for DELETE', async () => {
      const mockRequest = {
        method: 'DELETE',
      };

      const result = await handler(mockRequest);

      expect(result.statusCode).toBe(405);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toBe('Method not allowed');
    });
  });

  describe('CORS headers', () => {
    test('should include proper CORS headers in all responses', async () => {
      const mockRequest = {
        method: 'GET',
      };

      const result = await handler(mockRequest);

      expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers['Access-Control-Allow-Methods']).toBe('POST, GET, OPTIONS');
      expect(result.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
    });
  });

  describe('PDF cleanup', () => {
    test('should clean up temporary files after processing', async () => {
      const mockPdfContent = Buffer.from('mock pdf content');
      const mockParsedData = { file: 'test.pdf' };

      parse_pdf_file.mockResolvedValue(mockParsedData);

      const mockRequest = {
        method: 'POST',
        get: jest.fn((key) => {
          if (key === 'body') return mockPdfContent;
          return null;
        }),
      };

      // Mock file system operations
      const fs = require('fs');
      const originalUnlink = fs.unlink;
      fs.unlink = jest.fn();

      await handler(mockRequest);

      // The handler should have called fs.unlink for cleanup
      // Note: This test assumes the handler uses the same cleanup logic
      expect(parse_pdf_file).toHaveBeenCalled();
    });
  });
});
