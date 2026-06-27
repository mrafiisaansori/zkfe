'use client';
import { useForm } from 'react-hook-form';
import { Input, PasswordInput, SelectMenu, Button } from '@/components/ui';
import type { Pengguna } from '@/types';
import type { PenggunaInput } from '@/services/pengguna.service';

interface Props { initial?: Pengguna | null; loading?: boolean; onSubmit: (data: PenggunaInput) => void; onCancel: () => void; }

export function UserForm({ initial, loading, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PenggunaInput>({
    defaultValues: initial
      ? { nama: initial.NAMA, username: initial.USERNAME, level: (initial.LEVEL === 3 ? 3 : 2), telp: initial.TELP ?? '' }
      : { level: 2 },
  });
  const level = watch('level');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <Input label="Nama lengkap" error={errors.nama?.message} {...register('nama', { required: 'Wajib diisi' })} />
      <Input label="Username" error={errors.username?.message} {...register('username', { required: 'Wajib diisi' })} />
      {!initial && (
        <PasswordInput label="Password" error={errors.password?.message} {...register('password', { required: 'Wajib diisi' })} />
      )}
      <SelectMenu
        label="Role"
        value={level ?? 2}
        onChange={(v) => setValue('level', Number(v) as 2 | 3, { shouldValidate: true })}
        options={[{ value: 2, label: 'Kasir' }, { value: 3, label: 'Gudang' }]}
      />
      <p className="-mt-1 text-xs text-slate-400">
        {level === 3
          ? 'Gudang: akses Master Data, Stok, Pembelian, Retur, dan Transaksi (tanpa laporan keuangan).'
          : 'Kasir: akses POS, Open Bill, dan Riwayat transaksi.'}
      </p>
      <Input label="No. Telp (opsional)" {...register('telp')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Batal</Button>
        <Button type="submit" loading={loading}>{initial ? 'Simpan perubahan' : 'Tambah pengguna'}</Button>
      </div>
    </form>
  );
}
