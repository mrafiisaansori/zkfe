import { get } from './api';
import type { DashboardSummary } from '@/types';

export const dashboardService = {
  summary: () => get<DashboardSummary>('/dashboard/summary'),
  chart: (tahun: number) => get<{ tahun: number; data: { bulan: number; omzet: number; laba: number }[] }>('/dashboard/chart', { tahun }),
};
