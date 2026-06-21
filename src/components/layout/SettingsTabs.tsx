'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, QrCode, Percent } from 'lucide-react';
import { cn } from '@/utils/cn';

const TABS = [
  { label: 'Toko', href: '/admin/pengaturan', icon: Store },
  { label: 'Upload QRIS', href: '/admin/pengaturan/pembayaran', icon: QrCode },
  { label: 'Pajak', href: '/admin/pengaturan/pajak', icon: Percent },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex gap-2 border-b border-line">
      {TABS.map((t) => {
        const active = pathname === t.href;
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className="h-4 w-4" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
