'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { formatRupiah } from '@/utils/format';

interface Props {
  data: { name: string; omzet: number; laba: number }[];
}

export function DashboardYearChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={11} tickFormatter={(v) => `${Number(v) / 1000}k`} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 18, border: '1px solid #e2e8f0' }} />
        <Bar dataKey="omzet" name="Omzet" fill="#0077b6" radius={[8, 8, 0, 0]} />
        <Bar dataKey="laba" name="Laba" fill="#00b4d8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
