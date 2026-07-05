/** Pemformatan teks lebar-tetap untuk struk ESC/POS (tanpa dependency lain, biar bisa di-test langsung). */
export function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) : s;
}

export function center(s: string, width: number) {
  s = truncate(s, width);
  const totalPad = Math.max(0, width - s.length);
  const left = Math.floor(totalPad / 2);
  return ' '.repeat(left) + s + ' '.repeat(totalPad - left);
}

export function twoCol(left: string, right: string, width: number) {
  const r = truncate(right, width);
  const l = truncate(left, Math.max(0, width - r.length - 1));
  return l + ' '.repeat(Math.max(1, width - l.length - r.length)) + r;
}

export function dashes(width: number) {
  return '-'.repeat(width);
}

/** Word-wrap ke beberapa baris (bukan potong) — dipakai untuk nama toko/alamat yang panjang. */
export function wrapText(text: string, width: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    // Satu kata sendiri lebih panjang dari lebar kertas — potong paksa kata itu saja.
    if (word.length > width) {
      if (current) { lines.push(current); current = ''; }
      for (let i = 0; i < word.length; i += width) lines.push(word.slice(i, i + width));
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > width) { lines.push(current); current = word; }
    else current = candidate;
  }
  if (current) lines.push(current);
  return lines;
}
