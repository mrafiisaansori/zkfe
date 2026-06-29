// ===== Tipe data mengikuti skema backend (tabel m_* & t_*) =====

export type Role = 'superadmin' | 'admin' | 'kasir' | 'gudang';

export interface MerchantRef {
  id: number;
  nama: string;
  status?: string;
  invoice_prefix?: string;
  plan?: PlanType;
  pro_expires_at?: string | null;
  onboarding_done?: boolean;
  profile_complete?: boolean;
}

export type PlanType = 'FREE' | 'PRO' | 'BUSINESS';

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
  PLAN?: PlanType;
  PRO_EXPIRES_AT?: string | null;
  CREATED_AT?: string;
}

// ===== Payment gateway (Midtrans QRIS dinamis) - khusus BUSINESS =====
export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';

export interface MidtransQrisResult {
  transaction_id: number;
  no_nota: string;
  order_id: string;
  provider: string;
  payment_status: PaymentStatus;
  gross_amount: number;
  qr_string: string | null;
  qr_url: string | null;
  expiry_time: string | null;
}

export interface PaymentStatusResult {
  transaction_id: number;
  order_id: string | null;
  provider: string | null;
  payment_status: PaymentStatus;
  status_bayar: string;
  paid_at: string | null;
  total: number;
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

export type SubscriptionStatus = PaymentStatus | 'WAITING_VERIFICATION' | 'VERIFIED' | 'REJECTED';

export interface SubscriptionSetting {
  ID?: number;
  PRICE_MONTHLY: number;
  PRICE_YEARLY: number;
  PRICE_BUSINESS_MONTHLY: number;
  PRICE_BUSINESS_YEARLY: number;
  PAYMENT_TTL_HOURS: number;
  MAINTENANCE_MODE?: number;
  MAINTENANCE_MESSAGE?: string | null;
}

export interface SubscriptionPayment {
  ID: number;
  PAKET: 'BULANAN' | 'TAHUNAN';
  TARGET_PLAN: PlanType;
  DURATION_MONTHS: number;
  HARGA: number;
  KODE_UNIK: number;
  TOTAL_BAYAR: number;
  BUKTI?: string | null;
  BUKTI_URL?: string | null;
  STATUS: SubscriptionStatus;
  PROVIDER?: string | null;
  GATEWAY_MERCHANT_ID?: string | null;
  MIDTRANS_ORDER_ID?: string | null;
  MIDTRANS_TRANSACTION_ID?: string | null;
  QR_STRING?: string | null;
  QR_URL?: string | null;
  REJECT_REASON?: string | null;
  EXPIRES_AT?: string | null;
  PAID_AT?: string | null;
  ACTIVATED_AT?: string | null;
  CREATED_AT?: string;
  merchant?: { ID: number; NAMA: string; EMAIL?: string; PLAN?: string; PRO_EXPIRES_AT?: string | null };
  pemohon?: { ID: number; NAMA: string };
}

export interface Billing {
  plan: PlanType;
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

// ===== Closing Kasir / Sesi Kas (Shift) =====
export interface KasMutasi {
  ID: number;
  ID_SHIFT: number;
  TIPE: 'IN' | 'OUT';
  NOMINAL: number;
  KETERANGAN: string | null;
  CREATED_AT: string | null;
}

export interface KasShiftDetail {
  ID: number;
  ID_SHIFT: number;
  ID_JENIS_BAYAR: number | null;
  NAMA_JENIS: string | null;
  IS_CASH: number;
  EXPECTED: number;
  ACTUAL: number;
  SELISIH: number;
}

// Rincian expected per metode bayar (hasil hitungan backend).
export interface ShiftMethodExpected {
  id_jenis_bayar: number;
  nama: string;
  is_cash: boolean;
  expected: number;
}

// Hasil perhitungan expected (real-time saat OPEN, atau preview sebelum tutup).
export interface ShiftPreview {
  modal_awal: number;
  methods: ShiftMethodExpected[];
  cash_sales: number;
  non_cash_sales: number;
  total_sales: number;
  mutasi_in: number;
  mutasi_out: number;
  expected_cash: number;
  jumlah_transaksi: number;
}

export interface KasShift {
  ID: number;
  ID_USER: number | null;
  STATION: string | null;
  MODAL_AWAL: number;
  BUKA_AT: string | null;
  TUTUP_AT: string | null;
  EXPECTED_CASH: number;
  ACTUAL_CASH: number;
  SELISIH_CASH: number;
  STATUS: number; // 1=OPEN, 0=CLOSED
  CATATAN_BUKA: string | null;
  CATATAN_TUTUP: string | null;
  kasir?: { ID: number; NAMA: string } | null;
  detail?: KasShiftDetail[];
  mutasi?: KasMutasi[];
  preview?: ShiftPreview; // ada bila shift masih OPEN
}

export interface ShiftClosePreview extends ShiftPreview {
  shift: KasShift;
}

export interface DailyReportRow {
  id_shift: number;
  kasir: string | null;
  station: string | null;
  buka_at: string | null;
  tutup_at: string | null;
  status: 'OPEN' | 'CLOSED';
  modal_awal: number;
  cash_sales: number;
  non_cash_sales: number;
  total_sales: number;
  expected_cash: number;
  actual_cash: number | null;
  selisih_cash: number | null;
}

export interface DailyReport {
  tanggal: string;
  jumlah_shift: number;
  shift: DailyReportRow[];
  ringkasan: {
    total_cash_sales: number;
    total_non_cash_sales: number;
    total_omzet: number;
    total_selisih_cash: number;
  };
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

// ===== Rekap laporan lengkap (PRO/BUSINESS) =====
export interface RekapLaporan {
  filter: { tanggal_awal: string; tanggal_akhir: string; status: number; stok_threshold: number };
  ringkasan: {
    omzet_bersih: number;
    penerimaan_bruto: number;
    total_transaksi: number;
    total_modal: number;
    laba_kotor: number;
    ppn: number;
    service_charge: number;
    diskon: number;
    voucher: number;
    diskon_voucher_total: number;
  };
  per_metode_bayar: { metode: string; jumlah_transaksi: number; total: number }[];
  per_kasir: { id_user: number | null; kasir: string; jumlah_transaksi: number; total: number }[];
  produk_terlaris: { id_produk: number; nama: string; qty: number; omzet: number }[];
  produk_stok_menipis: { id: number; nama: string; stok: number; harga_jual: number }[];
  harian: { tanggal: string; jumlah_transaksi: number; total: number }[];
  bulanan: { bulan: string; jumlah_transaksi: number; total: number }[];
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

// Dashboard operasional Gudang (tanpa data keuangan).
export interface GudangDashboard {
  tanggal: string;
  total_produk: number;
  stok_menipis_count: number;
  produk_habis_count: number;
  stok_menipis: { ID: number; NAMA: string; STOK: number }[];
  produk_habis: { ID: number; NAMA: string; STOK: number }[];
  riwayat_stok: { ID: number; JENIS: number; QTY: number; TANGGAL: string; KETERANGAN: string; produk?: { ID: number; NAMA: string } }[];
  pembelian_terbaru: { ID: number; NO_NOTA: string; TANGGAL: string; STATUS: number; supplier?: { ID: number; NAMA: string } }[];
  retur_terbaru: { ID: number; NO_NOTA: string; TANGGAL: string; STATUS: number; supplier?: { ID: number; NAMA: string } }[];
  transaksi_terbaru: { ID: number; TANGGAL: string; JAM: string; kasir?: { ID: number; NAMA: string } }[];
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
  openBillDetailId?: number; // ada saat item berasal dari open bill
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
  PAID_QTY?: number;
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
  payments?: OpenBillPayment[];
}

export interface OpenBillPayment {
  ID: number;
  ID_OPEN_BILL: number;
  ID_PENJUALAN: number;
  SPLIT_NO: number;
  PAYER_NAME: string | null;
  TOTAL: number;
  ID_JENIS_BAYAR: number | null;
  BAYAR: number | null;
  KEMBALIAN: number | null;
  NOTE: string | null;
  CREATED_AT?: string;
  jenisBayar?: { ID: number; NAMA: string };
}
