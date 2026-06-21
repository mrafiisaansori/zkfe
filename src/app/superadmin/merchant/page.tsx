'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Ban, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Badge, SelectMenu, SearchInput, type Column } from '@/components/ui';
import { merchantService, getErrorMessage } from '@/services';
import type { Merchant } from '@/types';
import { formatDate } from '@/utils/format';
import { usePageLoading } from '@/hooks/usePageLoading';

const statusTone = (s: string) => (s === 'active' ? 'green' : s === 'suspended' ? 'red' : 'amber');
const statusLabel = (s: string) => (s === 'active' ? 'Aktif' : s === 'suspended' ? 'Ditangguhkan' : 'Pending');

export default function SuperadminMerchantPage() {
  const [data, setData] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await merchantService.list({ search: search || undefined, status: status || undefined })) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  async function setStatusFor(m: Merchant, next: string) {
    setBusyId(m.ID);
    try {
      await merchantService.updateStatus(m.ID, next);
      toast.success(`Merchant "${m.NAMA}" → ${statusLabel(next)}`);
      load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setBusyId(null); }
  }

  const columns: Column<Merchant>[] = [
    { header: 'Toko', accessor: (r) => (
      <div>
        <p className="font-medium text-slate-800">{r.NAMA}</p>
        <p className="text-xs text-slate-400">{r.CITY || '-'}{r.PROVINCE ? `, ${r.PROVINCE}` : ''}</p>
      </div>
    ) },
    { header: 'Pemilik', accessor: (r) => r.OWNER_NAME ?? '-' },
    { header: 'Kontak', accessor: (r) => (
      <div className="text-xs"><p>{r.EMAIL ?? '-'}</p><p className="text-slate-400">{r.PHONE ?? '-'}</p></div>
    ) },
    { header: 'Kategori', accessor: (r) => r.BUSINESS_CATEGORY ?? '-' },
    { header: 'Daftar', accessor: (r) => (r.CREATED_AT ? formatDate(r.CREATED_AT) : '-') },
    { header: 'Status', accessor: (r) => <Badge tone={statusTone(r.STATUS)}>{statusLabel(r.STATUS)}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => router.push(`/superadmin/merchant/${r.ID}`)}>
          <Eye className="h-4 w-4" /> Pantau
        </Button>
        {r.STATUS === 'active' ? (
          <Button variant="ghost" size="sm" loading={busyId === r.ID} onClick={() => setStatusFor(r, 'suspended')}>
            <Ban className="h-4 w-4" /> Tangguhkan
          </Button>
        ) : (
          <Button variant="ghost" size="sm" loading={busyId === r.ID} onClick={() => setStatusFor(r, 'active')}>
            <CheckCircle2 className="h-4 w-4" /> Aktifkan
          </Button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="Daftar Merchant" description="Kelola semua toko yang terdaftar" />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <SearchInput className="flex-1" placeholder="Cari nama toko / pemilik / email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="w-full sm:w-52">
            <SelectMenu
              label="Status"
              value={status}
              onChange={(v) => setStatus(String(v))}
              options={[
                { value: '', label: 'Semua status' },
                { value: 'active', label: 'Aktif' },
                { value: 'suspended', label: 'Ditangguhkan' },
                { value: 'pending', label: 'Pending' },
              ]}
            />
          </div>
        </div>
      </CardBody></Card>
      <Card><CardBody>
        <DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} emptyTitle="Belum ada merchant" showRowNumber />
      </CardBody></Card>
    </div>
  );
}
