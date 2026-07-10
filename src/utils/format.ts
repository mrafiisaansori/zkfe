export function formatRupiah(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  return 'Rp ' + n.toLocaleString('id-ID');
}

export function formatNumber(value: number | string | null | undefined): string {
  return (Number(value) || 0).toLocaleString('id-ID');
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  // toLocaleTimeString('id-ID') pakai titik (16.07); paksa titik dua agar konsisten.
  const jam = String(d.getHours()).padStart(2, '0');
  const menit = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(value)} pukul ${jam}:${menit}`;
}

// Countdown ramah-baca: >=1 jam -> "23j 55m", di bawah itu -> "05:28".
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}j ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Zona waktu aplikasi (WIB / Asia/Jakarta).
const APP_TZ = 'Asia/Jakarta';

// Tanggal "hari ini" menurut zona waktu aplikasi, bukan UTC.
export function todayISO(): string {
  // en-CA -> format YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
