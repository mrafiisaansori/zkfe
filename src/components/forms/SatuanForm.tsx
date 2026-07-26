'use client';
import { useForm } from 'react-hook-form';
import { Input, Button } from '@/components/ui';
import type { Satuan } from '@/types';

interface FormData { nama: string; }
interface Props { initial?: Satuan | null; loading?: boolean; onSubmit: (nama: string) => void; onCancel: () => void; }

export function SatuanForm({ initial, loading, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { nama: initial?.NAMA ?? '' },
  });
  return (
    <form onSubmit={handleSubmit((d) => onSubmit(d.nama))} className="space-y-3">
      <Input label="Nama satuan" placeholder="mis. Pcs, Box, Dus, Kg" error={errors.nama?.message} {...register('nama', { required: 'Wajib diisi' })} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Batal</Button>
        <Button type="submit" loading={loading}>Simpan</Button>
      </div>
    </form>
  );
}
