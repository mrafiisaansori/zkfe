/**
 * Cetak langsung ke printer thermal via Bluetooth Low Energy — skip driver/printer OS
 * sepenuhnya. Kebanyakan clone ESC/POS 58mm/80mm (RPP02N, POS58, GoojPrt, Zjiang, dst)
 * expose salah satu dari service vendor ini untuk terima byte ESC/POS mentah.
 *
 * PENTING: Web Bluetooth cuma boleh akses service yang dideklarasikan di optionalServices
 * saat requestDevice() — getPrimaryServices() tanpa argumen ATAU service di luar daftar ini
 * selalu throw SecurityError walau service itu beneran ada di device. Makanya harus dicoba
 * satu-satu by UUID, bukan "sisir semua service".
 */
const CANDIDATE_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // umum dipakai printer ESC/POS BLE clone (GoojPrt/Zjiang/dst)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip BLE UART, dipakai beberapa clone lain
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service, dipakai modul BLE generik
];

let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
const LAST_PRINTER_KEY = 'zk:lastBlePrinterId';

function rememberPrinter(id: string) { try { localStorage.setItem(LAST_PRINTER_KEY, id); } catch { /* storage diblokir */ } }
function forgetPrinter() { try { localStorage.removeItem(LAST_PRINTER_KEY); } catch { /* storage diblokir */ } }

/** Sambung ulang diam-diam ke printer terakhir yang berhasil (tanpa dialog pilih). Butuh navigator.bluetooth.getDevices (Chrome/Edge). */
async function reconnectLastPrinter(): Promise<boolean> {
  try {
    const id = localStorage.getItem(LAST_PRINTER_KEY);
    if (!id || !('getDevices' in navigator.bluetooth!)) return false;
    const devices: BluetoothDevice[] = await (navigator.bluetooth as unknown as { getDevices(): Promise<BluetoothDevice[]> }).getDevices();
    const device = devices.find((d) => (d as BluetoothDevice & { id: string }).id === id);
    const server = await device?.gatt?.connect();
    const characteristic = server && await findWritableCharacteristic(server);
    if (!characteristic) return false;
    cachedCharacteristic = characteristic;
    return true;
  } catch { return false; }
}

/** Firefox & Safari tidak pernah mengimplementasikan Web Bluetooth (bukan soal versi/flag). */
export function isWebBluetoothSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

function hasWebBluetooth() {
  return isWebBluetoothSupported();
}

async function findWritableCharacteristic(server: BluetoothRemoteGATTServer) {
  for (const uuid of CANDIDATE_SERVICES) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      const writable = chars.find((c) => c.properties.write || c.properties.writeWithoutResponse);
      if (writable) return writable;
    } catch {
      // service ini gak ada di device — lanjut coba UUID kandidat berikutnya.
    }
  }
  return null;
}

/**
 * Munculkan dialog pilih perangkat Bluetooth (butuh klik user). Panggil sekali saja per printer.
 * Return alasan gagal (bukan cuma boolean) supaya bisa ditampilkan ke user buat debug.
 */
export async function connectBluetoothPrinter(): Promise<{ ok: boolean; reason?: string }> {
  if (!hasWebBluetooth()) return { ok: false, reason: 'Browser ini tidak dukung Web Bluetooth (pakai Chrome/Edge, dan akses via HTTPS atau localhost).' };
  try {
    const device = await navigator.bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: CANDIDATE_SERVICES,
    });
    const server = await device.gatt?.connect();
    if (!server) return { ok: false, reason: 'Gagal buka koneksi GATT ke printer.' };
    const characteristic = await findWritableCharacteristic(server);
    if (!characteristic) {
      return { ok: false, reason: `Printer "${device.name || '?'}" tersambung tapi service ESC/POS-nya tidak dikenali (UUID beda dari yang didukung).` };
    }
    cachedCharacteristic = characteristic;
    rememberPrinter((device as BluetoothDevice & { id: string }).id);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('connectBluetoothPrinter gagal:', err);
    return { ok: false, reason: message };
  }
}

export function isBluetoothPrinterConnected() {
  return !!cachedCharacteristic;
}

/** Kirim byte ESC/POS. Return false kalau belum ada printer terhubung (caller fallback ke cetak biasa). */
export async function printViaBluetooth(bytes: Uint8Array): Promise<boolean> {
  if (!cachedCharacteristic && !(await reconnectLastPrinter())) return false;
  const characteristic = cachedCharacteristic!;
  try {
    // Chunk 180 byte — batas umum MTU BLE write, printer murah sering tidak nego MTU lebih besar.
    for (let i = 0; i < bytes.length; i += 180) {
      await characteristic.writeValue(bytes.slice(i, i + 180));
    }
    return true;
  } catch (err) {
    console.error('printViaBluetooth gagal:', err);
    cachedCharacteristic = null;
    forgetPrinter();
    return false;
  }
}
