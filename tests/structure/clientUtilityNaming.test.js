/**
 * Property-Based Tests for Client Utility File Naming
 * 
 * Feature: code-modularity-refactor
 * Property 8: Client Utility File Naming
 * 
 * *For any* utility or hook file (.js) in the client, the file name SHALL be camelCase.
 * 
 * **Validates: Requirements 6.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');

/**
 * Files that are excluded from camelCase naming requirement
 * These are barrel exports (index.js) which are a standard convention
 */
const EXCLUDED_FILES = ['index.js'];

/**
 * Helper function to check if a string is camelCase
 * @param {string} str - String to check
 * @returns {boolean} True if camelCase
 */
const isCamelCase = (str) => {
  // camelCase: starts with lowercase, no underscores or hyphens, can have numbers
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
};

/**
 * Helper function to get all .js utility/hook files in a directory
 * @param {string} dirPath - Path to directory
 * @returns {string[]} Array of file paths
 */
const getJsUtilityFiles = (dirPath) => {
  const files = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isFile() && entry.name.endsWith('.js')) {
      // Exclude barrel exports
      if (!EXCLUDED_FILES.includes(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
};

/**
 * Helper function to get the file name without extension
 * @param {string} filePath - Path to file
 * @returns {string} File name without extension
 */
const getFileNameWithoutExtension = (filePath) => {
  return path.basename(filePath, '.js');
};

describe('Feature: code-modularity-refactor, Property 8: Client Utility File Naming', () => {
  
  // Test shared/utils directory
  describe('Shared utils files', () => {
    const utilsPath = path.join(CLIENT_SRC_PATH, 'shared', 'utils');
    const utilFiles = getJsUtilityFiles(utilsPath);
    
    it('should have utility files in shared/utils', () => {
      expect(utilFiles.length).toBeGreaterThan(0);
    });

    it('should have all utility file names in camelCase (property test)', async () => {
      if (utilFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...utilFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Utility file names must be camelCase
            expect(isCamelCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test shared/hooks directory
  describe('Shared hooks files', () => {
    const hooksPath = path.join(CLIENT_SRC_PATH, 'shared', 'hooks');
    const hookFiles = getJsUtilityFiles(hooksPath);
    
    it('should have hook files in shared/hooks', () => {
      expect(hookFiles.length).toBeGreaterThan(0);
    });

    it('should have all hook file names in camelCase (property test)', async () => {
      if (hookFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...hookFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Hook file names must be camelCase
            expect(isCamelCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have hook files starting with "use" prefix (property test)', async () => {
      if (hookFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...hookFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Hook file names should start with "use"
            expect(fileName.startsWith('use')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test feature API hook files
  describe('Feature API hook files', () => {
    const features = ['tickets', 'auth', 'admin', 'agent', 'dashboard'];
    
    it('should have all feature API hook files in camelCase (property test)', async () => {
      const hookFiles = [];
      
      for (const feature of features) {
        const apiPath = path.join(CLIENT_SRC_PATH, 'features', feature, 'api');
        if (fs.existsSync(apiPath)) {
          const files = getJsUtilityFiles(apiPath);
          hookFiles.push(...files);
        }
      }
      
      if (hookFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...hookFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: API hook/utility file names must be camelCase
            expect(isCamelCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test shared/constants files
  describe('Shared constants files', () => {
    const constantsPath = path.join(CLIENT_SRC_PATH, 'shared', 'constants');
    const constantFiles = getJsUtilityFiles(constantsPath);
    
    it('should have constant files in shared/constants', () => {
      expect(constantFiles.length).toBeGreaterThan(0);
    });

    it('should have all constant file names in camelCase (property test)', async () => {
      if (constantFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...constantFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Constant file names must be camelCase
            expect(isCamelCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
