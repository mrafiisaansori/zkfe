'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Ban, Eye, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Badge, SelectMenu, SearchInput, Modal, Input, type Column } from '@/components/ui';
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
  const [planFor, setPlanFor] = useState<Merchant | null>(null);
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
    { header: 'Plan', accessor: (r) => {
      const planVal = (r as Merchant & { PLAN?: string }).PLAN || 'FREE';
      const paid = planVal === 'PRO' || planVal === 'BUSINESS';
      const exp = (r as Merchant & { PRO_EXPIRES_AT?: string }).PRO_EXPIRES_AT;
      return (
        <div>
          <Badge tone={planVal === 'BUSINESS' ? 'blue' : paid ? 'green' : 'slate'}>{planVal}</Badge>
          {paid && exp && <p className="mt-0.5 text-[11px] text-slate-400">s/d {formatDate(exp)}</p>}
        </div>
      );
    } },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => router.push(`/superadmin/merchant/${r.ID}`)}>
          <Eye className="h-4 w-4" /> Pantau
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPlanFor(r)}>
          <Crown className="h-4 w-4" /> Plan
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

      <PlanModal merchant={planFor} onClose={() => setPlanFor(null)} onSaved={() => { setPlanFor(null); load(); }} />
    </div>
  );
}

function toDateInput(v?: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function PlanModal({ merchant, onClose, onSaved }: { merchant: Merchant | null; onClose: () => void; onSaved: () => void }) {
  const [plan, setPlan] = useState<'FREE' | 'PRO' | 'BUSINESS'>('FREE');
  const [starts, setStarts] = useState('');
  const [expires, setExpires] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const isPaid = plan === 'PRO' || plan === 'BUSINESS';

  useEffect(() => {
    if (!merchant) return;
    const m = merchant as Merchant & { PLAN?: string; PRO_STARTS_AT?: string; PRO_EXPIRES_AT?: string };
    setPlan(m.PLAN === 'PRO' || m.PLAN === 'BUSINESS' ? m.PLAN : 'FREE');
    setStarts(toDateInput(m.PRO_STARTS_AT) || toDateInput(new Date().toISOString()));
    setExpires(toDateInput(m.PRO_EXPIRES_AT));
    setNote('');
  }, [merchant]);

  async function save() {
    if (!merchant) return;
    if (isPaid && !expires) { toast.error(`Isi tanggal expired ${plan}`); return; }
    setSaving(true);
    try {
      await merchantService.setPlan(merchant.ID, {
        plan,
        pro_starts_at: isPaid ? (starts || null) : null,
        pro_expires_at: isPaid ? (expires || null) : null,
        note: note || undefined,
      });
      toast.success(`Plan "${merchant.NAMA}" → ${plan}`);
      onSaved();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={!!merchant} onClose={onClose} title={`Kelola Plan — ${merchant?.NAMA ?? ''}`} size="sm">
      <div className="space-y-4">
        <SelectMenu
          label="Plan"
          value={plan}
          onChange={(v) => setPlan(v as 'FREE' | 'PRO' | 'BUSINESS')}
          options={[
            { value: 'FREE', label: 'FREE' },
            { value: 'PRO', label: 'PRO' },
            { value: 'BUSINESS', label: 'BUSINESS (custom + payment gateway)' },
          ]}
        />
        {isPaid && (
          <div className="grid grid-cols-2 gap-3">
            <Input label={`Mulai ${plan}`} type="date" value={starts} onChange={(e) => setStarts(e.target.value)} />
            <Input label={`Expired ${plan}`} type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
        )}
        <Input label="Catatan (alasan)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. aktivasi manual / promo" />
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {plan === 'BUSINESS'
            ? 'BUSINESS = semua fitur PRO + payment gateway QRIS dinamis Midtrans. Aktif sampai tanggal expired.'
            : plan === 'PRO'
              ? 'Fitur PRO langsung aktif sampai tanggal expired. Perubahan dicatat di riwayat.'
              : 'Memilih FREE akan menonaktifkan plan berbayar; fitur kembali mengikuti aturan FREE.'}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={save} loading={saving}>Simpan</Button>
        </div>
      </div>
    </Modal>
  );
}
