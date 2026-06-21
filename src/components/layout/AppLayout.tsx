'use client';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavbar } from './MobileNavbar';
import { AuthGuard } from './AuthGuard';
import { NavigationLoader } from './NavigationLoader';
import { LogoutOverlay } from './LogoutOverlay';
import { BackgroundPattern } from '@/components/ui/BackgroundPattern';
import type { Role } from '@/types';

// Shell utama: sidebar (desktop) + header + bottom nav (mobile).
export function AppLayout({ role, title, children }: { role: Role; title?: string; children: React.ReactNode }) {
  const isKasir = role === 'kasir';

  return (
    <AuthGuard role={role}>
      {/* Overlay loading global setiap pindah menu */}
      <NavigationLoader />
      {/* Overlay loading saat proses logout */}
      <LogoutOverlay />
      <div className={isKasir ? 'flex min-h-screen bg-background' : 'flex min-h-screen bg-background'}>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={title} />
          <main className={isKasir
            ? 'relative flex-1 overflow-hidden bg-[#eef6fb] p-3 pb-24 sm:p-4 lg:p-5 lg:pb-5'
            : 'relative flex-1 overflow-hidden bg-background p-4 pb-24 sm:p-6 lg:pb-6'}
          >
            {/* Background konten: off-white solid + pattern halus (tanpa gradient). */}
            {!isKasir && <BackgroundPattern variant="dots" blobs={false} />}
            <div className="relative">{children}</div>
          </main>
        </div>
        <MobileNavbar />
      </div>
    </AuthGuard>
  );
}
