import { cn } from '@/utils/cn';
import { DecorativeBlob } from './DecorativeBlob';

type Variant = 'dots' | 'grid' | 'wave' | 'diagonal' | 'none';

const variantClass: Record<Variant, string> = {
  dots: 'zk-pattern-dots',
  grid: 'zk-pattern-grid',
  wave: 'zk-pattern-wave',
  diagonal: 'zk-pattern-diagonal',
  none: '',
};

/**
 * Layer dekoratif background yang reusable: pattern halus + blob gradient.
 * Dipasang di dalam parent ber-`relative`; selalu di belakang konten &
 * pointer-events-none sehingga tidak mengganggu interaksi/readability.
 */
export function BackgroundPattern({
  variant = 'none',
  blobs = false,
  className,
}: {
  variant?: Variant;
  blobs?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      {variant !== 'none' && <div className={cn('absolute inset-0', variantClass[variant])} />}
      {blobs && (
        <>
          <DecorativeBlob tone="accent" className="-left-24 -top-24 h-72 w-72" />
          <DecorativeBlob tone="aqua" className="-right-24 top-10 h-80 w-80 opacity-25" />
        </>
      )}
    </div>
  );
}
