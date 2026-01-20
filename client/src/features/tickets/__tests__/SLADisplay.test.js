/**
 * Property-Based Tests for SLA Display Component
 * 
 * Feature: ui-backend-integration
 * Property 1: SLA Display Correctness
 * 
 * Tests the SLA display logic including status determination and time formatting.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatSLATime, getSLAStatus } from '../../client/src/features/tickets/components/SLADisplay.jsx';

/**
 * Property 1: SLA Display Correctness
 * 
 * *For any* ticket with an slaDueAt field, the UI SHALL display the correct SLA status:
 * - If slaBreached is true, display "Breached" indicator
 * - If slaDueAt is within 2 hours of now and not breached, display "At Risk" indicator
 * - If slaDueAt is more than 2 hours away and not breached, display "On Track" indicator
 * - If status is "resolved" or "closed", hide SLA indicator
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */
describe('Feature: ui-backend-integration, Property 1: SLA Display Correctness', () => {
  
  it('should return "breached" when slaBreached is true regardless of slaDueAt (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate any date for slaDueAt
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        async (slaDueAt) => {
          const result = getSLAStatus(slaDueAt, true);
          
          // Property: When slaBreached is true, status should always be "breached"
          expect(result).toBe('breached');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return "breached" when slaDueAt is in the past and not already breached (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates in the past (before now)
        fc.integer({ min: 1, max: 365 * 24 * 60 }).map(minutesAgo => {
          const date = new Date();
          date.setMinutes(date.getMinutes() - minutesAgo);
          return date;
        }),
        async (slaDueAt) => {
          const result = getSLAStatus(slaDueAt, false);
          
          // Property: When slaDueAt is in the past, status should be "breached"
          expect(result).toBe('breached');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return "at-risk" when slaDueAt is within 2 hours and not breached (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates within 2 hours from now (1 minute to 119 minutes in future)
        fc.integer({ min: 1, max: 119 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date;
        }),
        async (slaDueAt) => {
          const result = getSLAStatus(slaDueAt, false);
          
          // Property: When slaDueAt is within 2 hours, status should be "at-risk"
          expect(result).toBe('at-risk');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return "on-track" when slaDueAt is more than 2 hours away and not breached (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates more than 2 hours from now (121 minutes to 30 days in future)
        fc.integer({ min: 121, max: 30 * 24 * 60 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date;
        }),
        async (slaDueAt) => {
          const result = getSLAStatus(slaDueAt, false);
          
          // Property: When slaDueAt is more than 2 hours away, status should be "on-track"
          expect(result).toBe('on-track');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should return "on-track" when slaDueAt is null or undefined (property test)', async () => {
    // Test with null
    expect(getSLAStatus(null, false)).toBe('on-track');
    
    // Test with undefined
    expect(getSLAStatus(undefined, false)).toBe('on-track');
  });

  it('formatSLATime should return "overdue" suffix for past dates (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates in the past
        fc.integer({ min: 1, max: 365 * 24 * 60 }).map(minutesAgo => {
          const date = new Date();
          date.setMinutes(date.getMinutes() - minutesAgo);
          return date;
        }),
        async (slaDueAt) => {
          const result = formatSLATime(slaDueAt);
          
          // Property: Past dates should have "overdue" in the formatted string
          expect(result).toContain('overdue');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('formatSLATime should return "remaining" suffix for future dates (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates in the future
        fc.integer({ min: 1, max: 365 * 24 * 60 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date;
        }),
        async (slaDueAt) => {
          const result = formatSLATime(slaDueAt);
          
          // Property: Future dates should have "remaining" in the formatted string
          expect(result).toContain('remaining');
        }
      ),
      { numRuns: 10 }
    );
  });

  it('formatSLATime should return empty string for null/undefined (property test)', () => {
    expect(formatSLATime(null)).toBe('');
    expect(formatSLATime(undefined)).toBe('');
  });

  it('formatSLATime should include days for durations > 24 hours (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates more than 24 hours from now
        fc.integer({ min: 25 * 60, max: 365 * 24 * 60 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date;
        }),
        async (slaDueAt) => {
          const result = formatSLATime(slaDueAt);
          
          // Property: Durations > 24 hours should include "d" for days
          expect(result).toMatch(/\d+d/);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('formatSLATime should include hours for durations > 60 minutes (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates between 1 and 24 hours from now
        fc.integer({ min: 61, max: 24 * 60 - 1 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date;
        }),
        async (slaDueAt) => {
          const result = formatSLATime(slaDueAt);
          
          // Property: Durations > 60 minutes should include "h" for hours
          expect(result).toMatch(/\d+h/);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('getSLAStatus should handle string dates correctly (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate dates more than 2 hours from now as ISO strings
        fc.integer({ min: 121, max: 30 * 24 * 60 }).map(minutesFromNow => {
          const date = new Date();
          date.setMinutes(date.getMinutes() + minutesFromNow);
          return date.toISOString();
        }),
        async (slaDueAtString) => {
          const result = getSLAStatus(slaDueAtString, false);
          
          // Property: String dates should be parsed correctly
          expect(result).toBe('on-track');
        }
      ),
      { numRuns: 10 }
    );
  });
});
