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
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/brand/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
  // Alias '@/' eksplisit -> menjamin resolusi saat `next build` di server
  // (Passenger/Domainesia) tanpa bergantung pada pembacaan paths tsconfig.
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};
module.exports = nextConfig;
