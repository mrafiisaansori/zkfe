'use client';
import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Crown, Clock, Check, CheckCircle2, Loader2, ScanLine, ShieldCheck, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Modal, Badge, DataTable, type Column } from '@/components/ui';
import { subscriptionService, authService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';
import type { Billing, SubscriptionSetting, SubscriptionPayment, SubscriptionPaket, SubscriptionStatus, PlanType } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah, formatDateTime } from '@/utils/format';

const statusTone: Record<SubscriptionStatus, 'amber' | 'blue' | 'green' | 'red' | 'slate'> = {
  UNPAID: 'slate', PENDING: 'amber', PAID: 'green', EXPIRED: 'slate', CANCELLED: 'red', FAILED: 'red',
  WAITING_VERIFICATION: 'blue', VERIFIED: 'green', REJECTED: 'red',
};
const statusLabel: Record<SubscriptionStatus, string> = {
  UNPAID: 'Belum Dibayar', PENDING: 'Menunggu Pembayaran', PAID: 'Berhasil', EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan', FAILED: 'Gagal', WAITING_VERIFICATION: 'Verifikasi Manual (lama)',
  VERIFIED: 'Terverifikasi (lama)', REJECTED: 'Ditolak (lama)',
};
const BUSINESS_WHATSAPP_URL = 'https://wa.me/62859106997680?text=Halo%20Zona%20Kasir%2C%20saya%20ingin%20upgrade%20atau%20memperpanjang%20paket%20BUSINESS.';

// Manfaat PRO — dipakai untuk meyakinkan merchant FREE sebelum memilih paket.
const PRO_BENEFITS = [
  'Tambah produk lebih banyak (FREE maksimal 20)',
  'Multiple kasir sekaligus',
  'Open Bill, voucher, pajak & service charge',
  'Laporan lengkap & struk tanpa branding Zona Kasir',
];

// Paket PRO yang bisa dibayar sendiri lewat QRIS. Urutan tampil = urutan tile.
// `coret` = harga normal (tampilan promo saja, tidak memengaruhi nominal tagihan).
const PRO_PACKAGES: { paket: SubscriptionPaket; label: string; priceOf: (s: SubscriptionSetting) => number; coret?: number }[] = [
  { paket: 'BULANAN', label: '1 Bulan', priceOf: (s) => s.PRICE_MONTHLY },
  { paket: '3_BULAN', label: '3 Bulan', priceOf: (s) => s.PRICE_3_MONTHS, coret: 150000 },
  { paket: '6_BULAN', label: '6 Bulan', priceOf: (s) => s.PRICE_6_MONTHS, coret: 300000 },
  { paket: 'TAHUNAN', label: '1 Tahun', priceOf: (s) => s.PRICE_YEARLY, coret: 600000 },
];

export default function LanggananPage() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [setting, setSetting] = useState<SubscriptionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [payOpen, setPayOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'PRO' | 'BUSINESS'>('PRO');
  const [paket, setPaket] = useState<SubscriptionPaket>('BULANAN');
  const [active, setActive] = useState<SubscriptionPayment | null>(null);
  const [creating, setCreating] = useState(false);
  const [businessContactOpen, setBusinessContactOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [billingData, settingData] = await Promise.all([
        subscriptionService.billing(), subscriptionService.getSetting(),
      ]);
      setBilling(billingData); setSetting(settingData);
      if (billingData.plan === 'BUSINESS') setTargetPlan('BUSINESS');
      const pending = (billingData.payments || []).find((payment) => payment.STATUS === 'PENDING');
      setActive((current) => pending || (current?.STATUS === 'PAID' ? current : null));
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!active || active.STATUS !== 'PENDING') return undefined;
    let checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        const updated = await subscriptionService.paymentStatus(active.ID);
        setActive(updated);
        if (updated.STATUS === 'PAID') {
          toast.success(`Plan ${updated.TARGET_PLAN} berhasil diaktifkan`);
          const session = useAuthStore.getState();
          if (session.token) {
            const me = await authService.me();
            session.setSession(me, session.token);
          }
          await load();
          setActive(updated);
        } else if (['EXPIRED', 'CANCELLED', 'FAILED'].includes(updated.STATUS)) {
          await load();
          setActive(updated);
        }
      } catch { /* polling berikutnya akan mencoba kembali */ }
      finally { checking = false; }
    };
    check();
    const timer = window.setInterval(check, 3000);
    return () => window.clearInterval(timer);
  }, [active?.ID, active?.STATUS, load]);

  useEffect(() => {
    if (!payOpen || active?.STATUS !== 'PENDING') return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payOpen, active?.STATUS]);

  async function createPayment() {
    if (targetPlan === 'BUSINESS') {
      setBusinessContactOpen(true);
      return;
    }
    setCreating(true);
    try {
      const payment = await subscriptionService.createPayment(targetPlan, paket);
      setActive(payment); setPayOpen(true); setNow(Date.now());
      toast.success('QRIS berhasil dibuat, silakan scan untuk membayar');
      await load(); setActive(payment);
    } catch (error) { toast.error(getErrorMessage(error)); await load(); }
    finally { setCreating(false); }
  }

  const plan = billing?.plan || 'FREE';
  const selectedPrice = targetPlan === 'BUSINESS'
    ? (paket === 'TAHUNAN' ? setting?.PRICE_BUSINESS_YEARLY : setting?.PRICE_BUSINESS_MONTHLY)
    : setting ? PRO_PACKAGES.find((p) => p.paket === paket)?.priceOf(setting) : undefined;
  const expiresAt = active?.EXPIRES_AT ? new Date(active.EXPIRES_AT).getTime() : null;
  const secondsLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : null;
  const timerLabel = secondsLeft == null ? '-' : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const columns: Column<SubscriptionPayment>[] = [
    { header: 'Tanggal', accessor: (row) => formatDateTime(row.CREATED_AT || '') },
    { header: 'Plan', accessor: (row) => <span className="font-semibold">{row.TARGET_PLAN || 'PRO'}</span> },
    { header: 'Durasi', accessor: (row) => row.PAKET },
    { header: 'Nominal', accessor: (row) => <span className="font-semibold">{formatRupiah(row.TOTAL_BAYAR)}</span> },
    { header: 'Status', accessor: (row) => <Badge tone={statusTone[row.STATUS]} dot>{statusLabel[row.STATUS]}</Badge> },
    { header: '', accessor: (row) => row.STATUS === 'PENDING'
      ? <Button size="sm" variant="outline" onClick={() => { setActive(row); setPayOpen(true); }}>Tampilkan QRIS</Button>
      : null },
  ];

  return (
    <div>
      <PageHeader title="Langganan / Billing" description="Kelola paket tokomu. Pembayaran cukup scan QRIS, langsung aktif otomatis." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><Crown className="h-4 w-4" /> Plan saat ini</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-ink">{plan}</span>
            <Badge tone={plan === 'PRO' || plan === 'BUSINESS' ? 'green' : 'slate'}>{plan === 'FREE' ? 'Gratis' : 'Aktif'}</Badge>
          </div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><Clock className="h-4 w-4" /> Masa aktif plan</div>
          <div className="mt-1 text-lg font-bold text-ink">{billing?.pro_expires_at ? formatDateTime(billing.pro_expires_at) : '-'}</div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /> Pembayaran terakhir</div>
          <div className="mt-1">{billing?.latest ? <Badge tone={statusTone[billing.latest.STATUS]} dot>{statusLabel[billing.latest.STATUS]}</Badge> : <span className="text-slate-400">Belum ada</span>}</div>
        </CardBody></Card>
      </div>

      {plan === 'FREE' && (
        <Card className="mb-4 border-brand-200 bg-brand-50/50 dark:border-accent/25">
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white"><Crown className="h-4.5 w-4.5" /></span>
              <p className="font-bold text-slate-800">Kenapa upgrade ke PRO?</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {PRO_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {benefit}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card><CardBody>
        <div className="mb-4">
          <p className="font-semibold text-slate-800">Pilih Paket</p>
          <p className="text-sm text-slate-500">Bayar sekali pakai QRIS, plan aktif otomatis begitu pembayaran diterima.</p>
        </div>

        <div className="mb-4 inline-flex rounded-xl border border-line bg-canvas p-1">
          {(['PRO', 'BUSINESS'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTargetPlan(p)}
              className={cn(
                'rounded-lg px-5 py-2 text-sm font-bold transition-colors',
                targetPlan === p ? 'bg-primary text-white shadow-card' : 'text-slate-600 hover:text-primary',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {targetPlan === 'PRO' ? (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {PRO_PACKAGES.map((p) => {
                const price = setting ? p.priceOf(setting) : 0;
                const active_ = paket === p.paket;
                return (
                  <button
                    key={p.paket}
                    type="button"
                    onClick={() => setPaket(p.paket)}
                    className={cn(
                      'rounded-2xl border-2 p-4 text-left transition-all',
                      active_
                        ? 'border-primary bg-brand-50 shadow-card dark:bg-accent/10'
                        : 'border-line bg-white hover:border-brand-300 dark:hover:border-accent/40',
                    )}
                  >
                    <p className={cn('text-sm font-bold', active_ ? 'text-primary' : 'text-slate-600')}>{p.label}</p>
                    <div className="mt-1">
                      {p.coret && (
                        <p className="text-xs text-slate-400 line-through dark:text-slate-500">{formatRupiah(p.coret)}</p>
                      )}
                      <p className="text-lg font-black text-slate-900">{formatRupiah(price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={createPayment} loading={creating} disabled={!!active && active.STATUS === 'PENDING'} size="lg">
              <CreditCard className="h-4 w-4" /> Bayar {formatRupiah(selectedPrice || 0)} via QRIS
            </Button>
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-canvas p-4">
            <p className="text-sm text-slate-600">Upgrade atau perpanjangan paket BUSINESS dibantu langsung oleh tim kami (harga & masa aktif disesuaikan kebutuhan toko).</p>
            <Button onClick={createPayment} className="mt-3">
              <MessageCircle className="h-4 w-4" /> Hubungi untuk BUSINESS
            </Button>
          </div>
        )}
      </CardBody></Card>

      <Card className="mt-4"><CardBody>
        <p className="mb-3 font-semibold text-slate-800">Riwayat Pembayaran</p>
        <DataTable columns={columns} data={billing?.payments || []} loading={loading} rowKey={(row) => row.ID} showRowNumber emptyTitle="Belum ada pembayaran" />
      </CardBody></Card>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={`Pembayaran ${active?.TARGET_PLAN || 'Plan'}`} size="sm">
        {active && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-primary p-4 text-center text-white">
              <p className="text-xs uppercase tracking-wider text-brand-100">Total Pembayaran</p>
              <p className="mt-1 text-3xl font-bold">{formatRupiah(active.TOTAL_BAYAR)}</p>
              <p className="mt-1 text-xs text-brand-100">{active.TARGET_PLAN} · {active.PAKET}</p>
            </div>

            {active.STATUS === 'PENDING' && active.QR_URL ? (
              <div className="space-y-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={active.QR_URL} alt="QRIS pembayaran upgrade plan" loading="lazy" decoding="async" className="mx-auto h-60 w-60 rounded-2xl border object-contain bg-[#fff]" />
                <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2 text-left text-xs leading-5 text-slate-600">
                  <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Scan menggunakan aplikasi yang mendukung QRIS seperti GoPay, OVO, DANA, ShopeePay, LinkAja, atau mobile banking.</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Menunggu Pembayaran</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600"><Clock className="mr-1 inline h-3.5 w-3.5" /> {timerLabel}</div>
                </div>
                <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Status diperiksa otomatis setiap 3 detik.</p>
              </div>
            ) : active.STATUS === 'PAID' ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-500/15">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-2 font-bold text-emerald-800 dark:text-emerald-300">Pembayaran Berhasil</p>
                <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Plan {active.TARGET_PLAN} sudah aktif otomatis.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-50 p-5 text-center text-sm text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">Pembayaran {statusLabel[active.STATUS]}.</div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={businessContactOpen} onClose={() => setBusinessContactOpen(false)} title="Paket BUSINESS" size="sm">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"><MessageCircle className="h-7 w-7" /></span>
          <div>
            <p className="font-semibold text-slate-800">Upgrade dan perpanjangan BUSINESS dibantu oleh tim kami.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Hubungi WhatsApp <b>+62 859-1069-97680</b> untuk konfirmasi kebutuhan, harga, dan masa aktif paket BUSINESS.</p>
          </div>
          <a href={BUSINESS_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700">
            <MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp
          </a>
        </div>
      </Modal>
    </div>
  );
}
