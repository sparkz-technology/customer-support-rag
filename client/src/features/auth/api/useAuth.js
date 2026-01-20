import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from './authApi';

/**
 * Hook to get current authenticated user
 * @param {object} options - React Query options
 * @returns {object} Query result with user data
 */
export const useAuth = (options = {}) => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to send OTP to user's email
 * @returns {object} Mutation result for sending OTP
 */
export const useSendOtp = () => {
  return useMutation({
    mutationFn: (email) => authApi.sendOtp(email),
  });
};

/**
 * Hook to verify OTP and login
 * @returns {object} Mutation result for verifying OTP
 */
export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: ({ email, otp }) => authApi.verifyOtp(email, otp),
  });
};
