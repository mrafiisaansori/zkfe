'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { authService, getErrorMessage } from '@/services';
import type { Role } from '@/types';

export function homeForRole(role: Role): string {
  if (role === 'superadmin') return '/superadmin/dashboard';
  // Admin & Gudang berbagi area /admin (dashboard menyesuaikan role).
  if (role === 'admin' || role === 'gudang') return '/admin/dashboard';
  return '/kasir/dashboard';
}

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setSession, logout } = useAuthStore();
  const signingOut = useUIStore((s) => s.signingOut);
  const setSigningOut = useUIStore((s) => s.setSigningOut);

  async function login(
    username: string,
    password: string,
    turnstileToken?: string,
    expect?: 'merchant' | 'superadmin',
  ) {
    try {
      const res = await authService.login(username, password, turnstileToken);
      const role = res.user.role;
      // Pisahkan pintu login: super admin hanya via /be-admin, merchant via /login.
      if (expect === 'superadmin' && role !== 'superadmin') {
        return { ok: false, message: 'Akun ini bukan Super Admin. Gunakan halaman login merchant.' };
      }
      if (expect === 'merchant' && role === 'superadmin') {
        return { ok: false, message: 'Super Admin harus login melalui halaman khusus (/be-admin).' };
      }
      setSession(res.user, res.token);
      router.replace(homeForRole(role));
      return { ok: true };
    } catch (err) {
      return { ok: false, message: getErrorMessage(err) };
    }
  }

  async function signOut() {
    // Cegah klik logout berkali-kali: abaikan bila sudah berjalan.
    if (useUIStore.getState().signingOut) return;
    setSigningOut(true);
    try {
      // Bersihkan sesi lalu arahkan ke halaman login.
      logout();
      router.replace('/login');
    } finally {
      // Beri jeda singkat agar overlay tetap tampil sampai pindah halaman,
      // lalu reset state agar siap untuk sesi berikutnya.
      setTimeout(() => setSigningOut(false), 600);
    }
  }

  return { user, isAuthenticated, login, signOut, signingOut };
}
