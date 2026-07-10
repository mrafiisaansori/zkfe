// Loader tipis untuk Midtrans Snap.js (popup checkout). Dipakai di alur pembayaran
// POS, split bill, dan upgrade langganan - semuanya bisa beda client key/env
// (akun Midtrans merchant vs akun billing platform), makanya di-reload tiap ganti key.
let loadedKey: string | null = null;
let loadingPromise: Promise<void> | null = null;

export function loadSnap(clientKey: string, isProduction: boolean): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Snap.js hanya bisa dimuat di browser.'));
  if (loadedKey === clientKey && (window as any).snap) return Promise.resolve();

  loadingPromise = new Promise((resolve, reject) => {
    document.querySelectorAll('script[data-snap-midtrans]').forEach((el) => el.remove());
    const script = document.createElement('script');
    script.src = isProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.setAttribute('data-snap-midtrans', '1');
    script.onload = () => { loadedKey = clientKey; resolve(); };
    script.onerror = () => reject(new Error('Gagal memuat Snap.js Midtrans.'));
    document.body.appendChild(script);
  });
  return loadingPromise;
}

export interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

export function snapPay(token: string, callbacks: SnapCallbacks = {}) {
  (window as any).snap.pay(token, callbacks);
}

// Render Snap langsung di dalam elemen halaman (id=embedId) alih-alih popup/tab baru.
export function embedSnap(token: string, embedId: string, callbacks: SnapCallbacks = {}) {
  (window as any).snap.embed(token, { embedId, ...callbacks });
}
