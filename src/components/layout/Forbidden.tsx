'use client';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * Halaman "akses ditolak" yang rapi. Ditampilkan saat role mencoba membuka
 * halaman di luar haknya (mis. role Gudang membuka Laporan/Pengaturan via URL).
 * Proteksi sebenarnya tetap ada di backend; ini lapisan UX di frontend.
 */
export function Forbidden({ homeHref = '/admin/dashboard' }: { homeHref?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <ShieldAlert className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Akses ditolak</h1>
        <p className="mt-2 text-sm text-slate-500">
          Halaman ini tidak tersedia untuk role akun Anda. Silakan kembali ke dashboard.
        </p>
        <Link
          href={homeHref}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
