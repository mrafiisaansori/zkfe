import {
  LayoutDashboard, Package, Tags, Boxes, Users, Receipt, BarChart3,
  Settings, ShoppingCart, History, QrCode, Store, ClipboardList,
  TicketPercent, CreditCard, Layers, Truck, Undo2, Contact, Database, Wallet, LifeBuoy, TrendingUp, type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavLeaf {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  roles: Role[];
  children: NavLeaf[];
}

export type NavNode = NavLeaf | NavGroup;

export function isGroup(node: NavNode): node is NavGroup {
  return (node as NavGroup).children !== undefined;
}

// Struktur menu (mendukung grup bertingkat seperti "Master Data").
export const NAV_TREE: NavNode[] = [
  // ===== Admin Merchant & Gudang (berbagi area /admin) =====
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin', 'gudang'] },
  {
    label: 'Master Data',
    icon: Database,
    roles: ['admin', 'gudang'],
    children: [
      { label: 'Kategori', href: '/admin/kategori', icon: Tags, roles: ['admin', 'gudang'] },
      { label: 'Varian', href: '/admin/modifier', icon: Layers, roles: ['admin', 'gudang'] },
      { label: 'Produk', href: '/admin/produk', icon: Package, roles: ['admin', 'gudang'] },
      { label: 'Supplier', href: '/admin/supplier', icon: Contact, roles: ['admin', 'gudang'] },
      { label: 'Pengguna', href: '/admin/user', icon: Users, roles: ['admin'] },
      { label: 'Voucher', href: '/admin/voucher', icon: TicketPercent, roles: ['admin'] },
    ],
  },
  { label: 'Stok', href: '/admin/stok', icon: Boxes, roles: ['admin', 'gudang'] },
  { label: 'Pembelian Barang', href: '/admin/pembelian', icon: Truck, roles: ['admin', 'gudang'] },
  { label: 'Retur Barang', href: '/admin/retur', icon: Undo2, roles: ['admin', 'gudang'] },
  { label: 'Riwayat Transaksi', href: '/admin/transaksi', icon: Receipt, roles: ['gudang'] },
  // QR Menu (pesan dari meja) dinonaktifkan sementara — aktifkan lagi dengan
  // mengembalikan baris di bawah + set FEATURE_QR_ORDER=true di backend .env.
  // { label: 'QR Menu', href: '/admin/meja', icon: QrCode, roles: ['admin'] },
  { label: 'Katalog', href: '/admin/katalog', icon: Store, roles: ['admin'] },
  {
    label: 'Laporan',
    icon: BarChart3,
    roles: ['admin'],
    children: [
      { label: 'Laporan Transaksi', href: '/admin/transaksi', icon: Receipt, roles: ['admin'] },
      { label: 'Laporan Keuangan', href: '/admin/laporan', icon: BarChart3, roles: ['admin'] },
      { label: 'Laporan Closing', href: '/admin/laporan/closing', icon: Wallet, roles: ['admin'] },
    ],
  },
  { label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings, roles: ['admin'] },
  { label: 'Langganan', href: '/admin/langganan', icon: CreditCard, roles: ['admin'] },
  { label: 'Panduan', href: '/admin/dashboard?guide=1', icon: LifeBuoy, roles: ['admin'] },

  // ===== Super Admin (kelola semua merchant) =====
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard, roles: ['superadmin'] },
  { label: 'Merchant', href: '/superadmin/merchant', icon: Store, roles: ['superadmin'] },
  { label: 'Pembayaran Langganan', href: '/superadmin/langganan', icon: CreditCard, roles: ['superadmin'] },
  { label: 'Laporan Pendapatan', href: '/superadmin/laporan', icon: TrendingUp, roles: ['superadmin'] },
  { label: 'Harga Plan', href: '/superadmin/langganan/setting', icon: QrCode, roles: ['superadmin'] },
  { label: 'Test Midtrans GoPay', href: '/superadmin/midtrans-test', icon: QrCode, roles: ['superadmin'] },

  // ===== Kasir =====
  { label: 'Dashboard', href: '/kasir/dashboard', icon: LayoutDashboard, roles: ['kasir'] },
  { label: 'Kasir POS', href: '/kasir/pos', icon: ShoppingCart, roles: ['kasir'] },
  { label: 'Open Bill', href: '/kasir/open-bill', icon: ClipboardList, roles: ['kasir'] },
  { label: 'Buka/Tutup Kasir', href: '/kasir/closing', icon: Wallet, roles: ['kasir'] },
  { label: 'Riwayat', href: '/kasir/riwayat', icon: History, roles: ['kasir'] },
  { label: 'Panduan', href: '/kasir/dashboard?guide=1', icon: LifeBuoy, roles: ['kasir'] },
];

// Susun menu untuk sebuah role: filter node + filter anak grup. Grup kosong dibuang.
export function navForRole(role: Role): NavNode[] {
  const out: NavNode[] = [];
  for (const node of NAV_TREE) {
    if (!node.roles.includes(role)) continue;
    if (isGroup(node)) {
      const children = node.children.filter((c) => c.roles.includes(role));
      if (children.length) out.push({ ...node, children });
    } else {
      out.push(node);
    }
  }
  return out;
}

// Versi datar (semua leaf) untuk role — dipakai bottom-nav & deteksi item aktif.
export function flatNavForRole(role: Role): NavLeaf[] {
  const out: NavLeaf[] = [];
  for (const node of navForRole(role)) {
    if (isGroup(node)) out.push(...node.children);
    else out.push(node);
  }
  return out;
}

// Sebuah item dianggap aktif hanya bila href-nya adalah pencocokan prefiks
// paling spesifik (terpanjang) terhadap pathname saat ini. Ini mencegah
// "/admin/pengaturan" ikut menyala saat berada di "/admin/pengaturan/pembayaran".
export function isHrefActive(pathname: string, href: string, leaves: NavLeaf[]): boolean {
  const best = leaves
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .reduce((a, b) => (b.length > a.length ? b : a), '');
  return best === href;
}

// Apakah salah satu anak grup sedang aktif (untuk menyalakan header grup).
export function isGroupActive(pathname: string, group: NavGroup, leaves: NavLeaf[]): boolean {
  return group.children.some((c) => isHrefActive(pathname, c.href, leaves));
}
