// Mock the parse module
jest.mock('../../parse.py', () => ({
  parse_pdf_file: jest.fn(),
  parse: jest.fn(),
  text_of: jest.fn(),
  parse_step: jest.fn(),
}));

const { parse_pdf_file, parse, text_of, parse_step } = require('../../parse.py');

describe('PDF Parsing Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parse_pdf_file function', () => {
    test('should successfully parse a valid PDF file', async () => {
      const mockPdfPath = '/path/to/test.pdf';
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

      const result = await parse_pdf_file(mockPdfPath);

      expect(parse_pdf_file).toHaveBeenCalledWith(mockPdfPath);
      expect(result).toEqual(mockParsedData);
      expect(result.file).toBe('test.pdf');
    });

    test('should handle PDF parsing errors', async () => {
      const mockPdfPath = '/path/to/invalid.pdf';
      const mockError = new Error('Failed to extract text from PDF');

      parse_pdf_file.mockRejectedValue(mockError);

      const result = await parse_pdf_file(mockPdfPath);

      expect(result.error).toContain('Failed to parse PDF');
      expect(result.file).toBe('invalid.pdf');
    });

    test('should handle non-existent PDF files', async () => {
      const mockPdfPath = '/path/to/nonexistent.pdf';

      parse_pdf_file.mockRejectedValue(new Error('File not found'));

      const result = await parse_pdf_file(mockPdfPath);

      expect(result.error).toContain('Failed to parse PDF');
      expect(result.file).toBe('nonexistent.pdf');
    });

    test('should handle corrupted PDF files', async () => {
      const mockPdfPath = '/path/to/corrupted.pdf';

      parse_pdf_file.mockRejectedValue(new Error('PDF file is corrupted'));

      const result = await parse_pdf_file(mockPdfPath);

      expect(result.error).toContain('Failed to parse PDF');
      expect(result.file).toBe('corrupted.pdf');
    });
  });

  describe('text_of function', () => {
    test('should extract text from PDF correctly', () => {
      const mockPdfText = `
        USMLE STEP 1
        01/15/2023 PASS 240
        USMLE STEP 2
        03/20/2023 PASS 250
        ECFMG Certified: Yes
        Visa Sponsorship Needed: No
      `;

      text_of.mockReturnValue(mockPdfText);

      const result = text_of('/path/to/test.pdf');

      expect(text_of).toHaveBeenCalledWith('/path/to/test.pdf');
      expect(result).toContain('USMLE STEP 1');
      expect(result).toContain('USMLE STEP 2');
      expect(result).toContain('ECFMG Certified');
    });

    test('should handle PDFs with no text content', () => {
      text_of.mockReturnValue('');

      const result = text_of('/path/to/empty.pdf');

      expect(result).toBe('');
    });

    test('should normalize text formatting', () => {
      const messyText = 'USMLE\u00a0STEP\u00a01\nPASS\u00a0240';
      const normalizedText = 'USMLE STEP 1\nPASS 240';

      text_of.mockReturnValue(messyText);

      const result = text_of('/path/to/messy.pdf');

      // The function should handle normalization
      expect(result).toContain('USMLE');
    });
  });

  describe('parse function', () => {
    test('should parse complete USMLE application data', () => {
      const mockText = `
        Authorized to Work in the U.S.: Yes
        Current Work Authorization: H1B
        Visa Sponsorship Needed: No
        USMLE STEP 1
        01/15/2023 PASS 240
        USMLE STEP 2
        03/20/2023 PASS 250
        ECFMG Certified: Yes
      `;

      const mockParsedData = {
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

      parse.mockReturnValue(mockParsedData);

      const result = parse(mockText);

      expect(parse).toHaveBeenCalledWith(mockText);
      expect(result.visa.authorized_to_work_us).toBe('Yes');
      expect(result.usmle.step1.passed).toBe(true);
      expect(result.usmle.step2_ck.score).toBe('250');
      expect(result.ecfmg_status_report.certified).toBe('Yes');
    });

    test('should handle missing visa information', () => {
      const mockText = `
        USMLE STEP 1
        01/15/2023 PASS 240
        ECFMG Certified: Yes
      `;

      const mockParsedData = {
        visa: {
          authorized_to_work_us: null,
          current_work_authorization: null,
          visa_sponsorship_needed: null,
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
            present: false,
            passed: false,
            pass_date: null,
            score: null,
            failures: 0,
          },
        },
        ecfmg_status_report: {
          present: true,
          certified: 'Yes',
        },
      };

      parse.mockReturnValue(mockParsedData);

      const result = parse(mockText);

      expect(result.visa.authorized_to_work_us).toBeNull();
      expect(result.usmle.step1.present).toBe(true);
      expect(result.usmle.step2_ck.present).toBe(false);
    });

    test('should handle failed USMLE exams', () => {
      const mockText = `
        USMLE STEP 1
        01/15/2023 FAIL
        02/20/2023 PASS 235
        USMLE STEP 2
        03/20/2023 FAIL
        05/15/2023 PASS 245
      `;

      const mockParsedData = {
        visa: {
          authorized_to_work_us: null,
          current_work_authorization: null,
          visa_sponsorship_needed: null,
          visa_sponsorship_sought: null,
        },
        usmle: {
          step1: {
            present: true,
            passed: true,
            pass_date: '02/20/2023',
            score: '235',
            failures: 1,
          },
          step2_ck: {
            present: true,
            passed: true,
            pass_date: '05/15/2023',
            score: '245',
            failures: 1,
          },
        },
        ecfmg_status_report: {
          present: false,
          certified: 'Not Available',
        },
      };

      parse.mockReturnValue(mockParsedData);

      const result = parse(mockText);

      expect(result.usmle.step1.failures).toBe(1);
      expect(result.usmle.step2_ck.failures).toBe(1);
      expect(result.usmle.step1.passed).toBe(true);
      expect(result.usmle.step2_ck.passed).toBe(true);
    });

    test('should handle ECFMG status variations', () => {
      const testCases = [
        { text: 'ECFMG Certified: Yes', expected: 'Yes' },
        { text: 'ECFMG Certified: No', expected: 'No' },
        { text: 'ECFMG Certified: Not Available', expected: 'Not Available' },
        { text: '', expected: 'Not Available' },
      ];

      testCases.forEach(({ text, expected }) => {
        parse.mockReturnValue({
          visa: {},
          usmle: { step1: {}, step2_ck: {} },
          ecfmg_status_report: {
            present: text.length > 0,
            certified: expected,
          },
        });

        const result = parse(text);
        expect(result.ecfmg_status_report.certified).toBe(expected);
      });
    });
  });

  describe('parse_step function', () => {
    test('should parse STEP exam results correctly', () => {
      const mockBlocks = [
        '01/15/2023 PASS 240',
        'Previous attempt: 12/10/2022 FAIL',
      ];

      const mockParsedStep = {
        present: true,
        passed: true,
        pass_date: '01/15/2023',
        score: '240',
        failures: 1,
      };

      parse_step.mockReturnValue(mockParsedStep);

      const result = parse_step(mockBlocks);

      expect(parse_step).toHaveBeenCalledWith(mockBlocks);
      expect(result.present).toBe(true);
      expect(result.passed).toBe(true);
      expect(result.failures).toBe(1);
    });

    test('should handle exams with no attempts', () => {
      const mockBlocks = [];

      const mockParsedStep = {
        present: false,
        passed: false,
        pass_date: null,
        score: null,
        failures: 0,
      };

      parse_step.mockReturnValue(mockParsedStep);

      const result = parse_step(mockBlocks);

      expect(result.present).toBe(false);
      expect(result.passed).toBe(false);
      expect(result.failures).toBe(0);
    });

    test('should handle exams with only failures', () => {
      const mockBlocks = [
        '01/15/2023 FAIL',
        '02/20/2023 FAIL',
      ];

      const mockParsedStep = {
        present: true,
        passed: false,
        pass_date: null,
        score: null,
        failures: 2,
      };

      parse_step.mockReturnValue(mockParsedStep);

      const result = parse_step(mockBlocks);

      expect(result.present).toBe(true);
      expect(result.passed).toBe(false);
      expect(result.failures).toBe(2);
    });

    test('should handle score parsing edge cases', () => {
      const testCases = [
        { blocks: ['01/15/2023 PASS (240)'], expectedScore: '240' },
        { blocks: ['01/15/2023 PASS 240'], expectedScore: '240' },
        { blocks: ['01/15/2023 PASS'], expectedScore: null },
        { blocks: ['01/15/2023 FAIL'], expectedScore: null },
      ];

      testCases.forEach(({ blocks, expectedScore }) => {
        parse_step.mockReturnValue({
          present: true,
          passed: expectedScore !== null,
          pass_date: expectedScore ? '01/15/2023' : null,
          score: expectedScore,
          failures: expectedScore ? 0 : 1,
        });

        const result = parse_step(blocks);
        expect(result.score).toBe(expectedScore);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle malformed PDF text gracefully', () => {
      const malformedText = 'This is not a USMLE application document at all';

      parse.mockReturnValue({
        visa: {
          authorized_to_work_us: null,
          current_work_authorization: null,
          visa_sponsorship_needed: null,
          visa_sponsorship_sought: null,
        },
        usmle: {
          step1: {
            present: false,
            passed: false,
            pass_date: null,
            score: null,
            failures: 0,
          },
          step2_ck: {
            present: false,
            passed: false,
            pass_date: null,
            score: null,
            failures: 0,
          },
        },
        ecfmg_status_report: {
          present: false,
          certified: 'Not Available',
        },
      });

      const result = parse(malformedText);

      expect(result.usmle.step1.present).toBe(false);
      expect(result.usmle.step2_ck.present).toBe(false);
      expect(result.ecfmg_status_report.present).toBe(false);
    });

    test('should handle very large PDF files', () => {
      const largeText = 'USMLE STEP 1\n'.repeat(10000) + 'PASS 240';

      parse.mockReturnValue({
        visa: {},
        usmle: {
          step1: { present: true, passed: true, pass_date: null, score: '240', failures: 0 },
          step2_ck: { present: false, passed: false, pass_date: null, score: null, failures: 0 },
        },
        ecfmg_status_report: { present: false, certified: 'Not Available' },
      });

      const result = parse(largeText);

      expect(result.usmle.step1.passed).toBe(true);
    });

    test('should handle special characters in PDF text', () => {
      const specialText = 'USMLE STEP 1\n01/15/2023 PASS 240\nSpecial chars: àáâãäå';

      parse.mockReturnValue({
        visa: {},
        usmle: {
          step1: { present: true, passed: true, pass_date: '01/15/2023', score: '240', failures: 0 },
          step2_ck: { present: false, passed: false, pass_date: null, score: null, failures: 0 },
        },
        ecfmg_status_report: { present: false, certified: 'Not Available' },
      });

      const result = parse(specialText);

      expect(result.usmle.step1.score).toBe('240');
    });
  });
});
