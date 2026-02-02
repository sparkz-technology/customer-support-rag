import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      email: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) =>
        set({
          token,
          email: user.email,
          user: { ...user, role: user.role ? String(user.role).toLowerCase() : user.role },
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          email: null,
          user: null,
          isAuthenticated: false,
        }),

      updateUser: (user) =>
        set({
          user: { ...user, role: user.role ? String(user.role).toLowerCase() : user.role },
          email: user.email,
        }),
    }),
    {
      name: 'auth-storage',
      // When rehydrating, prefer the current in-memory state over persisted values
      merge: (persistedState, currentState) => ({ ...persistedState, ...currentState }),
    }
  )
);

// Role helpers
export const isUser = (user) => user?.role === 'user';
export const isAgent = (user) => user?.role === 'agent' || user?.role === 'admin';
export const isAdmin = (user) => user?.role === 'admin';
