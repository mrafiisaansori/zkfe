'use client';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  type TooltipProps,
} from 'recharts';
import { formatRupiah } from '@/utils/format';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  data: { name: string; omzet: number; laba: number }[];
  currentMonth: number; // 0-11, label bulan berjalan ditebalkan
}

// Warna seri dipakai juga oleh legend di kartu (page.tsx) agar selalu sinkron.
export const CHART_COLORS = {
  laba: { light: '#0077b6', dark: '#00a3cc' },
  sisa: { light: '#b3dceb', dark: '#2b4a66' },
};

// "80 jt", "1,2 M" — lebih mudah dibaca daripada "80000k".
const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

type Row = Props['data'][number] & { sisa: number };

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  const margin = row.omzet > 0 ? Math.round((row.laba / row.omzet) * 100) : 0;
  return (
    <div className="min-w-[180px] rounded-lg border border-line bg-white px-3 py-2.5 text-xs shadow-soft">
      <p className="mb-1.5 font-semibold text-ink">{label}</p>
      <p className="flex justify-between gap-4 text-slate-600"><span>Omzet</span><span className="font-semibold tabular-nums text-slate-800">{formatRupiah(row.omzet)}</span></p>
      <p className="flex justify-between gap-4 text-slate-600"><span>Laba</span><span className="font-semibold tabular-nums text-slate-800">{formatRupiah(row.laba)}</span></p>
      {row.omzet > 0 && <p className="mt-1 border-t border-slate-100 pt-1 text-slate-500">Margin {margin}%</p>}
    </div>
  );
}

// Satu batang per bulan: laba bertumpuk di dalam omzet (sisa = omzet - laba),
// jadi tinggi total batang = omzet.
export function DashboardYearChart({ data, currentMonth }: Props) {
  const dark = useThemeStore((s) => s.theme) === 'dark'
    && typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const mode = dark ? 'dark' : 'light';
  const grid = dark ? '#334155' : '#e6ebf0';
  const tick = dark ? '#94a3b8' : '#64748b';
  const rows: Row[] = data.map((d) => ({ ...d, sisa: Math.max(0, d.omzet - Math.max(0, d.laba)) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={grid} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          interval={0}
          tick={(p: { x: number; y: number; index: number; payload: { value: string } }) => (
            <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize={11}
              fill={p.index === currentMonth ? (dark ? '#f1f5f9' : '#0a2540') : tick}
              fontWeight={p.index === currentMonth ? 700 : 400}>
              {p.payload.value}
            </text>
          )}
        />
        <YAxis
          width={52}
          axisLine={false}
          tickLine={false}
          fontSize={11}
          tick={{ fill: tick }}
          tickFormatter={(v) => (Number(v) === 0 ? '0' : compact.format(Number(v)))}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: dark ? 'rgba(148,163,184,0.08)' : 'rgba(10,37,64,0.04)' }} />
        <Bar dataKey="laba" stackId="a" name="Laba" fill={CHART_COLORS.laba[mode]} maxBarSize={36} />
        <Bar dataKey="sisa" stackId="a" name="Omzet" fill={CHART_COLORS.sisa[mode]} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
