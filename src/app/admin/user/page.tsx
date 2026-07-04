'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, type Column } from '@/components/ui';
import { UserForm } from '@/components/forms/UserForm';
import { penggunaService, getErrorMessage } from '@/services';
import type { PenggunaInput } from '@/services/pengguna.service';
import type { Pengguna } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function UserPage() {
  const [data, setData] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pengguna | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Pengguna | null>(null);
  const [toReset, setToReset] = useState<Pengguna | null>(null);
  // Password baru hasil reset — ditampilkan SEKALI untuk disalin admin.
  const [resetResult, setResetResult] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await penggunaService.list()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function handleSubmit(d: PenggunaInput) {
    setSaving(true);
    try {
      if (editing) { await penggunaService.update(editing.ID, d); toast.success('Pengguna diperbarui'); }
      else { await penggunaService.create(d); toast.success('Pengguna ditambahkan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }
  async function handleDelete() {
    if (!toDelete) return; setBusy(true);
    try { await penggunaService.remove(toDelete.ID); toast.success('Pengguna dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function handleReset() {
    if (!toReset) return; setBusy(true);
    try {
      const res = await penggunaService.resetPassword(toReset.ID);
      setToReset(null);
      setCopied(false);
      setResetResult(res); // tampilkan password baru sekali
      toast.success('Password berhasil direset');
    }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  async function copyPassword() {
    if (!resetResult) return;
    try { await navigator.clipboard.writeText(resetResult.password); setCopied(true); }
    catch { toast.error('Gagal menyalin. Salin manual.'); }
  }

  const columns: Column<Pengguna>[] = [
    { header: 'Nama', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Username', accessor: (r) => r.USERNAME },
    { header: 'Role', accessor: (r) => {
      const label = r.LEVEL === 1 ? 'Admin' : r.LEVEL === 3 ? 'Gudang' : 'Kasir';
      const tone = r.LEVEL === 1 ? 'blue' : r.LEVEL === 3 ? 'amber' : 'slate';
      return <Badge tone={tone}>{label}</Badge>;
    } },
    { header: 'Telp', accessor: (r) => r.TELP || '-' },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setToReset(r)} title="Reset password"><KeyRound className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Pengguna" description="Manajemen akun kasir & gudang"
        action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah</Button>} />
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber /></CardBody></Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Pengguna' : 'Tambah Pengguna'} size="sm">
        <UserForm initial={editing} loading={saving} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={busy}
        title="Hapus pengguna" message={`Hapus akun "${toDelete?.NAMA}"?`} confirmLabel="Hapus" />
      <ConfirmDialog open={!!toReset} onClose={() => setToReset(null)} onConfirm={handleReset} loading={busy} danger={false}
        title="Reset password" message={`Buat password baru acak untuk "${toReset?.NAMA}"? Password lama tidak bisa dipakai lagi setelah ini.`} confirmLabel="Reset" />

      {/* Password baru — ditampilkan SEKALI. */}
      <Modal open={!!resetResult} onClose={() => setResetResult(null)} title="Password baru" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Password baru untuk akun <b>{resetResult?.username}</b> berhasil dibuat. Salin dan berikan ke pengguna.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5">
            <code className="flex-1 break-all font-mono text-base font-semibold text-slate-800">{resetResult?.password}</code>
            <Button variant="outline" size="sm" onClick={copyPassword}>{copied ? 'Tersalin' : 'Salin'}</Button>
          </div>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Catatan: password ini hanya ditampilkan <b>sekali</b>. Setelah ditutup, password tidak dapat dilihat lagi.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setResetResult(null)}>Selesai</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
