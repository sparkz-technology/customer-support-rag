/**
 * Property-Based Tests for Backend Service Domain Organization
 * 
 * Feature: code-modularity-refactor
 * Property 4: Backend Service Domain Organization
 * 
 * *For any* service domain (ticket, auth, admin, agent), the service files 
 * SHALL be organized in a domain-specific directory with a barrel export (index.js).
 * 
 * **Validates: Requirements 4.1, 4.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const SERVICES_PATH = path.join(process.cwd(), 'src', 'services');

// Required service domain directories per requirements 4.1
const REQUIRED_SERVICE_DOMAINS = ['ticket', 'auth', 'admin', 'agent'];

// Expected service files per domain
const DOMAIN_SERVICE_FILES = {
  ticket: ['ticket.service.js', 'ticket-assignment.js', 'sla-checker.js', 'index.js'],
  auth: ['auth.service.js', 'email.js', 'index.js'],
  admin: ['admin.service.js', 'audit-log.js', 'index.js'],
  agent: ['agent-panel.service.js', 'index.js'],
};

describe('Feature: code-modularity-refactor, Property 4: Backend Service Domain Organization', () => {
  it('should have all required service domain directories (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SERVICE_DOMAINS),
        async (domainName) => {
          const domainPath = path.join(SERVICES_PATH, domainName);
          
          // Property: Each required service domain directory must exist
          const exists = fs.existsSync(domainPath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have barrel export (index.js) in each service domain directory (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SERVICE_DOMAINS),
        async (domainName) => {
          const indexPath = path.join(SERVICES_PATH, domainName, 'index.js');
          
          // Property: Each service domain directory must have a barrel export
          const exists = fs.existsSync(indexPath);
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have expected service files in each domain (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SERVICE_DOMAINS),
        async (domainName) => {
          const domainPath = path.join(SERVICES_PATH, domainName);
          const expectedFiles = DOMAIN_SERVICE_FILES[domainName];
          
          // Property: Each domain must contain its expected service files
          for (const file of expectedFiles) {
            const filePath = path.join(domainPath, file);
            const exists = fs.existsSync(filePath);
            expect(exists).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have main services barrel export that re-exports from domains', () => {
    const mainIndexPath = path.join(SERVICES_PATH, 'index.js');
    
    // Property: Main services index.js must exist
    expect(fs.existsSync(mainIndexPath)).toBe(true);
    
    // Property: Main index.js must re-export from domain directories
    const content = fs.readFileSync(mainIndexPath, 'utf-8');
    
    for (const domain of REQUIRED_SERVICE_DOMAINS) {
      expect(content).toContain(`./${domain}/`);
    }
  });

  it('should have barrel exports that export all domain services', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_SERVICE_DOMAINS),
        async (domainName) => {
          const indexPath = path.join(SERVICES_PATH, domainName, 'index.js');
          const content = fs.readFileSync(indexPath, 'utf-8');
          
          // Property: Barrel export must use export * from syntax
          expect(content).toContain('export *');
          
          // Property: Barrel export must reference service files in the domain
          const expectedFiles = DOMAIN_SERVICE_FILES[domainName].filter(f => f !== 'index.js');
          for (const file of expectedFiles) {
            expect(content).toContain(file);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
