import { User } from 'lucide-react';
import { formatRupiah } from '@/utils/format';
import type { Penjualan } from '@/types';

// Detail item transaksi + label member. Dipakai di Riwayat kasir & Laporan Transaksi admin.
export function TrxItems({ trx }: { trx: Penjualan }) {
  return (
    <div>
      {trx.member && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <User className="h-4 w-4" /> Member · {trx.member.NAMA}
        </span>
      )}
      <ul className="divide-y divide-slate-100 text-sm">
        {trx.detail?.map((d) => {
          const diskon = Number(d.DISKON) || 0;
          const opsi = d.MODIFIER_DETAIL?.length ? d.MODIFIER_DETAIL : null;
          const nama = d.produk?.NAMA ?? `#${d.ID_PRODUK}`;
          const harga = opsi ? (d.HARGA_DASAR ?? d.HARGA_JUAL) : d.HARGA_JUAL;
          return (
            <li key={d.ID} className="py-2">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-800">{d.QTY}x {nama}</span>
                <span className="shrink-0 font-semibold text-slate-800">{formatRupiah(harga * d.QTY)}</span>
              </div>
              {opsi
                ? opsi.map((o, i) => (
                    <div key={i} className="ml-5 flex justify-between gap-3 text-xs text-slate-400">
                      <span>+ {o.nama}{o.grup ? ` (${o.grup})` : ''}</span>
                      <span className="shrink-0">{formatRupiah(o.harga * d.QTY)}</span>
                    </div>
                  ))
                : d.MODIFIER && <p className="text-right text-xs text-slate-400">{d.MODIFIER}</p>}
              {diskon > 0 && (
                <div className="flex justify-between gap-3 text-xs text-slate-400">
                  <span>Diskon</span><span className="shrink-0">− {formatRupiah(diskon)}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
