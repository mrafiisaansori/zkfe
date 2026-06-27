import { api, get } from './api';
import type { LaporanPenjualan, LaporanPendapatan, Produk, Penjualan, RekapLaporan } from '@/types';

export interface RekapFilter {
  tanggal_awal: string;
  tanggal_akhir: string;
  status?: 0 | 1;
  top_limit?: number;
}

export const laporanService = {
  penjualan: (tanggal_awal: string, tanggal_akhir: string, id_user: string | number = 'all', status: 0 | 1 = 1) =>
    get<LaporanPenjualan>('/laporan/penjualan', { tanggal_awal, tanggal_akhir, id_user, status }),
  pendapatan: (tanggal_awal: string, tanggal_akhir: string, status: 0 | 1 = 1) =>
    get<LaporanPendapatan>('/laporan/pendapatan', { tanggal_awal, tanggal_akhir, status }),
  stok: () => get<{ jumlah_produk: number; nilai_stok: number; data: Produk[] }>('/laporan/stok'),
  penyusutan: () => get<unknown[]>('/laporan/penyusutan'),

  // Rekap LENGKAP (PRO/BUSINESS). Backend mengembalikan 403 untuk plan FREE.
  rekap: (filter: RekapFilter) =>
    get<RekapLaporan>('/laporan/rekap', { ...filter }),

  // Unduh rekap sebagai CSV (memicu download di browser).
  async exportRekapCsv(filter: RekapFilter) {
    const res = await api.get('/laporan/rekap/export', { params: filter, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-laporan-${filter.tanggal_awal}_${filter.tanggal_akhir}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
