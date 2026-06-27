'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, ImagePlus, QrCode, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsTabs } from '@/components/layout/SettingsTabs';
import { Card, CardBody, Input, Button, LoadingState, Badge } from '@/components/ui';
import { qrisService, getErrorMessage } from '@/services';
import { usePageLoading } from '@/hooks/usePageLoading';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX = 2 * 1024 * 1024; // 2MB

export default function PembayaranPage() {
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [saving, setSaving] = useState(false);

  const [merchantName, setMerchantName] = useState('');
  const [nmid, setNmid] = useState('');
  const [isActive, setIsActive] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); // URL gambar tersimpan / object URL
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await qrisService.get();
      setMerchantName(d?.MERCHANT_NAME ?? '');
      setNmid(d?.NMID ?? '');
      setIsActive(Boolean(d?.IS_ACTIVE));
      setPreview(d?.IMAGE_URL ?? null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  function handleFile(f: File | null) {
    setFileError('');
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { setFileError('Format harus jpg, jpeg, png, atau webp'); return; }
    if (f.size > MAX) { setFileError('Ukuran maksimal 2MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isActive && !preview) {
      toast.error('Upload gambar QRIS terlebih dahulu sebelum mengaktifkan');
      return;
    }
    setSaving(true);
    try {
      await qrisService.update(
        { merchant_name: merchantName, nmid, is_active: isActive },
        file,
      );
      toast.success('Pengaturan QRIS disimpan');
      setFile(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Pengaturan" description="Kelola identitas toko & metode pembayaran" />
      <SettingsTabs />

      {loading ? <LoadingState /> : (
        <Card><CardBody>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pembayaran QRIS</p>
                <p className="text-xs text-slate-500">QRIS statis — pelanggan scan, kasir konfirmasi manual.</p>
              </div>
              <Badge tone={isActive ? 'green' : 'red'}>{isActive ? 'Aktif' : 'Nonaktif'}</Badge>
            </div>

            {/* Upload + preview gambar QRIS */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Gambar QRIS</label>
              <div className="flex flex-col items-start gap-3 sm:flex-row">
                <div className="flex h-44 w-44 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-line bg-slate-50">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Preview QRIS" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <QrCode className="h-10 w-10" />
                      <span className="text-xs">Belum ada gambar</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                    id="qris-input"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                    <ImagePlus className="h-4 w-4" /> {preview ? 'Ganti gambar' : 'Pilih gambar'}
                  </Button>
                  {file && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFile(null); setPreview(null); if (inputRef.current) inputRef.current.value = ''; }}
                    >
                      <Trash2 className="h-4 w-4" /> Batalkan gambar baru
                    </Button>
                  )}
                  <p className="text-xs text-slate-400">Format jpg, jpeg, png, webp. Maks 2MB.</p>
                  {fileError && <p className="text-xs text-rose-600">{fileError}</p>}
                </div>
              </div>
            </div>

            <Input label="Nama merchant" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Nama yang tampil di QRIS" />
            <Input label="NMID / ID QRIS (opsional)" value={nmid} onChange={(e) => setNmid(e.target.value)} placeholder="contoh: ID1024xxxxxxxx" />

            {/* Toggle aktif */}
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Aktifkan QRIS</p>
                <p className="text-xs text-slate-500">Jika nonaktif, metode QRIS tidak tersedia di kasir.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </label>

            <div className="flex justify-end pt-1">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Simpan</Button>
            </div>
          </form>
        </CardBody></Card>
      )}
    </div>
  );
}
