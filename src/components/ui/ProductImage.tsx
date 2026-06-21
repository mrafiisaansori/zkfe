'use client';
import { ImgHTMLAttributes, useState } from 'react';
import { cn } from '@/utils/cn';
import { DEFAULT_PRODUCT_IMAGE } from '@/utils/image';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
}

export function ProductImage({ src, alt = 'Produk', className, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const imageSrc = !failed && src ? src : DEFAULT_PRODUCT_IMAGE;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn('bg-slate-100 object-contain', className)}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
