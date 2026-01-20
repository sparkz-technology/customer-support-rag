/**
 * Rate Limit State Hook
 * 
 * Provides state management for rate limiting scenarios.
 * Cross-cutting hook used across multiple features.
 * 
 * Requirements: 3.2
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing rate limit state
 * 
 * @returns {Object} Rate limit state and handlers
 */
export function useRateLimitState() {
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const handleRateLimitError = useCallback((error) => {
    if (error?.isRateLimited || error?.status === 429) {
      setRateLimitInfo({
        retryAfter: error.retryAfter || 60,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitInfo(null);
  }, []);

  const isRateLimited = rateLimitInfo !== null;

  return {
    isRateLimited,
    rateLimitInfo,
    handleRateLimitError,
    clearRateLimit
  };
}

export default useRateLimitState;
