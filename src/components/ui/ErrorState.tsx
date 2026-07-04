import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
export function ErrorState({ message = 'Gagal memuat data', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-100 bg-rose-50/60 px-5 py-14 text-center dark:border-rose-500/25 dark:bg-rose-500/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-500 ring-1 ring-rose-100 dark:text-rose-300 dark:ring-rose-500/25">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Coba lagi</Button>}
    </div>
  );
}
