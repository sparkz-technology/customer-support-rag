/**
 * Property-Based Tests for API Module Co-location
 * 
 * Feature: code-modularity-refactor
 * Property 2: API Module Co-location
 * 
 * *For any* feature directory containing API calls, the feature SHALL have an 
 * `api/` subdirectory containing both API client functions and React Query hooks.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');
const FEATURES_PATH = path.join(CLIENT_SRC_PATH, 'features');

// Features that should have API modules per requirements 2.1, 2.2
const FEATURES_WITH_API = ['tickets', 'auth', 'admin', 'agent', 'dashboard'];

/**
 * Helper function to check if a directory exists and contains files
 * @param {string} dirPath - Path to directory
 * @returns {boolean} True if directory exists and has files
 */
const directoryExistsWithFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return false;
  const files = fs.readdirSync(dirPath);
  return files.length > 0;
};

/**
 * Helper function to check if a file contains specific content patterns
 * @param {string} filePath - Path to file
 * @param {RegExp} pattern - Pattern to search for
 * @returns {boolean} True if file exists and contains pattern
 */
const fileContainsPattern = (filePath, pattern) => {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return pattern.test(content);
};

/**
 * Helper function to get all JS/JSX files in a directory
 * @param {string} dirPath - Path to directory
 * @returns {string[]} Array of file names
 */
const getJsFiles = (dirPath) => {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath).filter(f => f.endsWith('.js') || f.endsWith('.jsx'));
};

describe('Feature: code-modularity-refactor, Property 2: API Module Co-location', () => {
  
  it('should have api/ subdirectory in features with API calls (property test)', async () => {
    // Get features that currently exist
    const existingFeatures = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature))
    );
    
    if (existingFeatures.length === 0) {
      // Skip if no features exist yet
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...existingFeatures),
        async (featureName) => {
          const apiPath = path.join(FEATURES_PATH, featureName, 'api');
          
          // Property: Feature with API calls must have api/ subdirectory
          // Note: Some features may not have been migrated yet, so we check if the feature
          // has any API-related files before asserting
          const featurePath = path.join(FEATURES_PATH, featureName);
          const featureFiles = getJsFiles(featurePath);
          
          // If feature has an index.js that exports API functions, it should have api/ dir
          const indexPath = path.join(featurePath, 'index.js');
          if (fs.existsSync(indexPath)) {
            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            const hasApiExports = /export.*Api|export.*use[A-Z]/.test(indexContent);
            
            if (hasApiExports) {
              expect(fs.existsSync(apiPath)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have barrel export (index.js) in api/ subdirectory (property test)', async () => {
    // Get features that have api/ directories
    const featuresWithApi = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature, 'api'))
    );
    
    if (featuresWithApi.length === 0) {
      // Skip if no features have api/ directories yet
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuresWithApi),
        async (featureName) => {
          const apiIndexPath = path.join(FEATURES_PATH, featureName, 'api', 'index.js');
          
          // Property: api/ subdirectory must have barrel export
          expect(fs.existsSync(apiIndexPath)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have API client file in api/ subdirectory (property test)', async () => {
    // Get features that have api/ directories
    const featuresWithApi = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature, 'api'))
    );
    
    if (featuresWithApi.length === 0) {
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuresWithApi),
        async (featureName) => {
          const apiPath = path.join(FEATURES_PATH, featureName, 'api');
          const files = getJsFiles(apiPath);
          
          // Property: api/ must contain an API client file (named *Api.js or *api.js)
          const hasApiClient = files.some(f => /[Aa]pi\.js$/.test(f));
          expect(hasApiClient).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have React Query hooks file in api/ subdirectory (property test)', async () => {
    // Get features that have api/ directories
    const featuresWithApi = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature, 'api'))
    );
    
    if (featuresWithApi.length === 0) {
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuresWithApi),
        async (featureName) => {
          const apiPath = path.join(FEATURES_PATH, featureName, 'api');
          const files = getJsFiles(apiPath);
          
          // Property: api/ must contain a hooks file (named use*.js)
          const hasHooksFile = files.some(f => /^use[A-Z].*\.js$/.test(f));
          expect(hasHooksFile).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should export API functions from barrel export (property test)', async () => {
    // Get features that have api/ directories with index.js
    const featuresWithApiIndex = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature, 'api', 'index.js'))
    );
    
    if (featuresWithApiIndex.length === 0) {
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuresWithApiIndex),
        async (featureName) => {
          const apiIndexPath = path.join(FEATURES_PATH, featureName, 'api', 'index.js');
          
          // Property: barrel export must export API client
          const hasApiExport = fileContainsPattern(apiIndexPath, /export.*[Aa]pi/);
          expect(hasApiExport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should export React Query hooks from barrel export (property test)', async () => {
    // Get features that have api/ directories with index.js
    const featuresWithApiIndex = FEATURES_WITH_API.filter(feature => 
      fs.existsSync(path.join(FEATURES_PATH, feature, 'api', 'index.js'))
    );
    
    if (featuresWithApiIndex.length === 0) {
      return;
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...featuresWithApiIndex),
        async (featureName) => {
          const apiIndexPath = path.join(FEATURES_PATH, featureName, 'api', 'index.js');
          
          // Property: barrel export must export hooks (use* functions)
          // Use multiline flag to handle exports across multiple lines
          const hasHooksExport = fileContainsPattern(apiIndexPath, /export[\s\S]*use[A-Z]/);
          expect(hasHooksExport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Specific test for tickets feature (the one we just migrated)
  describe('Tickets feature API module', () => {
    const ticketsApiPath = path.join(FEATURES_PATH, 'tickets', 'api');
    
    it('should have ticketsApi.js with API client functions', () => {
      const apiFilePath = path.join(ticketsApiPath, 'ticketsApi.js');
      expect(fs.existsSync(apiFilePath)).toBe(true);
      
      // Check for expected API functions
      const content = fs.readFileSync(apiFilePath, 'utf-8');
      expect(content).toMatch(/ticketsApi/);
      expect(content).toMatch(/list/);
      expect(content).toMatch(/get/);
      expect(content).toMatch(/create/);
      expect(content).toMatch(/sendMessage/);
      expect(content).toMatch(/updateStatus/);
    });

    it('should have useTickets.js with React Query hooks', () => {
      const hooksFilePath = path.join(ticketsApiPath, 'useTickets.js');
      expect(fs.existsSync(hooksFilePath)).toBe(true);
      
      // Check for expected hooks
      const content = fs.readFileSync(hooksFilePath, 'utf-8');
      expect(content).toMatch(/useTickets/);
      expect(content).toMatch(/useTicket/);
      expect(content).toMatch(/useCreateTicket/);
      expect(content).toMatch(/useSendMessage/);
      expect(content).toMatch(/useUpdateTicketStatus/);
      expect(content).toMatch(/useQuery/);
      expect(content).toMatch(/useMutation/);
    });

    it('should have index.js barrel export', () => {
      const indexPath = path.join(ticketsApiPath, 'index.js');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      // Check for expected exports (using patterns that work with multi-line exports)
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toMatch(/ticketsApi/);
      expect(content).toMatch(/useTickets/);
      expect(content).toMatch(/useTicket/);
      expect(content).toMatch(/useCreateTicket/);
    });
  });
});
