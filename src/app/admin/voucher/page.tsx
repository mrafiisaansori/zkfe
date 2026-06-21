'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, Input, type Column } from '@/components/ui';
import { voucherService, getErrorMessage } from '@/services';
import type { VoucherInput } from '@/services/voucher.service';
import type { Voucher } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah } from '@/utils/format';

const empty: VoucherInput = { kode: '', tipe: 'NOMINAL', nilai: 0, min_transaksi: 0, valid_from: '', valid_until: '', is_active: true };

export default function VoucherPage() {
  const [data, setData] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState<VoucherInput>(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await voucherService.list()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setFormOpen(true); }
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
            <Input label={form.tipe === 'PERSEN' ? 'Nilai (%)' : 'Nilai (Rp)'} type="number" min={0} value={form.nilai || ''} onChange={(e) => setForm((f) => ({ ...f, nilai: Number(e.target.value) }))} />
          </div>
          <Input label="Minimal transaksi (Rp)" type="number" min={0} value={form.min_transaksi || ''} onChange={(e) => setForm((f) => ({ ...f, min_transaksi: Number(e.target.value) }))} />
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
    </div>
  );
}
