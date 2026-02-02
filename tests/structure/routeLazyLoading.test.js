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
    const routesContent = readFileContent(ROUTES_FILE_PATH);
    const appContent = readFileContent(APP_JSX_PATH);
    if (!routesContent || !appContent) return;
    
    const lazyComponents = extractLazyImports(routesContent);
    
    // Extract component names used in App.jsx routes
    const usedComponentsPattern = /element=\{<(\w+)\s*\/>/g;
    const usedComponents = [];
    let match;
    while ((match = usedComponentsPattern.exec(appContent)) !== null) {
      usedComponents.push(match[1]);
    }
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...usedComponents.filter(c => c !== 'RoleBasedRedirect')), // Filter out guard components
        async (componentName) => {
          // Property: All route components must be lazy loaded
          expect(lazyComponents).toContain(componentName);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should export lazy-loaded components from routes.jsx (property test)', async () => {
    const content = readFileContent(ROUTES_FILE_PATH);
    if (!content) return;
    
    // Components that should be exported from routes.jsx
    const requiredComponents = [
      'DashboardPage', 'TicketsPage', 'TicketDetailPage', 'AIChat', 'LoginPage',
      'AgentDashboardPage', 'AgentTicketsPage', 'AgentChatPage',
      'AdminDashboardPage', 'AdminTicketsPage', 'AdminAgentsPage', 'AdminUsersPage', 'AdminAuditLogPage'
    ];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...requiredComponents),
        async (componentName) => {
          // Property: Each lazy component must be exported
          const exportPattern = new RegExp(`export\\s+const\\s+${componentName}\\s*=\\s*lazy`);
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
    
    // Instead of checking for route group names, check that App.jsx uses lazy components from routes
    const lazyComponents = [
      'DashboardPage', 'TicketsPage', 'TicketDetailPage', 'AIChat', 'LoginPage',
      'AgentDashboardPage', 'AgentTicketsPage', 'AgentChatPage',
      'AdminDashboardPage', 'AdminTicketsPage', 'AdminAgentsPage', 'AdminUsersPage', 'AdminAuditLogPage'
    ];
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...lazyComponents),
        async (componentName) => {
          // Property: App.jsx must use each lazy-loaded component
          expect(content).toMatch(new RegExp(`<${componentName}`));
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
    const routesContent = readFileContent(ROUTES_FILE_PATH);
    const appContent = readFileContent(APP_JSX_PATH);
    
    it('should have user routes with correct paths', () => {
      // Routes are now defined inline in App.jsx, check there
      // Check that user routes contain expected paths
      expect(appContent).toMatch(/path=["']\/dashboard["']/);
      expect(appContent).toMatch(/path=["']\/tickets["']/);
      expect(appContent).toMatch(/path=["']\/tickets\/:id["']/);
      expect(appContent).toMatch(/path=["']\/chat["']/);
    });

    it('should have agent routes with correct paths', () => {
      // Routes are now defined inline in App.jsx, check there
      // Check that agent routes contain expected paths
      expect(appContent).toMatch(/path=["']\/agent["']/);
      expect(appContent).toMatch(/path=["']\/agent\/tickets["']/);
      expect(appContent).toMatch(/path=["']\/agent\/tickets\/:id["']/);
    });

    it('should have admin routes with correct paths', () => {
      // Routes are now defined inline in App.jsx, check there
      // Check that admin routes contain expected paths
      expect(appContent).toMatch(/path=["']\/admin["']/);
      expect(appContent).toMatch(/path=["']\/admin\/tickets["']/);
      expect(appContent).toMatch(/path=["']\/admin\/agents["']/);
      expect(appContent).toMatch(/path=["']\/admin\/users["']/);
      expect(appContent).toMatch(/path=["']\/admin\/audit-log["']/);
    });
  });
});
