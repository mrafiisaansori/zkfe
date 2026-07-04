'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option { value: string | number; label: string }
interface Props {
  label?: string;
  value: string | number;
  options: Option[];
  placeholder?: string;
  onChange: (value: string | number) => void;
  className?: string;
  searchable?: boolean;          // tampilkan kotak pencarian di dalam dropdown
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
}

/**
 * Dropdown kustom (bukan <select> native) agar tampilan list bisa premium &
 * konsisten lintas browser. Tetap drop-in: cukup value + onChange(value).
 * Set `searchable` untuk mengaktifkan pencarian (mis. provinsi/kota).
 */
export function SelectMenu({
  label, value, options, placeholder = 'Pilih...', onChange, className,
  searchable = false, searchPlaceholder = 'Cari...', onSearchChange, loading = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => String(o.value) === String(value));

  const filtered = useMemo(() => {
    if (onSearchChange) return options;
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable, onSearchChange]);

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    // fokuskan input pencarian saat dropdown dibuka
    if (searchable) setTimeout(() => searchRef.current?.focus(), 0);
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, searchable]);

  useEffect(() => {
    if (!open || !searchable || !onSearchChange) return;
    const t = setTimeout(() => onSearchChange(query), 300);
    return () => clearTimeout(t);
  }, [open, query, searchable, onSearchChange]);

  return (
    <div className={cn('w-full', className)} ref={ref}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm outline-none transition-all',
            open ? 'border-primary ring-2 ring-accent/30' : 'border-line hover:border-brand-300',
            selected ? 'text-slate-800' : 'text-slate-400',
          )}
        >
          <span className="truncate font-medium">{selected ? selected.label : placeholder}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200', open && 'rotate-180 text-primary')} />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-2xl border border-line/80 bg-white shadow-premium-lg animate-scale-in"
          >
            {searchable && (
              <div className="sticky top-0 border-b border-line/70 bg-white p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-9 w-full rounded-lg border border-line bg-white pl-8 pr-3 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
            )}
            <div className="max-h-56 overflow-y-auto p-1.5">
              {loading && <p className="px-3 py-2 text-sm text-slate-400">Memuat...</p>}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">Tidak ada hasil</p>
              )}
              {filtered.map((o) => {
                const active = String(o.value) === String(value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      active ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-accent/15 dark:text-accent' : 'text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-accent" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
