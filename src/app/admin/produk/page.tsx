'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, History, Barcode, Upload, Download, FileSpreadsheet, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, SearchInput, DataTable, Modal, ConfirmDialog, Badge, ProductImage, type Column,
} from '@/components/ui';
import { ProdukForm } from '@/components/forms/ProdukForm';
import { produkService, kategoriService, modifierService, getErrorMessage } from '@/services';
import type { ProdukInput, ImportResult } from '@/services/produk.service';
import type { Produk, Kategori, RekamStok, ModifierGroup } from '@/types';
import { formatRupiah, formatDateTime } from '@/utils/format';
import { productImage } from '@/utils/image';
import { printBarcodeLabel } from '@/utils/printBarcodeLabel';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function ProdukPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Produk | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Produk | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState<{ produk: Produk; rows: RekamStok[] } | null>(null);

  // ===== Import massal =====
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  function resetImport() { setImportFile(null); setPreview(null); setImportResult(null); }

  // ===== Varian/modifier per produk =====
  const [varianFor, setVarianFor] = useState<Produk | null>(null);
  const [allGroups, setAllGroups] = useState<ModifierGroup[]>([]);
  const [selGroups, setSelGroups] = useState<number[]>([]);
  const [savingVarian, setSavingVarian] = useState(false);

  async function openVarian(p: Produk) {
    setVarianFor(p); setSelGroups([]);
    try {
      const [all, cur] = await Promise.all([
        allGroups.length ? Promise.resolve(allGroups) : modifierService.listGroups(),
        modifierService.getForProduct(p.ID),
      ]);
      setAllGroups(all);
      setSelGroups((cur || []).map((g) => g.ID));
    } catch (err) { toast.error(getErrorMessage(err)); }
  }
  async function saveVarian() {
    if (!varianFor) return; setSavingVarian(true);
    try { await modifierService.setProductGroups(varianFor.ID, selGroups); toast.success('Varian produk disimpan'); setVarianFor(null); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSavingVarian(false); }
  }

  async function doPreview() {
    if (!importFile) return; setImporting(true);
    try { setPreview(await produkService.import(importFile, true)); setImportResult(null); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setImporting(false); }
  }
  async function doImport() {
    if (!importFile) return; setImporting(true);
    try {
      const res = await produkService.import(importFile, false);
      setImportResult(res); setPreview(null);
      toast.success(`Import selesai: ${res.sukses} sukses, ${res.gagal} gagal`);
      load(search);
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setImporting(false); }
  }

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const [p, k] = await Promise.all([produkService.list(q), kategori.length ? Promise.resolve(kategori) : kategoriService.list()]);
      setProduk(p); setKategori(k);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstSearch = useRef(true);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // Lewati render pertama agar tidak dobel dengan initial load di atas.
    if (firstSearch.current) { firstSearch.current = false; return; }
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleSubmit(data: ProdukInput, file: File | null) {
    setSaving(true);
    try {
      if (editing) { await produkService.update(editing.ID, data, file); toast.success('Produk diperbarui'); }
      else { await produkService.create(data, file); toast.success('Produk ditambahkan'); }
      setFormOpen(false); setEditing(null); load(search);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try { await produkService.remove(toDelete.ID); toast.success('Produk dihapus'); setToDelete(null); load(search); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setDeleting(false); }
  }

  async function openHistory(p: Produk) {
    try { const rows = await produkService.stockHistory(p.ID); setHistory({ produk: p, rows: rows || [] }); }
    catch (err) { toast.error(getErrorMessage(err)); }
  }

  const columns: Column<Produk>[] = [
    {
      header: '',
      className: 'w-14',
      accessor: (r) => (
        <ProductImage src={productImage(r)} alt={r.NAMA} className="h-12 w-12 rounded-2xl border border-slate-200" />
      ),
    },
    { header: 'Nama', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Kategori', accessor: (r) => r.kategori?.DESKRIPSI ?? '-' },
    { header: 'Harga jual', accessor: (r) => formatRupiah(r.HARGA_JUAL) },
    { header: 'Stok', accessor: (r) => <Badge tone={r.STOK <= 0 ? 'red' : r.STOK <= 10 ? 'amber' : 'green'}>{r.STOK}</Badge> },
    { header: 'Barcode', accessor: (r) => r.BARCODE || '-' },
    {
      header: 'Aksi',
      accessor: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" title="Cetak label barcode"
            onClick={() => printBarcodeLabel([{ nama: r.NAMA, harga: r.HARGA_JUAL, barcode: r.BARCODE || '' }], 1)}>
            <Barcode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Varian/modifier" onClick={() => openVarian(r)}><Layers className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => openHistory(r)}><History className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Produk" description="Master data produk, harga, stok, foto, dan barcode Zona Kasir"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetImport(); setImportOpen(true); }}><Upload className="h-4 w-4" /> Import</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" /> Tambah</Button>
          </div>
        } />
      <Card>
        <CardBody>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-sm flex-1"><SearchInput placeholder="Cari produk, barcode, kategori..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Badge tone="blue">{produk.length} produk</Badge>
          </div>
          <DataTable columns={columns} data={produk} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada produk" showRowNumber />
        </CardBody>
      </Card>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} title={editing ? 'Edit Produk' : 'Tambah Produk'}>
        <ProdukForm kategori={kategori} initial={editing} loading={saving} onSubmit={handleSubmit} onCancel={() => { setFormOpen(false); setEditing(null); }} />
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={deleting}
        title="Hapus produk" message={`Hapus "${toDelete?.NAMA}"? Tindakan ini tidak bisa dibatalkan.`} confirmLabel="Hapus" />

      <Modal open={!!history} onClose={() => setHistory(null)} title={`Riwayat stok - ${history?.produk.NAMA ?? ''}`}>
        {history && (history.rows.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Belum ada riwayat</p> : (
          <ul className="divide-y divide-slate-100">
            {history.rows.map((r) => (
              <li key={r.ID} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <Badge tone={r.JENIS === 1 ? 'green' : 'red'}>{r.JENIS === 1 ? `+${r.QTY}` : `-${r.QTY}`}</Badge>
                  <span className="ml-2 text-slate-600">{r.KETERANGAN}</span>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(r.TANGGAL)}</span>
              </li>
            ))}
          </ul>
        ))}
      </Modal>

      {/* Assign varian/modifier ke produk */}
      <Modal open={!!varianFor} onClose={() => setVarianFor(null)} title={`Varian - ${varianFor?.NAMA ?? ''}`} size="sm"
        footer={<><Button variant="outline" onClick={() => setVarianFor(null)} disabled={savingVarian}>Batal</Button><Button onClick={saveVarian} loading={savingVarian}>Simpan</Button></>}>
        {allGroups.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">Belum ada grup varian. Buat dulu di menu <b>Varian</b>.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Pilih grup varian yang berlaku untuk produk ini.</p>
            {allGroups.map((g) => {
              const checked = selGroups.includes(g.ID);
              return (
                <label key={g.ID} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setSelGroups((s) => (e.target.checked ? [...s, g.ID] : s.filter((x) => x !== g.ID)))}
                  />
                  <span className="font-semibold text-slate-700">{g.NAMA}</span>
                  <span className="text-xs text-slate-400">({(g.options || []).length} opsi)</span>
                </label>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Import produk massal */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Produk dari Excel/CSV" size="lg">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
            <p className="text-sm text-slate-600">Unduh template, isi data produk, lalu unggah kembali.</p>
            <Button variant="outline" size="sm" onClick={() => produkService.downloadImportTemplate()}>
              <Download className="h-4 w-4" /> Template Excel
            </Button>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-white px-4 py-6 text-center">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold text-primary">{importFile ? importFile.name : 'Pilih file .xlsx / .csv'}</span>
            <span className="text-xs text-slate-400">Kolom: Nama Produk, SKU/Barcode, Kategori, Harga Jual, Harga Modal, Stok Awal</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { setImportFile(e.target.files?.[0] || null); setPreview(null); setImportResult(null); }} />
          </label>

          {(preview || importResult) && (
            <div className="rounded-xl border border-line">
              <div className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5 text-sm">
                <span className="font-semibold">Total: {(preview || importResult)!.total}</span>
                <Badge tone="green">{(preview || importResult)!.sukses} {importResult ? 'sukses' : 'siap'}</Badge>
                <Badge tone="red">{(preview || importResult)!.gagal} gagal</Badge>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-2">Baris</th><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Keterangan</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {(preview || importResult)!.rows.map((r) => (
                      <tr key={r.row}>
                        <td className="px-4 py-2 text-slate-500">{r.row}</td>
                        <td className="px-4 py-2 text-slate-700">{r.nama || '-'}</td>
                        <td className="px-4 py-2"><Badge tone={r.status === 'gagal' ? 'red' : 'green'}>{r.status}</Badge></td>
                        <td className="px-4 py-2 text-slate-500">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>Tutup</Button>
            {!importResult && <Button variant="outline" onClick={doPreview} loading={importing} disabled={!importFile}>Pratinjau</Button>}
            {!importResult && <Button onClick={doImport} loading={importing} disabled={!importFile || (preview ? preview.sukses === 0 : false)}>Import Sekarang</Button>}
          </div>
        </div>
      </Modal>
    </div>
  );
}