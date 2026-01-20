/**
 * Property-Based Tests for Route Lazy Loading
 * 
 * Feature: code-modularity-refactor
 * Property 11: Route Lazy Loading
 * 
 * *For any* feature route in the client route configuration, the route component 
 * SHALL be imported using React's `lazy()` function.
 * 
 * **Validates: Requirements 7.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_SRC_PATH = path.join(process.cwd(), 'client', 'src');
const APP_PATH = path.join(CLIENT_SRC_PATH, 'app');
const ROUTES_FILE_PATH = path.join(APP_PATH, 'routes.jsx');
const APP_JSX_PATH = path.join(CLIENT_SRC_PATH, 'App.jsx');
const GUARDS_PATH = path.join(APP_PATH, 'guards');

// Route groups that should be lazy loaded
const ROUTE_GROUPS = ['userRoutes', 'agentRoutes', 'adminRoutes'];

// Required guard components
const REQUIRED_GUARDS = ['ProtectedRoute', 'AgentRoute', 'AdminRoute', 'RoleBasedRedirect'];

/**
 * Helper function to read file content
 * @param {string} filePath - Path to file
 * @returns {string} File content or empty string if not found
 */
const readFileContent = (filePath) => {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf-8');
};

/**
 * Helper function to extract lazy imports from routes file
 * @param {string} content - File content
 * @returns {string[]} Array of component names that are lazy loaded
 */
const extractLazyImports = (content) => {
  const lazyPattern = /const\s+(\w+)\s*=\s*lazy\s*\(\s*\(\)\s*=>\s*import\s*\(/g;
  const matches = [];
  let match;
  while ((match = lazyPattern.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

/**
 * Helper function to extract route elements from a route group
 * @param {string} content - File content
 * @param {string} routeGroup - Name of the route group (e.g., 'userRoutes')
 * @returns {string[]} Array of component names used in routes
 */
const extractRouteElements = (content, routeGroup) => {
  // Find the route group definition
  const groupPattern = new RegExp(`export\\s+const\\s+${routeGroup}\\s*=\\s*\\[([\\s\\S]*?)\\];`, 'm');
  const groupMatch = content.match(groupPattern);
  if (!groupMatch) return [];
  
  const groupContent = groupMatch[1];
  
  // Extract element components from the route definitions
  const elementPattern = /element:\s*<(\w+)/g;
  const elements = [];
  let match;
  while ((match = elementPattern.exec(groupContent)) !== null) {
    elements.push(match[1]);
  }
  return elements;
};

describe('Feature: code-modularity-refactor, Property 11: Route Lazy Loading', () => {
  
  it('should have routes.jsx file in app directory', () => {
    expect(fs.existsSync(ROUTES_FILE_PATH)).toBe(true);
  });

  it('should import lazy from React in routes.jsx', () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    expect(content).toMatch(/import\s*{\s*lazy\s*}\s*from\s*['"]react['"]/);
  });

  it('should have all route components lazy loaded (property test)', async () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    if (!content) return;
    
    const lazyComponents = extractLazyImports(content);
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ROUTE_GROUPS),
        async (routeGroup) => {
          const routeElements = extractRouteElements(content, routeGroup);
          
          // Property: All route elements must be lazy loaded
          for (const element of routeElements) {
            expect(lazyComponents).toContain(element);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should export route groups from routes.jsx (property test)', async () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    if (!content) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ROUTE_GROUPS),
        async (routeGroup) => {
          // Property: Each route group must be exported
          const exportPattern = new RegExp(`export\\s+const\\s+${routeGroup}`);
          expect(content).toMatch(exportPattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have guards directory with required guard components (property test)', async () => {
    expect(fs.existsSync(GUARDS_PATH)).toBe(true);
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...REQUIRED_GUARDS),
        async (guardName) => {
          const guardPath = path.join(GUARDS_PATH, `${guardName}.jsx`);
          
          // Property: Each required guard must exist
          expect(fs.existsSync(guardPath)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have barrel export in guards directory', () => {
    const indexPath = path.join(GUARDS_PATH, 'index.js');
    expect(fs.existsSync(indexPath)).toBe(true);
    
    const content = readFileContent(indexPath);
    
    // Check that all guards are exported
    for (const guard of REQUIRED_GUARDS) {
      expect(content).toMatch(new RegExp(guard));
    }
  });

  it('should have App.jsx using Suspense for lazy loading', () => {
    const content = readFileContent(APP_JSX_PATH);
    
    // Property: App.jsx must import Suspense
    expect(content).toMatch(/import\s*{\s*Suspense[^}]*}\s*from\s*['"]react['"]/);
    
    // Property: App.jsx must use Suspense component
    expect(content).toMatch(/<Suspense/);
  });

  it('should have App.jsx importing route guards from app/guards', () => {
    const content = readFileContent(APP_JSX_PATH);
    
    // Property: App.jsx must import guards from app/guards
    expect(content).toMatch(/from\s*['"]\.\/app\/guards['"]/);
  });

  it('should have App.jsx importing route configurations from app/routes', () => {
    const content = readFileContent(APP_JSX_PATH);
    
    // Property: App.jsx must import routes from app/routes
    expect(content).toMatch(/from\s*['"]\.\/app\/routes['"]/);
  });

  it('should have App.jsx using route configurations (property test)', async () => {
    const content = readFileContent(APP_JSX_PATH);
    if (!content) return;
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ROUTE_GROUPS),
        async (routeGroup) => {
          // Property: App.jsx must use each route group
          expect(content).toMatch(new RegExp(routeGroup));
        }
      ),
      { numRuns: 100 }
    );
  });

  // Specific tests for lazy loaded components
  describe('Lazy loaded page components', () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    const lazyComponents = extractLazyImports(content);
    
    it('should have user pages lazy loaded', () => {
      expect(lazyComponents).toContain('DashboardPage');
      expect(lazyComponents).toContain('TicketsPage');
      expect(lazyComponents).toContain('TicketDetailPage');
      expect(lazyComponents).toContain('AIChat');
      expect(lazyComponents).toContain('LoginPage');
    });

    it('should have agent pages lazy loaded', () => {
      expect(lazyComponents).toContain('AgentDashboardPage');
      expect(lazyComponents).toContain('AgentTicketsPage');
      expect(lazyComponents).toContain('AgentChatPage');
    });

    it('should have admin pages lazy loaded', () => {
      expect(lazyComponents).toContain('AdminDashboardPage');
      expect(lazyComponents).toContain('AdminTicketsPage');
      expect(lazyComponents).toContain('AdminAgentsPage');
      expect(lazyComponents).toContain('AdminUsersPage');
      expect(lazyComponents).toContain('AdminAuditLogPage');
    });
  });

  // Test route structure
  describe('Route structure', () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    
    it('should have user routes with correct paths', () => {
      const userRouteElements = extractRouteElements(content, 'userRoutes');
      expect(userRouteElements.length).toBeGreaterThan(0);
      
      // Check that user routes contain expected paths
      expect(content).toMatch(/path:\s*['"]\/dashboard['"]/);
      expect(content).toMatch(/path:\s*['"]\/tickets['"]/);
      expect(content).toMatch(/path:\s*['"]\/tickets\/:id['"]/);
      expect(content).toMatch(/path:\s*['"]\/chat['"]/);
    });

    it('should have agent routes with correct paths', () => {
      const agentRouteElements = extractRouteElements(content, 'agentRoutes');
      expect(agentRouteElements.length).toBeGreaterThan(0);
      
      // Check that agent routes contain expected paths
      expect(content).toMatch(/path:\s*['"]\/agent['"]/);
      expect(content).toMatch(/path:\s*['"]\/agent\/tickets['"]/);
      expect(content).toMatch(/path:\s*['"]\/agent\/tickets\/:id['"]/);
    });

    it('should have admin routes with correct paths', () => {
      const adminRouteElements = extractRouteElements(content, 'adminRoutes');
      expect(adminRouteElements.length).toBeGreaterThan(0);
      
      // Check that admin routes contain expected paths
      expect(content).toMatch(/path:\s*['"]\/admin['"]/);
      expect(content).toMatch(/path:\s*['"]\/admin\/tickets['"]/);
      expect(content).toMatch(/path:\s*['"]\/admin\/agents['"]/);
      expect(content).toMatch(/path:\s*['"]\/admin\/users['"]/);
      expect(content).toMatch(/path:\s*['"]\/admin\/audit-log['"]/);
    });
  });
});
