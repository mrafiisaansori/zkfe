'use client';
import { forwardRef } from 'react';
import { formatRupiah, formatDateTime } from '@/utils/format';
import type { Penjualan, PlanType } from '@/types';

export type ReceiptSize = '58' | '80';

interface ReceiptProps {
  trx: Penjualan;
  namaToko?: string;
  alamatToko?: string;
  bayar?: number | null;
  plan?: PlanType;
  size?: ReceiptSize;
}

// Lebar cetak: 58mm ≈ area cetak ~48mm, 80mm ≈ ~72mm. Pakai px untuk preview.
const widthPx: Record<ReceiptSize, string> = { '58': 'w-[220px]', '80': 'w-[300px]' };

/**
 * Struk thermal (preview + cetak). Menampilkan pajak, service, diskon item, voucher,
 * dan branding sesuai plan: FREE WAJIB menampilkan "Powered by Zona Kasir".
 */
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ trx, namaToko, alamatToko, bayar, plan = 'FREE', size = '58' }, ref) => {
    const displayNamaToko = namaToko || (plan === 'FREE' ? 'TOKO ZONA KASIR' : 'TOKO');
    const total = Number(trx.TOTAL) || 0;
    const diskon = Number(trx.DISKON) || 0;
    const ppn = Number(trx.PPN) || 0;
    const service = Number(trx.SERVICE_CHARGE) || 0;
    const diskonVoucher = Number(trx.DISKON_VOUCHER) || 0;
    const items = trx.detail || [];
    const subtotal = items.reduce((s, d) => s + d.HARGA_JUAL * d.QTY, 0);
    const diskonItem = items.reduce((s, d) => s + (Number(d.DISKON) || 0), 0);

    return (
      <div ref={ref} className={`receipt-print mx-auto ${widthPx[size]} bg-white p-3 font-mono text-[11px] leading-tight text-black`}>
        <div className="text-center">
          <p className="text-sm font-bold uppercase">{displayNamaToko}</p>
          {alamatToko && <p className="text-[10px]">{alamatToko}</p>}
        </div>
        <div className="my-1.5 border-t border-dashed border-black" />
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>No</span><span>#{String(trx.ID).padStart(6, '0')}</span></div>
          <div className="flex justify-between"><span>Tanggal</span><span>{formatDateTime(`${trx.TANGGAL}T${trx.JAM || '00:00:00'}`)}</span></div>
          <div className="flex justify-between"><span>Kasir</span><span>{trx.kasir?.NAMA ?? '-'}</span></div>
        </div>
        <div className="my-1.5 border-t border-dashed border-black" />

        {items.map((d) => {
          const lineDiskon = Number(d.DISKON) || 0;
          return (
            <div key={d.ID} className="mb-1">
              <p className="truncate">{d.produk?.NAMA ?? `#${d.ID_PRODUK}`}</p>
              {d.MODIFIER && <p className="text-[10px] text-black/70">{d.MODIFIER}</p>}
              <div className="flex justify-between">
                <span>{d.QTY} x {formatRupiah(d.HARGA_JUAL)}</span>
                <span>{formatRupiah(d.HARGA_JUAL * d.QTY)}</span>
              </div>
              {lineDiskon > 0 && (
                <div className="flex justify-between text-[10px]"><span>&nbsp;&nbsp;diskon item</span><span>- {formatRupiah(lineDiskon)}</span></div>
              )}
            </div>
          );
        })}

        <div className="my-1.5 border-t border-dashed border-black" />
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
          {diskonItem > 0 && <div className="flex justify-between"><span>Diskon item</span><span>- {formatRupiah(diskonItem)}</span></div>}
          {diskon > 0 && <div className="flex justify-between"><span>Diskon</span><span>- {formatRupiah(diskon)}</span></div>}
          {diskonVoucher > 0 && (
            <div className="flex justify-between"><span>Voucher {trx.KODE_VOUCHER ? `(${trx.KODE_VOUCHER})` : ''}</span><span>- {formatRupiah(diskonVoucher)}</span></div>
          )}
          {ppn > 0 && <div className="flex justify-between"><span>PPN</span><span>{formatRupiah(ppn)}</span></div>}
          {service > 0 && <div className="flex justify-between"><span>Service</span><span>{formatRupiah(service)}</span></div>}
        </div>
        <div className="my-1.5 border-t border-dashed border-black" />
        <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{formatRupiah(total)}</span></div>
        {bayar != null && (
          <>
            <div className="flex justify-between"><span>Bayar</span><span>{formatRupiah(bayar)}</span></div>
            <div className="flex justify-between"><span>Kembali</span><span>{formatRupiah(bayar - total)}</span></div>
          </>
        )}
        <div className="mt-0.5 flex justify-between"><span>Metode</span><span>{trx.jenisBayar?.NAMA ?? '-'}</span></div>
        <div className="flex justify-between"><span>Status</span><span>{trx.STATUS_BAYAR || 'LUNAS'}</span></div>

        <div className="my-1.5 border-t border-dashed border-black" />
        <p className="text-center">Terima kasih atas kunjungan Anda</p>

        {/* Branding plan FREE — WAJIB. PRO & BUSINESS bebas branding. */}
        {plan === 'FREE' && (
          <div className="mt-1 text-center text-[10px]">
            <p className="font-bold">Powered by Zona Kasir</p>
            <p>POS mudah untuk toko &amp; UMKM</p>
          </div>
        )}
      </div>
    );
  },
);
Receipt.displayName = 'Receipt';
