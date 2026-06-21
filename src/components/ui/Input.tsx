import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id, ...rest }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        ref={ref}
        id={id}
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
Input.displayName = 'Input';
