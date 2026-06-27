'use client';
import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Crown, Clock, CheckCircle2, Loader2, ScanLine, ShieldCheck, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Modal, Badge, DataTable, type Column } from '@/components/ui';
import { subscriptionService, authService, getErrorMessage } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import type { Billing, SubscriptionSetting, SubscriptionPayment, SubscriptionStatus, PlanType } from '@/types';
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

export default function LanggananPage() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [setting, setSetting] = useState<SubscriptionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [payOpen, setPayOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'PRO' | 'BUSINESS'>('PRO');
  const [paket, setPaket] = useState<'BULANAN' | 'TAHUNAN'>('BULANAN');
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
      toast.success('QRIS dinamis berhasil dibuat');
      await load(); setActive(payment);
    } catch (error) { toast.error(getErrorMessage(error)); await load(); }
    finally { setCreating(false); }
  }

  const plan = billing?.plan || 'FREE';
  const selectedPrice = targetPlan === 'BUSINESS'
    ? (paket === 'TAHUNAN' ? setting?.PRICE_BUSINESS_YEARLY : setting?.PRICE_BUSINESS_MONTHLY)
    : (paket === 'TAHUNAN' ? setting?.PRICE_YEARLY : setting?.PRICE_MONTHLY);
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
      <PageHeader title="Langganan / Billing" description="Upgrade plan otomatis melalui QRIS dinamis Midtrans." />

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

      <Card><CardBody>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-semibold text-slate-800">Upgrade / Perpanjang Plan</p>
            <p className="text-sm text-slate-500">QRIS dibuat otomatis sesuai plan dan durasi yang dipilih.</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-600">Plan
              <select value={targetPlan} onChange={(event) => setTargetPlan(event.target.value as 'PRO' | 'BUSINESS')} className="mt-1 block h-10 rounded-xl border border-line bg-white px-3 text-sm">
                <option value="PRO">PRO</option><option value="BUSINESS">BUSINESS</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-600">Durasi
              <select value={paket} onChange={(event) => setPaket(event.target.value as 'BULANAN' | 'TAHUNAN')} className="mt-1 block h-10 rounded-xl border border-line bg-white px-3 text-sm">
                <option value="BULANAN">Bulanan</option><option value="TAHUNAN">Tahunan</option>
              </select>
            </label>
            <Button onClick={createPayment} loading={creating} disabled={!!active && active.STATUS === 'PENDING'}>
              {targetPlan === 'BUSINESS' ? <MessageCircle className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              {targetPlan === 'BUSINESS' ? 'Hubungi untuk BUSINESS' : `Bayar ${formatRupiah(selectedPrice || 0)}`}
            </Button>
          </div>
        </div>
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
                <img src={active.QR_URL} alt="QRIS dinamis pembayaran upgrade plan" className="mx-auto h-60 w-60 rounded-2xl border object-contain" />
                <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2 text-left text-xs leading-5 text-slate-600">
                  <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Scan menggunakan aplikasi yang mendukung QRIS seperti GoPay, OVO, DANA, ShopeePay, LinkAja, atau mobile banking.</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Menunggu Pembayaran</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600"><Clock className="mr-1 inline h-3.5 w-3.5" /> {timerLabel}</div>
                </div>
                <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Status diperiksa otomatis setiap 3 detik.</p>
              </div>
            ) : active.STATUS === 'PAID' ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-2 font-bold text-emerald-800">Pembayaran Berhasil</p>
                <p className="mt-1 text-xs text-emerald-700">Plan {active.TARGET_PLAN} sudah aktif otomatis.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-rose-50 p-5 text-center text-sm text-rose-700">Pembayaran {statusLabel[active.STATUS]}.</div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={businessContactOpen} onClose={() => setBusinessContactOpen(false)} title="Paket BUSINESS" size="sm">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><MessageCircle className="h-7 w-7" /></span>
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
