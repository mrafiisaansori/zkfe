'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/cn';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const widthClass: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};


const featureSlides = [
  {
    title: 'Checkout kasir lebih cepat',
    text: 'Cari produk, scan barcode, atur keranjang, lalu selesaikan transaksi dalam satu alur yang ringkas.',
    stat: '3 langkah',
    statLabel: 'scan, bayar, cetak',
  },
  {
    title: 'Stok toko tetap terkendali',
    text: 'Produk, kategori, dan pergerakan stok tersusun rapi agar kasir tidak menjual barang kosong.',
    stat: 'Real-time',
    statLabel: 'produk & stok',
  },
  {
    title: 'Pembayaran fleksibel',
    text: 'Cash, transfer, dan QRIS dikelola dari proses checkout yang sama untuk operasional yang lebih tertib.',
    stat: 'Multi bayar',
    statLabel: 'cash, QRIS, transfer',
  },
  {
    title: 'Laporan penjualan siap pantau',
    text: 'Riwayat transaksi, rekap harian, dan akses role membantu pemilik toko membaca performa lebih cepat.',
    stat: 'Harian',
    statLabel: 'rekap & audit',
  },
];


export function AuthLoadingOverlay({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-5">
      <div className="w-full max-w-xs rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-premium-lg">
        <BrandLoader label={label} size="md" />
        <p className="mt-4 text-xs leading-5 text-slate-500">Mohon tunggu, sistem sedang memproses permintaan Anda.</p>
      </div>
    </div>
  );
}

export function AuthShell({
  children,
  maxWidth = 'md',
  className,
  contentAlign = 'start',
}: {
  children: ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
  contentAlign?: 'start' | 'center';
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = featureSlides[activeSlide];

  // Halaman auth berada di luar AppLayout, jadi terapkan class .dark sendiri
  // dari preferensi tersimpan (store yang sama dipakai Header setelah login).
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const logoTone = theme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % featureSlides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, []);

  function changeSlide(direction: -1 | 1) {
    setActiveSlide((current) => (current + direction + featureSlides.length) % featureSlides.length);
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-canvas lg:h-[100dvh] lg:overflow-hidden">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
        title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        className="fixed right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <section className="grid min-h-[100dvh] w-full bg-white lg:h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.75fr)]">
        <aside className="hidden h-screen bg-brand-50 p-8 dark:bg-slate-950 lg:flex lg:flex-col xl:p-12">
          <BrandLogo size="lg" tone={logoTone} />

          <div className="my-auto grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink xl:text-4xl">
                Jualan lebih cepat, stok lebih rapi, pembayaran lebih mudah.
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-600 [@media(max-height:760px)]:hidden">
                Zona Kasir membantu toko mengelola transaksi, produk, stok, QRIS, dan laporan tanpa membuat kasir bekerja lebih lambat.
              </p>

              <div className="mt-8 border-t border-brand-200 pt-5">
                <p className="text-base font-semibold text-ink">{slide.title}</p>
                <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-600">{slide.text}</p>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changeSlide(-1)}
                    aria-label="Slide fitur sebelumnya"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 bg-white text-slate-600 transition-colors hover:text-primary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeSlide(1)}
                    aria-label="Slide fitur berikutnya"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 bg-white text-slate-600 transition-colors hover:text-primary"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="flex gap-1.5">
                    {featureSlides.map((item, index) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        aria-label={`Tampilkan ${item.title}`}
                        className={cn('h-1.5 rounded-full transition-all', index === activeSlide ? 'w-6 bg-primary' : 'w-1.5 bg-brand-200 hover:bg-brand-300')}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <img
              src="/images/auth-pos-illustration.svg"
              alt="Ilustrasi aplikasi POS untuk merchant"
              loading="lazy"
              decoding="async"
              className="mx-auto aspect-square max-h-[48vh] w-full max-w-[400px] object-contain"
            />
          </div>
        </aside>

        <section className="relative flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-white px-5 py-8 sm:px-8 sm:py-10 lg:h-[100dvh] lg:min-h-0 lg:px-10 lg:py-0 xl:px-14">
          <div
            className={cn(
              'w-full',
              contentAlign === 'center'
                ? 'my-auto py-0'
                : 'py-0 lg:py-[clamp(3rem,9vh,6rem)] [@media(min-width:1024px)_and_(max-height:820px)]:py-[clamp(2.5rem,7vh,4rem)]',
              widthClass[maxWidth],
              className,
            )}
          >
            <div className="mb-7 flex justify-center lg:hidden">
              <BrandLogo size="lg" tone={logoTone} />
            </div>

            {children}
          </div>
        </section>
      </section>
    </main>
  );
}
