'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, type Column } from '@/components/ui';
import { KategoriForm } from '@/components/forms/KategoriForm';
import { kategoriService, getErrorMessage } from '@/services';
import type { Kategori } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function KategoriPage() {
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Kategori | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Kategori | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await kategoriService.list()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(deskripsi: string) {
    setSaving(true);
    try {
      if (editing) { await kategoriService.update(editing.ID, deskripsi); toast.success('Kategori diperbarui'); }
      else { await kategoriService.create(deskripsi); toast.success('Kategori ditambahkan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }
  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try { await kategoriService.remove(toDelete.ID); toast.success('Kategori dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  }

  const columns: Column<Kategori>[] = [
    { header: 'Nama kategori', accessor: (r) => <span className="font-medium text-slate-800">{r.DESKRIPSI}</span> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Kategori" description="Kelompok produk untuk filter POS dan laporan Zona Kasir"
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah</Button>} />
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber /></CardBody></Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Kategori' : 'Tambah Kategori'} size="sm">
        <KategoriForm initial={editing} loading={saving} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus kategori" message={`Hapus kategori "${toDelete?.DESKRIPSI}"?`} confirmLabel="Hapus" />
    </div>
  );
}