import { get } from './api';
import type { LaporanPenjualan, LaporanPendapatan, Produk, Penjualan } from '@/types';

export const laporanService = {
  penjualan: (tanggal_awal: string, tanggal_akhir: string, id_user: string | number = 'all', status: 0 | 1 = 1) =>
    get<LaporanPenjualan>('/laporan/penjualan', { tanggal_awal, tanggal_akhir, id_user, status }),
  pendapatan: (tanggal_awal: string, tanggal_akhir: string, status: 0 | 1 = 1) =>
    get<LaporanPendapatan>('/laporan/pendapatan', { tanggal_awal, tanggal_akhir, status }),
  stok: () => get<{ jumlah_produk: number; nilai_stok: number; data: Produk[] }>('/laporan/stok'),
  penyusutan: () => get<unknown[]>('/laporan/penyusutan'),
};
