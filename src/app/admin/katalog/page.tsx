'use client';
import { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, Save, ImagePlus, Share2, Printer, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardBody, Button, Input } from '@/components/ui';
import { merchantService, identitasService, getErrorMessage } from '@/services';
import type { Identitas } from '@/types';
import { usePageLoading } from '@/hooks/usePageLoading';
import { printQrPoster } from '@/utils/printQrPoster';

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

export default function KatalogPage() {
  const [slug, setSlug] = useState('');
  const [identitas, setIdentitas] = useState<Identitas | null>(null);
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [savingSlug, setSavingSlug] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, it] = await Promise.all([merchantService.me(), identitasService.get()]);
      setSlug(m.SLUG || '');
      setIdentitas(it);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const url = slug ? `${origin()}/store/${slug}` : '';

  async function saveSlug() {
    setSavingSlug(true);
    try { const m = await merchantService.updateOwn({ slug }); setSlug(m.SLUG || ''); toast.success('Link katalog disimpan'); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSavingSlug(false); }
  }
  async function uploadBanner(file: File) {
    setUploading(true);
    try { setIdentitas(await identitasService.uploadBanner(file)); toast.success('Banner diperbarui'); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setUploading(false); }
  }
  function copy() { navigator.clipboard.writeText(url).then(() => toast.success('Link disalin')).catch(() => {}); }
  function share() {
    if (navigator.share) navigator.share({ title: identitas?.NAMA || 'Katalog', url }).catch(() => {});
    else copy();
  }

  return (
    <div>
      <PageHeader title="Katalog Online" description="Halaman katalog publik toko Anda untuk dibagikan ke pelanggan." />

      <Card className="mb-4"><CardBody>
        <p className="mb-2 text-sm font-semibold text-slate-700">Link katalog</p>
        {url ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 truncate rounded-xl bg-canvas px-3 py-2 text-sm text-primary">{url}</code>
            <Button variant="outline" size="sm" onClick={copy}><Copy className="h-4 w-4" /> Salin</Button>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-canvas"><ExternalLink className="h-4 w-4" /> Buka</a>
            <Button variant="outline" size="sm" onClick={share}><Share2 className="h-4 w-4" /> Bagikan</Button>
          </div>
        ) : <p className="mb-3 text-sm text-slate-400">Atur slug di bawah untuk membuat link.</p>}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Slug (alamat link)</label>
          <div className="flex items-stretch gap-2">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="nama-toko-anda"
              className="h-11 flex-1 rounded-xl border border-line bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-accent/25"
            />
            <Button className="h-11 shrink-0" onClick={saveSlug} loading={savingSlug}><Save className="h-4 w-4" /> Simpan</Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Hanya huruf kecil, angka, dan tanda hubung. Contoh: kopi-senja.</p>
        </div>
      </CardBody></Card>

      {/* QR Katalog untuk dipajang/dicetak */}
      {url && (
        <Card className="mb-4"><CardBody>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(url)}`}
                alt="QR Katalog"
                className="h-28 w-28 rounded-xl border border-line"
              />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700"><QrCode className="h-4 w-4" /> QR Katalog</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Pengunjung scan QR ini untuk membuka katalog toko Anda. Cetak dan pajang di toko/meja.</p>
              </div>
            </div>
            <Button
              onClick={() => printQrPoster({ title: identitas?.NAMA || 'Toko Saya', subtitle: 'Scan untuk lihat katalog', url })}
            >
              <Printer className="h-4 w-4" /> Cetak QR
            </Button>
          </div>
        </CardBody></Card>
      )}

      <Card><CardBody>
        <p className="mb-2 text-sm font-semibold text-slate-700">Banner katalog</p>
        <div className="overflow-hidden rounded-2xl border border-line">
          {identitas?.BANNER_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identitas.BANNER_URL} alt="Banner" className="h-40 w-full object-cover" />
          ) : <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-sm text-slate-400">Belum ada banner</div>}
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-semibold text-primary">
          <ImagePlus className="h-4 w-4" /> {uploading ? 'Mengunggah…' : 'Unggah banner'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBanner(f); }} />
        </label>
        <p className="mt-2 text-xs text-slate-400">Logo toko diambil dari Pengaturan; produk & kategori otomatis tampil di katalog.</p>
      </CardBody></Card>
    </div>
  );
}
