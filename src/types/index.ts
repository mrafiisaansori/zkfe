// ===== Tipe data mengikuti skema backend (tabel m_* & t_*) =====

export type Role = 'superadmin' | 'admin' | 'kasir';

export interface MerchantRef {
  id: number;
  nama: string;
  status?: string;
  invoice_prefix?: string;
  plan?: 'FREE' | 'PRO';
  pro_expires_at?: string | null;
}

export interface User {
  id: number;
  nama: string;
  username: string;
  level: number; // 0 super admin, 1 admin merchant, 2 kasir
  role: Role;
  merchant_id?: number | null;
  merchant?: MerchantRef | null;
}

export interface Merchant {
  ID: number;
  NAMA: string;
  OWNER_NAME: string | null;
  EMAIL: string | null;
  PHONE: string | null;
  ADDRESS: string | null;
  CITY: string | null;
  PROVINCE: string | null;
  BUSINESS_CATEGORY: string | null;
  INVOICE_PREFIX: string | null;
  SLUG?: string | null;
  STATUS: string; // active | suspended | pending
  PLAN?: 'FREE' | 'PRO';
  PRO_EXPIRES_AT?: string | null;
  CREATED_AT?: string;
}

export interface TaxSetting {
  ID?: number;
  PPN_ENABLED: boolean;
  PPN_PERSEN: number;
  SERVICE_ENABLED: boolean;
  SERVICE_PERSEN: number;
}

export interface Voucher {
  ID: number;
  KODE: string;
  TIPE: 'NOMINAL' | 'PERSEN';
  NILAI: number;
  MIN_TRANSAKSI: number;
  VALID_FROM: string | null;
  VALID_UNTIL: string | null;
  IS_ACTIVE: boolean;
}

export type SubscriptionStatus = 'PENDING' | 'WAITING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface SubscriptionSetting {
  ID?: number;
  QRIS_IMAGE?: string | null;
  QRIS_IMAGE_URL?: string | null;
  QRIS_LABEL?: string | null;
  PRICE_MONTHLY: number;
  PRICE_YEARLY: number;
  PAYMENT_TTL_HOURS: number;
}

export interface SubscriptionPayment {
  ID: number;
  PAKET: 'BULANAN' | 'TAHUNAN';
  HARGA: number;
  KODE_UNIK: number;
  TOTAL_BAYAR: number;
  BUKTI?: string | null;
  BUKTI_URL?: string | null;
  STATUS: SubscriptionStatus;
  REJECT_REASON?: string | null;
  EXPIRES_AT?: string | null;
  PAID_AT?: string | null;
  CREATED_AT?: string;
  merchant?: { ID: number; NAMA: string; EMAIL?: string; PLAN?: string; PRO_EXPIRES_AT?: string | null };
  pemohon?: { ID: number; NAMA: string };
}

export interface Billing {
  plan: 'FREE' | 'PRO';
  pro_expires_at: string | null;
  status_toko: string | null;
  payments: SubscriptionPayment[];
  latest: SubscriptionPayment | null;
}

export interface MerchantStats {
  total: number;
  active: number;
  suspended: number;
  pending: number;
}

export interface Provinsi {
  ID: string;
  NAMA: string;
}

export interface Kota {
  ID: string;
  PROVINSI_ID: string;
  NAMA: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: unknown;
}

export interface Kategori {
  ID: number;
  DESKRIPSI: string;
}

export interface Produk {
  ID: number;
  NAMA: string;
  ID_KATEGORI: number;
  STOK: number;
  HARGA_BELI: number;
  HARGA_JUAL: number;
  BARCODE: string | null;
  FOTO: string | null;
  FOTO_URL: string | null;
  kategori?: Kategori | null;
}

export interface Supplier {
  ID: number;
  NAMA: string;
  ALAMAT: string | null;
  NO_TELP: string | null;
  NAMA_PIC: string | null;
  NO_TELP_PIC: string | null;
}

export interface JenisBayar {
  ID: number;
  NAMA: string;
}

export interface Pengguna {
  ID: number;
  NAMA: string;
  USERNAME: string;
  LEVEL: number;
  TELP: string | null;
}

export interface Identitas {
  ID: number;
  NAMA: string | null;
  ALAMAT: string | null;
  NO_TELP: string | null;
  EMAIL: string | null;
  WEBSITE: string | null;
  LOGO: string | null;
  LOGO_URL?: string | null;
  BANNER?: string | null;
  BANNER_URL?: string | null;
}

export interface Qris {
  ID: number;
  MERCHANT_NAME: string | null;
  NMID: string | null;
  IMAGE: string | null;
  IMAGE_URL: string | null;
  IS_ACTIVE: boolean;
}

export interface RekamStok {
  ID: number;
  ID_PRODUK: number;
  JENIS: number; // 1 masuk, 2 keluar
  QTY: number;
  TANGGAL: string;
  KETERANGAN: string | null;
}

export interface DetailPenjualan {
  ID: number;
  ID_TRANSAKSI_PENJUALAN: number;
  ID_PRODUK: number;
  HARGA_BELI: number;
  HARGA_JUAL: number;
  QTY: number;
  MODIFIER?: string | null; // deskripsi varian terpilih
  DISKON?: number; // diskon per item (nominal)
  produk?: { ID: number; NAMA: string };
}

export interface ModifierOption {
  ID: number;
  ID_GROUP: number;
  NAMA: string;
  HARGA: number;
}

export interface ModifierGroup {
  ID: number;
  NAMA: string;
  TIPE: 'SINGLE' | 'MULTI';
  WAJIB: boolean;
  options?: ModifierOption[];
}

export interface Penjualan {
  ID: number;
  TANGGAL: string;
  JAM: string;
  ID_JENIS_BAYAR: number;
  TOTAL: string;
  ID_USER: number;
  KETERANGAN: string | null;
  DISKON: string | null;
  PPN?: number;
  SERVICE_CHARGE?: number;
  KODE_VOUCHER?: string | null;
  DISKON_VOUCHER?: number;
  STATUS: number; // 1 sah, 0 batal
  STATUS_BAYAR?: string | null; // LUNAS/PAID
  kasir?: { ID: number; NAMA: string };
  jenisBayar?: { ID: number; NAMA: string };
  detail?: DetailPenjualan[];
}

export interface CheckoutResult {
  id: number;
  no_nota: string;
  subtotal: number;
  diskon_item?: number;
  diskon: number;
  diskon_voucher?: number;
  kode_voucher?: string | null;
  ppn?: number;
  service_charge?: number;
  total: number;
  bayar: number | null;
  kembalian: number | null;
}

export interface DashboardSummary {
  tanggal: string;
  transaksi_hari_ini: number;
  pendapatan_hari_ini: number; // omzet bersih (tanpa PPN & service)
  laba_hari_ini?: number;
  qty_terjual_hari_ini?: number;
  rata_rata_transaksi?: number;
  ppn_hari_ini?: number;
  service_hari_ini?: number;
  total_dibayar_hari_ini?: number;
  total_produk: number;
  total_pengguna: number;
  stok_menipis: { ID: number; NAMA: string; STOK: number }[];
  produk_terlaris?: { id_produk: number; nama: string; qty: number; omzet: number }[];
  transaksi_terbaru?: { ID: number; TANGGAL: string; JAM: string; TOTAL: string; kasir?: { ID: number; NAMA: string } }[];
}

export interface LaporanPenjualan {
  filter: Record<string, unknown>;
  jumlah_transaksi: number;
  omzet: number;          // penjualan bersih (tanpa PPN & service)
  total_ppn: number;
  total_service: number;
  total_dibayar: number;  // bruto diterima dari pelanggan
  total_penjualan: number; // = omzet (kompatibilitas)
  data: Penjualan[];
}

export interface LaporanPendapatan {
  filter: Record<string, unknown>;
  omzet: number;
  modal: number;
  laba: number;
  ppn: number;
  service: number;
  total_dibayar: number;
  jumlah_item: number;
}

export interface CartItem {
  lineId: string;       // identitas baris unik (produk yg sama + varian beda = baris beda)
  id_produk: number;
  nama: string;
  harga: number;        // harga dasar produk
  qty: number;
  stok: number;
  image?: string;
  diskon?: number;      // diskon per item (nominal) — dinonaktifkan
  modifierExtra?: number;       // tambahan harga dari varian
  modifierText?: string | null; // deskripsi varian (mis. "Ukuran: L")
  modifierOptionIds?: number[]; // id opsi terpilih (dikirim ke backend)
}

export type OpenBillStatus = 'OPEN' | 'PAID' | 'CANCELLED';

export interface OpenBillDetail {
  ID: number;
  ID_OPEN_BILL: number;
  ID_PRODUK: number;
  HARGA_BELI: number;
  HARGA_JUAL: number;
  QTY: number;
  MODIFIER?: string | null;
  MODIFIER_OPTIONS?: string | null;
  NOTE?: string | null;
  produk?: { ID: number; NAMA: string; STOK: number };
}

export interface OpenBill {
  ID: number;
  NO_BILL: string | null;
  CUSTOMER_NAME: string | null;
  TABLE_NO: string | null;
  NOTE: string | null;
  STATUS: OpenBillStatus;
  TOTAL: number;
  ID_USER: number;
  ID_PENJUALAN: number | null;
  CREATED_AT?: string;
  kasir?: { ID: number; NAMA: string };
  detail?: OpenBillDetail[];
}
