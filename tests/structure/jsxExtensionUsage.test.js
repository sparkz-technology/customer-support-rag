/**
 * Property-Based Tests for JSX Extension Usage
 * 
 * Feature: code-modularity-refactor
 * Property 10: JSX Extension Usage
 * 
 * *For any* file containing JSX syntax, the file SHALL have a `.jsx` extension; 
 * files without JSX SHALL have a `.js` extension.
 * 
 * **Validates: Requirements 6.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');

/**
 * Files that are intentionally .jsx for consistency with other tests
 * (e.g., routes.jsx is required by routeLazyLoading.test.js)
 */
const EXCLUDED_JSX_FILES = ['routes.jsx', 'main.jsx'];

/**
 * Helper function to recursively get all .js and .jsx files in a directory
 * @param {string} dirPath - Path to directory
 * @returns {string[]} Array of file paths
 */
const getJavaScriptFilesRecursively = (dirPath) => {
  const files = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and dist directories
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...getJavaScriptFilesRecursively(fullPath));
      }
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
};

/**
 * Helper function to check if a file contains JSX syntax
 * @param {string} filePath - Path to file
 * @returns {boolean} True if file contains JSX
 */
const containsJSX = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // More precise JSX detection:
  // Look for actual JSX syntax, not just angle brackets
  
  // Check for React component tags (PascalCase) with proper JSX context
  const hasComponentTag = /<[A-Z][a-zA-Z0-9]*[\s\/>]/.test(content) && 
                          (content.includes('import React') || content.includes('from \'react\'') || content.includes('from "react"'));
  
  // Check for HTML tags in return statements (strong indicator of JSX)
  const hasHTMLInReturn = /return\s*\(\s*<[a-z]+[\s>]/.test(content) || /return\s+<[a-z]+[\s>]/.test(content);
  
  // Check for JSX fragments
  const hasFragment = /return\s*\(\s*<>/.test(content) || /return\s+<>/.test(content);
  
  // Check for self-closing JSX tags (strong indicator)
  const hasSelfClosingTag = /<[A-Z][a-zA-Z0-9]*\s+[^>]*\/>/.test(content);
  
  return hasComponentTag || hasHTMLInReturn || hasFragment || hasSelfClosingTag;
};

/**
 * Helper function to get file extension
 * @param {string} filePath - Path to file
 * @returns {string} File extension (.js or .jsx)
 */
const getFileExtension = (filePath) => {
  return path.extname(filePath);
};

describe('Feature: code-modularity-refactor, Property 10: JSX Extension Usage', () => {
  // Get all JavaScript files in client/src
  const allFiles = getJavaScriptFilesRecursively(CLIENT_SRC_PATH);
  
  it('should have JavaScript files in the client directory', () => {
    expect(allFiles.length).toBeGreaterThan(0);
  });

  it('should use .jsx extension for files containing JSX syntax (property test)', async () => {
    if (allFiles.length === 0) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allFiles),
        async (filePath) => {
          const hasJSX = containsJSX(filePath);
          const extension = getFileExtension(filePath);
          
          // Property: Files with JSX syntax must have .jsx extension
          if (hasJSX) {
            expect(extension).toBe('.jsx');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use .js extension for files without JSX syntax (property test)', async () => {
    if (allFiles.length === 0) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allFiles),
        async (filePath) => {
          const hasJSX = containsJSX(filePath);
          const extension = getFileExtension(filePath);
          const fileName = path.basename(filePath);
          // Skip excluded files that are intentionally .jsx
          if (EXCLUDED_JSX_FILES.includes(fileName)) return;
          
          // Property: Files without JSX syntax should have .js extension
          if (!hasJSX) {
            expect(extension).toBe('.js');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test specific directories
  describe('Feature component files', () => {
    const featureComponentDirs = [
      'features/tickets/components',
      'features/tickets/pages',
      'features/auth/pages',
      'features/dashboard/pages',
      'features/agent/pages',
      'features/admin/pages',
    ];

    it('should have .jsx extension for all component files (property test)', async () => {
      const componentFiles = [];
      
      for (const dir of featureComponentDirs) {
        const dirPath = path.join(CLIENT_SRC_PATH, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath)
            .filter(f => (f.endsWith('.js') || f.endsWith('.jsx')) && f !== 'index.js')
            .map(f => path.join(dirPath, f));
          componentFiles.push(...files);
        }
      }
      
      if (componentFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...componentFiles),
          async (filePath) => {
            const extension = getFileExtension(filePath);
            
            // Property: Component files in feature directories should use .jsx
            expect(extension).toBe('.jsx');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Shared component files', () => {
    const sharedComponentDirs = [
      'shared/components/layout',
      'shared/components/feedback',
      'shared/components/form',
    ];

    it('should have .jsx extension for all shared component files (property test)', async () => {
      const sharedComponentFiles = [];
      
      for (const dir of sharedComponentDirs) {
        const dirPath = path.join(CLIENT_SRC_PATH, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath)
            .filter(f => (f.endsWith('.js') || f.endsWith('.jsx')) && f !== 'index.js')
            .map(f => path.join(dirPath, f));
          sharedComponentFiles.push(...files);
        }
      }
      
      if (sharedComponentFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...sharedComponentFiles),
          async (filePath) => {
            const extension = getFileExtension(filePath);
            
            // Property: Shared component files should use .jsx
            expect(extension).toBe('.jsx');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('API and utility files', () => {
    const utilityDirs = [
      'shared/utils',
      'shared/hooks',
      'features/tickets/api',
      'features/auth/api',
      'features/admin/api',
      'features/agent/api',
      'features/dashboard/api',
    ];

    it('should have .js extension for all utility and API files (property test)', async () => {
      const utilityFiles = [];
      
      for (const dir of utilityDirs) {
        const dirPath = path.join(CLIENT_SRC_PATH, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath)
            .filter(f => f.endsWith('.js') || f.endsWith('.jsx'))
            .map(f => path.join(dirPath, f));
          utilityFiles.push(...files);
        }
      }
      
      if (utilityFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...utilityFiles),
          async (filePath) => {
            const extension = getFileExtension(filePath);
            
            // Property: Utility and API files should use .js (no JSX)
            expect(extension).toBe('.js');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
