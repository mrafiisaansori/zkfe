import Image from 'next/image';
import { cn } from '@/utils/cn';

type Variant = 'full' | 'icon';
type Tone = 'light' | 'dark';
type Size = 'sm' | 'md' | 'lg';

const iconSizes: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
};
const titleSizes: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export function BrandLogo({
  variant = 'full',
  tone = 'light',
  size = 'md',
  className,
}: {
  variant?: Variant;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  // Latar gelap (sidebar / menu mobile setelah login) memakai logo putih,
  // latar terang (header, halaman login) memakai logo berwarna.
  const logoSrc = tone === 'dark' ? '/brand/logo-baru-putih.png' : '/brand/zona-kasir-icon.png';
  const icon = (
    <span className={cn('relative shrink-0 overflow-hidden rounded-xl', iconSizes[size])}>
      <Image src={logoSrc} alt="Zona Kasir" fill sizes="44px" className="object-contain" priority />
    </span>
  );

  if (variant === 'icon') return <div className={className}>{icon}</div>;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {icon}
      <div className="min-w-0 leading-tight">
        <p className={cn('font-bold uppercase tracking-[0.06em]', titleSizes[size], tone === 'dark' ? 'text-white' : 'text-slate-900')}>
          ZONA KASIR
        </p>
        <p className={cn('text-[11px] font-medium uppercase tracking-[0.18em]', tone === 'dark' ? 'text-slate-300' : 'text-slate-400')}>
          Point of Sale
        </p>
      </div>
    </div>
  );
}
