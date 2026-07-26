'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, SelectMenu, SearchInput, Input, Pagination, type Column,
} from '@/components/ui';
import { memberService, getErrorMessage } from '@/services';
import type { MemberInput } from '@/services/member.service';
import type { Member } from '@/types';
import type { PaginationMeta } from '@/services/api';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatDate } from '@/utils/format';
import { useAuthStore } from '@/stores/authStore';

const emptyForm: MemberInput = { nama: '', no_hp: '', email: '', alamat: '', status: 1 };

export default function MemberPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isPro = user?.merchant?.plan === 'PRO' || user?.merchant?.plan === 'BUSINESS';
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<MemberInput>(emptyForm);

  const load = useCallback(async () => {
    if (!isPro) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await memberService.list({
        search: search || undefined,
        status: status === '' ? undefined : (Number(status) as 0 | 1),
        page,
        limit: 25,
      });
      setData(res.data || []);
      setMeta(res.meta);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status, page, isPro]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormOpen(true); }
  function openEdit(m: Member) {
    setEditing(m);
    setForm({ nama: m.NAMA, no_hp: m.NO_HP, email: m.EMAIL || '', alamat: m.ALAMAT || '', status: (m.STATUS ?? 1) as 0 | 1 });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nama.trim()) { toast.error('Nama member wajib diisi'); return; }
    if (!form.no_hp.trim()) { toast.error('Nomor HP wajib diisi'); return; }
    setSaving(true);
    try {
      if (editing) { await memberService.update(editing.ID, form); toast.success('Member diperbarui'); }
      else { await memberService.create(form); toast.success('Member ditambahkan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }
  async function doDelete() {
    if (!toDelete) return; setBusy(true);
    try { await memberService.remove(toDelete.ID); toast.success('Member dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const columns: Column<Member>[] = [
    { header: 'Kode', accessor: (r) => <span className="font-mono text-xs font-semibold text-slate-500">{r.KODE_MEMBER || '-'}</span> },
    { header: 'Nama', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'No. HP', accessor: (r) => r.NO_HP || '-' },
    { header: 'Email', accessor: (r) => r.EMAIL || '-' },
    { header: 'Terdaftar', accessor: (r) => formatDate(r.TANGGAL_DAFTAR) },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS === 0 ? 'red' : 'green'}>{r.STATUS === 0 ? 'Nonaktif' : 'Aktif'}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/member/${r.ID}`)}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    ) },
  ];

  if (!isPro) {
    return (
      <div>
        <PageHeader title="Master Member" description="Kelola data member/pelanggan toko Anda" />
        <Card><CardBody className="py-10 text-center">
          <p className="font-semibold text-slate-800">Fitur Member tersedia mulai paket PRO.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Kelola data pelanggan, riwayat transaksi, dan pilih member langsung dari halaman kasir.</p>
          <Button className="mt-5" onClick={() => router.push('/admin/langganan')}>Upgrade ke PRO</Button>
        </CardBody></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Master Member" description="Kelola data member/pelanggan toko Anda"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah Member</Button>} />

      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput className="flex-1" placeholder="Cari nama / no. HP / kode member..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <div className="w-full sm:w-52">
            <SelectMenu label="Status" value={status} onChange={(v) => { setStatus(String(v)); setPage(1); }}
              options={[{ value: '', label: 'Semua' }, { value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }]} />
          </div>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada member" showRowNumber startIndex={(page - 1) * 25} />
        <Pagination page={page} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
      </CardBody></Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Member' : 'Tambah Member'} size="md">
        <div className="space-y-3">
          <Input label="Nama member" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} placeholder="mis. Budi Santoso" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="No. HP" placeholder="081234567890" value={form.no_hp} onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))} />
            <Input label="Email (opsional)" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <Input label="Alamat (opsional)" value={form.alamat} onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))} />
          <SelectMenu label="Status" value={String(form.status ?? 1)} onChange={(v) => setForm((f) => ({ ...f, status: Number(v) as 0 | 1 }))}
            options={[{ value: '1', label: 'Aktif' }, { value: '0', label: 'Nonaktif' }]} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Simpan perubahan' : 'Tambah'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={busy}
        title="Hapus member" message={`Hapus member "${toDelete?.NAMA}"?`} confirmLabel="Hapus" />
    </div>
  );
}
