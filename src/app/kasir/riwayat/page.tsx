'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, ReceiptText, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, FilterDate, Badge, SelectMenu, Pagination, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { laporanService, jenisBayarService, getErrorMessage } from '@/services';
import type { Penjualan, JenisBayar } from '@/types';
import type { PaginationMeta } from '@/services/api';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function RiwayatKasirPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Penjualan[]>([]);
  const [jenisBayar, setJenisBayar] = useState<JenisBayar[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [awal, setAwal] = useState(todayISO());
  const [akhir, setAkhir] = useState(todayISO());
  const [metode, setMetode] = useState<number>(0); // 0 = semua metode
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | undefined>();
  const [rekap, setRekap] = useState({ jumlah: 0, total: 0 });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await laporanService.penjualanPage(awal, akhir, user.id, 1, page, 25, metode || undefined);
      setData(res.data?.data || []);
      setMeta(res.meta);
      setRekap({
        jumlah: res.data?.jumlah_transaksi || 0,
        total: res.data?.total_dibayar || 0,
      });
    }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [user, awal, akhir, metode, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { jenisBayarService.list().then((j) => setJenisBayar(j || [])).catch(() => {}); }, []);

  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">#{String(r.ID).padStart(6, '0')}</span> },
    { header: 'Tanggal', accessor: (r) => formatDate(r.TANGGAL) },
    { header: 'Jam', accessor: (r) => r.JAM },
    { header: 'Metode', accessor: (r) => <Badge tone="blue">{r.jenisBayar?.NAMA ?? '-'}</Badge> },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={r.STATUS === 1 ? 'green' : 'red'}>{r.STATUS === 1 ? 'Sah' : 'Batal'}</Badge> },
    { header: 'Aksi', accessor: (r) => <Link href={`/kasir/riwayat/${r.ID}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link> },
  ];

  return (
    <div>
      <PageHeader title="Riwayat Transaksi" description="Transaksi yang Anda proses" />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FilterDate
            awal={awal}
            akhir={akhir}
            onAwal={(v) => { setAwal(v); setPage(1); }}
            onAkhir={(v) => { setAkhir(v); setPage(1); }}
          />
          <div className="w-full sm:w-52">
            <SelectMenu
              label="Metode bayar"
              value={metode}
              onChange={(v) => { setMetode(Number(v)); setPage(1); }}
              options={[{ value: 0, label: 'Semua metode' }, ...jenisBayar.map((j) => ({ value: j.ID, label: j.NAMA }))]}
            />
          </div>
          <Button onClick={() => (page === 1 ? load() : setPage(1))}>Terapkan</Button>
        </div>
      </CardBody></Card>

      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada transaksi" showRowNumber startIndex={(page - 1) * 25} />
        <Pagination page={page} totalPages={meta?.total_pages ?? 1} onChange={setPage} />
      </CardBody></Card>

      {/* Rekap total untuk memudahkan kasir merekap penjualan */}
      {!loading && rekap.jumlah > 0 && (
        <Card className="mt-4"><CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-600"><ReceiptText className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-slate-500">Jumlah transaksi</p>
                <p className="text-lg font-semibold text-slate-800">{rekap.jumlah}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-600"><Wallet className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-slate-500">Total penjualan</p>
                <p className="text-lg font-semibold text-emerald-700">{formatRupiah(rekap.total)}</p>
              </div>
            </div>
          </div>
        </CardBody></Card>
      )}
    </div>
  );
}
