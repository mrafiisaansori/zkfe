'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PackageCheck,
  QrCode,
  ReceiptText,
  ScanLine,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { BrandLoader } from '@/components/ui/BrandLoader';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { cn } from '@/utils/cn';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const widthClass: Record<MaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

const steps = [
  { icon: ScanLine, label: 'Scan produk' },
  { icon: ShoppingBag, label: 'Kelola keranjang' },
  { icon: CreditCard, label: 'Terima pembayaran' },
];

const featureSlides = [
  {
    icon: ScanLine,
    title: 'Checkout kasir lebih cepat',
    text: 'Cari produk, scan barcode, atur keranjang, lalu selesaikan transaksi dalam satu alur yang ringkas.',
    stat: '3 langkah',
    statLabel: 'scan, bayar, cetak',
    accent: 'bg-primary',
  },
  {
    icon: PackageCheck,
    title: 'Stok toko tetap terkendali',
    text: 'Produk, kategori, dan pergerakan stok tersusun rapi agar kasir tidak menjual barang kosong.',
    stat: 'Real-time',
    statLabel: 'produk & stok',
    accent: 'bg-success',
  },
  {
    icon: QrCode,
    title: 'Pembayaran fleksibel',
    text: 'Cash, transfer, dan QRIS dikelola dari proses checkout yang sama untuk operasional yang lebih tertib.',
    stat: 'Multi bayar',
    statLabel: 'cash, QRIS, transfer',
    accent: 'bg-warning',
  },
  {
    icon: BarChart3,
    title: 'Laporan penjualan siap pantau',
    text: 'Riwayat transaksi, rekap harian, dan akses role membantu pemilik toko membaca performa lebih cepat.',
    stat: 'Harian',
    statLabel: 'rekap & audit',
    accent: 'bg-brand-700',
  },
];

const featureTiles = [
  { icon: ReceiptText, title: 'Riwayat rapi' },
  { icon: Boxes, title: 'Produk tertata' },
  { icon: UsersRound, title: 'Role akses' },
];

export function AuthLoadingOverlay({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-5 backdrop-blur-sm">
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
  const SlideIcon = slide.icon;

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
      <section className="grid min-h-[100dvh] w-full bg-white lg:h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.78fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.05fr)_minmax(460px,0.75fr)]">
        <aside className="relative hidden h-screen overflow-hidden bg-[#eef6fb] p-6 lg:flex lg:flex-col xl:p-8">
          <span aria-hidden className="zk-pattern-diagonal pointer-events-none absolute inset-0 opacity-70" />
          <span aria-hidden className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-white/70" />
          <span aria-hidden className="pointer-events-none absolute -right-28 bottom-16 h-72 w-72 rounded-full bg-brand-100/80" />

          <div className="relative z-10 flex items-center justify-between">
            <BrandLogo size="lg" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-primary shadow-card">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Siap transaksi
            </span>
          </div>

          <div className="relative z-10 mt-5 grid min-h-0 flex-1 content-center gap-5">
            <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(270px,0.74fr)] xl:grid-cols-[minmax(0,0.88fr)_minmax(310px,0.74fr)]">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/85 px-3 py-1.5 text-xs font-semibold text-primary shadow-card">
                  <Sparkles className="h-3.5 w-3.5" />
                  POS modern untuk merchant
                </span>
                <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-ink xl:text-4xl">
                  Jualan lebih cepat, stok lebih rapi, pembayaran lebih mudah.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 [@media(max-height:760px)]:hidden">
                  Zona Kasir membantu toko mengelola transaksi, produk, stok, QRIS, dan laporan tanpa membuat kasir bekerja lebih lambat.
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white bg-white/80 p-4 shadow-premium backdrop-blur">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${slide.accent}`}>
                      <SlideIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold leading-6 text-ink">{slide.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{slide.text}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-2xl font-semibold tracking-tight text-ink">{slide.stat}</p>
                      <p className="text-xs font-medium text-slate-500">{slide.statLabel}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeSlide(-1)}
                        aria-label="Slide fitur sebelumnya"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-200 hover:text-primary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => changeSlide(1)}
                        aria-label="Slide fitur berikutnya"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-slate-600 transition-colors hover:border-brand-200 hover:text-primary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[400px]">
                <div className="relative overflow-hidden rounded-2xl border border-white bg-white/85 p-4 shadow-premium-lg backdrop-blur">
                  <div className="rounded-xl bg-brand-50 p-4">
                    <img
                      src="/images/auth-pos-illustration.svg"
                      alt="Ilustrasi aplikasi POS untuk merchant"
                      loading="lazy"
                      decoding="async"
                      className="aspect-square max-h-[36vh] w-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {featureTiles.map((item) => (
                      <div key={item.title} className="rounded-xl border border-line bg-white px-2 py-2 text-center shadow-card">
                        <item.icon className="mx-auto h-4 w-4 text-primary" />
                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-600">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-4 left-6 right-6 rounded-2xl border border-brand-100 bg-white/95 px-4 py-3 shadow-soft [@media(max-height:1000px)]:hidden">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Mode kasir</p>
                      <p className="text-sm font-bold text-ink">Cash, QRIS, Transfer</p>
                    </div>
                    <span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Aktif</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 [@media(max-height:760px)]:hidden">
              <div className="flex flex-wrap gap-2">
                {steps.map((step) => (
                  <span
                    key={step.label}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 shadow-card"
                  >
                    <step.icon className="h-3.5 w-3.5 text-primary" />
                    {step.label}
                  </span>
                ))}
              </div>

              <div className="flex shrink-0 gap-1.5">
                {featureSlides.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Tampilkan ${item.title}`}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === activeSlide ? 'w-8 bg-primary' : 'w-2 bg-brand-200 hover:bg-brand-300',
                    )}
                  />
                ))}
              </div>
            </div>
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
              <BrandLogo size="lg" />
            </div>

            {children}
          </div>
        </section>
      </section>
    </main>
  );
}
