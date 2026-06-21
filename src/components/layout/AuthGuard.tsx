'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { LoadingState } from '@/components/ui';
import { homeForRole } from '@/hooks/useAuth';
import type { Role } from '@/types';

// Proteksi route berbasis role. Cek dilakukan di client setelah hydrate.
export function AuthGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Tunggu sampai sesi dari localStorage selesai dipulihkan, agar reload
    // tidak salah dianggap belum login (logout sendiri).
    if (!hasHydrated) return;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }
    if (user.role !== role) {
      router.replace(homeForRole(user.role));
      return;
    }
    setReady(true);
  }, [hasHydrated, isAuthenticated, user, role, router]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center"><LoadingState label="Memeriksa sesi..." /></div>;
  return <>{children}</>;
}
