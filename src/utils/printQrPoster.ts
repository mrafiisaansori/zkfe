interface QrPosterData {
  title: string;        // nama toko
  subtitle?: string;    // mis. "Scan untuk lihat katalog"
  url: string;          // URL yang di-encode ke QR
  note?: string;        // teks kecil di bawah QR (mis. URL atau ajakan)
}

const qrSrc = (url: string, size = 600) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=12&data=${encodeURIComponent(url)}`;

/**
 * Cetak poster QR katalog yang rapi (siap pajang). Membuka jendela cetak
 * self-contained dengan desain kartu + branding Zona Kasir.
 */
export function printQrPoster({ title, subtitle = 'Scan untuk lihat katalog', url, note }: QrPosterData) {
  const win = window.open('', 'PRINT', 'height=800,width=600');
  if (!win) return;

  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>QR Katalog - ${title}</title>
    <style>
      @page { size: A5 portrait; margin: 0; }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      html, body { margin: 0; padding: 0; height: 100%; font-family: Arial, Helvetica, sans-serif; background: #fff; }
      .poster {
        width: 148mm; height: 210mm; margin: 0 auto; padding: 14mm 12mm; overflow: hidden;
        display: flex; flex-direction: column; align-items: center; text-align: center;
        background: linear-gradient(180deg, #0077b6 0%, #00a0c8 38%, #ffffff 38%, #ffffff 100%);
      }
      .head { color: #fff; margin-bottom: 8mm; }
      .head h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; }
      .head p { margin: 6px 0 0; font-size: 15px; opacity: .95; }
      .card {
        background: #fff; border-radius: 18px; padding: 18px; width: 100%;
        box-shadow: 0 18px 40px -22px rgba(0,0,0,.45); border: 1px solid #e6eef5;
      }
      .qrbox { border: 2px dashed #cfe0ec; border-radius: 14px; padding: 14px; }
      .qrbox img { width: 100%; max-width: 360px; height: auto; display: block; margin: 0 auto; }
      .cta { margin: 14px 0 4px; font-size: 20px; font-weight: 800; color: #03045e; }
      .note { font-size: 13px; color: #5b6b7b; word-break: break-all; }
      .foot { margin-top: auto; padding-top: 6mm; display: flex; align-items: center; gap: 8px; color: #0077b6; }
      .zbadge { width: 26px; height: 26px; border-radius: 7px; background: #0077b6; color: #fff; font-weight: 900; font-size: 15px; display: inline-flex; align-items: center; justify-content: center; }
      .foot b { font-size: 15px; }
      .foot small { display:block; color:#8aa0b3; font-weight: 400; font-size: 11px; }
    </style>
  </head><body>
    <div class="poster">
      <div class="head">
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="card">
        <div class="qrbox"><img src="${qrSrc(url)}" alt="QR Katalog" /></div>
        <p class="cta">Scan &amp; Belanja</p>
        <p class="note">${note || url}</p>
      </div>
      <div class="foot">
        <span class="zbadge">Z</span>
        <b>Zona Kasir<small>POS untuk toko &amp; UMKM</small></b>
      </div>
    </div>
    <script>
      // Tunggu gambar QR termuat sebelum cetak.
      var img = document.querySelector('img');
      function go(){ window.focus(); window.print(); setTimeout(function(){ window.close(); }, 300); }
      if (img && !img.complete) { img.onload = go; img.onerror = go; } else { setTimeout(go, 400); }
    </script>
  </body></html>`);
  win.document.close();
}
