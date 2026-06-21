'use client';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { SettingsTabs } from '@/components/layout/SettingsTabs';
import { Card, CardBody, Input, Button, LoadingState } from '@/components/ui';
import { identitasService, getErrorMessage } from '@/services';
import type { IdentitasInput } from '@/services/identitas.service';
import { usePageLoading } from '@/hooks/usePageLoading';

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  usePageLoading(loading);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { register, handleSubmit, reset } = useForm<IdentitasInput>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await identitasService.get();
      reset({ nama: d?.NAMA ?? '', alamat: d?.ALAMAT ?? '', no_telp: d?.NO_TELP ?? '', email: d?.EMAIL ?? '', website: d?.WEBSITE ?? '' });
      setLogoUrl(d?.LOGO_URL ?? null);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  }, [reset]);
  useEffect(() => { load(); }, [load]);

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const d = await identitasService.uploadLogo(file);
      setLogoUrl(d?.LOGO_URL ?? null);
      toast.success('Logo toko diperbarui');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setUploadingLogo(false); }
  }

  async function onSubmit(data: IdentitasInput) {
    setSaving(true);
    try { await identitasService.update(data); toast.success('Pengaturan disimpan'); }
    catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Pengaturan" description="Kelola identitas toko, logo & metode pembayaran" />
      <SettingsTabs />
      {loading ? <LoadingState /> : (
        <>
          <Card className="mb-4">
            <CardBody>
              <p className="mb-2 text-sm font-semibold text-slate-700">Logo toko</p>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-line bg-canvas">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada</span>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-300 px-4 py-2 text-sm font-semibold text-primary">
                  <ImagePlus className="h-4 w-4" /> {uploadingLogo ? 'Mengunggah...' : 'Unggah logo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-400">Logo tampil di struk, QR menu, dan katalog online.</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <Input label="Nama toko" {...register('nama')} />
                <Input label="Alamat" {...register('alamat')} />
                <Input label="No. Telp" {...register('no_telp')} />
                <Input label="Email" {...register('email')} />
                <Input label="Website" {...register('website')} />
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Simpan</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
