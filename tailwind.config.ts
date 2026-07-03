import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ===== Palet Zona Kasir =====
        // Navy → Deep Blue → Cyan → Aqua → Ice Blue.
        // Dipetakan ke skala "brand" agar seluruh kelas brand-* ikut otomatis.
        brand: {
          50: '#eef6fb',  // surface/bg lembut (lebih netral, tidak terlalu cyan)
          100: '#d6ebf5',
          200: '#b3dceb', // border/section ringan
          300: '#7fc4dd',
          400: '#34a9cf', // accent ringan
          500: '#0096c7',
          600: '#0077b6', // Deep Blue — primary (button/link/menu aktif)
          700: '#055e9c',
          800: '#073b73',
          900: '#0a2540', // Navy elegan untuk sidebar/header/heading
        },

        // ===== Semantic design tokens =====
        primary: { DEFAULT: '#0a6cb0', dark: '#0a2540', light: '#0096c7' },
        secondary: '#b3dceb',
        accent: '#00a3cc',
        background: '#f6f8fa',   // off-white netral & bersih (background utama)
        canvas: '#f1f5f8',       // off-white alternatif untuk section
        surface: '#ffffff',
        ink: '#0a2540',          // navy elegan untuk chrome & heading penting
        muted: '#64748b',        // teks sekunder (slate netral, profesional)
        line: '#e6ebf0',         // border lembut netral (bukan aqua)

        // Status — diselaraskan agar tetap jelas maknanya.
        success: { DEFAULT: '#10b981', soft: '#ecfdf5' },
        warning: { DEFAULT: '#f59e0b', soft: '#fffbeb' },
        error: { DEFAULT: '#ef4444', soft: '#fef2f2' },

        // Alias lama agar tidak ada referensi yang error.
        violet: {
          50: '#eef6fb', 100: '#d6ebf5', 500: '#0096c7', 600: '#0077b6',
          700: '#055e9c',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 500: '#10b981', 600: '#059669',
        },
      },
      borderRadius: {
        // Radius lebih moderat → terlihat matang, bukan "bubble" template.
        xl: '0.625rem',   // 10px
        '2xl': '0.75rem', // 12px
        '3xl': '0.875rem',// 14px
        '4xl': '1.125rem',
      },
      boxShadow: {
        // Bayangan tipis & netral (abu), bukan glow biru mencolok.
        soft: '0 1px 2px rgba(16,24,40,0.04), 0 4px 12px -8px rgba(16,24,40,0.10)',
        card: '0 1px 2px rgba(16,24,40,0.05), 0 1px 1px rgba(16,24,40,0.04)',
        glow: '0 6px 16px -10px rgba(0,119,182,0.35)',
        premium: '0 1px 2px rgba(16,24,40,0.04), 0 6px 16px -12px rgba(16,24,40,0.14)',
        'premium-lg': '0 2px 4px rgba(16,24,40,0.05), 0 14px 30px -18px rgba(16,24,40,0.18)',
        sidebar: '0 10px 30px -22px rgba(10,37,64,0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-sheet': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'scale-in': 'scale-in .16s ease-out',
        'slide-up': 'slide-up .2s ease-out',
        'slide-up-sheet': 'slide-up-sheet .26s cubic-bezier(.32,.72,0,1)',
      },
    },
  },
  plugins: [],
};
export default config;
