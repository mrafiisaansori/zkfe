/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  // Dimatikan agar effect tidak dijalankan ganda di dev (double-fetch saat
  // halaman pertama dibuka). Hanya memengaruhi mode development.
  reactStrictMode: false,
  // Lewati type-check & ESLint saat build (berat memori di shared hosting).
  // Validasi tipe tetap dilakukan di lokal via `npm run typecheck`.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Alias '@/' eksplisit -> menjamin resolusi saat `next build` di server
  // (Passenger/Domainesia) tanpa bergantung pada pembacaan paths tsconfig.
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
module.exports = nextConfig;
