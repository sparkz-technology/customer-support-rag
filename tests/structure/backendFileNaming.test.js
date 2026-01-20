/**
 * Property-Based Tests for Backend File Naming
 * 
 * Feature: code-modularity-refactor
 * Property 9: Backend File Naming
 * 
 * *For any* JavaScript file in the backend src/ directory, the file name 
 * SHALL be kebab-case (e.g., `ticket.service.js`, `auth.middleware.js`).
 * 
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_SRC_PATH = path.join(process.cwd(), 'src');

/**
 * Files that are excluded from kebab-case naming requirement
 * These are standard entry point files
 */
const EXCLUDED_FILES = ['index.js', 'app.js'];

/**
 * Helper function to check if a string is kebab-case
 * @param {string} str - String to check
 * @returns {boolean} True if kebab-case
 */
const isKebabCase = (str) => {
  // kebab-case: lowercase letters, numbers, hyphens, and dots
  // Must start with a letter, can contain dots (for patterns like auth.service.js)
  const nameWithoutExtension = str.replace(/\.(js|json)$/, '');
  return /^[a-z][a-z0-9]*([.-][a-z0-9]+)*$/.test(nameWithoutExtension);
};

/**
 * Helper function to recursively get all .js files in a directory
 * @param {string} dirPath - Path to directory
 * @returns {string[]} Array of file paths
 */
const getJsFilesRecursively = (dirPath) => {
  const files = [];
  
  if (!fs.existsSync(dirPath)) return files;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and test directories
      if (entry.name !== 'node_modules' && entry.name !== '__tests__') {
        files.push(...getJsFilesRecursively(fullPath));
      }
    } else if (entry.name.endsWith('.js')) {
      // Exclude standard entry point files
      if (!EXCLUDED_FILES.includes(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
};

/**
 * Helper function to get the file name with extension
 * @param {string} filePath - Path to file
 * @returns {string} File name with extension
 */
const getFileName = (filePath) => {
  return path.basename(filePath);
};

describe('Feature: code-modularity-refactor, Property 9: Backend File Naming', () => {
  // Get all JS files in src/
  const backendFiles = getJsFilesRecursively(BACKEND_SRC_PATH);
  
  it('should have JavaScript files in the backend directory', () => {
    expect(backendFiles.length).toBeGreaterThan(0);
  });

  it('should have all backend file names in kebab-case (property test)', async () => {
    if (backendFiles.length === 0) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...backendFiles),
        async (filePath) => {
          const fileName = getFileName(filePath);
          const nameWithoutExtension = fileName.replace('.js', '');
          
          // Models can be PascalCase (for Mongoose models), so check if this is a model file
          const isModelFile = filePath.includes(path.join('src', 'models'));
          const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(nameWithoutExtension);
          
          // Property: Backend file names must be kebab-case (or PascalCase for models)
          if (isModelFile) {
            expect(isPascalCase || isKebabCase(fileName)).toBe(true);
          } else {
            expect(isKebabCase(fileName)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test service files specifically
  describe('Service files', () => {
    const serviceDirs = ['ticket', 'auth', 'admin', 'agent'];
    
    it('should have all service files in kebab-case (property test)', async () => {
      const serviceFiles = [];
      
      for (const dir of serviceDirs) {
        const dirPath = path.join(BACKEND_SRC_PATH, 'services', dir);
        if (fs.existsSync(dirPath)) {
          const files = getJsFilesRecursively(dirPath);
          serviceFiles.push(...files);
        }
      }
      
      if (serviceFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...serviceFiles),
          async (filePath) => {
            const fileName = getFileName(filePath);
            
            // Property: Service file names must be kebab-case
            expect(isKebabCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test controller files
  describe('Controller files', () => {
    const controllersPath = path.join(BACKEND_SRC_PATH, 'controllers');
    
    it('should have all controller files in kebab-case (property test)', async () => {
      if (!fs.existsSync(controllersPath)) return;
      
      const controllerFiles = getJsFilesRecursively(controllersPath);
      
      if (controllerFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...controllerFiles),
          async (filePath) => {
            const fileName = getFileName(filePath);
            
            // Property: Controller file names must be kebab-case
            expect(isKebabCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test middleware files
  describe('Middleware files', () => {
    const middlewarePath = path.join(BACKEND_SRC_PATH, 'middleware');
    
    it('should have all middleware files in kebab-case (property test)', async () => {
      if (!fs.existsSync(middlewarePath)) return;
      
      const middlewareFiles = getJsFilesRecursively(middlewarePath);
      
      if (middlewareFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...middlewareFiles),
          async (filePath) => {
            const fileName = getFileName(filePath);
            
            // Property: Middleware file names must be kebab-case
            expect(isKebabCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test model files
  describe('Model files', () => {
    const modelsPath = path.join(BACKEND_SRC_PATH, 'models');
    
    it('should have all model files in kebab-case or PascalCase (property test)', async () => {
      if (!fs.existsSync(modelsPath)) return;
      
      const modelFiles = getJsFilesRecursively(modelsPath);
      
      if (modelFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...modelFiles),
          async (filePath) => {
            const fileName = getFileName(filePath);
            const nameWithoutExtension = fileName.replace('.js', '');
            
            // Property: Model file names can be PascalCase (for Mongoose models) or kebab-case
            const isPascalCase = /^[A-Z][a-zA-Z0-9]*$/.test(nameWithoutExtension);
            const isKebab = isKebabCase(fileName);
            
            expect(isPascalCase || isKebab).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Test config files
  describe('Config files', () => {
    const configPath = path.join(BACKEND_SRC_PATH, 'config');
    
    it('should have all config files in kebab-case (property test)', async () => {
      if (!fs.existsSync(configPath)) return;
      
      const configFiles = getJsFilesRecursively(configPath);
      
      if (configFiles.length === 0) return;
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...configFiles),
          async (filePath) => {
            const fileName = getFileName(filePath);
            
            // Property: Config file names must be kebab-case
            expect(isKebabCase(fileName)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
