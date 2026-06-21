'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface Props { page: number; totalPages: number; onChange: (p: number) => void; }
export function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <span className="text-sm text-slate-500">
        Halaman <span className="font-semibold text-slate-700">{page}</span> dari {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Sebelumnya">
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-line bg-brand-50 px-3 text-sm font-semibold text-primary-dark">
          {page}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Berikutnya">
          <span className="hidden sm:inline">Berikutnya</span> <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
