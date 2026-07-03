import type { Penjualan } from '@/types';

export function nomorNotaPenjualan(trx: Pick<Penjualan, 'ID' | 'NO_NOTA'> | null | undefined): string {
  if (!trx) return '-';
  return trx.NO_NOTA || String(trx.ID).padStart(6, '0');
}

export function nomorNotaPenjualanLabel(trx: Pick<Penjualan, 'ID' | 'NO_NOTA'> | null | undefined): string {
  const nomor = nomorNotaPenjualan(trx);
  return nomor === '-' ? nomor : `#${nomor}`;
}
