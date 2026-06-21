'use client';
import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Crown, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Modal, Badge, DataTable, type Column } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { Billing, SubscriptionSetting, SubscriptionPayment, SubscriptionStatus } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah, formatDateTime } from '@/utils/format';

const statusTone: Record<SubscriptionStatus, 'amber' | 'blue' | 'green' | 'red' | 'slate'> = {
  PENDING: 'amber', WAITING_VERIFICATION: 'blue', VERIFIED: 'green', REJECTED: 'red', EXPIRED: 'slate',
};
const statusLabel: Record<SubscriptionStatus, string> = {
  PENDING: 'Menunggu Pembayaran',
  WAITING_VERIFICATION: 'Menunggu Verifikasi',
  VERIFIED: 'Terverifikasi',
  REJECTED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
};

export default function LanggananPage() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [setting, setSetting] = useState<SubscriptionSetting | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [payOpen, setPayOpen] = useState(false);
  const [paket, setPaket] = useState<'BULANAN' | 'TAHUNAN'>('BULANAN');
  const [active, setActive] = useState<SubscriptionPayment | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([subscriptionService.billing(), subscriptionService.getSetting()]);
      setBilling(b); setSetting(s);
      // pembayaran yang masih perlu aksi
      const act = (b.payments || []).find((p) => p.STATUS === 'PENDING' || p.STATUS === 'WAITING_VERIFICATION');
      setActive(act || null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function createPayment() {
    setCreating(true);
    try {
      const p = await subscriptionService.createPayment(paket);
      setActive(p); setPayOpen(true);
      toast.success('Pembayaran dibuat, silakan bayar & upload bukti');
      load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setCreating(false); }
  }

  async function confirmPaid() {
    if (!active) return; setSubmitting(true);
    try {
      await subscriptionService.submitPayment(active.ID);
      toast.success('Konfirmasi terkirim, menunggu verifikasi admin');
      setPayOpen(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSubmitting(false); }
  }

  const plan = billing?.plan || 'FREE';
  const columns: Column<SubscriptionPayment>[] = [
    { header: 'Tanggal', accessor: (r) => formatDateTime(r.CREATED_AT || '') },
    { header: 'Paket', accessor: (r) => r.PAKET },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL_BAYAR)}</span> },
    { header: 'Kode unik', accessor: (r) => <span className="font-mono">{r.KODE_UNIK}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={statusTone[r.STATUS]} dot>{statusLabel[r.STATUS]}</Badge> },
    { header: '', accessor: (r) => (r.STATUS === 'PENDING'
      ? <Button size="sm" variant="outline" onClick={() => { setActive(r); setPayOpen(true); }}>Bayar</Button>
      : r.STATUS === 'REJECTED' && r.REJECT_REASON ? <span className="text-xs text-rose-500">{r.REJECT_REASON}</span> : null) },
  ];

  return (
    <div>
      <PageHeader title="Langganan / Billing" description="Status plan toko Anda & pembayaran langganan PRO." />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><Crown className="h-4 w-4" /> Plan saat ini</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-black text-ink">{plan}</span>
            <Badge tone={plan === 'PRO' ? 'green' : 'slate'}>{plan === 'PRO' ? 'Aktif' : 'Gratis'}</Badge>
          </div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><Clock className="h-4 w-4" /> Masa aktif PRO</div>
          <div className="mt-1 text-lg font-bold text-ink">{billing?.pro_expires_at ? formatDateTime(billing.pro_expires_at) : '-'}</div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="flex items-center gap-2 text-slate-500"><CreditCard className="h-4 w-4" /> Status pembayaran</div>
          <div className="mt-1">{billing?.latest ? <Badge tone={statusTone[billing.latest.STATUS]} dot>{statusLabel[billing.latest.STATUS]}</Badge> : <span className="text-slate-400">Belum ada</span>}</div>
        </CardBody></Card>
      </div>

      <Card><CardBody>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-800">Upgrade / Perpanjang PRO</p>
            <p className="text-sm text-slate-500">
              Bulanan {formatRupiah(setting?.PRICE_MONTHLY || 0)} · Tahunan {formatRupiah(setting?.PRICE_YEARLY || 0)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select value={paket} onChange={(e) => setPaket(e.target.value as 'BULANAN' | 'TAHUNAN')} className="h-10 rounded-xl border border-line bg-white px-3 text-sm">
              <option value="BULANAN">Bulanan</option>
              <option value="TAHUNAN">Tahunan</option>
            </select>
            <Button onClick={createPayment} loading={creating} disabled={!!active}>
              <CreditCard className="h-4 w-4" /> {active ? 'Ada pembayaran aktif' : 'Upgrade PRO'}
            </Button>
          </div>
        </div>
        <DataTable columns={columns} data={billing?.payments || []} loading={loading} rowKey={(r) => r.ID} showRowNumber emptyTitle="Belum ada pembayaran" />
      </CardBody></Card>

      {/* Modal pembayaran QRIS */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Pembayaran Langganan PRO" size="sm">
        {active && (
          <div className="space-y-3">
            {setting?.QRIS_IMAGE_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={setting.QRIS_IMAGE_URL} alt="QRIS Zona Kasir" className="mx-auto h-56 w-56 rounded-xl border object-contain" />
            ) : (
              <div className="rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">QRIS Zona Kasir belum diatur admin.</div>
            )}
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Paket</span><span className="font-semibold">{active.PAKET}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Harga</span><span>{formatRupiah(active.HARGA)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kode unik</span><span className="font-mono font-bold">{active.KODE_UNIK}</span></div>
              <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><span>Total bayar</span><span className="text-primary">{formatRupiah(active.TOTAL_BAYAR)}</span></div>
            </div>
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-slate-600">
              Bayar <b>tepat {formatRupiah(active.TOTAL_BAYAR)}</b> (termasuk 3 digit kode unik {active.KODE_UNIK}) agar admin mudah mencocokkan tanpa perlu upload bukti.
              {active.EXPIRES_AT && <> Berlaku s/d {formatDateTime(active.EXPIRES_AT)}.</>}
            </p>
            <Button className="w-full" onClick={confirmPaid} loading={submitting}>
              <CheckCircle2 className="h-4 w-4" /> Saya sudah bayar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
