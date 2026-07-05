/**
 * Konversi gambar logo merchant jadi bitmap monokrom ESC/POS (perintah raster GS v 0),
 * supaya logo yang tampil di preview web (hitam-putih) sama persis hasilnya di cetakan
 * Bluetooth mentah — bukan cuma di jalur printer OS yang bisa render <img> langsung.
 *
 * ponytail: threshold hitam/putih sederhana (bukan dithering Floyd-Steinberg) — cukup
 * buat logo solid/kontras tinggi. Upgrade ke dithering kalau ada logo gradasi halus yang keliatan pecah.
 */
export async function logoUrlToRaster(url: string, maxWidthDots: number, maxHeightDots = 80): Promise<Uint8Array> {
  try {
    const img = await loadImage(url);
    const scale = Math.min(maxWidthDots / img.width, maxHeightDots / img.height, 1);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new Uint8Array();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h); // throws kalau canvas ternoda CORS

    const bytesPerRow = Math.ceil(w / 8);
    const bitmap = new Uint8Array(bytesPerRow * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const black = gray < 160 && data[i + 3] > 128; // alpha rendah = transparan = putih
        if (black) bitmap[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x % 8);
      }
    }

    const xL = bytesPerRow & 0xff, xH = (bytesPerRow >> 8) & 0xff;
    const yL = h & 0xff, yH = (h >> 8) & 0xff;
    return new Uint8Array([0x1d, 0x76, 0x30, 0, xL, xH, yL, yH, ...bitmap]);
  } catch {
    return new Uint8Array(); // logo gagal dimuat/CORS — cetak jalan terus tanpa logo
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
