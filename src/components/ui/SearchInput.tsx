'use client';
import { Search } from 'lucide-react';
import { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-brand-300 focus:border-primary focus:ring-2 focus:ring-accent/30"
        {...rest}
      />
    </div>
  );
}
