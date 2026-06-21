import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Zona Kasir',
  description: 'Zona Kasir POS System - Admin & Kasir',
  icons: {
    icon: [
      { url: '/brand/zona-kasir-icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className: 'rounded-xl border border-line bg-white text-sm text-slate-700 shadow-soft',
            style: { padding: '10px 14px' },
            success: { iconTheme: { primary: '#0077b6', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
