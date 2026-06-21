'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

/**
 * Dipanggil di setiap halaman untuk melaporkan status loading datanya ke store
 * global. Overlay navigasi (NavigationLoader) akan tetap tampil sampai data dari
 * backend benar-benar selesai dimuat (loading === false), lalu otomatis hilang.
 */
export function usePageLoading(loading: boolean) {
  const setNavLoading = useUIStore((s) => s.setNavLoading);

  useEffect(() => {
    setNavLoading(loading);
  }, [loading, setNavLoading]);

  // Saat halaman di-unmount (pindah menu), pastikan overlay dinyalakan kembali
  // sampai halaman tujuan melaporkan statusnya.
  useEffect(() => {
    return () => setNavLoading(true);
  }, [setNavLoading]);
}
