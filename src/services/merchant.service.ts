import { get, put } from './api';
import type {
  Merchant, MerchantStats, Produk, Pengguna, Penjualan,
  DashboardSummary, LaporanPenjualan, LaporanPendapatan, Qris,
} from '@/types';

export interface MerchantDashboard {
  merchant: Merchant;
  summary: DashboardSummary;
}

export interface StokReport {
  jumlah_produk: number;
  nilai_stok: number;
  data: Array<Produk & { ID_KATEGORI: number }>;
}

export const merchantService = {
  // Super admin
  list: (params?: { search?: string; status?: string }) =>
    get<Merchant[]>('/merchant', params as Record<string, unknown>),
  stats: () => get<MerchantStats>('/merchant/stats'),
  getById: (id: number) => get<Merchant>(`/merchant/${id}`),
  updateStatus: (id: number, status: string) => put<Merchant>(`/merchant/${id}/status`, { status }),

  // Pemantauan detail per merchant (super admin, read-only)
  monitorDashboard: (id: number) => get<MerchantDashboard>(`/merchant/${id}/dashboard`),
  monitorProduk: (id: number, search?: string) =>
    get<Produk[]>(`/merchant/${id}/produk`, search ? { search } : undefined),
  monitorStok: (id: number) => get<StokReport>(`/merchant/${id}/stok`),
  monitorPenjualan: (id: number, filter?: Record<string, unknown>) =>
    get<Penjualan[]>(`/merchant/${id}/penjualan`, filter),
  monitorLaporanPenjualan: (id: number, filter: Record<string, unknown>) =>
    get<LaporanPenjualan>(`/merchant/${id}/laporan/penjualan`, filter),
  monitorLaporanPendapatan: (id: number, filter: Record<string, unknown>) =>
    get<LaporanPendapatan>(`/merchant/${id}/laporan/pendapatan`, filter),
  monitorPengguna: (id: number) => get<Pengguna[]>(`/merchant/${id}/pengguna`),
  monitorQris: (id: number) => get<Qris>(`/merchant/${id}/qris`),

  // Toko sendiri
  me: () => get<Merchant>('/merchant/me'),
  updateOwn: (data: Partial<Merchant> & Record<string, unknown>) => put<Merchant>('/merchant/me', data),
};
