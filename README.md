# POS Frontend (Next.js)

Frontend modern untuk sistem POS, mengonsumsi backend Node.js di folder **`/pos-backend/`**.
Dibangun mengikuti fitur & alur sistem POS existing (CodeIgniter 3) — login, kasir (POS), produk,
kategori, stok, pengguna, transaksi, dan laporan — dengan tampilan yang bersih, responsive, serta
nyaman untuk desktop, tablet, dan mobile.

Project CodeIgniter lama dan folder `/pos-backend/` **tidak diubah**.

## Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| HTTP client | Axios (instance terpusat) |
| State management | Zustand (auth & cart) |
| Form & validasi | React Hook Form |
| Notifikasi | react-hot-toast |
| Ikon | lucide-react |
| Grafik | Recharts |

## Cara Install

```bash
cd pos-frontend
npm install
```

## Setting .env

Salin `.env.example` menjadi `.env.local` lalu sesuaikan:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASIC_AUTH_USERNAME=admin
NEXT_PUBLIC_BASIC_AUTH_PASSWORD=rahasia
```

- `NEXT_PUBLIC_API_BASE_URL` → base URL backend (`/pos-backend`). Frontend memanggil `${BASE_URL}/api/...`.
- `NEXT_PUBLIC_BASIC_AUTH_*` → kredensial Basic Auth yang melindungi seluruh API backend. Dikirim otomatis di setiap request.

> Catatan keamanan: karena memakai prefix `NEXT_PUBLIC_`, kredensial Basic Auth ikut ter-bundle ke
> sisi browser. Ini mengikuti desain backend Anda (Basic Auth sebagai gate). Untuk produksi publik,
> pertimbangkan memproksikan request lewat route handler Next.js agar kredensial tidak terekspos.

## Cara Menjalankan

```bash
# pastikan backend /pos-backend sudah jalan di http://localhost:3000
npm run dev      # development -> http://localhost:3001 (atau port lain bila 3000 dipakai backend)
npm run build && npm start   # produksi
npm run typecheck            # cek TypeScript
```

Jika backend memakai port 3000, jalankan frontend di port lain, mis:
```bash
npm run dev -- -p 3001
```

## Koneksi ke /pos-backend

Semua request lewat satu instance Axios (`src/services/api.ts`) yang:
- memakai `baseURL = ${NEXT_PUBLIC_API_BASE_URL}/api`,
- menambahkan header `Authorization: Basic <base64(user:pass)>` otomatis,
- menyediakan helper `get/post/put/del` + `getErrorMessage()` untuk menampilkan pesan error backend yang rapi.

Login memanggil `POST /api/auth/login`. Backend bersifat stateless, jadi data user (id, nama, role)
disimpan di `localStorage` via Zustand (`pos-auth`) untuk proteksi route & konteks transaksi kasir.

## Struktur Folder

```
pos-frontend/
├── src/
│   ├── app/                      # routing (App Router)
│   │   ├── login/                # halaman login (public)
│   │   ├── admin/                # area admin (layout + proteksi role)
│   │   │   ├── dashboard, produk, kategori, stok, user,
│   │   │   ├── transaksi, transaksi/[id], laporan, pengaturan
│   │   ├── kasir/                # area kasir
│   │   │   ├── dashboard, pos, riwayat, riwayat/[id]
│   │   ├── layout.tsx, page.tsx, globals.css
│   ├── components/
│   │   ├── layout/   # AppLayout, Sidebar, Header, MobileNavbar, AuthGuard, PageHeader, StatCard
│   │   ├── ui/       # Button, Input, Select, Card, Badge, Modal, ConfirmDialog, DataTable,
│   │   │             # SearchInput, FilterDate, Pagination, Loading/Empty/ErrorState, Spinner
│   │   ├── forms/    # ProdukForm, KategoriForm, UserForm
│   │   └── pos/      # ProductGrid, Cart, PaymentModal, Receipt
│   ├── services/     # api + service per domain (produk, penjualan, laporan, dst)
│   ├── stores/       # authStore, cartStore (Zustand)
│   ├── hooks/        # useAuth
│   ├── types/        # tipe data (mengikuti skema backend)
│   ├── utils/        # format (rupiah/tanggal), cn
│   └── constants/    # menu navigasi per role
├── public/
├── .env.example
├── package.json
└── README.md
```

## Daftar Halaman & Hak Akses

| Halaman | Path | Role |
|---|---|---|
| Login | `/login` | Public |
| Dashboard Admin | `/admin/dashboard` | admin |
| Produk | `/admin/produk` | admin |
| Tambah/Edit Produk | modal di `/admin/produk` | admin |
| Kategori | `/admin/kategori` | admin |
| Stok | `/admin/stok` | admin |
| Pengguna | `/admin/user` | admin |
| Data Transaksi | `/admin/transaksi` | admin |
| Detail Transaksi | `/admin/transaksi/[id]` | admin |
| Laporan Penjualan | `/admin/laporan` | admin |
| Pengaturan Toko | `/admin/pengaturan` | admin |
| Dashboard Kasir | `/kasir/dashboard` | kasir |
| Kasir / POS | `/kasir/pos` | kasir |
| Riwayat Transaksi | `/kasir/riwayat` | kasir |
| Detail Transaksi | `/kasir/riwayat/[id]` | kasir |

Proteksi role dilakukan oleh `AuthGuard` (di `AppLayout`). Jika belum login → diarahkan ke `/login`;
jika role tidak sesuai → diarahkan ke dashboard role-nya sendiri.

## Cara Login

Gunakan akun dari database POS (tabel `m_pengguna`):

- Admin: `admin` / `rahasia`
- Kasir: `kasir1` / `rahasia`

Setelah login, admin diarahkan ke dashboard admin, kasir ke dashboard kasir.

## Endpoint Backend yang Digunakan

| Fitur | Endpoint |
|---|---|
| Login | `POST /api/auth/login` |
| Produk | `GET/POST /api/produk`, `PUT/DELETE /api/produk/{id}`, `GET /api/produk/barcode/{barcode}` |
| Stok | `POST /api/produk/{id}/stok`, `GET /api/produk/{id}/stok-history` |
| Kategori | `GET/POST /api/kategori`, `PUT/DELETE /api/kategori/{id}` |
| Jenis bayar | `GET /api/jenis-bayar` |
| Pengguna | `GET/POST /api/pengguna`, `PUT/DELETE /api/pengguna/{id}`, `POST /api/pengguna/{id}/reset-password` |
| Penjualan | `GET /api/penjualan`, `GET /api/penjualan/{id}`, `POST /api/penjualan/checkout`, `POST /api/penjualan/{id}/void` |
| Laporan | `GET /api/laporan/penjualan`, `GET /api/laporan/pendapatan`, `GET /api/laporan/stok` |
| Dashboard | `GET /api/dashboard/summary`, `GET /api/dashboard/chart?tahun=YYYY` |
| Identitas toko | `GET/PUT /api/identitas` |

## Fitur yang Sesuai dengan POS Existing

- Login multi-role (admin & kasir) mengikuti `m_pengguna.LEVEL`.
- Kasir/POS: cari produk, scan barcode (`/produk/barcode/{barcode}`), keranjang realtime, ubah qty,
  hapus item, diskon, subtotal/total otomatis, input bayar + kembalian otomatis, checkout
  (`/penjualan/checkout`), modal sukses + cetak struk.
- Produk: CRUD + riwayat pergerakan stok (`t_rekam_stok`).
- Stok: penyesuaian masuk/keluar insidentil.
- Pengguna: CRUD + reset password.
- Transaksi: daftar + filter tanggal/status, detail + cetak struk, void (kembalikan stok).
- Laporan: penjualan + pendapatan/laba per periode, export CSV.
- Dashboard admin: penjualan & transaksi hari ini, total produk, stok menipis, grafik omzet/laba bulanan.
- Dashboard kasir: ringkasan transaksi & penjualan hari ini, shortcut POS, transaksi terbaru.
- Pengaturan toko (identitas) untuk struk/laporan.

## Fitur yang Perlu Dicek Manual / Catatan

- **Cetak struk** memakai `window.print()` + CSS `@media print` (area `#print-area`). Untuk printer
  thermal khusus, sesuaikan ukuran/escpos secara terpisah.
- **Export laporan** saat ini berupa CSV di sisi frontend. POS lama mencetak PDF/struk via view —
  bila butuh format identik, perlu endpoint export khusus di backend.
- **Pembelian, Retur, Penyusutan, Transaksi Keuangan** tersedia di backend namun **belum dibuatkan
  halaman UI** di frontend ini (fokus permintaan: produk, stok, kasir, transaksi, laporan, user).
  Bisa ditambahkan dengan pola yang sama — service-nya sebagian sudah ada.
- **Endpoint yang mungkin perlu ditambah di backend** (opsional, untuk UX lebih baik):
  - Endpoint dashboard khusus kasir (saat ini dihitung di frontend dari `GET /penjualan` berdasarkan `id_user`).
  - Pagination server-side untuk daftar produk/transaksi besar (saat ini list penuh + filter client).
  - Filter `id_user`/kasir untuk dropdown di laporan admin (sudah didukung query, perlu daftar kasir — bisa via `GET /pengguna`).
- **Keamanan Basic Auth** terekspos di client (lihat bagian .env). Untuk produksi, pertimbangkan proxy/route handler.
- **Stok & harga** mengikuti data backend; pastikan database backend sudah terisi agar tampilan tidak kosong.

## Kualitas Kode

TypeScript penuh, komponen reusable, pemisahan UI / logic / service, instance API terpusat (tanpa
duplikasi logika request), error handling + toast konsisten, loading/empty/error state di semua
halaman fetch, validasi form via React Hook Form, dan refresh data otomatis setelah create/update/delete.
Project lolos `npm run typecheck` tanpa error.
