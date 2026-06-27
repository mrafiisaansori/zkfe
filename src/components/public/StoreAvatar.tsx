'use client';
import { useState } from 'react';

/**
 * Avatar logo toko untuk halaman publik. Jika logo kosong atau gagal dimuat,
 * tampilkan inisial nama toko (hindari ikon gambar rusak).
 */
export function StoreAvatar({ src, name, className = '' }: { src?: string | null; name?: string | null; className?: string }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || 'T').trim().charAt(0).toUpperCase();
  const show = src && !broken;

  return (
    <div className={`flex items-center justify-center overflow-hidden bg-white ${className}`}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={name || 'Logo'} decoding="async" className="h-full w-full object-contain p-1" onError={() => setBroken(true)} />
      ) : (
        <span className="text-xl font-black text-primary">{initial}</span>
      )}
    </div>
  );
}
