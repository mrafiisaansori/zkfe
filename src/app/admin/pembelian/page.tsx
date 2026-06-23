'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle2, Eye, Printer, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, SelectMenu, SearchInput, Input, type Column,
} from '@/components/ui';
import {
  pembelianService, supplierService, produkService, identitasService, getErrorMessage,
} from '@/services';
import type { Pembelian, PembelianInput } from '@/services/pembelian.service';
import type { Supplier } from '@/services/supplier.service';
import type { Produk } from '@/types';
import { formatRupiah, formatDate } from '@/utils/format';
import { cetakPembelian, type MerchantHeader } from '@/utils/cetakDokumen';
import { usePageLoading } from '@/hooks/usePageLoading';

const STATUS_LABEL: Record<number, string> = { 0: 'Draft', 1: 'Selesai', 2: 'Dibatalkan' };
const statusTone = (s: number) => (s === 1 ? 'green' : s === 2 ? 'red' : 'amber');
const today = () => new Date().toISOString().slice(0, 10);

interface ItemRow { id_produk: number | ''; harga_beli: number | ''; qty: number | '' }

export default function PembelianPage() {
  const [data, setData] = useState<Pembelian[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [merchant, setMerchant] = useState<MerchantHeader>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pembelian | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Pembelian | null>(null);
  const [toFinalize, setToFinalize] = useState<Pembelian | null>(null);
  const [toDelete, setToDelete] = useState<Pembelian | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state
  const [noNota, setNoNota] = useState('');
  const [tanggal, setTanggal] = useState(today());
  const [supplierId, setSupplierId] = useState<string>('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ id_produk: '', harga_beli: '', qty: '' }]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData((await pembelianService.list({ search: search || undefined, status: status === '' ? undefined : Number(status) })) || []);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    supplierService.list({ status: 1 }).then((d) => setSuppliers(d || [])).catch(() => {});
    produkService.list().then((d) => setProduk(d || [])).catch(() => {});
    identitasService.get().then((d) => setMerchant({ nama: d?.NAMA, alamat: d?.ALAMAT, no_telp: d?.NO_TELP, logo_url: d?.LOGO_URL })).catch(() => {});
  }, []);

  const produkOptions = useMemo(() => produk.map((p) => ({ value: p.ID, label: p.NAMA })), [produk]);
  const supplierOptions = useMemo(() => [{ value: '', label: '— Tanpa supplier —' }, ...suppliers.map((s) => ({ value: String(s.ID), label: s.NAMA }))], [suppliers]);

  function openCreate() {
    setEditing(null); setNoNota(''); setTanggal(today()); setSupplierId(''); setCatatan('');
    setItems([{ id_produk: '', harga_beli: '', qty: '' }]); setFormOpen(true);
  }
  function openEdit(p: Pembelian) {
    setEditing(p); setNoNota(p.NO_NOTA); setTanggal((p.TANGGAL || '').slice(0, 10));
    setSupplierId(p.ID_SUPPLIER ? String(p.ID_SUPPLIER) : ''); setCatatan(p.CATATAN || '');
    setItems((p.detail || []).map((d) => ({ id_produk: d.ID_PRODUK, harga_beli: d.HARGA_BELI, qty: d.QTY })));
    if (!p.detail?.length) setItems([{ id_produk: '', harga_beli: '', qty: '' }]);
    setFormOpen(true);
  }

  const total = useMemo(() => items.reduce((s, it) => s + (Number(it.harga_beli) || 0) * (Number(it.qty) || 0), 0), [items]);

  function setItem(i: number, patch: Partial<ItemRow>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addRow() { setItems((p) => [...p, { id_produk: '', harga_beli: '', qty: '' }]); }
  function removeRow(i: number) { setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i))); }

  function buildPayload(): PembelianInput | null {
    if (!noNota.trim()) { toast.error('Nomor nota wajib diisi'); return null; }
    const clean = items.filter((it) => it.id_produk && Number(it.qty) > 0);
    if (!clean.length) { toast.error('Tambahkan minimal 1 item produk'); return null; }
    return {
      no_nota: noNota.trim(),
      tanggal,
      id_supplier: supplierId ? Number(supplierId) : null,
      catatan: catatan || undefined,
      items: clean.map((it) => ({ id_produk: Number(it.id_produk), harga_beli: Number(it.harga_beli) || 0, qty: Number(it.qty) })),
    };
  }

  async function saveDraft(thenFinalize = false) {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      let id = editing?.ID;
      if (editing) { await pembelianService.update(editing.ID, payload); }
      else { const res = await pembelianService.create(payload); id = res?.id; }
      if (thenFinalize && id) {
        await pembelianService.selesaikan(id);
        toast.success('Pembelian selesai, stok & harga beli diperbarui');
      } else {
        toast.success('Draft pembelian disimpan');
      }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function doFinalize() {
    if (!toFinalize) return; setBusy(true);
    try { await pembelianService.selesaikan(toFinalize.ID); toast.success('Pembelian selesai, stok diperbarui'); setToFinalize(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function doDelete() {
    if (!toDelete) return; setBusy(true);
    try { await pembelianService.remove(toDelete.ID); toast.success('Pembelian dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  async function openView(p: Pembelian) {
    try { setViewing(await pembelianService.getById(p.ID)); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  const columns: Column<Pembelian>[] = [
    { header: 'No. Nota', accessor: (r) => <span className="font-semibold text-slate-800">{r.NO_NOTA}</span> },
    { header: 'Tanggal', accessor: (r) => (r.TANGGAL ? formatDate(r.TANGGAL) : '-') },
    { header: 'Supplier', accessor: (r) => r.supplier?.NAMA || '-' },
    { header: 'Status', accessor: (r) => <Badge tone={statusTone(r.STATUS)}>{STATUS_LABEL[r.STATUS]}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => openView(r)} title="Lihat"><Eye className="h-4 w-4" /></Button>
        {r.STATUS === 0 && (
          <>
            <Button variant="ghost" size="sm" onClick={() => openEdit(r)} title="Edit"><FileText className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setToFinalize(r)} title="Selesaikan"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setToDelete(r)} title="Hapus"><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Pembelian" description="Catat barang masuk / restok dari supplier"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Buat Pembelian</Button>} />

      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput className="flex-1" placeholder="Cari nomor nota..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="w-full sm:w-52">
            <SelectMenu label="Status" value={status} onChange={(v) => setStatus(String(v))}
              options={[{ value: '', label: 'Semua status' }, { value: '0', label: 'Draft' }, { value: '1', label: 'Selesai' }, { value: '2', label: 'Dibatalkan' }]} />
          </div>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada pembelian" showRowNumber />
      </CardBody></Card>

      {/* Form draft */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Pembelian (Draft)' : 'Buat Pembelian'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Nomor nota/invoice" value={noNota} onChange={(e) => setNoNota(e.target.value)} placeholder="mis. INV-001" />
            <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            <SelectMenu label="Supplier" value={supplierId} onChange={(v) => setSupplierId(String(v))} options={supplierOptions} searchable />
            <Input label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Item Pembelian</p>
            {/* Header kolom (desktop) */}
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-semibold text-slate-400 sm:grid">
              <div className="col-span-5">Produk</div>
              <div className="col-span-2">Harga beli</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2 text-right">Subtotal</div>
              <div className="col-span-1" />
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-xl border border-line p-2 sm:border-0 sm:p-0">
                <div className="col-span-12 sm:col-span-5">
                  <SelectMenu value={it.id_produk === '' ? '' : it.id_produk} onChange={(v) => setItem(i, { id_produk: Number(v) })} options={produkOptions} searchable placeholder="Pilih produk" />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Input type="number" min={0} placeholder="Harga" value={it.harga_beli} onChange={(e) => setItem(i, { harga_beli: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <Input type="number" min={0} placeholder="Qty" value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value === '' ? '' : Number(e.target.value) })} />
                </div>
                <div className="col-span-10 sm:col-span-2">
                  <p className="truncate text-right text-sm font-semibold text-slate-700">{formatRupiah((Number(it.harga_beli) || 0) * (Number(it.qty) || 0))}</p>
                </div>
                <div className="col-span-2 flex justify-end sm:col-span-1">
                  <Button variant="ghost" size="sm" onClick={() => removeRow(i)} title="Hapus baris"><X className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4" /> Tambah item</Button>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-sm text-slate-500">Total Pembelian</span>
            <span className="text-lg font-black text-primary">{formatRupiah(total)}</span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button>
            <Button variant="outline" onClick={() => saveDraft(false)} loading={saving}>Simpan Draft</Button>
            <Button onClick={() => saveDraft(true)} loading={saving}><CheckCircle2 className="h-4 w-4" /> Selesaikan &amp; Tambah Stok</Button>
          </div>
        </div>
      </Modal>

      {/* Detail / cetak */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Pembelian ${viewing?.NO_NOTA ?? ''}`} size="md">
        {viewing && <DetailView p={viewing} merchant={merchant} />}
      </Modal>

      <ConfirmDialog open={!!toFinalize} onClose={() => setToFinalize(null)} onConfirm={doFinalize} loading={busy} danger={false}
        title="Selesaikan pembelian" message={`Selesaikan "${toFinalize?.NO_NOTA}"? Stok akan ditambah & harga beli diperbarui. Tindakan ini mengunci dokumen.`} confirmLabel="Selesaikan" />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={busy}
        title="Hapus pembelian" message={`Hapus draft "${toDelete?.NO_NOTA}"?`} confirmLabel="Hapus" />
    </div>
  );
}

function DetailView({ p, merchant }: { p: Pembelian; merchant: MerchantHeader }) {
  const total = (p.detail || []).reduce((s, d) => s + d.HARGA_BELI * d.QTY, 0);
  const cetak = () => cetakPembelian(p, merchant);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <p className="text-slate-500">Tanggal</p><p className="text-right font-medium">{formatDate(p.TANGGAL)}</p>
        <p className="text-slate-500">Supplier</p><p className="text-right font-medium">{p.supplier?.NAMA || '-'}</p>
        <p className="text-slate-500">Status</p><p className="text-right font-medium">{STATUS_LABEL[p.STATUS]}</p>
        {p.CATATAN && (<><p className="text-slate-500">Catatan</p><p className="text-right">{p.CATATAN}</p></>)}
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-xs text-slate-500"><tr><th className="px-3 py-2 text-left">Produk</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Harga</th><th className="px-3 py-2 text-right">Subtotal</th></tr></thead>
          <tbody>
            {(p.detail || []).map((d) => (
              <tr key={d.ID} className="border-t border-line">
                <td className="px-3 py-2">{d.produk?.NAMA || d.ID_PRODUK}</td>
                <td className="px-3 py-2 text-right">{d.QTY}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(d.HARGA_BELI)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatRupiah(d.HARGA_BELI * d.QTY)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-lg font-black text-primary">{formatRupiah(total)}</span>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" onClick={cetak}><Printer className="h-4 w-4" /> Cetak</Button>
      </div>
    </div>
  );
}
