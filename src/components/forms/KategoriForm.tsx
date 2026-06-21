'use client';
import { useForm } from 'react-hook-form';
import { Input, Button } from '@/components/ui';
import type { Kategori } from '@/types';

interface FormData { deskripsi: string; }
interface Props { initial?: Kategori | null; loading?: boolean; onSubmit: (deskripsi: string) => void; onCancel: () => void; }

export function KategoriForm({ initial, loading, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { deskripsi: initial?.DESKRIPSI ?? '' },
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d.deskripsi))} className="space-y-3">
      <Input label="Nama kategori" error={errors.deskripsi?.message} {...register('deskripsi', { required: 'Wajib diisi' })} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Batal</Button>
        <Button type="submit" loading={loading}>Simpan</Button>
      </div>
    </form>
  );
}
