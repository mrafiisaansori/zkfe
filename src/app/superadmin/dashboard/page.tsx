'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Store, CheckCircle2, Ban, Clock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/layout/StatCard';
import { Card, CardBody, Button, DataTable, Badge, type Column } from '@/components/ui';
import { merchantService, getErrorMessage } from '@/services';
import type { Merchant, MerchantStats } from '@/types';
import { formatDate } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

const statusTone = (s: string) => (s === 'active' ? 'green' : s === 'suspended' ? 'red' : 'amber');
const statusLabel = (s: string) => (s === 'active' ? 'Aktif' : s === 'suspended' ? 'Ditangguhkan' : 'Pending');

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [recent, setRecent] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([merchantService.stats(), merchantService.list()]);
      setStats(s);
      setRecent((list || []).slice(0, 8));
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const columns: Column<Merchant>[] = [
    { header: 'Toko', accessor: (r) => <span className="font-medium text-slate-800">{r.NAMA}</span> },
    { header: 'Pemilik', accessor: (r) => r.OWNER_NAME ?? '-' },
    { header: 'Daftar', accessor: (r) => (r.CREATED_AT ? formatDate(r.CREATED_AT) : '-') },
    { header: 'Status', accessor: (r) => <Badge tone={statusTone(r.STATUS)}>{statusLabel(r.STATUS)}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Dashboard Super Admin" description="Ringkasan seluruh merchant" />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total merchant" value={stats?.total ?? 0} icon={Store} tone="brand" />
        <StatCard label="Aktif" value={stats?.active ?? 0} icon={CheckCircle2} tone="green" />
        <StatCard label="Ditangguhkan" value={stats?.suspended ?? 0} icon={Ban} tone="red" />
        <StatCard label="Pending" value={stats?.pending ?? 0} icon={Clock} tone="amber" />
      </div>

      <Card><CardBody>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Merchant terbaru</h3>
          <Link href="/superadmin/merchant"><Button variant="ghost" size="sm">Lihat semua <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <DataTable columns={columns} data={recent} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada merchant" />
      </CardBody></Card>
    </div>
  );
}
