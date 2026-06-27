'use client';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavbar } from './MobileNavbar';
import { AuthGuard } from './AuthGuard';
import { Forbidden } from './Forbidden';
import { NavigationLoader } from './NavigationLoader';
import { LogoutOverlay } from './LogoutOverlay';
import { BackgroundPattern } from '@/components/ui/BackgroundPattern';
import { useAuthStore } from '@/stores/authStore';
import type { Role } from '@/types';

// Halaman /admin yang BOLEH diakses role Gudang (operasional). Selain ini → forbidden.
const GUDANG_ALLOWED_PREFIXES = [
  '/admin/dashboard',
  '/admin/kategori',
  '/admin/modifier',
  '/admin/produk',
  '/admin/supplier',
  '/admin/stok',
  '/admin/pembelian',
  '/admin/retur',
  '/admin/transaksi',
];

function isGudangAllowed(pathname: string): boolean {
  return GUDANG_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Shell utama: sidebar (desktop) + header + bottom nav (mobile).
// `role` boleh array (mis. ['admin','gudang']). Untuk Gudang, halaman di luar
// allowlist ditampilkan sebagai Forbidden (proteksi sebenarnya tetap di backend).
export function AppLayout({ role, title, children }: { role: Role | Role[]; title?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const roles = Array.isArray(role) ? role : [role];
  const isKasir = roles.includes('kasir');
  const blockGudang = user?.role === 'gudang' && !isGudangAllowed(pathname);

  return (
    <AuthGuard role={role}>
      {/* Overlay loading global setiap pindah menu */}
      <NavigationLoader />
      {/* Overlay loading saat proses logout */}
      <LogoutOverlay />
      {/* Shell tinggi tetap: hanya area konten (main) yang scroll, sidebar diam. */}
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header title={title} />
          <main className={isKasir
            ? 'relative min-h-0 flex-1 overflow-y-auto bg-[#eef6fb] p-3 pb-24 sm:p-4 lg:p-5 lg:pb-5'
            : 'relative min-h-0 flex-1 overflow-y-auto bg-background p-4 pb-24 sm:p-6 lg:pb-6'}
          >
            {/* Background konten: off-white solid + pattern halus (tanpa gradient). */}
            {!isKasir && <BackgroundPattern variant="dots" blobs={false} />}
            <div className="relative">{blockGudang ? <Forbidden /> : children}</div>
          </main>
        </div>
        <MobileNavbar />
      </div>
    </AuthGuard>
  );
}
