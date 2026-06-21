// Custom server Next.js untuk Phusion Passenger (cPanel/Domainesia).
// Passenger menjalankan file ini & menyuntikkan PORT. Next melayani semua
// request (termasuk aset _next & API route). WAJIB sudah `npm run build` dulu.
const http = require('http');
const next = require('next');

const port = process.env.PORT || 3000;
const app = next({ dev: false }); // production: pakai hasil build di .next
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Frontend Next.js berjalan di port ${port}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Gagal start Next.js:', err);
    process.exit(1);
  });
