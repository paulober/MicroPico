import type { SerialPortDetails } from "@paulober/pico-mpy-com";

// USB vendors of common MicroPython boards and USB-to-serial chips. The OS
// often reports a generic manufacturer (e.g. "Microsoft" on Windows, or
// "MicroPython" for every board running it), so known IDs are named here.
const usbVendors = new Map<number, string>([
  [0x0403, "FTDI"],
  [0x0483, "STMicroelectronics"],
  [0x10c4, "Silicon Labs CP210x"],
  [0x1915, "Nordic Semiconductor"],
  [0x1a86, "WCH CH34x"],
  [0x1b4f, "SparkFun"],
  [0x239a, "Adafruit"],
  [0x2341, "Arduino"],
  [0x2886, "Seeed Studio"],
  [0x2e8a, "Raspberry Pi"],
  [0x303a, "Espressif"],
  [0xf055, "MicroPython"],
]);

// manufacturer strings that don't say anything about the device
const genericManufacturers = ["microsoft", "(standard port types)"];

const hex = (id: number): string =>
  id.toString(16).toUpperCase().padStart(4, "0");

/**
 * A short description of the device behind a serial port, e.g.
 * "Raspberry Pi · USB 2E8A:0005".
 *
 * @returns An empty string if nothing is known about the device.
 */
export function describePort(port: SerialPortDetails): string {
  const manufacturer = port.manufacturer?.trim();
  const name =
    (port.vendorId !== undefined ? usbVendors.get(port.vendorId) : undefined) ??
    (manufacturer && !genericManufacturers.includes(manufacturer.toLowerCase())
      ? manufacturer
      : undefined);
  const usbId =
    port.vendorId !== undefined && port.productId !== undefined
      ? `USB ${hex(port.vendorId)}:${hex(port.productId)}`
      : undefined;

  return [name, usbId].filter(Boolean).join(" · ");
}
