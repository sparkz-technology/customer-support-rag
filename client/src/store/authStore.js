import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      email: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,

      login: (token, refreshToken, user) =>
        set({
          token,
          refreshToken,
          email: user.email,
          user: { ...user, role: user.role ? String(user.role).toLowerCase() : user.role },
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          email: null,
          user: null,
          isAuthenticated: false,
        }),

      updateUser: (user) =>
        set({
          user: { ...user, role: user.role ? String(user.role).toLowerCase() : user.role },
          email: user.email,
        }),

      setSession: (user) =>
        set({
          user: { ...user, role: user.role ? String(user.role).toLowerCase() : user.role },
          email: user.email,
          isAuthenticated: true,
        }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'auth-storage',
      // Prefer persisted values over initial defaults
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...persistedState };
        if (merged.token) {
          merged.isAuthenticated = true;
        }
        return merged;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Role helpers
export const isUser = (user) => user?.role === 'user';
export const isAgent = (user) => user?.role === 'agent' || user?.role === 'admin';
export const isAdmin = (user) => user?.role === 'admin';
