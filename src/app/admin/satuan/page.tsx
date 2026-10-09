'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, type Column } from '@/components/ui';
import { SatuanForm } from '@/components/forms/SatuanForm';
import { satuanService, getErrorMessage } from '@/services';
import type { Satuan } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function SatuanPage() {
  const [data, setData] = useState<Satuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Satuan | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Satuan | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await satuanService.list()) || []); }
    catch (err) { setError(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(nama: string) {
    setSaving(true);
    try {
      if (editing) { await satuanService.update(editing.ID, nama); toast.success('Satuan diperbarui'); }
      else { await satuanService.create(nama); toast.success('Satuan ditambahkan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }
  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try { await satuanService.remove(toDelete.ID); toast.success('Satuan dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  }

  const columns: Column<Satuan>[] = [
    { header: 'Nama satuan', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Satuan" description="Satuan penjualan produk (Pcs, Box, Dus, Kg, Liter, Botol, dll)"
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah</Button>} />
      <Card><CardBody><DataTable error={error} onRetry={() => load()} columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber /></CardBody></Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Satuan' : 'Tambah Satuan'} size="sm">
        <SatuanForm initial={editing} loading={saving} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus satuan" message={`Hapus satuan "${toDelete?.NAMA}"?`} confirmLabel="Hapus" />
    </div>
  );
}
