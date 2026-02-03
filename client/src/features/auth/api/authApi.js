import { apiClient } from '../../../api/client';

/**
 * Auth API functions
 * Handles authentication-related API calls
 */
export const authApi = {
  /**
   * Send OTP to user's email
   * @param {string} email - User's email address
   * @returns {Promise<{message: string}>}
   */
  sendOtp: (email) => apiClient('POST', '/auth/send-otp', { email }),

  /**
   * Verify OTP and get JWT tokens
   * @param {string} email - User's email address
   * @param {string} otp - One-time password
   * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
   */
  verifyOtp: (email, otp) => apiClient('POST', '/auth/verify-otp', { email, otp }),

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{accessToken: string, refreshToken: string, user: object}>}
   */
  refresh: (refreshToken) => apiClient('POST', '/auth/refresh', { refreshToken }),

  /**
   * Logout (revoke refresh token)
   */
  logout: () => apiClient('POST', '/auth/logout'),

  /**
   * Get current authenticated user
   * @returns {Promise<{user: object}>}
   */
  getMe: () => apiClient('GET', '/auth/me'),
};
