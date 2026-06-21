import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  // 'gradient' sengaja dibuat solid & elegan (bukan gradient mencolok) agar konsisten.
  primary: 'bg-primary text-white shadow-card hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-accent',
  gradient: 'bg-primary text-white shadow-card hover:bg-brand-700 active:bg-brand-800 focus-visible:ring-accent',
  secondary: 'bg-brand-50 text-primary hover:bg-brand-100 focus-visible:ring-accent',
  danger: 'bg-error text-white shadow-card hover:brightness-95 active:brightness-90 focus-visible:ring-error',
  ghost: 'text-slate-600 hover:bg-canvas hover:text-slate-900 focus-visible:ring-accent',
  outline: 'border border-line bg-white text-slate-700 hover:bg-canvas hover:border-brand-300 hover:text-primary focus-visible:ring-accent',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
