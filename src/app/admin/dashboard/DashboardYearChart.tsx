'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { formatRupiah } from '@/utils/format';

interface Props {
  data: { name: string; omzet: number; laba: number }[];
  currentMonth: number; // 0-11, ditebalkan
}

// Satu batang per bulan: laba bertumpuk di dalam omzet (sisa = omzet - laba).
export function DashboardYearChart({ data, currentMonth }: Props) {
  const rows = data.map((d) => ({ ...d, sisa: Math.max(0, d.omzet - Math.max(0, d.laba)) }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={11} tickFormatter={(v) => `${Number(v) / 1000}k`} />
        <Tooltip
          formatter={(_v: number, _n: string, item) => item.dataKey === 'laba' ? [formatRupiah(item.payload.laba), 'Laba'] : [formatRupiah(item.payload.omzet), 'Omzet']}
          contentStyle={{ borderRadius: 18, border: '1px solid #e2e8f0' }}
        />
        <Bar dataKey="laba" stackId="a" name="Laba">
          {rows.map((_, i) => <Cell key={i} fill="#00b4d8" fillOpacity={i === currentMonth ? 1 : 0.7} />)}
        </Bar>
        <Bar dataKey="sisa" stackId="a" name="Omzet" radius={[8, 8, 0, 0]}>
          {rows.map((_, i) => <Cell key={i} fill="#0077b6" fillOpacity={i === currentMonth ? 1 : 0.45} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
