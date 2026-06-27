'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Users, Tags, Package, Settings, ShoppingCart, Wallet, Receipt, Lock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { accountService, getErrorMessage } from '@/services';

type Step = { icon: React.ElementType; title: string; desc: string; href?: string; hrefLabel?: string };

// Alur untuk Admin merchant.
const ADMIN_STEPS: Step[] = [
  { icon: Users, title: 'Buat akun tim', desc: 'Di menu Pengguna, buat akun Kasir dan Gudang untuk tim toko Anda.', href: '/admin/user', hrefLabel: 'Buka menu Pengguna' },
  { icon: Tags, title: 'Buat kategori produk', desc: 'Buat kategori dulu sebelum input produk agar daftar produk lebih rapi.', href: '/admin/kategori', hrefLabel: 'Buka menu Kategori' },
  { icon: Package, title: 'Tambah produk', desc: 'Di menu Produk, isi nama, harga, stok awal, barcode, dan foto produk.', href: '/admin/produk', hrefLabel: 'Buka menu Produk' },
  { icon: Settings, title: 'Lengkapi data toko', desc: 'Lengkapi nama toko, alamat, telepon, logo, dan QRIS di Pengaturan agar struk & katalog rapi.', href: '/admin/pengaturan', hrefLabel: 'Buka Pengaturan' },
];

// Alur untuk Kasir.
const KASIR_STEPS: Step[] = [
  { icon: ShoppingCart, title: 'Masuk Kasir POS', desc: 'Semua transaksi penjualan dilakukan lewat menu Kasir POS.', href: '/kasir/pos', hrefLabel: 'Buka Kasir POS' },
  { icon: Wallet, title: 'Buka Kasir dulu', desc: 'Sebelum melayani transaksi, buka sesi kasir di menu Buka/Tutup Kasir.', href: '/kasir/closing', hrefLabel: 'Buka/Tutup Kasir' },
  { icon: Receipt, title: 'Proses transaksi', desc: 'Pilih produk, masukkan ke keranjang, pilih metode bayar, lalu selesaikan transaksi.', href: '/kasir/pos', hrefLabel: 'Mulai transaksi' },
  { icon: Lock, title: 'Tutup Kasir', desc: 'Setelah selesai operasional, tutup kasir untuk rekap & cocokkan uang harian/shift.', href: '/kasir/closing', hrefLabel: 'Buka/Tutup Kasir' },
];

export function OnboardingGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const token = useAuthStore((s) => s.token);

  const role = user?.role;
  const steps = role === 'kasir' ? KASIR_STEPS : ADMIN_STEPS;
  const merchantId = user?.merchant?.id ?? user?.merchant_id ?? 0;
  // Status "sudah selesai/skip" disimpan per merchant + role (di perangkat ini).
  const doneKey = useMemo(() => `zk-guide-done-${merchantId}-${role}`, [merchantId, role]);
  const stepKey = useMemo(() => `zk-guide-step-${merchantId}-${role}`, [merchantId, role]);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Auto-buka untuk user baru / merchant baru, atau saat dibuka ulang (?guide=1).
  useEffect(() => {
    if (!user || (role !== 'admin' && role !== 'kasir')) return;
    const manual = searchParams.get('guide') === '1';
    let localDone = false;
    try { localDone = localStorage.getItem(doneKey) === '1'; } catch { /* ignore */ }
    // Admin: tentukan "baru" dari flag server (onboarding_done). Kasir tidak punya
    // flag server, jadi pakai status lokal per perangkat.
    const needNew = role === 'admin'
      ? user.merchant?.onboarding_done === false
      : !localDone;
    if (manual || (needNew && !localDone)) {
      let saved = 0;
      try { saved = Number(localStorage.getItem(stepKey)) || 0; } catch { /* ignore */ }
      setStep(manual ? 0 : Math.min(saved, steps.length - 1));
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, searchParams]);

  function persistStep(n: number) {
    try { localStorage.setItem(stepKey, String(n)); } catch { /* ignore */ }
  }

  async function finish(skip = false) {
    setBusy(true);
    try {
      try { localStorage.setItem(doneKey, '1'); } catch { /* ignore */ }
      // Admin: tandai onboarding merchant selesai di server (kasir tidak punya hak ini).
      if (role === 'admin') {
        await accountService.onboardingDone();
        if (user && token) {
          setSession(
            { ...user, merchant: user.merchant ? { ...user.merchant, onboarding_done: true } : user.merchant },
            token,
          );
        }
      }
      setOpen(false);
      if (!skip) toast.success('Panduan selesai. Selamat menggunakan Zona Kasir!');
      if (searchParams.get('guide')) router.replace(pathname);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusy(false); }
  }

  if (!open) return null;
  const s = steps[step];
  const Icon = s.icon;
  const isLast = step === steps.length - 1;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={`Panduan ${role === 'kasir' ? 'Kasir' : 'Admin'} (${step + 1}/${steps.length})`}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={() => finish(true)} disabled={busy}>Lewati</Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => { const n = step - 1; setStep(n); persistStep(n); }} disabled={busy}>
              Kembali
            </Button>
          )}
          {isLast
            ? <Button onClick={() => finish(false)} loading={busy}><CheckCircle2 className="h-4 w-4" /> Selesai</Button>
            : <Button onClick={() => { const n = step + 1; setStep(n); persistStep(n); }}>Selanjutnya <ArrowRight className="h-4 w-4" /></Button>}
        </>
      )}
    >
      <div className="flex flex-col items-center gap-3 py-1 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-primary">
          <Icon className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-bold text-ink">{s.title}</h3>
        <p className="text-sm text-slate-500">{s.desc}</p>
        {s.href && (
          <Button
            variant="secondary"
            className="mt-1"
            onClick={() => { persistStep(step); setOpen(false); router.push(s.href as string); }}
          >
            {s.hrefLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {steps.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-primary' : 'w-1.5 bg-slate-300'}`} />
        ))}
      </div>
    </Modal>
  );
}
