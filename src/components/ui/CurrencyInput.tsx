'use client';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  label?: string;
  error?: string;
  value: number | string | null | undefined;
  onChange: (value: number) => void;
}

// Tampilkan dengan titik ribuan (id-ID) selagi diketik; 0/kosong ditampilkan
// kosong supaya placeholder tetap terlihat. Nilai yang dikirim ke onChange
// selalu angka polos tanpa titik — jadi tersimpan ke database apa adanya.
function displayValue(v: number | string | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return '';
  return n.toLocaleString('id-ID');
}

/**
 * Input nominal (Rupiah) dengan masking titik ribuan otomatis saat mengetik.
 * Drop-in pengganti <Input type="number"> untuk field harga/nominal — bukan
 * untuk qty, persen, atau angka lain yang bukan uang.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, value, onChange, className, id, ...rest }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        id={id}
        inputMode="numeric"
        value={displayValue(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          onChange(digits ? Number(digits) : 0);
        }}
        className={cn(
          'h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/30',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  ),
);
CurrencyInput.displayName = 'CurrencyInput';
