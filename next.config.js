/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  // Dimatikan agar effect tidak dijalankan ganda di dev (double-fetch saat
  // halaman pertama dibuka). Hanya memengaruhi mode development.
  reactStrictMode: false,
  // Alias '@/' eksplisit -> menjamin resolusi saat `next build` di server
  // (Passenger/Domainesia) tanpa bergantung pada pembacaan paths tsconfig.
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
module.exports = nextConfig;
