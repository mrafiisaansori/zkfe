import {
  LayoutDashboard, Package, Tags, Boxes, Users, Receipt, BarChart3,
  Settings, ShoppingCart, History, QrCode, Store, ClipboardList,
  TicketPercent, CreditCard, Layers, type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Produk', href: '/admin/produk', icon: Package, roles: ['admin'] },
  { label: 'Kategori', href: '/admin/kategori', icon: Tags, roles: ['admin'] },
  { label: 'Varian', href: '/admin/modifier', icon: Layers, roles: ['admin'] },
  { label: 'Stok', href: '/admin/stok', icon: Boxes, roles: ['admin'] },
  { label: 'Pengguna', href: '/admin/user', icon: Users, roles: ['admin'] },
  { label: 'Voucher', href: '/admin/voucher', icon: TicketPercent, roles: ['admin'] },
  // QR Menu (pesan dari meja) dinonaktifkan sementara — aktifkan lagi dengan
  // mengembalikan baris di bawah + set FEATURE_QR_ORDER=true di backend .env.
  // { label: 'QR Menu', href: '/admin/meja', icon: QrCode, roles: ['admin'] },
  { label: 'Katalog', href: '/admin/katalog', icon: Store, roles: ['admin'] },
  { label: 'Transaksi', href: '/admin/transaksi', icon: Receipt, roles: ['admin'] },
  { label: 'Laporan', href: '/admin/laporan', icon: BarChart3, roles: ['admin'] },
  { label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings, roles: ['admin'] },
  { label: 'Langganan', href: '/admin/langganan', icon: CreditCard, roles: ['admin'] },

  // Super Admin (kelola semua merchant)
  { label: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard, roles: ['superadmin'] },
  { label: 'Merchant', href: '/superadmin/merchant', icon: Store, roles: ['superadmin'] },
  { label: 'Pembayaran Langganan', href: '/superadmin/langganan', icon: CreditCard, roles: ['superadmin'] },
  { label: 'QRIS Langganan', href: '/superadmin/langganan/setting', icon: QrCode, roles: ['superadmin'] },

  { label: 'Dashboard', href: '/kasir/dashboard', icon: LayoutDashboard, roles: ['kasir'] },
  { label: 'Kasir POS', href: '/kasir/pos', icon: ShoppingCart, roles: ['kasir'] },
  { label: 'Open Bill', href: '/kasir/open-bill', icon: ClipboardList, roles: ['kasir'] },
  { label: 'Riwayat', href: '/kasir/riwayat', icon: History, roles: ['kasir'] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}

// Sebuah item dianggap aktif hanya bila href-nya adalah pencocokan prefiks
// paling spesifik (terpanjang) terhadap pathname saat ini. Ini mencegah
// "/admin/pengaturan" ikut menyala saat berada di "/admin/pengaturan/pembayaran".
export function isNavItemActive(pathname: string, href: string, items: NavItem[]): boolean {
  const best = items
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
    .reduce((a, b) => (b.length > a.length ? b : a), '');
  return best === href;
}
