import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // True setelah state dari localStorage selesai dipulihkan (hindari logout palsu saat reload).
  hasHydrated: boolean;
  setSession: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

// Sesi disimpan di localStorage (persist). Backend multi-tenant pakai JWT:
// token + identitas user (id, role, merchant) disimpan untuk proteksi route & header Authorization.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      setSession: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'pos-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    },
  ),
);
