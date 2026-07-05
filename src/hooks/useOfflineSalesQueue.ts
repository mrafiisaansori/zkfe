import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { flushQueue, getQueue, type QueuedSale } from '@/utils/offlineQueue';

/** Badge status antrean transaksi offline + auto-sync begitu koneksi balik online. */
export function useOfflineSalesQueue() {
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const refresh = useCallback(() => setQueue(getQueue()), []);

  const sync = useCallback(async () => {
    const { synced, failed } = await flushQueue();
    refresh();
    if (synced.length) toast.success(`${synced.length} transaksi offline berhasil disinkron`);
    if (failed.length) toast.error(`${failed.length} transaksi offline ditolak server — cek ulang manual`);
  }, [refresh]);

  useEffect(() => {
    refresh();
    if (navigator.onLine) sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [refresh, sync]);

  return {
    pendingCount: queue.filter((q) => q.status === 'pending').length,
    failedCount: queue.filter((q) => q.status === 'failed').length,
    sync,
  };
}
