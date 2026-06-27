import { get } from './api';
import type { DashboardSummary, GudangDashboard } from '@/types';

export const dashboardService = {
  summary: () => get<DashboardSummary>('/dashboard/summary'),
  chart: (tahun: number) => get<{ tahun: number; data: { bulan: number; omzet: number; laba: number }[] }>('/dashboard/chart', { tahun }),
  // Dashboard operasional khusus role Gudang (tanpa data keuangan).
  gudang: () => get<GudangDashboard>('/dashboard/gudang'),
};
