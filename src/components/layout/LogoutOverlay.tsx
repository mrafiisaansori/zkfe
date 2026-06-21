'use client';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { useUIStore } from '@/stores/uiStore';

/**
 * Overlay global saat proses logout berlangsung. Tetap tampil sampai user
 * benar-benar diarahkan ke halaman Login, sekaligus memblokir interaksi
 * (mencegah klik logout berkali-kali).
 */
export function LogoutOverlay() {
  const signingOut = useUIStore((s) => s.signingOut);
  if (!signingOut) return null;

  return (
    <div
      aria-busy
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-white/70 backdrop-blur-[2px]"
    >
      <div className="animate-scale-in rounded-3xl border border-line bg-white/90 px-9 py-7 shadow-soft">
        <BrandLoader label="Keluar dari akun…" />
      </div>
    </div>
  );
}
