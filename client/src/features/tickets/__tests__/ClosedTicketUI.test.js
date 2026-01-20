/**
 * Property-Based Tests for Closed Ticket UI State
 * 
 * Feature: ui-backend-integration
 * Property 6: Closed Ticket UI State
 * 
 * Tests the closed ticket UI display logic.
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Determines if the message input should be hidden
 * @param {string} status - Ticket status
 * @returns {boolean} True if input should be hidden
 */
const shouldHideMessageInput = (status) => {
  return status === 'closed';
};

/**
 * Determines if the "Ticket Closed" banner should be shown
 * @param {string} status - Ticket status
 * @returns {boolean} True if banner should be shown
 */
const shouldShowClosedBanner = (status) => {
  return status === 'closed';
};

/**
 * Gets the closed ticket display info
 * @param {string} status - Ticket status
 * @param {string|null} closureReason - Optional closure reason
 * @returns {Object} Display info for closed ticket UI
 */
const getClosedTicketDisplayInfo = (status, closureReason) => {
  const isClosed = status === 'closed';
  return {
    hideMessageInput: isClosed,
    showClosedBanner: isClosed,
    closureReason: isClosed && closureReason ? closureReason : null,
    hasClosureReason: isClosed && !!closureReason
  };
};

/**
 * Property 6: Closed Ticket UI State
 * 
 * *For any* ticket with status "closed":
 * - The message input SHALL be hidden
 * - A "Ticket Closed" banner SHALL be displayed
 * - If closureReason exists, it SHALL be displayed
 * 
 * **Validates: Requirements 7.1, 7.2, 7.3**
 */
describe('Feature: ui-backend-integration, Property 6: Closed Ticket UI State', () => {
  
  it('should hide message input for any closed ticket (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
        async (closureReason) => {
          const displayInfo = getClosedTicketDisplayInfo('closed', closureReason);
          
          // Property: Message input should be hidden for closed tickets
          expect(displayInfo.hideMessageInput).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should show "Ticket Closed" banner for any closed ticket (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
        async (closureReason) => {
          const displayInfo = getClosedTicketDisplayInfo('closed', closureReason);
          
          // Property: Closed banner should be shown for closed tickets
          expect(displayInfo.showClosedBanner).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should display closure reason when available for closed tickets (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (closureReason) => {
          const displayInfo = getClosedTicketDisplayInfo('closed', closureReason);
          
          // Property: Closure reason should be displayed when provided
          expect(displayInfo.hasClosureReason).toBe(true);
          expect(displayInfo.closureReason).toBe(closureReason);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle missing closure reason gracefully (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(null, undefined, ''),
        async (closureReason) => {
          const displayInfo = getClosedTicketDisplayInfo('closed', closureReason);
          
          // Property: Should still show banner even without closure reason
          expect(displayInfo.showClosedBanner).toBe(true);
          expect(displayInfo.hideMessageInput).toBe(true);
          // Property: hasClosureReason should be false for empty/null reasons
          expect(displayInfo.hasClosureReason).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should show message input for non-closed tickets (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('open', 'in-progress', 'resolved'),
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
        async (status, closureReason) => {
          const displayInfo = getClosedTicketDisplayInfo(status, closureReason);
          
          // Property: Message input should NOT be hidden for non-closed tickets
          expect(displayInfo.hideMessageInput).toBe(false);
          // Property: Closed banner should NOT be shown for non-closed tickets
          expect(displayInfo.showClosedBanner).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should correctly determine UI state for any ticket status (property test)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('open', 'in-progress', 'resolved', 'closed'),
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
        async (status, closureReason) => {
          const isClosed = status === 'closed';
          
          // Test individual functions
          expect(shouldHideMessageInput(status)).toBe(isClosed);
          expect(shouldShowClosedBanner(status)).toBe(isClosed);
          
          // Test combined display info
          const displayInfo = getClosedTicketDisplayInfo(status, closureReason);
          expect(displayInfo.hideMessageInput).toBe(isClosed);
          expect(displayInfo.showClosedBanner).toBe(isClosed);
        }
      ),
      { numRuns: 10 }
    );
  });
});
