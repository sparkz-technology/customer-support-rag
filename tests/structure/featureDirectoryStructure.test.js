/**
 * Property-Based Tests for Feature Directory Structure
 * 
 * Feature: code-modularity-refactor
 * Tests that feature directories are properly co-located
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');
const FEATURES_PATH = path.join(CLIENT_SRC_PATH, 'features');
const SHARED_PATH = path.join(CLIENT_SRC_PATH, 'shared');
const APP_PATH = path.join(CLIENT_SRC_PATH, 'app');

// Required feature directories per requirements 1.1, 1.2, 1.3, 1.4
const REQUIRED_FEATURES = ['tickets', 'auth', 'admin', 'agent', 'dashboard'];

// Required shared subdirectories per requirements 3.1, 3.2, 3.3
const REQUIRED_SHARED_SUBDIRS = ['components', 'hooks', 'utils', 'constants'];

/**
 * Property 1: Feature Co-location
 * 
 * *For any* feature name (tickets, auth, admin, agent, dashboard), all components, 
 * hooks, and utilities specific to that feature SHALL exist within the 
 * `features/{feature}/` directory structure.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */
describe('Feature: code-modularity-refactor, Property 1: Feature Co-location', () => {
  it('should have all required feature directories (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_FEATURES),
        async (featureName) => {
          const featurePath = path.join(FEATURES_PATH, featureName);
          
          // Property: Each required feature directory must exist
          const exists = fs.existsSync(featurePath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have barrel export (index.js) in each feature directory (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_FEATURES),
        async (featureName) => {
          const indexPath = path.join(FEATURES_PATH, featureName, 'index.js');
          
          // Property: Each feature directory must have a barrel export
          const exists = fs.existsSync(indexPath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have features directory at correct location', () => {
    // Property: Features directory must exist at client/src/features
    expect(fs.existsSync(FEATURES_PATH)).toBe(true);
  });

  it('should have shared directory with required subdirectories (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SHARED_SUBDIRS),
        async (subdirName) => {
          const subdirPath = path.join(SHARED_PATH, subdirName);
          
          // Property: Each required shared subdirectory must exist
          const exists = fs.existsSync(subdirPath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have barrel export in each shared subdirectory (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SHARED_SUBDIRS),
        async (subdirName) => {
          const indexPath = path.join(SHARED_PATH, subdirName, 'index.js');
          
          // Property: Each shared subdirectory must have a barrel export
          const exists = fs.existsSync(indexPath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have app directory for application shell', () => {
    // Property: App directory must exist at client/src/app
    expect(fs.existsSync(APP_PATH)).toBe(true);
  });

  it('should have barrel export in app directory', () => {
    const indexPath = path.join(APP_PATH, 'index.js');
    
    // Property: App directory must have a barrel export
    expect(fs.existsSync(indexPath)).toBe(true);
  });
});
