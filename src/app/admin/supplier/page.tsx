'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, SelectMenu, SearchInput, Input, type Column,
} from '@/components/ui';
import { supplierService, getErrorMessage } from '@/services';
import type { Supplier, SupplierInput } from '@/services/supplier.service';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function SupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState<SupplierInput>({ nama: '', no_telp: '', email: '', alamat: '', catatan: '', status: 1 });

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await supplierService.list({ search: search || undefined, status: status === '' ? undefined : Number(status) })) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ nama: '', no_telp: '', email: '', alamat: '', catatan: '', status: 1 });
    setFormOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ nama: s.NAMA, no_telp: s.NO_TELP || '', email: s.EMAIL || '', alamat: s.ALAMAT || '', catatan: s.CATATAN || '', status: (s.STATUS ?? 1) as 0 | 1 });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nama.trim()) { toast.error('Nama supplier wajib diisi'); return; }
    setSaving(true);
    try {
      if (editing) { await supplierService.update(editing.ID, form); toast.success('Supplier diperbarui'); }
      else { await supplierService.create(form); toast.success('Supplier ditambahkan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }
  async function doDelete() {
    if (!toDelete) return; setBusy(true);
    try { await supplierService.remove(toDelete.ID); toast.success('Supplier dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const columns: Column<Supplier>[] = [
    { header: 'Nama', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Telepon', accessor: (r) => r.NO_TELP || '-' },
    { header: 'Email', accessor: (r) => r.EMAIL || '-' },
    { header: 'Alamat', accessor: (r) => <span className="line-clamp-1 max-w-[220px]">{r.ALAMAT || '-'}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS === 0 ? 'red' : 'green'}>{r.STATUS === 0 ? 'Nonaktif' : 'Aktif'}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Supplier" description="Kelola data supplier toko Anda"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Supplier</Button>} />

      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput className="flex-1" placeholder="Cari nama / telepon / email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="w-full sm:w-52">
            <SelectMenu label="Status" value={status} onChange={(v) => setStatus(String(v))}
              options={[{ value: '', label: 'Semua' }, { value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }]} />
          </div>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada supplier" showRowNumber />
      </CardBody></Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Supplier' : 'Tambah Supplier'} size="md">
        <div className="space-y-3">
          <Input label="Nama supplier" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} placeholder="mis. PT Sumber Rejeki" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="No. Telepon / WhatsApp" value={form.no_telp} onChange={(e) => setForm((f) => ({ ...f, no_telp: e.target.value }))} />
            <Input label="Email (opsional)" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <Input label="Alamat" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />
          <Input label="Catatan (opsional)" value={form.catatan} onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))} />
          <SelectMenu label="Status" value={String(form.status ?? 1)} onChange={(v) => setForm((f) => ({ ...f, status: Number(v) as 0 | 1 }))}
            options={[{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }]} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Simpan perubahan' : 'Tambah'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={busy}
        title="Hapus supplier" message={`Hapus supplier "${toDelete?.NAMA}"?`} confirmLabel="Hapus" />
    </div>
  );
}
