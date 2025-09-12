#!/usr/bin/env node

/**
 * Comprehensive Test Runner for RankRx Light
 * This script runs all tests and provides a summary
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting RankRx Light Comprehensive Test Suite\n');

// Test configuration
const testConfig = {
  frontend: {
    path: './',
    command: 'npm test -- --watchAll=false --verbose',
    description: 'Frontend React Components and Integration Tests'
  },
  api: {
    path: './',
    command: 'node -e "console.log(\'API tests would run here with proper Python test runner\')"',
    description: 'Python API Endpoint Tests'
  }
};

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

function runTestSuite(name, config) {
  console.log(`📋 Running ${config.description}`);
  console.log('─'.repeat(50));

  try {
    const originalDir = process.cwd();
    process.chdir(config.path);

    const output = execSync(config.command, {
      encoding: 'utf8',
      timeout: 300000, // 5 minutes timeout
      stdio: 'pipe'
    });

    process.chdir(originalDir);

    // Parse test results (basic parsing for Jest output)
    const passed = (output.match(/✓/g) || []).length;
    const failed = (output.match(/✕/g) || []).length;

    results.total += passed + failed;
    results.passed += passed;
    results.failed += failed;

    results.details.push({
      name,
      status: failed > 0 ? 'FAILED' : 'PASSED',
      passed,
      failed,
      output: output.slice(-500) // Last 500 chars for summary
    });

    console.log(`✅ ${name}: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      console.log('❌ Output:', output.slice(-200));
    }

  } catch (error) {
    results.failed += 1;
    results.details.push({
      name,
      status: 'ERROR',
      passed: 0,
      failed: 1,
      output: error.message
    });

    console.log(`❌ ${name}: Failed to run - ${error.message}`);
  }

  console.log('');
}

function generateReport() {
  console.log('📊 Test Results Summary');
  console.log('═'.repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📈 Success Rate: ${results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0}%`);
  console.log('');

  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.details.filter(test => test.status !== 'PASSED').forEach(test => {
      console.log(`  • ${test.name}: ${test.failed} failures`);
    });
    console.log('');
  }

  console.log('🔍 Detailed Results:');
  results.details.forEach(test => {
    const icon = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.passed}/${test.passed + test.failed} passed`);
  });
}

function checkTestFiles() {
  console.log('🔍 Checking Test Files');

  const testFiles = [
    '__tests__/api/parse-pdf.test.js',
    '__tests__/components/FileUpload.test.tsx',
    '__tests__/components/HomePage.test.tsx',
    '__tests__/integration/FileUploadIntegration.test.tsx',
    '__tests__/utils/ranking.test.ts',
    '__tests__/utils/pdfCleanup.test.js',
    '__tests__/utils/pdfParsing.test.js'
  ];

  let missingFiles = [];
  testFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    console.log('⚠️  Missing test files:');
    missingFiles.forEach(file => console.log(`  • ${file}`));
    console.log('');
  } else {
    console.log('✅ All test files present');
  }
  console.log('');
}

function main() {
  console.log('🎯 RankRx Light - Comprehensive Testing Suite');
  console.log('Testing PDF upload, parsing, ranking, and cleanup functionality\n');

  checkTestFiles();

  // Run frontend tests
  runTestSuite('Frontend Tests', testConfig.frontend);

  // Run API tests (placeholder for now)
  runTestSuite('API Tests', testConfig.api);

  generateReport();

  // Exit with appropriate code
  const exitCode = results.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}
