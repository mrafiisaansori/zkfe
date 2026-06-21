'use client';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Modal, ConfirmDialog, Badge, Input, EmptyState } from '@/components/ui';
import { modifierService, getErrorMessage } from '@/services';
import type { ModifierGroup } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { formatRupiah } from '@/utils/format';

export default function ModifierPage() {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  const [groupOpen, setGroupOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ModifierGroup | null>(null);
  const [gForm, setGForm] = useState<{ nama: string; tipe: 'SINGLE' | 'MULTI'; wajib: boolean }>({ nama: '', tipe: 'SINGLE', wajib: false });
  const [saving, setSaving] = useState(false);

  const [optFor, setOptFor] = useState<ModifierGroup | null>(null); // grup yang sedang ditambah opsi
  const [oForm, setOForm] = useState({ nama: '', harga: 0 });

  const [toDelGroup, setToDelGroup] = useState<ModifierGroup | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setGroups((await modifierService.listGroups()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreateGroup() { setEditGroup(null); setGForm({ nama: '', tipe: 'SINGLE', wajib: false }); setGroupOpen(true); }
  function openEditGroup(g: ModifierGroup) { setEditGroup(g); setGForm({ nama: g.NAMA, tipe: g.TIPE, wajib: g.WAJIB }); setGroupOpen(true); }

  async function saveGroup() {
    setSaving(true);
    try {
      if (editGroup) await modifierService.updateGroup(editGroup.ID, gForm);
      else await modifierService.createGroup(gForm);
      toast.success('Grup disimpan'); setGroupOpen(false); load();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }
  async function delGroup() {
    if (!toDelGroup) return; setBusy(true);
    try { await modifierService.removeGroup(toDelGroup.ID); toast.success('Grup dihapus'); setToDelGroup(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function addOption() {
    if (!optFor || !oForm.nama.trim()) return; setSaving(true);
    try { await modifierService.addOption(optFor.ID, { nama: oForm.nama.trim(), harga: Number(oForm.harga) || 0 }); setOForm({ nama: '', harga: 0 }); toast.success('Opsi ditambahkan'); await load(); setOptFor((g) => groups.find((x) => x.ID === g?.ID) || g); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  }
  async function delOption(id: number) {
    try { await modifierService.removeOption(id); toast.success('Opsi dihapus'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  // Sinkronkan modal opsi dengan data terbaru.
  const optGroup = optFor ? groups.find((g) => g.ID === optFor.ID) || optFor : null;

  return (
    <div>
      <PageHeader title="Varian / Modifier" description="Grup pilihan produk (ukuran, topping, level gula) untuk coffee shop & F&B."
        action={<Button onClick={openCreateGroup}><Plus className="h-4 w-4" /> Tambah Grup</Button>} />

      {!loading && groups.length === 0 && (
        <Card><CardBody><EmptyState title="Belum ada grup varian" description="Mis. buat grup 'Ukuran' dengan opsi S, M, L." /></CardBody></Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.ID}><CardBody>
            <div className="mb-2 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-bold text-slate-800">{g.NAMA}</span>
                </div>
                <div className="mt-1 flex gap-1.5">
                  <Badge tone="blue">{g.TIPE === 'SINGLE' ? 'Pilih satu' : 'Pilih banyak'}</Badge>
                  {g.WAJIB && <Badge tone="amber">Wajib</Badge>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEditGroup(g)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelGroup(g)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
              </div>
            </div>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {(g.options || []).map((o) => (
                <li key={o.ID} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">{o.NAMA}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">{o.HARGA > 0 ? `+${formatRupiah(o.HARGA)}` : 'Gratis'}</span>
                    <button onClick={() => delOption(o.ID)} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              ))}
              {(g.options || []).length === 0 && <li className="px-3 py-2 text-xs text-slate-400">Belum ada opsi</li>}
            </ul>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { setOForm({ nama: '', harga: 0 }); setOptFor(g); }}><Plus className="h-4 w-4" /> Tambah opsi</Button>
          </CardBody></Card>
        ))}
      </div>

      {/* Modal grup */}
      <Modal open={groupOpen} onClose={() => setGroupOpen(false)} title={editGroup ? 'Edit Grup' : 'Tambah Grup'} size="sm"
        footer={<><Button variant="outline" onClick={() => setGroupOpen(false)} disabled={saving}>Batal</Button><Button onClick={saveGroup} loading={saving}>Simpan</Button></>}>
        <div className="space-y-3">
          <Input label="Nama grup" value={gForm.nama} onChange={(e) => setGForm((f) => ({ ...f, nama: e.target.value }))} placeholder="mis. Ukuran / Topping" />
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Tipe pilihan</label>
            <select value={gForm.tipe} onChange={(e) => setGForm((f) => ({ ...f, tipe: e.target.value as 'SINGLE' | 'MULTI' }))} className="h-11 w-full rounded-xl border border-line bg-white px-3 text-sm">
              <option value="SINGLE">Pilih satu (mis. ukuran)</option>
              <option value="MULTI">Pilih banyak (mis. topping)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={gForm.wajib} onChange={(e) => setGForm((f) => ({ ...f, wajib: e.target.checked }))} /> Wajib dipilih saat jual
          </label>
        </div>
      </Modal>

      {/* Modal tambah opsi */}
      <Modal open={!!optFor} onClose={() => setOptFor(null)} title={`Opsi - ${optGroup?.NAMA ?? ''}`} size="sm">
        <div className="space-y-3">
          <ul className="divide-y divide-line rounded-xl border border-line">
            {(optGroup?.options || []).map((o) => (
              <li key={o.ID} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{o.NAMA}</span>
                <span className="flex items-center gap-2"><span className="text-slate-500">{o.HARGA > 0 ? `+${formatRupiah(o.HARGA)}` : 'Gratis'}</span>
                  <button onClick={() => delOption(o.ID)} className="text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></span>
              </li>
            ))}
            {(optGroup?.options || []).length === 0 && <li className="px-3 py-2 text-xs text-slate-400">Belum ada opsi</li>}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Nama opsi" value={oForm.nama} onChange={(e) => setOForm((f) => ({ ...f, nama: e.target.value }))} placeholder="mis. Large" />
            <Input label="Tambahan harga" type="number" min={0} value={oForm.harga || ''} onChange={(e) => setOForm((f) => ({ ...f, harga: Number(e.target.value) }))} />
          </div>
          <Button onClick={addOption} loading={saving} disabled={!oForm.nama.trim()}><Plus className="h-4 w-4" /> Tambah opsi</Button>
        </div>
      </Modal>

      <ConfirmDialog open={!!toDelGroup} onClose={() => setToDelGroup(null)} onConfirm={delGroup} loading={busy}
        title="Hapus grup" message={`Hapus grup "${toDelGroup?.NAMA}" beserta semua opsinya?`} confirmLabel="Hapus" />
    </div>
  );
}
