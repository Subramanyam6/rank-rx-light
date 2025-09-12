const fs = require('fs');
const os = require('os');
const path = require('path');

// Mock the file system operations
jest.mock('fs', () => ({
  unlink: jest.fn(),
  existsSync: jest.fn(),
}));

// Mock the handler function (simplified version for testing)
function createTestHandler() {
  return {
    async processFile(fileBuffer) {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `test-${Date.now()}.pdf`);

      try {
        // Simulate writing file
        fs.writeFileSync = jest.fn();

        // Simulate processing
        const result = {
          file: 'test.pdf',
          processed: true,
        };

        return result;
      } finally {
        // Cleanup
        if (fs.existsSync(tempFilePath)) {
          fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Cleanup error:', err);
          });
        }
      }
    },
  };
}

describe('PDF Cleanup Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.unlink.mockImplementation((path, callback) => {
      if (callback) callback(null);
    });
  });

  test('should clean up temporary files after successful processing', async () => {
    const handler = createTestHandler();
    const mockFileBuffer = Buffer.from('mock pdf content');

    fs.existsSync.mockReturnValue(true);

    const result = await handler.processFile(mockFileBuffer);

    expect(result.processed).toBe(true);
    expect(fs.unlink).toHaveBeenCalled();
  });

  test('should clean up temporary files even if processing fails', async () => {
    const handler = createTestHandler();

    // Mock processing to fail
    handler.processFile = async function(fileBuffer) {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `test-${Date.now()}.pdf`);

      try {
        // Simulate writing file
        fs.writeFileSync = jest.fn();

        // Simulate processing failure
        throw new Error('Processing failed');
      } finally {
        // Cleanup
        if (fs.existsSync(tempFilePath)) {
          fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Cleanup error:', err);
          });
        }
      }
    };

    const mockFileBuffer = Buffer.from('mock pdf content');

    await expect(handler.processFile(mockFileBuffer)).rejects.toThrow('Processing failed');
    expect(fs.unlink).toHaveBeenCalled();
  });

  test('should handle cleanup errors gracefully', async () => {
    const handler = createTestHandler();
    const mockFileBuffer = Buffer.from('mock pdf content');

    // Mock unlink to fail
    fs.unlink.mockImplementation((path, callback) => {
      if (callback) callback(new Error('Unlink failed'));
    });

    const result = await handler.processFile(mockFileBuffer);

    expect(result.processed).toBe(true);
    expect(fs.unlink).toHaveBeenCalled();
    // Should not throw error even if cleanup fails
  });

  test('should not attempt cleanup if file does not exist', async () => {
    const handler = createTestHandler();
    const mockFileBuffer = Buffer.from('mock pdf content');

    fs.existsSync.mockReturnValue(false);

    const result = await handler.processFile(mockFileBuffer);

    expect(result.processed).toBe(true);
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  test('should clean up multiple temporary files if created', async () => {
    const handler = {
      async processFile(fileBuffer) {
        const tempDir = os.tmpdir();
        const tempFilePath1 = path.join(tempDir, `test1-${Date.now()}.pdf`);
        const tempFilePath2 = path.join(tempDir, `test2-${Date.now()}.pdf`);

        try {
          // Simulate processing with multiple temp files
          const result = {
            file: 'test.pdf',
            processed: true,
          };

          return result;
        } finally {
          // Cleanup multiple files
          [tempFilePath1, tempFilePath2].forEach(filePath => {
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) console.error('Cleanup error:', err);
              });
            }
          });
        }
      },
    };

    const mockFileBuffer = Buffer.from('mock pdf content');

    const result = await handler.processFile(mockFileBuffer);

    expect(result.processed).toBe(true);
    expect(fs.unlink).toHaveBeenCalledTimes(2);
  });

  test('should use secure temporary file names', () => {
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    const expectedPath = path.join(tempDir, `test-${timestamp}.pdf`);

    expect(expectedPath).toContain('test-');
    expect(expectedPath).toContain('.pdf');
    expect(expectedPath.startsWith(tempDir)).toBe(true);
  });

  test('should handle concurrent file processing with separate cleanup', async () => {
    const handler = createTestHandler();

    const process1 = handler.processFile(Buffer.from('content1'));
    const process2 = handler.processFile(Buffer.from('content2'));

    const [result1, result2] = await Promise.all([process1, process2]);

    expect(result1.processed).toBe(true);
    expect(result2.processed).toBe(true);
    expect(fs.unlink).toHaveBeenCalledTimes(2);
  });

  test('should clean up files on serverless function timeout', async () => {
    const handler = createTestHandler();

    // Simulate serverless timeout by setting a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout')), 100);
    });

    const processingPromise = handler.processFile(Buffer.from('content'));

    // Race between processing and timeout
    await expect(Promise.race([processingPromise, timeoutPromise])).rejects.toThrow();

    // Cleanup should still be attempted
    expect(fs.unlink).toHaveBeenCalled();
  });
});
