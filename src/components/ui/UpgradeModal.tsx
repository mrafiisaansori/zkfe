'use client';
import Link from 'next/link';
import { Crown, Check, ArrowRight } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

const DEFAULT_BENEFITS = [
  'Bisa menggunakan Open Bill',
  'Bisa multiple kasir',
  'Bisa tambah produk lebih dari 50',
  'Struk tanpa branding Zona Kasir',
];

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  benefits?: string[];
  upgradeHref?: string;
  // false untuk konteks kasir: hanya tombol "Tutup" (kasir tidak mengelola langganan).
  showUpgradeButton?: boolean;
}

/**
 * Modal ajakan upgrade ke PRO. Dipakai saat merchant FREE mencoba fitur PRO
 * (Open Bill, voucher, dll). Tidak mengubah flow transaksi.
 */
export function UpgradeModal({
  open, onClose, title = 'Fitur khusus PRO', description, benefits = DEFAULT_BENEFITS,
  upgradeHref = '/admin/langganan', showUpgradeButton = true,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <Crown className="h-7 w-7" />
          </span>
          <p className="text-sm text-slate-600">
            {description || 'Fitur ini hanya tersedia untuk merchant plan PRO. Upgrade untuk membukanya.'}
          </p>
        </div>

        <ul className="space-y-1.5 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" /> {b}
            </li>
          ))}
        </ul>

        {showUpgradeButton ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={onClose}>Nanti saja</Button>
            <Link
              href={upgradeHref}
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              Upgrade ke PRO <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <Button className="w-full" onClick={onClose}>Tutup</Button>
        )}
      </div>
    </Modal>
  );
}
