import { type LucideIcon } from 'lucide-react';

type Tone = 'brand' | 'green' | 'amber' | 'red';

// Tinted icon datar (tanpa gradient/glow) — bersih & profesional.
const TONES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-primary dark:bg-accent/15 dark:text-accent',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

export function StatCard({ label, value, icon: Icon, tone = 'brand' }: {
  label: string; value: string | number; icon: LucideIcon; tone?: Tone;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-soft sm:p-5">
      <div className="flex items-center gap-3.5">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{value}</p>
        </div>
      </div>
    </div>
  );
}
