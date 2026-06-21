/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dimatikan agar effect tidak dijalankan ganda di dev (double-fetch saat
  // halaman pertama dibuka). Hanya memengaruhi mode development.
  reactStrictMode: false,
};
module.exports = nextConfig;
