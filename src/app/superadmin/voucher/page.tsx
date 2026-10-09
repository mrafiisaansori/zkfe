'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, Input, type Column } from '@/components/ui';
import { subscriptionService, getErrorMessage } from '@/services';
import type { SubscriptionVoucherInput } from '@/services/subscription.service';
import type { SubscriptionVoucher, SubscriptionVoucherRedemption, SubscriptionPaket } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatDateTime } from '@/utils/format';

const PAKET_LABEL: Record<SubscriptionPaket, string> = { BULANAN: '1 Bulan', '3_BULAN': '3 Bulan', '6_BULAN': '6 Bulan', TAHUNAN: '1 Tahun' };
const empty: SubscriptionVoucherInput = { kode: '', target_plan: 'PRO', paket: 'BULANAN', max_redemptions: null, valid_from: '', valid_until: '', is_active: true, note: '' };
const selectCls = 'h-11 w-full rounded-xl border border-line bg-white px-3 text-sm';

export default function SuperadminVoucherPage() {
  const [data, setData] = useState<SubscriptionVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionVoucher | null>(null);
  const [form, setForm] = useState<SubscriptionVoucherInput>(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<SubscriptionVoucher | null>(null);
  const [busy, setBusy] = useState(false);
  const [redeemFor, setRedeemFor] = useState<SubscriptionVoucher | null>(null);
  const [redemptions, setRedemptions] = useState<SubscriptionVoucherRedemption[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await subscriptionService.listVouchers()) || []); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setFormOpen(true); }
  function openEdit(v: SubscriptionVoucher) {
    setEditing(v);
    setForm({
      kode: v.KODE, target_plan: v.TARGET_PLAN, paket: v.PAKET, max_redemptions: v.MAX_REDEMPTIONS,
      valid_from: v.VALID_FROM?.slice(0, 10) || '', valid_until: v.VALID_UNTIL?.slice(0, 10) || '',
      is_active: v.IS_ACTIVE, note: v.NOTE || '',
    });
    setFormOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, kode: form.kode.trim().toUpperCase(), valid_from: form.valid_from || null, valid_until: form.valid_until || null };
      if (editing) await subscriptionService.updateVoucher(editing.ID, payload);
      else await subscriptionService.createVoucher(payload);
      toast.success(editing ? 'Voucher diperbarui' : 'Voucher dibuat');
      setFormOpen(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function deactivate(v: SubscriptionVoucher) {
    try { await subscriptionService.updateVoucher(v.ID, { is_active: false }); toast.success('Voucher dinonaktifkan'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  async function handleDelete() {
    if (!toDelete) return; setBusy(true);
    try { await subscriptionService.removeVoucher(toDelete.ID); toast.success('Voucher dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  async function openRedemptions(v: SubscriptionVoucher) {
    setRedeemFor(v); setRedemptions(null);
    try { setRedemptions((await subscriptionService.voucherRedemptions(v.ID)) || []); }
    catch (err) { toast.error(getErrorMessage(err)); setRedeemFor(null); }
  }

  const columns: Column<SubscriptionVoucher>[] = [
    { header: 'Kode', accessor: (r) => <span className="font-mono font-bold text-slate-800">{r.KODE}</span> },
    { header: 'Plan', accessor: (r) => <Badge tone="blue">{r.TARGET_PLAN}</Badge> },
    { header: 'Paket', accessor: (r) => PAKET_LABEL[r.PAKET] ?? r.PAKET },
    { header: 'Terpakai', accessor: (r) => `${r.USED_COUNT} / ${r.MAX_REDEMPTIONS ?? 'tanpa batas'}` },
    { header: 'Berlaku', accessor: (r) => `${r.VALID_FROM?.slice(0, 10) || '-'} s/d ${r.VALID_UNTIL?.slice(0, 10) || '-'}` },
    { header: 'Status', accessor: (r) => (
      <div className="flex flex-wrap gap-1">
        <Badge tone={r.IS_ACTIVE ? 'green' : 'slate'}>{r.IS_ACTIVE ? 'Aktif' : 'Nonaktif'}</Badge>
        {r.MAX_REDEMPTIONS != null && r.USED_COUNT >= r.MAX_REDEMPTIONS && <Badge tone="amber">Kuota habis</Badge>}
      </div>
    ) },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openRedemptions(r)} title="Siapa yang redeem"><Users className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-4 w-4" /></Button>
        {r.USED_COUNT > 0 ? (
          r.IS_ACTIVE && <Button variant="ghost" size="sm" onClick={() => deactivate(r)} title="Nonaktifkan (sudah pernah dipakai, tidak bisa dihapus)"><Ban className="h-4 w-4 text-amber-600" /></Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setToDelete(r)} title="Hapus"><Trash2 className="h-4 w-4 text-rose-500" /></Button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Voucher Langganan" description="Kode promo yang langsung memperpanjang plan merchant tanpa bayar."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah</Button>} />
      <Card><CardBody><DataTable error={error} onRetry={load} columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber emptyTitle="Belum ada voucher langganan" /></CardBody></Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Voucher' : 'Tambah Voucher'} size="sm"
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={save} loading={saving}>Simpan</Button></>}>
        <div className="space-y-3">
          <Input label="Kode voucher" value={form.kode} onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase() }))} placeholder="PROMO2026" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Plan</label>
              <select value={form.target_plan} onChange={(e) => setForm((f) => ({ ...f, target_plan: e.target.value as 'PRO' | 'BUSINESS' }))} className={selectCls}>
                <option value="PRO">PRO</option><option value="BUSINESS">BUSINESS</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Durasi</label>
              <select value={form.paket} onChange={(e) => setForm((f) => ({ ...f, paket: e.target.value as SubscriptionPaket }))} className={selectCls}>
                {(Object.keys(PAKET_LABEL) as SubscriptionPaket[]).map((k) => <option key={k} value={k}>{PAKET_LABEL[k]}</option>)}
              </select>
            </div>
          </div>
          <Input label="Kuota (kosong = tanpa batas)" type="number" min={1} value={form.max_redemptions ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, max_redemptions: e.target.value ? Number(e.target.value) : null }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berlaku dari" type="date" value={form.valid_from || ''} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} />
            <Input label="Berlaku sampai" type="date" value={form.valid_until || ''} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
          </div>
          <Input label="Catatan (opsional)" value={form.note || ''} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Aktif
          </label>
        </div>
      </Modal>

      <Modal open={!!redeemFor} onClose={() => setRedeemFor(null)} title={`Redeem ${redeemFor?.KODE ?? ''}`}>
        {redemptions === null ? (
          <p className="py-4 text-center text-sm text-slate-400">Memuat...</p>
        ) : redemptions.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Belum ada yang redeem.</p>
        ) : (
          <ul className="divide-y divide-line">
            {redemptions.map((r) => (
              <li key={r.ID} className="py-2 text-sm">
                <p className="font-semibold text-slate-800">{r.merchant?.NAMA ?? `Merchant #${r.MERCHANT_ID}`}</p>
                <p className="text-xs text-slate-500">{r.merchant?.EMAIL ?? '-'} · {r.TARGET_PLAN} {PAKET_LABEL[r.PAKET] ?? r.PAKET}</p>
                <p className="text-xs text-slate-400">Redeem {formatDateTime(r.CREATED_AT)}{r.PRO_EXPIRES_AT ? ` · aktif sampai ${formatDateTime(r.PRO_EXPIRES_AT)}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={busy}
        title="Hapus voucher" message={`Hapus voucher "${toDelete?.KODE}"?`} confirmLabel="Hapus" />
    </div>
  );
}
