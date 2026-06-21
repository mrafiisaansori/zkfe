import type { Produk } from '@/types';

export const DEFAULT_PRODUCT_IMAGE = '/images/default-product.svg';

type ProductImageShape = Partial<Produk> | Record<string, unknown>;

// Ambil URL gambar produk dari beberapa kemungkinan field API; fallback ke asset lokal.
export function productImage(produk: ProductImageShape | null | undefined): string {
  if (!produk) return DEFAULT_PRODUCT_IMAGE;
  const image = produk as Partial<Produk> & Record<string, unknown>;
  const candidates = [
    image.FOTO_URL,
    image.FOTO,
    image.image_url,
    image.product_image,
    image.foto_url,
    image.foto,
    image.gambar,
  ];

  const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return typeof found === 'string' ? found : DEFAULT_PRODUCT_IMAGE;
}
