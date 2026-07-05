// Web Bluetooth belum masuk lib.dom TypeScript bawaan — deklarasi minimal untuk bagian yang dipakai (blePrinter.ts).
interface BluetoothRemoteGATTCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue(value: BufferSource): Promise<void>;
}
interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}
interface BluetoothRemoteGATTServer {
  connect(): Promise<BluetoothRemoteGATTServer>;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}
interface BluetoothDevice {
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}
interface Bluetooth {
  requestDevice(options: { acceptAllDevices?: boolean; optionalServices?: string[] }): Promise<BluetoothDevice>;
}
interface Navigator {
  bluetooth?: Bluetooth;
}
