import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      email: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => set({ 
        token, 
        email: user.email, 
        user,
        isAuthenticated: true 
      }),
      logout: () => set({ 
        token: null, 
        email: null, 
        user: null, 
        isAuthenticated: false 
      }),
      updateUser: (user) => set({ user, email: user.email }),
    }),
    { name: 'auth-storage' }
  )
);

// Role helpers
export const isUser = (user) => user?.role === 'user';
export const isAgent = (user) => user?.role === 'agent' || user?.role === 'admin';
export const isAdmin = (user) => user?.role === 'admin';
