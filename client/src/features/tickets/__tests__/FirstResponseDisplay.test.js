/**
 * Property-Based Tests for First Response Time Display
 * 
 * Feature: ui-backend-integration
 * Property 5: First Response Time Display
 * 
 * Tests the first response time display logic.
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatFirstResponseTime } from '../../client/src/features/tickets/pages/TicketsPage.jsx';

/**
 * Property 5: First Response Time Display
 * 
 * *For any* ticket:
 * - If firstResponseAt is set, display the formatted timestamp
 * - If firstResponseAt is null and status is not "resolved"/"closed", display "Awaiting Response"
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
describe('Feature: ui-backend-integration, Property 5: First Response Time Display', () => {
  
  // Arbitrary for ticket statuses
  const ticketStatusArb = fc.constantFrom('open', 'in-progress', 'resolved', 'closed');
  const activeStatusArb = fc.constantFrom('open', 'in-progress');
  const closedStatusArb = fc.constantFrom('resolved', 'closed');

  it('should display formatted timestamp when firstResponseAt is set (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate any valid date for firstResponseAt
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        // Generate any ticket status
        ticketStatusArb,
        async (firstResponseAt, status) => {
          const result = formatFirstResponseTime(firstResponseAt, status);
          
          // Property: When firstResponseAt is set, result should NOT be "Awaiting Response" or "-"
          expect(result).not.toBe('Awaiting Response');
          expect(result).not.toBe('-');
          
          // Property: Result should contain month abbreviation (formatted date)
          expect(result).toMatch(/[A-Z][a-z]{2}/); // Month abbreviation like "Jan", "Feb", etc.
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display "Awaiting Response" when firstResponseAt is null and status is active (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate active statuses (not resolved/closed)
        activeStatusArb,
        async (status) => {
          const result = formatFirstResponseTime(null, status);
          
          // Property: When firstResponseAt is null and status is active, show "Awaiting Response"
          expect(result).toBe('Awaiting Response');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display "-" when firstResponseAt is null and status is resolved/closed (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate closed statuses
        closedStatusArb,
        async (status) => {
          const result = formatFirstResponseTime(null, status);
          
          // Property: When firstResponseAt is null and status is resolved/closed, show "-"
          expect(result).toBe('-');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle ISO string dates correctly (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid timestamps and convert to ISO strings
        fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
          .map(ts => new Date(ts).toISOString()),
        ticketStatusArb,
        async (firstResponseAtString, status) => {
          const result = formatFirstResponseTime(firstResponseAtString, status);
          
          // Property: String dates should be parsed and formatted correctly
          expect(result).not.toBe('Awaiting Response');
          expect(result).not.toBe('-');
          expect(result).toMatch(/[A-Z][a-z]{2}/); // Month abbreviation
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include time component in formatted output (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        ticketStatusArb,
        async (firstResponseAt, status) => {
          const result = formatFirstResponseTime(firstResponseAt, status);
          
          // Property: Formatted output should include time (AM/PM format)
          expect(result).toMatch(/\d{1,2}:\d{2}/); // Time format like "10:30"
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle undefined firstResponseAt same as null (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        ticketStatusArb,
        async (status) => {
          const resultNull = formatFirstResponseTime(null, status);
          const resultUndefined = formatFirstResponseTime(undefined, status);
          
          // Property: undefined should behave same as null
          expect(resultNull).toBe(resultUndefined);
        }
      ),
      { numRuns: 100 }
    );
  });
});
