'use client';
import { useRouter } from 'next/navigation';
import { Wrench, RefreshCw, LogOut } from 'lucide-react';
import { Button } from '@/components/ui';
import { BrandLogo } from './BrandLogo';
import { useAuthStore } from '@/stores/authStore';

// Halaman maintenance untuk Admin/Kasir/Gudang saat Maintenance Mode aktif.
// Super Admin tidak pernah melihat halaman ini (di-handle di AppLayout).
export function MaintenancePage({ message }: { message?: string }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  function backToLogin() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-background to-background px-4 py-10">
      {/* Aksen dekoratif halus */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-100/50 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo size="lg" />
        </div>

        <div className="rounded-3xl border border-line bg-white/90 p-8 text-center shadow-soft backdrop-blur">
          <span className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <Wrench className="h-9 w-9" />
            <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-100/40" aria-hidden="true" />
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Sedang dalam pemeliharaan
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">Sebentar ya, kami sedang berbenah</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
            {message?.trim()
              || 'Zona Kasir sedang dalam pemeliharaan untuk meningkatkan layanan. Silakan coba beberapa saat lagi.'}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" /> Coba lagi
            </Button>
            <Button onClick={backToLogin} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4" /> Kembali ke Login
            </Button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Zona Kasir &middot; Point of Sale
        </p>
      </div>
    </div>
  );
}
