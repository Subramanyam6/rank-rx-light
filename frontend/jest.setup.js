import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the PDF parsing function
jest.mock('../parse.py', () => ({
  parse_pdf_file: jest.fn(),
}));

// Mock the File API
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.filename = filename;
    this.name = filename;
    this.size = properties?.size || 1024;
    this.type = properties?.type || 'application/pdf';
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FormData
global.FormData = class MockFormData {
  constructor() {
    this.data = {};
  }

  append(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key];
  }
};
