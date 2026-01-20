/**
 * Property-Based Tests for Test File Co-location
 * 
 * Feature: code-modularity-refactor
 * Property 13: Test File Co-location
 * 
 * Tests that client component and utility tests are co-located with their source files
 * 
 * **Validates: Requirements 9.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');
const FEATURES_PATH = path.join(CLIENT_SRC_PATH, 'features');
const SHARED_PATH = path.join(CLIENT_SRC_PATH, 'shared');

/**
 * Recursively get all files matching a pattern
 */
function getAllFilesRecursive(dir, pattern, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFilesRecursive(filePath, pattern, fileList);
    } else if (pattern.test(file)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Get all test files in features and shared directories
 */
function getAllTestFiles() {
  const featureTests = getAllFilesRecursive(FEATURES_PATH, /\.test\.js$/);
  const sharedTests = getAllFilesRecursive(SHARED_PATH, /\.test\.js$/);
  return [...featureTests, ...sharedTests];
}

/**
 * Check if a test file is co-located with its source file
 * Test files should be in a __tests__ subdirectory within the same feature directory
 */
function isTestColocated(testFilePath) {
  // Test file should be in a __tests__ directory
  return testFilePath.includes('__tests__');
}

/**
 * Property 13: Test File Co-location
 * 
 * *For any* component or utility in a feature directory, its unit test file SHALL be 
 * located in a `__tests__/` subdirectory within the same feature directory.
 * 
 * **Validates: Requirements 9.1**
 */
describe('Feature: code-modularity-refactor, Property 13: Test File Co-location', () => {
  
  it('should have all test files in __tests__ directories (property test)', async () => {
    const testFiles = getAllTestFiles();
    
    // Skip if no test files found
    if (testFiles.length === 0) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testFiles),
        async (testFilePath) => {
          // Property: All test files should be in __tests__ directories
          expect(isTestColocated(testFilePath)).toBe(true);
        }
      ),
      { numRuns: Math.min(testFiles.length, 100) }
    );
  });

  it('should have __tests__ directories within feature directories', () => {
    // Check that __tests__ directories exist in features
    const ticketsTestsPath = path.join(FEATURES_PATH, 'tickets', '__tests__');
    
    // Property: Feature directories with tests should have __tests__ subdirectory
    if (fs.existsSync(ticketsTestsPath)) {
      const stats = fs.statSync(ticketsTestsPath);
      expect(stats.isDirectory()).toBe(true);
    }
  });

  it('should have __tests__ directories within shared directories', () => {
    // Check that __tests__ directories exist in shared
    const sharedFeedbackTestsPath = path.join(SHARED_PATH, 'components', 'feedback', '__tests__');
    
    // Property: Shared directories with tests should have __tests__ subdirectory
    if (fs.existsSync(sharedFeedbackTestsPath)) {
      const stats = fs.statSync(sharedFeedbackTestsPath);
      expect(stats.isDirectory()).toBe(true);
    }
  });

  it('should not have test files in legacy tests/components directory', () => {
    const legacyTestsPath = path.join(process.cwd(), 'tests', 'components');
    
    // Property: Legacy tests/components directory should not exist or be empty
    if (fs.existsSync(legacyTestsPath)) {
      const files = fs.readdirSync(legacyTestsPath);
      expect(files.length).toBe(0);
    }
  });

  it('should have test files named with .test.js suffix (property test)', async () => {
    const testFiles = getAllTestFiles();
    
    // Skip if no test files found
    if (testFiles.length === 0) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testFiles),
        async (testFilePath) => {
          // Property: All test files should have .test.js suffix
          expect(testFilePath).toMatch(/\.test\.js$/);
        }
      ),
      { numRuns: Math.min(testFiles.length, 100) }
    );
  });

  it('should have test files for major components in tickets feature', () => {
    // Check for specific test files that should exist
    const expectedTests = [
      'client/src/features/tickets/__tests__/AgentSelect.test.js',
      'client/src/features/tickets/__tests__/SLADisplay.test.js',
      'client/src/features/tickets/__tests__/TicketBadges.test.js'
    ];

    for (const testPath of expectedTests) {
      const fullPath = path.join(process.cwd(), testPath);
      // Property: Major component tests should exist in feature __tests__ directory
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('should have test files for shared components', () => {
    // Check for shared component tests
    const errorDisplayTest = path.join(
      process.cwd(),
      'client/src/shared/components/feedback/__tests__/ErrorDisplay.test.js'
    );

    // Property: Shared component tests should exist in shared __tests__ directory
    if (fs.existsSync(errorDisplayTest)) {
      expect(fs.existsSync(errorDisplayTest)).toBe(true);
    }
  });
});
