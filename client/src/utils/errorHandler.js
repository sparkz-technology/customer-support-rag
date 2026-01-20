/**
 * @deprecated This file is deprecated. Import from '../shared/utils' instead.
 * This file re-exports from the new location for backward compatibility.
 */
export {
  ERROR_MESSAGES,
  SPECIFIC_ERROR_MESSAGES,
  ApiError,
  getErrorMessage,
  parseValidationErrors,
  isRetryableError,
  formatRetryTime,
  getRetryAfter,
} from '../shared/utils/errorHandler';
