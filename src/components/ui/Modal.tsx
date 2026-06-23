'use client';
import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.addEventListener('keydown', onEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 animate-fade-in sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full overflow-hidden rounded-t-2xl border border-line bg-white shadow-soft animate-slide-up-sheet sm:rounded-2xl sm:animate-scale-in',
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line bg-brand-50/60 px-5 py-4">
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="max-h-[72vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3.5 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
