'use client';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ImagePlus, X } from 'lucide-react';
import { Input, CurrencyInput, Select, Button, ProductImage } from '@/components/ui';
import type { Produk, Kategori } from '@/types';
import type { ProdukInput } from '@/services/produk.service';
import { productImage } from '@/utils/image';

interface Props {
  kategori: Kategori[];
  initial?: Produk | null;
  loading?: boolean;
  onSubmit: (data: ProdukInput, file: File | null) => void;
  onCancel: () => void;
}

const MAX = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function ProdukForm({ kategori, initial, loading, onSubmit, onCancel }: Props) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ProdukInput>({
    defaultValues: initial ? {
      nama: initial.NAMA, id_kategori: initial.ID_KATEGORI, harga_beli: initial.HARGA_BELI,
      harga_jual: initial.HARGA_JUAL, barcode: initial.BARCODE ?? '', stok: initial.STOK,
    } : { stok: 0 },
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial ? productImage(initial) : null);
  const [fileError, setFileError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setFileError('');
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { setFileError('Format harus jpg, jpeg, png, atau webp'); return; }
    if (f.size > MAX) { setFileError('Ukuran maksimal 2MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function clearImage() {
    setFile(null);
    setPreview(initial && initial.FOTO_URL ? initial.FOTO_URL : null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d, file))} className="space-y-3">
      {/* Upload gambar + preview */}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Foto produk</label>
        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
            <ProductImage src={preview} alt="Preview produk" className="h-full w-full" />
            {file && (
              <button type="button" onClick={clearImage}
                className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"><X className="h-3.5 w-3.5" /></button>
            )}
          </div>
          <div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="hidden" id="foto-input" />
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {preview && file ? 'Ganti gambar' : 'Pilih gambar'}
            </Button>
            <p className="mt-1 text-xs text-slate-400">JPG/PNG/WEBP, maks 2MB</p>
            {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
          </div>
        </div>
      </div>

      <Input label="Nama produk" error={errors.nama?.message} {...register('nama', { required: 'Nama wajib diisi' })} />
      <Select label="Kategori" error={errors.id_kategori?.message} placeholder="Pilih kategori"
        options={kategori.map((k) => ({ value: k.ID, label: k.DESKRIPSI }))}
        {...register('id_kategori', { required: 'Kategori wajib dipilih', valueAsNumber: true })} />
      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="harga_beli"
          control={control}
          rules={{ required: 'Wajib', min: { value: 0, message: '>= 0' } }}
          render={({ field }) => (
            <CurrencyInput label="Harga beli" error={errors.harga_beli?.message} value={field.value} onChange={field.onChange} />
          )}
        />
        <Controller
          name="harga_jual"
          control={control}
          rules={{ required: 'Wajib', min: { value: 0, message: '>= 0' } }}
          render={({ field }) => (
            <CurrencyInput label="Harga jual" error={errors.harga_jual?.message} value={field.value} onChange={field.onChange} />
          )}
        />
      </div>
      {!initial && (
        <Input label="Stok awal" type="number" {...register('stok', { valueAsNumber: true })} />
      )}
      <Input label="Barcode (opsional)" {...register('barcode')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Batal</Button>
        <Button type="submit" loading={loading}>{initial ? 'Simpan perubahan' : 'Tambah produk'}</Button>
      </div>
    </form>
  );
}
