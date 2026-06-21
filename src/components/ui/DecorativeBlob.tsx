import { cn } from '@/utils/cn';

type Tone = 'primary' | 'accent' | 'aqua' | 'navy';

const tones: Record<Tone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  aqua: 'bg-brand-200',
  navy: 'bg-ink',
};

/**
 * Lingkaran gradient blur transparan untuk dekorasi background.
 * Selalu pointer-events-none & opacity rendah agar tidak mengganggu konten.
 */
export function DecorativeBlob({
  tone = 'accent',
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute rounded-full opacity-20 blur-3xl',
        tones[tone],
        className,
      )}
    />
  );
}
