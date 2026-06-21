import { get, post, put, del, postForm, putForm, api } from './api';
import type { Produk, RekamStok } from '@/types';

export interface ImportRow { row: number; nama: string; status: 'sukses' | 'gagal' | 'siap'; message: string }
export interface ImportResult { total: number; sukses: number; gagal: number; rows: ImportRow[] }

export interface ProdukInput {
  nama: string;
  id_kategori: number;
  stok?: number;
  harga_beli: number;
  harga_jual: number;
  barcode?: string;
}

// Bangun FormData untuk upload multipart (data + file gambar opsional).
function toFormData(data: Partial<ProdukInput>, file?: File | null): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
  });
  if (file) fd.append('foto', file);
  return fd;
}

export const produkService = {
  list: (search?: string) => get<Produk[]>('/produk', search ? { search } : undefined),
  getById: (id: number) => get<Produk>(`/produk/${id}`),
  getByBarcode: (barcode: string) => get<Produk>(`/produk/barcode/${barcode}`),

  // create/update mendukung gambar via multipart. Tanpa file tetap berfungsi.
  create: (data: ProdukInput, file?: File | null) =>
    file ? postForm<Produk>('/produk', toFormData(data, file)) : post<Produk>('/produk', data),
  update: (id: number, data: Partial<ProdukInput>, file?: File | null) =>
    file ? putForm<Produk>(`/produk/${id}`, toFormData(data, file)) : put<Produk>(`/produk/${id}`, data),

  remove: (id: number) => del(`/produk/${id}`),
  adjustStock: (id: number, jenis: 1 | 2, qty: number, keterangan?: string) =>
    post<Produk>(`/produk/${id}/stok`, { jenis, qty, keterangan }),
  stockHistory: (id: number) => get<RekamStok[]>(`/produk/${id}/stok-history`),

  // ===== Import massal =====
  // Unduh template Excel.
  async downloadImportTemplate() {
    const res = await api.get('/produk/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template-import-produk.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  // Upload file -> preview (dryRun) atau import sungguhan.
  async import(file: File, dryRun: boolean): Promise<ImportResult> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post(`/produk/import?dryRun=${dryRun}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data?.data as ImportResult;
  },
};
