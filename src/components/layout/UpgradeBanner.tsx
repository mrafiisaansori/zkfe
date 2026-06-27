'use client';
import Link from 'next/link';
import { Crown, Check, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const BENEFITS = [
  'Tambah produk lebih banyak (FREE maksimal 20)',
  'Multiple kasir',
  'Open Bill untuk cafe / coffee shop',
  'Struk tanpa branding Zona Kasir',
];

/**
 * Banner ajakan upgrade ke PRO. Hanya tampil untuk merchant plan FREE.
 * Plan diambil dari sesi (authStore), bukan input.
 */
export function UpgradeBanner() {
  const plan = useAuthStore((s) => s.user?.merchant?.plan);
  if (plan === 'PRO' || plan === 'BUSINESS') return null; // sudah berbayar: tidak perlu banner

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-accent/10 p-5 shadow-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Crown className="h-3.5 w-3.5" /> Upgrade ke PRO
          </div>
          <h3 className="text-lg font-bold text-ink">Buka semua fitur untuk toko Anda</h3>
          <ul className="mt-2 grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/admin/langganan"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-brand-700"
        >
          Upgrade ke PRO <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
