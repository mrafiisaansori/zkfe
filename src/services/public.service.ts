import { get, post } from './api';

export interface PublicProduct {
  id: number; nama: string; harga: number; stok: number;
  id_kategori: number | null; kategori: string | null; foto_url: string | null;
}
export interface PublicStore {
  nama: string; alamat: string | null; no_telp: string | null;
  logo_url: string | null; banner_url: string | null;
}
export interface PublicMenu {
  meja: { id: number; nomor: string };
  merchant: { id: number; nama: string };
  toko: PublicStore | null;
  kategori: { id: number; nama: string }[];
  produk: PublicProduct[];
}
export interface PublicCatalog {
  merchant: { id: number; nama: string; phone: string | null; slug: string };
  toko: PublicStore | null;
  kategori: { id: number; nama: string }[];
  produk: PublicProduct[];
}

// Endpoint publik (tanpa login). merchant_id diturunkan server dari token/slug.
export const publicService = {
  getMenu: (token: string) => get<PublicMenu>(`/public/menu/${token}`),
  order: (token: string, payload: { customer_name?: string; note?: string; items: { id_produk: number; qty: number }[] }) =>
    post<{ no_bill: string; meja: string; total: number }>(`/public/menu/${token}/order`, payload),
  getCatalog: (slug: string) => get<PublicCatalog>(`/public/store/${slug}`),
  // Status maintenance global (tanpa login).
  maintenance: () => get<{ active: boolean; message: string }>('/public/maintenance'),
};
