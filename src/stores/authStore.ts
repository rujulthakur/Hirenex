import { create } from 'zustand';
import { api } from '@/services';
import type { Role, User } from '@/types';

export type AuthStatus = 'unknown' | 'loading' | 'authenticated' | 'anonymous';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User) => void;
  clear: () => void;
  /** Loads GET /auth/me on app start. Never throws: failure means anonymous. */
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, status: 'anonymous' }),
  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const user = await api.auth.me();
      set({ user, status: 'authenticated' });
    } catch {
      // The short-lived access token may just have expired: try the long-lived refresh token once before giving up.
      try {
        await api.auth.refresh();
        const user = await api.auth.me();
        set({ user, status: 'authenticated' });
      } catch {
        set({ user: null, status: 'anonymous' });
      }
    }
  },
  logout: async () => {
    try {
      await api.auth.logout();
    } finally {
      set({ user: null, status: 'anonymous' });
    }
  },
}));

export function useRole(): Role | null {
  return useAuthStore((s) => s.user?.role ?? null);
}
