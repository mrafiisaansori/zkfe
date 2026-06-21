'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { useUIStore } from '@/stores/uiStore';

/**
 * Overlay loading global yang muncul setiap kali pindah menu dan bertahan sampai
 * data dari backend benar-benar tampil. Terdiri dari progress bar tipis di atas
 * + overlay halus dengan spinner di area konten.
 *
 * Mekanisme: setiap perubahan rute langsung menyalakan loading; tiap halaman
 * memanggil `usePageLoading(loading)` untuk mematikannya saat datanya siap.
 * Ada pengaman timeout agar overlay tidak pernah macet.
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const navLoading = useUIStore((s) => s.navLoading);
  const setNavLoading = useUIStore((s) => s.setNavLoading);
  const [visible, setVisible] = useState(false);

  // Nyalakan loading begitu rute berubah (sebelum halaman tujuan termount).
  useEffect(() => {
    setNavLoading(true);
  }, [pathname, setNavLoading]);

  // Pengaman: jangan biarkan overlay macet lebih dari 12 detik.
  useEffect(() => {
    if (!navLoading) return;
    const t = setTimeout(() => setNavLoading(false), 12000);
    return () => clearTimeout(t);
  }, [navLoading, pathname, setNavLoading]);

  // Sinkronkan tampilan agar transisi fade-out mulus.
  useEffect(() => {
    if (navLoading) setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [navLoading]);

  if (!visible) return null;

  return (
    <>
      {/* Progress bar tipis di paling atas layar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent">
        <div className="zk-navbar h-full w-1/3 rounded-full bg-gradient-to-r from-accent via-brand-300 to-brand-600" />
      </div>

      {/* Overlay halus + brand loader */}
      <div
        aria-busy
        aria-live="polite"
        className={`fixed inset-0 z-[55] flex items-center justify-center bg-white/60 backdrop-blur-[2px] transition-opacity duration-200 ${
          navLoading ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="animate-scale-in rounded-3xl border border-line bg-white/90 px-9 py-7 shadow-soft">
          <BrandLoader label="Memuat data…" />
        </div>
      </div>
    </>
  );
}
