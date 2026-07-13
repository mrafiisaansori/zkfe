'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, Input, CurrencyInput, UpgradeModal, type Column } from '@/components/ui';
import { voucherService, getErrorMessage } from '@/services';
import type { VoucherInput } from '@/services/voucher.service';
import type { Voucher } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';

const empty: VoucherInput = { kode: '', tipe: 'NOMINAL', nilai: 0, min_transaksi: 0, valid_from: '', valid_until: '', is_active: true };

export default function VoucherPage() {
  const user = useAuthStore((s) => s.user);
  const isPro = user?.merchant?.plan === 'PRO' || user?.merchant?.plan === 'BUSINESS';
  const [data, setData] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState<VoucherInput>(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);
  const [busy, setBusy] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // Voucher yang SUDAH ADA tetap kelihatan & bisa dikelola di semua plan
  // (termasuk setelah PRO turun ke FREE) - cuma bikin voucher BARU yang PRO-only.
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try { setData((await voucherService.list()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  function openCreate() {
    if (!isPro) { setUpgradeOpen(true); return; }
    setEditing(null); setForm(empty); setFormOpen(true);
  }
  function openEdit(v: Voucher) {
    setEditing(v);
    setForm({ kode: v.KODE, tipe: v.TIPE, nilai: v.NILAI, min_transaksi: v.MIN_TRANSAKSI, valid_from: v.VALID_FROM || '', valid_until: v.VALID_UNTIL || '', is_active: v.IS_ACTIVE });
    setFormOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = { ...form, valid_from: form.valid_from || null, valid_until: form.valid_until || null };
      if (editing) { await voucherService.update(editing.ID, payload); toast.success('Voucher diperbarui'); }
      else { await voucherService.create(payload); toast.success('Voucher dibuat'); }
      setFormOpen(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!toDelete) return; setBusy(true);
    try { await voucherService.remove(toDelete.ID); toast.success('Voucher dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const columns: Column<Voucher>[] = [
    { header: 'Kode', accessor: (r) => <span className="font-mono font-bold text-slate-800">{r.KODE}</span> },
    { header: 'Tipe', accessor: (r) => r.TIPE === 'PERSEN' ? `${r.NILAI}%` : formatRupiah(r.NILAI) },
    { header: 'Min. transaksi', accessor: (r) => formatRupiah(r.MIN_TRANSAKSI) },
    { header: 'Berlaku', accessor: (r) => `${r.VALID_FROM || '-'} s/d ${r.VALID_UNTIL || '-'}` },
    { header: 'Status', accessor: (r) => <Badge tone={r.IS_ACTIVE ? 'green' : 'slate'}>{r.IS_ACTIVE ? 'Aktif' : 'Nonaktif'}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Voucher / Promo" description="Kode diskon yang bisa dipakai kasir saat checkout."
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah</Button>} />
      {!isPro && data.length === 0 && !loading && (
        <Card className="mb-4"><CardBody className="py-8 text-center">
          <p className="font-semibold text-slate-800">Bikin voucher baru tersedia mulai paket PRO.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Kelola kode promo, periode berlaku, dan minimal transaksi dengan kontrol yang lebih profesional.</p>
          <Button className="mt-5" onClick={() => setUpgradeOpen(true)}>Upgrade ke PRO</Button>
        </CardBody></Card>
      )}
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber /></CardBody></Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Voucher' : 'Tambah Voucher'} size="sm"
        footer={<><Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={save} loading={saving}>Simpan</Button></>}>
        <div className="space-y-3">
          <Input label="Kode voucher" value={form.kode} onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase() }))} placeholder="DISKON10" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Tipe</label>
              <select value={form.tipe} onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as 'NOMINAL' | 'PERSEN' }))}
                className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
                <option value="NOMINAL">Nominal (Rp)</option>
                <option value="PERSEN">Persen (%)</option>
              </select>
            </div>
            {form.tipe === 'PERSEN' ? (
              <Input label="Nilai (%)" type="number" min={0} value={form.nilai || ''} onChange={(e) => setForm((f) => ({ ...f, nilai: Number(e.target.value) }))} />
            ) : (
              <CurrencyInput label="Nilai (Rp)" value={form.nilai} onChange={(v) => setForm((f) => ({ ...f, nilai: v }))} />
            )}
          </div>
          <CurrencyInput label="Minimal transaksi (Rp)" value={form.min_transaksi} onChange={(v) => setForm((f) => ({ ...f, min_transaksi: v }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Berlaku dari" type="date" value={form.valid_from || ''} onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))} />
            <Input label="Berlaku sampai" type="date" value={form.valid_until || ''} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Aktif
          </label>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={busy}
        title="Hapus voucher" message={`Hapus voucher "${toDelete?.KODE}"?`} confirmLabel="Hapus" />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        title="Bikin voucher baru tersedia di PRO"
        description="Voucher yang sudah ada tetap bisa dipakai & dikelola. Upgrade ke PRO untuk bikin kode promo baru, plus pajak dan service charge."
        benefits={['Buat voucher dan promo baru', 'Atur pajak dan service charge', 'Struk tanpa branding Zona Kasir']}
      />
    </div>
  );
}
