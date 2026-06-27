import { get, post } from './api';
import type { KasShift, KasMutasi, ShiftClosePreview, DailyReport } from '@/types';

export interface OpenShiftInput {
  modal_awal: number;
  station?: string;
  catatan?: string;
}

export interface MutasiInput {
  tipe: 'IN' | 'OUT';
  nominal: number;
  keterangan?: string;
}

export interface CloseShiftInput {
  actual_cash: number;
  actual_methods?: { id_jenis_bayar: number; actual: number }[];
  catatan?: string;
}

// Catatan keamanan: id_user & merchant_id TIDAK dikirim dari frontend —
// backend mengambilnya dari token (sesi login).
export const kasShiftService = {
  active: () => get<KasShift | null>('/kas-shift/active'),
  list: (params?: { status?: 'OPEN' | 'CLOSED'; id_user?: number; tanggal_awal?: string; tanggal_akhir?: string }) =>
    get<KasShift[]>('/kas-shift', params as Record<string, unknown>),
  getById: (id: number) => get<KasShift>(`/kas-shift/${id}`),
  open: (data: OpenShiftInput) => post<KasShift>('/kas-shift', data),
  mutasi: (id: number, data: MutasiInput) => post<KasMutasi>(`/kas-shift/${id}/mutasi`, data),
  closePreview: (id: number) => get<ShiftClosePreview>(`/kas-shift/${id}/close-preview`),
  close: (id: number, data: CloseShiftInput) => post<KasShift>(`/kas-shift/${id}/close`, data),
  reportDaily: (tanggal: string) => get<DailyReport>('/kas-shift/report/daily', { tanggal }),
};
