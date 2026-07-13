'use client';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Peringatan H-3/H-1 sebelum langganan PRO/BUSINESS berakhir. Cuma tampil buat
 * merchant yang plan-nya masih berbayar & AKTIF (yang sudah turun ke FREE
 * urusannya UpgradeBanner, bukan ini), dan expired_at dalam 3 hari ke depan.
 * plan/pro_expires_at diambil dari sesi (authStore), bukan input.
 */
export function ExpiryWarningBanner() {
  const user = useAuthStore((s) => s.user);
  const merchant = user?.merchant;
  const plan = merchant?.plan;
  const expiresAt = merchant?.pro_expires_at;
  if ((plan !== 'PRO' && plan !== 'BUSINESS') || !expiresAt) return null;

  const daysLeft = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  if (daysLeft < 0 || daysLeft > 3) return null;

  const waktu = daysLeft === 0 ? 'hari ini' : daysLeft === 1 ? 'besok' : `dalam ${daysLeft} hari`;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-sm font-bold">Langganan {plan} kamu berakhir {waktu}</p>
          <p className="text-xs text-amber-700 dark:text-amber-300/80">
            {isAdmin
              ? 'Perpanjang sekarang biar fitur PRO nggak kepotong.'
              : 'Hubungi admin toko buat perpanjang, biar fitur nggak kepotong.'}
          </p>
        </div>
      </div>
      {isAdmin && (
        <Link href="/admin/langganan" className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-center text-sm font-bold text-white hover:bg-amber-700">
          Perpanjang
        </Link>
      )}
    </div>
  );
}
