/**
 * Property-Based Tests for Agent Select Component
 * 
 * Feature: ui-backend-integration
 * Property 3: Agent Dropdown Filtering
 * 
 * Tests the agent filtering and sorting logic.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  filterAgentsByCapacity, 
  sortAgentsByCategory, 
  processAgentsForDropdown 
} from '../../client/src/features/tickets/components/AgentSelect.jsx';

// Generator for a single agent
const agentArbitrary = fc.record({
  _id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  categories: fc.array(fc.constantFrom('billing', 'technical', 'general', 'account', 'shipping'), { minLength: 0, maxLength: 3 }),
  currentLoad: fc.integer({ min: 0, max: 20 }),
  maxLoad: fc.integer({ min: 1, max: 20 }),
  isActive: fc.boolean(),
});

// Generator for a list of agents
const agentsArbitrary = fc.array(agentArbitrary, { minLength: 0, maxLength: 20 });

/**
 * Property 3: Agent Dropdown Filtering
 * 
 * *For any* agent dropdown, the list SHALL only include agents where:
 * - isActive is true
 * - currentLoad < maxLoad
 * And each agent entry SHALL display their categories and current load.
 * 
 * **Validates: Requirements 3.2, 3.3**
 */
describe('Feature: ui-backend-integration, Property 3: Agent Dropdown Filtering', () => {
  
  it('should only include agents with available capacity (currentLoad < maxLoad) (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        async (agents) => {
          const filtered = filterAgentsByCapacity(agents);
          
          // Property: All filtered agents must have currentLoad < maxLoad
          for (const agent of filtered) {
            const currentLoad = agent.currentLoad || 0;
            const maxLoad = agent.maxLoad || 10;
            expect(currentLoad).toBeLessThan(maxLoad);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should only include active agents (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        async (agents) => {
          const filtered = filterAgentsByCapacity(agents);
          
          // Property: All filtered agents must be active (isActive !== false)
          for (const agent of filtered) {
            expect(agent.isActive).not.toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude agents at full capacity (currentLoad >= maxLoad) (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        async (agents) => {
          const filtered = filterAgentsByCapacity(agents);
          const filteredIds = new Set(filtered.map(a => a._id));
          
          // Property: Agents at full capacity should not be in filtered list
          for (const agent of agents) {
            const currentLoad = agent.currentLoad || 0;
            const maxLoad = agent.maxLoad || 10;
            if (currentLoad >= maxLoad) {
              expect(filteredIds.has(agent._id)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude inactive agents (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        async (agents) => {
          const filtered = filterAgentsByCapacity(agents);
          const filteredIds = new Set(filtered.map(a => a._id));
          
          // Property: Inactive agents should not be in filtered list
          for (const agent of agents) {
            if (agent.isActive === false) {
              expect(filteredIds.has(agent._id)).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prioritize agents matching ticket category (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        fc.constantFrom('billing', 'technical', 'general', 'account', 'shipping'),
        async (agents, ticketCategory) => {
          const sorted = sortAgentsByCategory(agents, ticketCategory);
          
          // Find the last index of a matching agent
          let lastMatchingIndex = -1;
          // Find the first index of a non-matching agent
          let firstNonMatchingIndex = sorted.length;
          
          for (let i = 0; i < sorted.length; i++) {
            const categories = (sorted[i].categories || []).map(c => c.toLowerCase());
            const matches = categories.includes(ticketCategory.toLowerCase());
            
            if (matches) {
              lastMatchingIndex = i;
            } else if (firstNonMatchingIndex === sorted.length) {
              firstNonMatchingIndex = i;
            }
          }
          
          // Property: All matching agents should come before non-matching agents
          if (lastMatchingIndex !== -1 && firstNonMatchingIndex !== sorted.length) {
            expect(lastMatchingIndex).toBeLessThan(firstNonMatchingIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all agents when sorting (no agents lost) (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        fc.constantFrom('billing', 'technical', 'general', null, undefined),
        async (agents, ticketCategory) => {
          const sorted = sortAgentsByCategory(agents, ticketCategory);
          
          // Property: Sorting should not add or remove agents
          expect(sorted.length).toBe(agents.length);
          
          // All original agents should be in sorted list
          const sortedIds = new Set(sorted.map(a => a._id));
          for (const agent of agents) {
            expect(sortedIds.has(agent._id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle empty agents array (property test)', async () => {
    const filtered = filterAgentsByCapacity([]);
    const sorted = sortAgentsByCategory([], 'billing');
    const processed = processAgentsForDropdown([], 'billing');
    
    expect(filtered).toEqual([]);
    expect(sorted).toEqual([]);
    expect(processed).toEqual([]);
  });

  it('should handle null/undefined agents array (property test)', async () => {
    expect(filterAgentsByCapacity(null)).toEqual([]);
    expect(filterAgentsByCapacity(undefined)).toEqual([]);
    expect(sortAgentsByCategory(null, 'billing')).toEqual([]);
    expect(sortAgentsByCategory(undefined, 'billing')).toEqual([]);
    expect(processAgentsForDropdown(null, 'billing')).toEqual([]);
    expect(processAgentsForDropdown(undefined, 'billing')).toEqual([]);
  });

  it('processAgentsForDropdown should filter then sort (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        agentsArbitrary,
        fc.constantFrom('billing', 'technical', 'general'),
        async (agents, ticketCategory) => {
          const processed = processAgentsForDropdown(agents, ticketCategory);
          
          // Property 1: All processed agents should have capacity
          for (const agent of processed) {
            const currentLoad = agent.currentLoad || 0;
            const maxLoad = agent.maxLoad || 10;
            expect(currentLoad).toBeLessThan(maxLoad);
            expect(agent.isActive).not.toBe(false);
          }
          
          // Property 2: Matching agents should come first
          let foundNonMatching = false;
          for (const agent of processed) {
            const categories = (agent.categories || []).map(c => c.toLowerCase());
            const matches = categories.includes(ticketCategory.toLowerCase());
            
            if (!matches) {
              foundNonMatching = true;
            } else if (foundNonMatching) {
              // Found a matching agent after a non-matching one - this violates the property
              expect(foundNonMatching).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
