import Image from 'next/image';
import { cn } from '@/utils/cn';

type Size = 'sm' | 'md' | 'lg';

const ring: Record<Size, string> = {
  sm: 'h-11 w-11',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};
const logo: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

/**
 * Loader brand premium: logo Zona Kasir dengan pulse halus + ring gradient
 * berputar di sekelilingnya. Murni presentasional (transform/opacity → ringan,
 * GPU-accelerated, tidak bikin lag).
 */
export function BrandLoader({
  label,
  size = 'md',
  className,
}: {
  label?: string;
  size?: Size;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <span className={cn('relative flex items-center justify-center', ring[size])}>
        <span aria-hidden className="zk-loader-ring absolute inset-0 rounded-full" />
        <span aria-hidden className="absolute inset-[3px] rounded-full bg-white shadow-[0_1px_8px_-2px_rgba(3,4,94,0.25)]" />
        <Image
          src="/brand/zona-kasir-icon.svg"
          alt="Zona Kasir"
          width={48}
          height={48}
          priority
          className={cn('zk-loader-pulse relative rounded-xl object-contain', logo[size])}
        />
      </span>
      {label && <p className="text-sm font-medium text-slate-500">{label}</p>}
    </div>
  );
}
