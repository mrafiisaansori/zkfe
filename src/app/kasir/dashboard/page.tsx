'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Wallet, Receipt, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, Button, DataTable, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { laporanService, getErrorMessage } from '@/services';
import type { Penjualan } from '@/types';
import { formatRupiah, formatDate, todayISO } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function KasirDashboard() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Penjualan[]>([]);
  const [total, setTotal] = useState(0);
  const [jumlah, setJumlah] = useState(0);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await laporanService.penjualanPage(todayISO(), todayISO(), user.id, 1, 1, 8);
      setData(res.data?.data || []);
      setTotal(res.data?.total_dibayar || 0);
      setJumlah(res.data?.jumlah_transaksi || 0);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Penjualan>[] = [
    { header: 'Nota', accessor: (r) => <span className="font-mono">#{String(r.ID).padStart(6, '0')}</span> },
    { header: 'Waktu', accessor: (r) => r.JAM },
    { header: 'Total', accessor: (r) => <span className="font-semibold">{formatRupiah(r.TOTAL)}</span> },
  ];

  return (
    <div>
      <PageHeader title={`Halo, ${user?.nama ?? 'Kasir'}`} description={`Ringkasan kasir Zona Kasir hari ini (${formatDate(todayISO())})`}
        action={<Link href="/kasir/pos"><Button><ShoppingCart className="h-4 w-4" /> Mulai Transaksi</Button></Link>} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Penjualan hari ini" value={formatRupiah(total)} icon={Wallet} tone="green" />
        <StatCard label="Transaksi hari ini" value={jumlah} icon={Receipt} tone="brand" />
      </div>

      <Card className="mt-5"><CardBody>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Transaksi terbaru</h3>
          <Link href="/kasir/riwayat" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">Lihat semua <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada transaksi hari ini" />
      </CardBody></Card>
    </div>
  );
}
 
