'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Trash2, QrCode, Crown, ArrowRight, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, DataTable, Modal, ConfirmDialog, Input, Badge, type Column } from '@/components/ui';
import { mejaService, getErrorMessage } from '@/services';
import type { Meja } from '@/services/meja.service';
import { usePageLoading } from '@/hooks/usePageLoading';
import { useAuthStore } from '@/stores/authStore';

const menuUrl = (token: string) => (typeof window !== 'undefined' ? `${window.location.origin}/menu/${token}` : `/menu/${token}`);
const qrImg = (token: string) => `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(menuUrl(token))}`;

export default function MejaPage() {
  const planVal = useAuthStore((s) => s.user?.merchant?.plan);
  const isPro = planVal === 'PRO' || planVal === 'BUSINESS'; // BUSINESS = superset PRO
  const [data, setData] = useState<Meja[]>([]);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [nomor, setNomor] = useState('');
  const [adding, setAdding] = useState(false);
  const [qr, setQr] = useState<Meja | null>(null);
  const [toDelete, setToDelete] = useState<Meja | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await mejaService.list()) || []); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isPro) load(); else setLoading(false); }, [load, isPro]);

  async function add() {
    if (!nomor.trim()) return; setAdding(true);
    try { await mejaService.create(nomor.trim()); setNomor(''); toast.success('Meja ditambahkan'); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setAdding(false); }
  }
  async function handleDelete() {
    if (!toDelete) return; setBusy(true);
    try { await mejaService.remove(toDelete.ID); toast.success('Meja dihapus'); setToDelete(null); load(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setBusy(false); }
  }
  function copyLink(token: string) {
    navigator.clipboard.writeText(menuUrl(token)).then(() => toast.success('Link disalin')).catch(() => {});
  }

  if (!isPro) {
    return (
      <div>
        <PageHeader title="QR Menu & Self Order" description="Pelanggan scan QR di meja untuk memesan sendiri." />
        <Card><CardBody>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-primary"><Crown className="h-7 w-7" /></span>
            <h3 className="text-lg font-bold text-ink">QR Menu hanya untuk plan PRO</h3>
            <p className="max-w-md text-sm text-slate-500">Buat menu digital per meja agar pelanggan memesan sendiri (otomatis masuk Open Bill). Tersedia di plan PRO.</p>
            <Link href="/admin/langganan" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700">
              Upgrade ke PRO <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardBody></Card>
      </div>
    );
  }

  const columns: Column<Meja>[] = [
    { header: 'Meja', accessor: (r) => <span className="font-semibold text-slate-800">{r.NOMOR}</span> },
    { header: 'Status', accessor: (r) => <Badge tone={r.IS_ACTIVE ? 'green' : 'slate'}>{r.IS_ACTIVE ? 'Aktif' : 'Nonaktif'}</Badge> },
    { header: 'Aksi', accessor: (r) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setQr(r)} title="Lihat QR"><QrCode className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => copyLink(r.QR_TOKEN)} title="Salin link"><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
      </div>
    ) },
  ];

  return (
    <div>
      <PageHeader title="QR Menu & Self Order" description="Buat QR per meja. Pelanggan scan → pesan sendiri → masuk Open Bill." />
      <Card className="mb-4"><CardBody>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1"><Input label="Nomor / nama meja" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="mis. 01 / VIP-1" /></div>
          <Button onClick={add} loading={adding} disabled={!nomor.trim()}><Plus className="h-4 w-4" /> Tambah meja</Button>
        </div>
      </CardBody></Card>
      <Card><CardBody><DataTable columns={columns} data={data} loading={loading} rowKey={(r) => r.ID} showRowNumber emptyTitle="Belum ada meja" /></CardBody></Card>

      <Modal open={!!qr} onClose={() => setQr(null)} title={`QR Menu - Meja ${qr?.NOMOR ?? ''}`} size="sm">
        {qr && (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImg(qr.QR_TOKEN)} alt={`QR meja ${qr.NOMOR}`} loading="lazy" decoding="async" className="h-60 w-60 rounded-xl border border-line" />
            <p className="break-all text-center text-xs text-slate-500">{menuUrl(qr.QR_TOKEN)}</p>
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={() => copyLink(qr.QR_TOKEN)}><Copy className="h-4 w-4" /> Salin link</Button>
              <a href={qrImg(qr.QR_TOKEN)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-canvas">
                <ExternalLink className="h-4 w-4" /> Buka QR
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} loading={busy}
        title="Hapus meja" message={`Hapus meja "${toDelete?.NOMOR}"? QR-nya tidak akan berfungsi lagi.`} confirmLabel="Hapus" />
    </div>
  );
}
