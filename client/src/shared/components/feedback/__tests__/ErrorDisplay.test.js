/**
 * Property-Based Tests for Error Display
 * 
 * Feature: ui-backend-integration
 * Property 7: Error Message Display
 * 
 * Tests the error handling logic including message mapping and validation error display.
 * 
 * **Validates: Requirements 10.1, 10.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { 
  getErrorMessage, 
  ApiError, 
  ERROR_MESSAGES, 
  SPECIFIC_ERROR_MESSAGES,
  isRetryableError,
  formatRetryTime,
  parseValidationErrors
} from '../../client/src/utils/errorHandler';
import {
  validateForm,
  hasErrors,
  validationRules
} from '../../client/src/utils/formValidation';

/**
 * Property 7: Error Message Display
 * 
 * *For any* API error response, the UI SHALL display:
 * - A user-friendly error message (not raw error)
 * - For validation errors, highlight the specific field
 * 
 * **Validates: Requirements 10.1, 10.4**
 */
describe('Feature: ui-backend-integration, Property 7: Error Message Display', () => {
  
  describe('getErrorMessage - User-friendly error messages', () => {
    
    it('should return user-friendly message for any HTTP status code (property test)', async () => {
      const knownStatusCodes = Object.keys(ERROR_MESSAGES).map(Number);
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...knownStatusCodes),
          async (statusCode) => {
            const error = new ApiError('Raw error', statusCode);
            const message = getErrorMessage(error);
            
            // Property: Message should be user-friendly (from ERROR_MESSAGES)
            expect(message).toBe(ERROR_MESSAGES[statusCode]);
            // Property: Message should not be the raw error
            expect(message).not.toBe('Raw error');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return user-friendly message for any known error type (property test)', async () => {
      const knownErrorTypes = Object.keys(SPECIFIC_ERROR_MESSAGES);
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...knownErrorTypes),
          async (errorType) => {
            const message = getErrorMessage(errorType);
            
            // Property: Message should be from SPECIFIC_ERROR_MESSAGES
            expect(message).toBe(SPECIFIC_ERROR_MESSAGES[errorType]);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should never return empty string for any error (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Random string errors
            fc.string({ minLength: 1, maxLength: 100 }),
            // Random status codes
            fc.integer({ min: 100, max: 599 }).map(status => new ApiError('Error', status)),
            // Standard Error objects
            fc.string({ minLength: 1, maxLength: 50 }).map(msg => new Error(msg))
          ),
          async (error) => {
            const message = getErrorMessage(error);
            
            // Property: Message should never be empty
            expect(message).toBeTruthy();
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return string type for any input (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined),
            fc.record({
              message: fc.string(),
              status: fc.integer({ min: 100, max: 599 })
            })
          ),
          async (input) => {
            const message = getErrorMessage(input);
            
            // Property: Result should always be a string
            expect(typeof message).toBe('string');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('ApiError - Error classification', () => {
    
    it('should correctly classify network errors (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(0, null, undefined),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (status, message) => {
            const error = new ApiError(message, status);
            
            // Property: Status 0 or falsy should be classified as network error
            expect(error.isNetworkError).toBe(true);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should correctly classify rate limit errors (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 300 }),
          async (message, retryAfter) => {
            const error = new ApiError(message, 429, null, retryAfter);
            
            // Property: Status 429 should be classified as rate limited
            expect(error.isRateLimited).toBe(true);
            expect(error.retryAfter).toBe(retryAfter);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly classify server errors (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 500, max: 599 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (status, message) => {
            const error = new ApiError(message, status);
            
            // Property: Status 5xx should be classified as server error
            expect(error.isServerError).toBe(true);
            expect(error.isClientError).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should correctly classify client errors (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 499 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          async (status, message) => {
            const error = new ApiError(message, status);
            
            // Property: Status 4xx should be classified as client error
            expect(error.isClientError).toBe(true);
            expect(error.isServerError).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('isRetryableError - Retry logic', () => {
    
    it('should mark network and server errors as retryable (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Network errors (status 0)
            fc.constant(new ApiError('Network error', 0)),
            // Server errors (5xx)
            fc.integer({ min: 500, max: 599 }).map(s => new ApiError('Server error', s))
          ),
          async (error) => {
            // Property: Network and server errors should be retryable
            expect(isRetryableError(error)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not mark client errors as retryable (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Client errors (4xx) except rate limiting
          fc.integer({ min: 400, max: 428 }),
          async (status) => {
            const error = new ApiError('Client error', status);
            
            // Property: Client errors (except 429) should not be retryable
            expect(isRetryableError(error)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('formatRetryTime - Time formatting', () => {
    
    it('should format seconds correctly for values under 60 (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 59 }),
          async (seconds) => {
            const formatted = formatRetryTime(seconds);
            
            // Property: Should contain the number and "second"
            expect(formatted).toContain(String(seconds));
            expect(formatted).toContain('second');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should format minutes correctly for values 60 and above (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 60, max: 3600 }),
          async (seconds) => {
            const formatted = formatRetryTime(seconds);
            
            // Property: Should contain "minute" for values >= 60
            expect(formatted).toContain('minute');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle singular vs plural correctly (property test)', async () => {
      // Test singular second
      expect(formatRetryTime(1)).toBe('1 second');
      // Test plural seconds
      expect(formatRetryTime(2)).toBe('2 seconds');
      // Test singular minute
      expect(formatRetryTime(60)).toBe('1 minute');
      // Test plural minutes
      expect(formatRetryTime(120)).toBe('2 minutes');
    });
  });

  describe('parseValidationErrors - Field error extraction', () => {
    
    it('should extract field errors from array format (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 20 }),
              message: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (errors) => {
            const errorData = { errors };
            const parsed = parseValidationErrors(errorData);
            
            // Property: Each field should have its error message
            errors.forEach(err => {
              expect(parsed[err.field]).toBe(err.message);
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should extract field errors from fieldErrors format (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.string({ minLength: 1, maxLength: 50 })
          ),
          async (fieldErrors) => {
            if (Object.keys(fieldErrors).length === 0) return; // Skip empty
            
            const errorData = { fieldErrors };
            const parsed = parseValidationErrors(errorData);
            
            // Property: Should return the fieldErrors object
            expect(parsed).toEqual(fieldErrors);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return null for invalid error data (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.constant({}),
            fc.constant({ errors: [] })
          ),
          async (errorData) => {
            const parsed = parseValidationErrors(errorData);
            
            // Property: Should return null for invalid/empty data
            expect(parsed).toBeNull();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Form Validation - Field-level validation', () => {
    
    it('should validate required fields correctly (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
            fc.constant('   ') // whitespace only
          ),
          async (emptyValue) => {
            const error = validationRules.required(emptyValue, 'Field');
            
            // Property: Empty values should fail required validation
            expect(error).toBeTruthy();
            expect(error).toContain('required');
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should pass required validation for non-empty values (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (nonEmptyValue) => {
            const error = validationRules.required(nonEmptyValue, 'Field');
            
            // Property: Non-empty values should pass required validation
            expect(error).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should validate email format correctly (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          async (validEmail) => {
            const error = validationRules.email(validEmail);
            
            // Property: Valid emails should pass validation
            expect(error).toBeNull();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid email formats (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('@') || !s.includes('.')),
          async (invalidEmail) => {
            const error = validationRules.email(invalidEmail);
            
            // Property: Invalid emails should fail validation
            if (invalidEmail) {
              expect(error).toBeTruthy();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should validate minLength correctly (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          async (minLen, value) => {
            const validator = validationRules.minLength(minLen);
            const error = validator(value, 'Field');
            
            if (!value) {
              // Property: Empty values should pass (use required for that)
              expect(error).toBeNull();
            } else if (value.length < minLen) {
              // Property: Short values should fail
              expect(error).toBeTruthy();
              expect(error).toContain(`at least ${minLen}`);
            } else {
              // Property: Long enough values should pass
              expect(error).toBeNull();
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should validate maxLength correctly (property test)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 5, max: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (maxLen, value) => {
            const validator = validationRules.maxLength(maxLen);
            const error = validator(value, 'Field');
            
            if (value.length > maxLen) {
              // Property: Long values should fail
              expect(error).toBeTruthy();
              expect(error).toContain(`no more than ${maxLen}`);
            } else {
              // Property: Short enough values should pass
              expect(error).toBeNull();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('validateForm - Form-level validation', () => {
    
    it('should return errors for all invalid fields (property test)', async () => {
      const schema = {
        email: { rules: [validationRules.required, validationRules.email], label: 'Email' },
        name: { rules: [validationRules.required], label: 'Name' }
      };

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(fc.constant(''), fc.constant('invalid')),
            name: fc.oneof(fc.constant(''), fc.constant('   '))
          }),
          async (values) => {
            const errors = validateForm(values, schema);
            
            // Property: Should have errors for invalid fields
            expect(hasErrors(errors)).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should return empty errors for valid form (property test)', async () => {
      const schema = {
        email: { rules: [validationRules.required, validationRules.email], label: 'Email' },
        name: { rules: [validationRules.required], label: 'Name' }
      };

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
          }),
          async (values) => {
            const errors = validateForm(values, schema);
            
            // Property: Should have no errors for valid form
            expect(hasErrors(errors)).toBe(false);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
