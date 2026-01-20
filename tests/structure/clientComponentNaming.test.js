/**
 * Property-Based Tests for Client Component File Naming
 * 
 * Feature: code-modularity-refactor
 * Property 7: Client Component File Naming
 * 
 * *For any* React component file (.jsx) in the client, the file name SHALL be 
 * PascalCase and SHALL match the component's default export name.
 * 
 * **Validates: Requirements 6.1, 6.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');

/**
 * Non-component JSX files that are excluded from PascalCase naming requirement
 * These are configuration/entry files that use JSX syntax but are not React components
 */
const EXCLUDED_JSX_FILES = ['routes.jsx', 'main.jsx'];

/**
 * Helper function to recursively get all .jsx component files in a directory
 * @param {string} dirPath - Path to directory
 * @returns {string[]} Array of file paths
 */
const getJsxFilesRecursively = (dirPath) => {
  const files = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and dist directories
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        files.push(...getJsxFilesRecursively(fullPath));
      }
    } else if (entry.name.endsWith('.jsx')) {
      // Exclude non-component JSX files (like route configurations)
      if (!EXCLUDED_JSX_FILES.includes(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
};

/**
 * Helper function to check if a string is PascalCase
 * @param {string} str - String to check
 * @returns {boolean} True if PascalCase
 */
const isPascalCase = (str) => {
  // PascalCase: starts with uppercase, no underscores or hyphens, can have numbers
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
};

/**
 * Helper function to extract the default export name from a file
 * @param {string} filePath - Path to file
 * @returns {string|null} Default export name or null if not found
 */
const extractDefaultExportName = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Pattern 1: export default function ComponentName
  const funcMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (funcMatch) return funcMatch[1];
  
  // Pattern 2: export default ComponentName (at end of file)
  const exportMatch = content.match(/export\s+default\s+(\w+)\s*;?\s*$/m);
  if (exportMatch) return exportMatch[1];
  
  // Pattern 3: const ComponentName = ... ; export default ComponentName
  const constExportMatch = content.match(/export\s+default\s+(\w+)/);
  if (constExportMatch) return constExportMatch[1];
  
  return null;
};

/**
 * Helper function to get the file name without extension
 * @param {string} filePath - Path to file
 * @returns {string} File name without extension
 */
const getFileNameWithoutExtension = (filePath) => {
  return path.basename(filePath, '.jsx');
};

describe('Feature: code-modularity-refactor, Property 7: Client Component File Naming', () => {
  // Get all JSX files in client/src
  const jsxFiles = getJsxFilesRecursively(CLIENT_SRC_PATH);
  
  it('should have JSX files in the client directory', () => {
    expect(jsxFiles.length).toBeGreaterThan(0);
  });

  it('should have all JSX file names in PascalCase (property test)', async () => {
    if (jsxFiles.length === 0) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...jsxFiles),
        async (filePath) => {
          const fileName = getFileNameWithoutExtension(filePath);
          
          // Property: JSX file names must be PascalCase
          expect(isPascalCase(fileName)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have JSX file names matching their default export (property test)', async () => {
    if (jsxFiles.length === 0) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...jsxFiles),
        async (filePath) => {
          const fileName = getFileNameWithoutExtension(filePath);
          const exportName = extractDefaultExportName(filePath);
          
          // Property: If file has a default export, file name should match export name
          if (exportName) {
            expect(fileName).toBe(exportName);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Specific tests for feature component files
  describe('Feature component files', () => {
    const featureComponentDirs = [
      'features/tickets/components',
      'features/tickets/pages',
      'features/auth/pages',
      'features/dashboard/pages',
      'features/agent/pages',
      'features/admin/pages',
    ];

    it('should have PascalCase component files in feature directories (property test)', async () => {
      const featureJsxFiles = [];
      
      for (const dir of featureComponentDirs) {
        const dirPath = path.join(CLIENT_SRC_PATH, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsx'));
          featureJsxFiles.push(...files.map(f => path.join(dirPath, f)));
        }
      }
      
      if (featureJsxFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...featureJsxFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Feature component files must be PascalCase
            expect(isPascalCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Specific tests for shared component files
  describe('Shared component files', () => {
    const sharedComponentDirs = [
      'shared/components/layout',
      'shared/components/feedback',
      'shared/components/form',
    ];

    it('should have PascalCase component files in shared directories (property test)', async () => {
      const sharedJsxFiles = [];
      
      for (const dir of sharedComponentDirs) {
        const dirPath = path.join(CLIENT_SRC_PATH, dir);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsx'));
          sharedJsxFiles.push(...files.map(f => path.join(dirPath, f)));
        }
      }
      
      if (sharedJsxFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...sharedJsxFiles),
          async (filePath) => {
            const fileName = getFileNameWithoutExtension(filePath);
            
            // Property: Shared component files must be PascalCase
            expect(isPascalCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
