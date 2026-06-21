import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Option { value: string | number; label: string }
interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className, id, ...rest }, ref) => (
    <div className="w-full">
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border border-line bg-white pl-3.5 pr-10 text-sm font-medium text-slate-800 outline-none transition-colors duration-150 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/30',
            error && 'border-rose-400',
            className,
          )}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  ),
);
Select.displayName = 'Select';
