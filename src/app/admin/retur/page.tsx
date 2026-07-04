'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle2, Eye, X, FileText, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Badge, SelectMenu, SearchInput, Input, Pagination, type Column,
} from '@/components/ui';
import {
  returService, pembelianService, supplierService, produkService, identitasService, getErrorMessage,
} from '@/services';
import type { Retur, ReturInput } from '@/services/retur.service';
import type { Pembelian } from '@/services/pembelian.service';
import type { Supplier } from '@/services/supplier.service';
import type { Produk } from '@/types';
import type { PaginationMeta } from '@/services/api';
import { formatDate } from '@/utils/format';
import { cetakRetur, type MerchantHeader } from '@/utils/cetakDokumen';
import { usePageLoading } from '@/hooks/usePageLoading';
import { Printer } from 'lucide-react';

const STATUS_LABEL: Record<number, string> = { 0: 'Draft', 1: 'Selesai', 2: 'Dibatalkan' };
const statusTone = (s: number) => (s === 1 ? 'green' : s === 2 ? 'red' : 'amber');
const today = () => new Date().toISOString().slice(0, 10);
const KONDISI = ['Rusak', 'Salah kirim', 'Kedaluwarsa', 'Tidak sesuai', 'Lainnya'];

interface ItemRow { id_produk: number | ''; qty: number | ''; alasan: string; kondisi: string; harga: number | '' }

export default function ReturPage() {
  const [data, setData] = useState<Retur[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [pembelianList, setPembelianList] = useState<Pembelian[]>([]);
  const [produkSearchLoading, setProdukSearchLoading] = useState(false);
  const [pembelianSearchLoading, setPembelianSearchLoading] = useState(false);
  const [merchant, setMerchant] = useState<MerchantHeader>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Retur | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Retur | null>(null);
  const [toFinalize, setToFinalize] = useState<Retur | null>(null);
  const [toCancel, setToCancel] = useState<Retur | null>(null);
  const [toDelete, setToDelete] = useState<Retur | null>(null);
  const [busy, setBusy] = useState(false);

  const [noNota, setNoNota] = useState('');
  const [tanggal, setTanggal] = useState(today());
  const [supplierId, setSupplierId] = useState<string>('');
  const [pembelianId, setPembelianId] = useState<string>('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ id_produk: '', qty: '', alasan: '', kondisi: '', harga: '' }]);

  const mergeProdukOptions = useCallback((rows: Produk[]) => {
    setProduk((prev) => {
      const map = new Map(prev.map((p) => [p.ID, p]));
      rows.forEach((p) => map.set(p.ID, p));
      return Array.from(map.values()).sort((a, b) => a.NAMA.localeCompare(b.NAMA));
    });
  }, []);

  const loadProdukOptions = useCallback(async (q = '') => {
    setProdukSearchLoading(true);
    try {
      const res = await produkService.listPage({ search: q || undefined, page: 1, limit: 50 });
      mergeProdukOptions(res.data || []);
    } catch {
      // Hindari toast berulang selama user mengetik di dropdown.
    } finally {
      setProdukSearchLoading(false);
    }
  }, [mergeProdukOptions]);

  const mergePembelianOptions = useCallback((rows: Pembelian[]) => {
    setPembelianList((prev) => {
      const map = new Map(prev.map((p) => [p.ID, p]));
      rows.forEach((p) => map.set(p.ID, p));
      return Array.from(map.values()).sort((a, b) => b.ID - a.ID);
    });
  }, []);

  const loadPembelianOptions = useCallback(async (q = '') => {
    setPembelianSearchLoading(true);
    try {
      const res = await pembelianService.listPage({ status: 1, search: q || undefined, page: 1, limit: 50 });
      mergePembelianOptions(res.data || []);
    } catch {
      // Dropdown option search tidak perlu toast berulang.
    } finally {
      setPembelianSearchLoading(false);
    }
  }, [mergePembelianOptions]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await returService.listPage({
        search: search || undefined,
        status: status === '' ? undefined : Number(status),
        page,
        limit: 25,
      });
      setData(res.data || []);
      setMeta(res.meta);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status, page]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    supplierService.listPage({ status: 1, limit: 100 }).then((d) => setSuppliers(d.data || [])).catch(() => {});
    loadProdukOptions();
    loadPembelianOptions();
    identitasService.get().then((d) => setMerchant({ nama: d?.NAMA, alamat: d?.ALAMAT, no_telp: d?.NO_TELP, logo_url: d?.LOGO_URL })).catch(() => {});
  }, [loadProdukOptions, loadPembelianOptions]);

  const produkOptions = useMemo(() => produk.map((p) => ({ value: p.ID, label: p.NAMA })), [produk]);
  const supplierOptions = useMemo(() => [{ value: '', label: '— Tanpa supplier —' }, ...suppliers.map((s) => ({ value: String(s.ID), label: s.NAMA }))], [suppliers]);
  const pembelianOptions = useMemo(() => [{ value: '', label: '— Tanpa pembelian asal —' }, ...pembelianList.map((p) => ({ value: String(p.ID), label: `${p.NO_NOTA} (${formatDate(p.TANGGAL)})` }))], [pembelianList]);

  function openCreate() {
    setEditing(null); setNoNota(''); setTanggal(today()); setSupplierId(''); setPembelianId(''); setCatatan('');
    setItems([{ id_produk: '', qty: '', alasan: '', kondisi: '', harga: '' }]); setFormOpen(true);
  }
  function openEdit(r: Retur) {
    setEditing(r); setNoNota(r.NO_NOTA); setTanggal((r.TANGGAL || '').slice(0, 10));
    setSupplierId(r.ID_SUPPLIER ? String(r.ID_SUPPLIER) : ''); setPembelianId(r.ID_PEMBELIAN ? String(r.ID_PEMBELIAN) : '');
    setCatatan(r.CATATAN || '');
    setItems((r.detail || []).map((d) => ({ id_produk: d.ID_PRODUK, qty: d.QTY, alasan: d.ALASAN || '', kondisi: d.KONDISI || '', harga: d.HARGA ?? '' })));
    mergeProdukOptions((r.detail || []).filter((d) => d.produk).map((d) => ({
      ID: d.produk!.ID,
      NAMA: d.produk!.NAMA,
      ID_KATEGORI: 0,
      STOK: d.produk!.STOK ?? 0,
      HARGA_BELI: 0,
      HARGA_JUAL: 0,
      BARCODE: null,
      FOTO: null,
      FOTO_URL: null,
    })));
    if (r.pembelian) mergePembelianOptions([{
      ID: r.pembelian.ID,
      NO_NOTA: r.pembelian.NO_NOTA,
      TANGGAL: r.TANGGAL,
      STATUS: 1,
      ID_SUPPLIER: r.ID_SUPPLIER,
      supplier: r.supplier,
    } as Pembelian]);
    if (!r.detail?.length) setItems([{ id_produk: '', qty: '', alasan: '', kondisi: '', harga: '' }]);
    setFormOpen(true);
  }

  function setItem(i: number, patch: Partial<ItemRow>) { setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it))); }
  function addRow() { setItems((p) => [...p, { id_produk: '', qty: '', alasan: '', kondisi: '', harga: '' }]); }
  function removeRow(i: number) { setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i))); }

  function buildPayload(): ReturInput | null {
    if (!noNota.trim()) { toast.error('Nomor retur wajib diisi'); return null; }
    const clean = items.filter((it) => it.id_produk && Number(it.qty) > 0);
    if (!clean.length) { toast.error('Tambahkan minimal 1 item'); return null; }
    return {
      no_nota: noNota.trim(),
      tanggal,
      id_supplier: supplierId ? Number(supplierId) : null,
      id_pembelian: pembelianId ? Number(pembelianId) : null,
      catatan: catatan || undefined,
      items: clean.map((it) => ({
        id_produk: Number(it.id_produk), qty: Number(it.qty),
        alasan: it.alasan || undefined, kondisi: it.kondisi || undefined,
        harga: it.harga === '' ? null : Number(it.harga),
      })),
    };
  }

  async function saveDraft(thenFinalize = false) {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      let id = editing?.ID;
      if (editing) { await returService.update(editing.ID, payload); }
      else { const res = await returService.create(payload); id = res?.id; }
      if (thenFinalize && id) { await returService.selesaikan(id); toast.success('Retur selesai, stok dikurangi'); }
      else { toast.success('Draft retur disimpan'); }
      setFormOpen(false); setEditing(null); load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function doFinalize() {
    if (!toFinalize) return; setBusy(true);
    try { await returService.selesaikan(toFinalize.ID); toast.success('Retur selesai, stok dikurangi'); setToFinalize(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function doCancel() {
    if (!toCancel) return; setBusy(true);
    try { await returService.batal(toCancel.ID); toast.success('Retur dibatalkan' + (toCancel.STATUS === 1 ? ', stok dikembalikan' : '')); setToCancel(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function doDelete() {
    if (!toDelete) return; setBusy(true);
    try { await returService.remove(toDelete.ID); toast.success('Retur dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  async function openView(r: Retur) {
    try { setViewing(await returService.getById(r.ID)); } catch (err) { toast.error(getErrorMessage(err)); }
  }

  const columns: Column<Retur>[] = [
    { header: 'No. Retur', accessor: (r) => <span className="font-semibold text-slate-800">{r.NO_NOTA}</span> },
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
        {r.STATUS === 1 && (
          <Button variant="ghost" size="sm" onClick={() => setToCancel(r)} title="Batalkan / Void"><Ban className="h-4 w-4 text-red-500" /></Button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Retur Barang" description="Pengembalian barang ke supplier (rusak / salah kirim / dll)"
        action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Buat Retur</Button>} />

      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput className="flex-1" placeholder="Cari nomor retur..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <div className="w-full sm:w-52">
            <SelectMenu label="Status" value={status} onChange={(v) => { setStatus(String(v)); setPage(1); }}
              options={[{ value: '', label: 'Semua status' }, { value: '0', label: 'Draft' }, { value: '1', label: 'Selesai' }, { value: '2', label: 'Dibatalkan' }]} />
          </div>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada retur" showRowNumber startIndex={(page - 1) * 25} />
        <Pagination page={page} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
      </CardBody></Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Retur (Draft)' : 'Buat Retur'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input label="Nomor retur" value={noNota} onChange={(e) => setNoNota(e.target.value)} placeholder="mis. RTR-001" />
            <Input label="Tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            <SelectMenu label="Supplier" value={supplierId} onChange={(v) => setSupplierId(String(v))} options={supplierOptions} searchable />
            <SelectMenu
              label="Pembelian asal (opsional)"
              value={pembelianId}
              onChange={(v) => setPembelianId(String(v))}
              options={pembelianOptions}
              searchable
              onSearchChange={loadPembelianOptions}
              loading={pembelianSearchLoading}
              searchPlaceholder="Cari nomor pembelian..."
            />
            <div className="sm:col-span-2"><Input label="Catatan (opsional)" value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Item Retur</p>
            {items.map((it, i) => (
              <div key={i} className="rounded-xl border border-line p-3">
                <div className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-12 sm:col-span-6">
                    <SelectMenu
                      label="Produk"
                      value={it.id_produk === '' ? '' : it.id_produk}
                      onChange={(v) => setItem(i, { id_produk: Number(v) })}
                      options={produkOptions}
                      searchable
                      onSearchChange={loadProdukOptions}
                      loading={produkSearchLoading}
                      searchPlaceholder="Cari produk..."
                      placeholder="Pilih produk"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <Input label="Qty retur" type="number" min={0} value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value === '' ? '' : Number(e.target.value) })} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Input label="Nilai/harga" type="number" min={0} value={it.harga} onChange={(e) => setItem(i, { harga: e.target.value === '' ? '' : Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button variant="ghost" size="sm" onClick={() => removeRow(i)} title="Hapus baris"><X className="h-4 w-4 text-red-500" /></Button>
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <SelectMenu label="Kondisi barang" value={it.kondisi} onChange={(v) => setItem(i, { kondisi: String(v) })} options={[{ value: '', label: '— Pilih —' }, ...KONDISI.map((k) => ({ value: k, label: k }))]} />
                  </div>
                  <div className="col-span-12 sm:col-span-6">
                    <Input label="Alasan retur" value={it.alasan} onChange={(e) => setItem(i, { alasan: e.target.value })} placeholder="mis. kemasan rusak" />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-4 w-4" /> Tambah item</Button>
          </div>

          <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Stok TIDAK berubah saat draft. Stok baru berkurang ketika retur diselesaikan. Pembatalan retur selesai akan mengembalikan stok.
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button>
            <Button variant="outline" onClick={() => saveDraft(false)} loading={saving}>Simpan Draft</Button>
            <Button onClick={() => saveDraft(true)} loading={saving}><CheckCircle2 className="h-4 w-4" /> Selesaikan Retur</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Retur ${viewing?.NO_NOTA ?? ''}`} size="md">
        {viewing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Tanggal</p><p className="text-right font-medium">{formatDate(viewing.TANGGAL)}</p>
              <p className="text-slate-500">Supplier</p><p className="text-right font-medium">{viewing.supplier?.NAMA || '-'}</p>
              <p className="text-slate-500">Pembelian asal</p><p className="text-right font-medium">{viewing.pembelian?.NO_NOTA || '-'}</p>
              <p className="text-slate-500">Status</p><p className="text-right font-medium">{STATUS_LABEL[viewing.STATUS]}</p>
            </div>
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-canvas text-xs text-slate-500"><tr><th className="px-3 py-2 text-left">Produk</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-left">Kondisi</th><th className="px-3 py-2 text-left">Alasan</th></tr></thead>
                <tbody>
                  {(viewing.detail || []).map((d) => (
                    <tr key={d.ID} className="border-t border-line">
                      <td className="px-3 py-2">{d.produk?.NAMA || d.ID_PRODUK}</td>
                      <td className="px-3 py-2 text-right">{d.QTY}</td>
                      <td className="px-3 py-2">{d.KONDISI || '-'}</td>
                      <td className="px-3 py-2">{d.ALASAN || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => cetakRetur(viewing, merchant)}><Printer className="h-4 w-4" /> Cetak</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toFinalize} onClose={() => setToFinalize(null)} onConfirm={doFinalize} loading={busy} danger={false}
        title="Selesaikan retur" message={`Selesaikan "${toFinalize?.NO_NOTA}"? Stok akan dikurangi sesuai item. Dokumen akan dikunci.`} confirmLabel="Selesaikan" />
      <ConfirmDialog open={!!toCancel} onClose={() => setToCancel(null)} onConfirm={doCancel} loading={busy}
        title="Batalkan / Void retur" message={`Batalkan "${toCancel?.NO_NOTA}"? Stok yang sebelumnya dikurangi akan dikembalikan.`} confirmLabel="Batalkan" />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={busy}
        title="Hapus retur" message={`Hapus draft "${toDelete?.NO_NOTA}"?`} confirmLabel="Hapus" />
    </div>
  );
}
