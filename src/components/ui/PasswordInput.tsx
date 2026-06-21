'use client';
import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

// Input password dengan tombol lihat/sembunyikan (toggle).
export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id, ...rest }, ref) => {
    const [show, setShow] = useState(false);
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            className={cn(
              'h-11 w-full rounded-xl border border-line bg-white pl-3.5 pr-11 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/30',
              error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
              className,
            )}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
