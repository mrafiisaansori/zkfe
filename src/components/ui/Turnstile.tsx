'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Site key di-inject saat build (NEXT_PUBLIC_*). Kosong = Turnstile NONAKTIF
// (mis. di lokal). Set hanya di production agar widget hanya muncul di cloud.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
export const turnstileEnabled = !!SITE_KEY;

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id?: string) => void } }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export interface TurnstileHandle {
  /** Reset widget & kosongkan token (panggil setelah submit GAGAL). */
  reset: () => void;
}

/**
 * Widget Cloudflare Turnstile. onToken dipanggil dengan token saat sukses,
 * atau '' saat expired/error/reset. Gunakan ref.reset() untuk meminta token
 * baru setelah submit gagal (token Turnstile bersifat sekali pakai).
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (token: string) => void }>(
  function Turnstile({ onToken }, ref) {
    const elRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) {
          try { window.turnstile.reset(widgetId.current); } catch { /* ignore */ }
        }
        onToken('');
      },
    }), [onToken]);

    useEffect(() => {
      if (!SITE_KEY) return undefined;
      let cancelled = false;

      const render = () => {
        if (cancelled || !elRef.current || !window.turnstile || widgetId.current) return;
        widgetId.current = window.turnstile.render(elRef.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': () => onToken(''),
        });
      };

      if (window.turnstile) {
        render();
      } else if (!document.getElementById(SCRIPT_ID)) {
        const s = document.createElement('script');
        s.id = SCRIPT_ID; s.src = SRC; s.async = true; s.defer = true;
        s.onload = render;
        document.head.appendChild(s);
      } else {
        const t = setInterval(() => { if (window.turnstile) { clearInterval(t); render(); } }, 200);
        return () => clearInterval(t);
      }

      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          try { window.turnstile.remove(widgetId.current); } catch { /* ignore */ }
          widgetId.current = null;
        }
      };
    }, [onToken]);

    if (!SITE_KEY) return null;
    return <div ref={elRef} className="my-1 flex justify-center" />;
  },
);
