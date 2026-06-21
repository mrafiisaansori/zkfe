'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PackagePlus, PackageMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Card, CardBody, Button, SearchInput, DataTable, Modal, Input, Select, Badge, type Column,
} from '@/components/ui';
import { produkService, getErrorMessage } from '@/services';
import type { Produk } from '@/types';
import { formatRupiah } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function StokPage() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<Produk | null>(null);
  const [jenis, setJenis] = useState<1 | 2>(1);
  const [qty, setQty] = useState<number>(0);
  const [ket, setKet] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try { setProduk((await produkService.list(q)) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  const firstSearch = useRef(true);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // Lewati render pertama agar tidak dobel dengan initial load di atas.
    if (firstSearch.current) { firstSearch.current = false; return; }
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
  }, [search, load]);

  async function submit() {
    if (!target || qty <= 0) { toast.error('Qty harus lebih dari 0'); return; }
    setSaving(true);
    try {
      await produkService.adjustStock(target.ID, jenis, qty, ket);
      toast.success('Stok diperbarui');
      setTarget(null); setQty(0); setKet(''); setJenis(1); load(search);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  const columns: Column<Produk>[] = [
    { header: 'Produk', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Kategori', accessor: (r) => r.kategori?.DESKRIPSI ?? '-' },
    { header: 'Stok', accessor: (r) => <Badge tone={r.STOK <= 0 ? 'red' : r.STOK <= 10 ? 'amber' : 'green'}>{r.STOK}</Badge> },
    { header: 'Harga jual', accessor: (r) => formatRupiah(r.HARGA_JUAL) },
    { header: 'Aksi', accessor: (r) => (
      <Button variant="outline" size="sm" onClick={() => setTarget(r)}>Sesuaikan</Button>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Manajemen Stok" description="Penyesuaian stok masuk/keluar untuk menjaga kesiapan kasir" />
      <Card><CardBody>
        <div className="mb-4 max-w-sm"><SearchInput placeholder="Cari produk untuk penyesuaian stok..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <DataTable columns={columns} data={produk} loading={loading} rowKey={(r) => r.ID} showRowNumber />
      </CardBody></Card>

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Sesuaikan stok - ${target?.NAMA ?? ''}`} size="sm"
        footer={<>
          <Button variant="outline" onClick={() => setTarget(null)} disabled={saving}>Batal</Button>
          <Button onClick={submit} loading={saving}>Simpan</Button>
        </>}>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Stok saat ini: <b>{target?.STOK}</b></p>
          <Select label="Jenis" value={jenis} onChange={(e) => setJenis(Number(e.target.value) as 1 | 2)}
            options={[{ value: 1, label: 'Tambah stok (masuk)' }, { value: 2, label: 'Kurangi stok (keluar)' }]} />
          <Input label="Jumlah" type="number" min={1} value={qty || ''} onChange={(e) => setQty(Number(e.target.value))} />
          <Input label="Keterangan" value={ket} onChange={(e) => setKet(e.target.value)} placeholder="mis. stok opname" />
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm">
            {jenis === 1 ? <PackagePlus className="h-4 w-4 text-green-600" /> : <PackageMinus className="h-4 w-4 text-red-600" />}
            Stok akhir: <b>{(target?.STOK ?? 0) + (jenis === 1 ? qty : -qty)}</b>
          </div>
        </div>
      </Modal>
    </div>
  );
}