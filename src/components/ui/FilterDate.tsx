'use client';
import { Input } from './Input';

interface Props {
  awal: string; akhir: string;
  onAwal: (v: string) => void; onAkhir: (v: string) => void;
}
export function FilterDate({ awal, akhir, onAwal, onAkhir }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <Input type="date" label="Tanggal awal" value={awal} onChange={(e) => onAwal(e.target.value)} />
      <Input type="date" label="Tanggal akhir" value={akhir} onChange={(e) => onAkhir(e.target.value)} />
    </div>
  );
}
