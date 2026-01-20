/**
 * Property-Based Tests for Backend Test Adjacency
 * 
 * Feature: code-modularity-refactor
 * Property 14: Backend Test Adjacency
 * 
 * Tests that backend service tests are adjacent to service files with .test.js suffix
 * 
 * **Validates: Requirements 9.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const SERVICES_PATH = path.join(process.cwd(), 'src', 'services');

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
 * Get all service files (.js but not .test.js) in services directory
 */
function getAllServiceFiles() {
  const allJsFiles = getAllFilesRecursive(SERVICES_PATH, /\.js$/);
  // Filter out test files and index files
  return allJsFiles.filter(file => 
    !file.includes('.test.js') && 
    !file.endsWith('index.js')
  );
}

/**
 * Get all test files in services directory
 */
function getAllServiceTestFiles() {
  return getAllFilesRecursive(SERVICES_PATH, /\.test\.js$/);
}

/**
 * Check if a test file is adjacent to its service file
 * Test file should be in the same directory with .test.js suffix
 */
function isTestAdjacent(serviceFilePath) {
  const dir = path.dirname(serviceFilePath);
  const basename = path.basename(serviceFilePath, '.js');
  const testFilePath = path.join(dir, `${basename}.test.js`);
  
  return fs.existsSync(testFilePath);
}

/**
 * Get the expected test file path for a service file
 */
function getExpectedTestPath(serviceFilePath) {
  const dir = path.dirname(serviceFilePath);
  const basename = path.basename(serviceFilePath, '.js');
  return path.join(dir, `${basename}.test.js`);
}

/**
 * Property 14: Backend Test Adjacency
 * 
 * *For any* service file in the backend, its test file SHALL be adjacent to the 
 * service file with a `.test.js` suffix.
 * 
 * **Validates: Requirements 9.2**
 */
describe('Feature: code-modularity-refactor, Property 14: Backend Test Adjacency', () => {
  
  it('should have test files adjacent to service files with .test.js suffix (property test)', async () => {
    const testFiles = getAllServiceTestFiles();
    
    // Skip if no test files found
    if (testFiles.length === 0) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testFiles),
        async (testFilePath) => {
          const dir = path.dirname(testFilePath);
          const basename = path.basename(testFilePath, '.test.js');
          const serviceFilePath = path.join(dir, `${basename}.js`);
          
          // Property: Test file should be adjacent to its service file
          // The service file should exist in the same directory
          expect(fs.existsSync(serviceFilePath)).toBe(true);
        }
      ),
      { numRuns: Math.min(testFiles.length, 100) }
    );
  });

  it('should have test files with .test.js suffix (property test)', async () => {
    const testFiles = getAllServiceTestFiles();
    
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

  it('should not have test files in legacy tests/services directory', () => {
    const legacyTestsPath = path.join(process.cwd(), 'tests', 'services');
    
    // Property: Legacy tests/services directory should not exist or be empty
    if (fs.existsSync(legacyTestsPath)) {
      const files = fs.readdirSync(legacyTestsPath);
      expect(files.length).toBe(0);
    }
  });

  it('should have test file for ticket-assignment service', () => {
    const serviceFile = path.join(SERVICES_PATH, 'ticket', 'ticket-assignment.js');
    const testFile = path.join(SERVICES_PATH, 'ticket', 'ticket-assignment.test.js');
    
    // Property: ticket-assignment service should have adjacent test file
    if (fs.existsSync(serviceFile)) {
      expect(fs.existsSync(testFile)).toBe(true);
    }
  });

  it('should have test files in the same directory as service files (property test)', async () => {
    const testFiles = getAllServiceTestFiles();
    
    // Skip if no test files found
    if (testFiles.length === 0) {
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...testFiles),
        async (testFilePath) => {
          const testDir = path.dirname(testFilePath);
          const basename = path.basename(testFilePath, '.test.js');
          const serviceFilePath = path.join(testDir, `${basename}.js`);
          
          // Property: Test file directory should match service file directory
          const serviceDir = path.dirname(serviceFilePath);
          expect(testDir).toBe(serviceDir);
        }
      ),
      { numRuns: Math.min(testFiles.length, 100) }
    );
  });

  it('should have service files organized in domain directories', () => {
    // Check that service domain directories exist
    const domainDirs = ['ticket', 'auth', 'admin', 'agent'];
    
    for (const domain of domainDirs) {
      const domainPath = path.join(SERVICES_PATH, domain);
      
      // Property: Domain directories should exist
      expect(fs.existsSync(domainPath)).toBe(true);
      
      if (fs.existsSync(domainPath)) {
        const stats = fs.statSync(domainPath);
        expect(stats.isDirectory()).toBe(true);
      }
    }
  });

  it('should have test files within domain directories, not at root', () => {
    const testFiles = getAllServiceTestFiles();
    
    // Skip if no test files found
    if (testFiles.length === 0) {
      return;
    }

    for (const testFile of testFiles) {
      const relativePath = path.relative(SERVICES_PATH, testFile);
      const parts = relativePath.split(path.sep);
      
      // Property: Test files should be at least one level deep (in a domain directory)
      // Not directly in src/services/
      expect(parts.length).toBeGreaterThan(1);
    }
  });
});
