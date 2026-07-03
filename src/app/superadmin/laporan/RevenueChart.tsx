'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { formatRupiah } from '@/utils/format';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

interface Props {
  data: { bulan: number; revenue: number }[];
}

export function RevenueChart({ data }: Props) {
  const chartData = data.map((d) => ({ name: BULAN[d.bulan - 1], revenue: d.revenue }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={11} tickFormatter={(v) => `${Number(v) / 1000}k`} />
        <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: 18, border: '1px solid #e2e8f0' }} />
        <Bar dataKey="revenue" name="Pendapatan" fill="#0077b6" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
