'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, FilterDate, ConfirmDialog, Badge, Select, type Column } from '@/components/ui';
import { penjualanService, getErrorMessage } from '@/services';
import type { Penjualan } from '@/types';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function TransaksiPage() {
  const [data, setData] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const [status, setStatus] = useState<'1' | '0'>('1');
  const [toVoid, setToVoid] = useState<Penjualan | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await penjualanService.list({ tanggal_awal: awal, tanggal_akhir: akhir, status: Number(status) as 0 | 1 })) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [awal, akhir, status]);
  useEffect(() => { load(); }, [load]);

  async function handleVoid() {
    if (!toVoid) return; setBusy(true);
    try { await penjualanService.void(toVoid.ID); toast.success('Transaksi dibatalkan'); setToVoid(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }

  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">#{String(r.ID).padStart(6, '0')}</span> },
    { header: 'Tanggal', accessor: (r) => formatDate(r.TANGGAL) },
    { header: 'Kasir', accessor: (r) => r.kasir?.NAMA ?? '-' },
    { header: 'Bayar', accessor: (r) => r.jenisBayar?.NAMA ?? '-' },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS === 1 ? 'green' : 'red'}>{r.STATUS === 1 ? 'Sah' : 'Batal'}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Link href={`/admin/transaksi/${r.ID}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
        {r.STATUS === 1 && <Button variant="ghost" size="sm" onClick={() => setToVoid(r)}><Ban className="h-4 w-4 text-red-500" /></Button>}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Data Transaksi" description="Riwayat seluruh penjualan Zona Kasir" />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate awal={awal} akhir={akhir} onAwal={setAwal} onAkhir={setAkhir} />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as '1' | '0')}
            options={[{ value: '1', label: 'Sah' }, { value: '0', label: 'Batal' }]} />
          <Button onClick={load}>Terapkan</Button>
        </div>
      </CardBody></Card>
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Tidak ada transaksi pada periode ini" showRowNumber /></CardBody></Card>

      <ConfirmDialog open={!!toVoid} onClose={() => setToVoid(null)} onConfirm={handleVoid} loading={busy}
        title="Batalkan transaksi" message={`Batalkan nota #${toVoid ? String(toVoid.ID).padStart(6, '0') : ''}? Stok akan dikembalikan.`} confirmLabel="Batalkan" />
    </div>
  );
}